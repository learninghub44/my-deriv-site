// Deriv's current production API (developers.deriv.com) authenticates websocket
// connections via a short-lived OTP obtained over REST, rather than the old
// app_id-query-param + `authorize` message pattern. Deriv-App-ID is the same
// value as the OAuth client_id used for login - there is no separate legacy id.
const REST_BASE = 'https://api.derivws.com';

/**
 * List the user's Options trading accounts (id, balance, currency, type) via REST.
 * Replaces the old websocket `account_list` message.
 */
export async function fetchOptionsAccounts(accessToken, appId) {
  const response = await fetch(`${REST_BASE}/trading/v1/options/accounts`, {
    method: 'GET',
    headers: {
      'Deriv-App-ID': appId,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body?.errors?.[0]?.message || `Failed to load accounts (${response.status})`;
    throw new Error(message);
  }

  return Array.isArray(body.data) ? body.data : [];
}

/**
 * Request a one-time-password websocket URL for a specific account.
 * Returns a ready-to-connect wss:// URL, e.g.
 * "wss://api.derivws.com/trading/v1/options/ws/demo?otp=..."
 */
export async function requestOtpWebsocketUrl(accountId, accessToken, appId) {
  const response = await fetch(`${REST_BASE}/trading/v1/options/accounts/${accountId}/otp`, {
    method: 'POST',
    headers: {
      'Deriv-App-ID': appId,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok || !body?.data?.url) {
    const message = body?.errors?.[0]?.message || `Failed to obtain websocket OTP (${response.status})`;
    throw new Error(message);
  }

  return body.data.url;
}

// ==================== Logging Utilities ====================
const logWebSocket = (action, data) => {
  console.info(`[DerivWS] ${action}`, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

const logWebSocketError = (action, error) => {
  console.error(`[DerivWS Error] ${action}`, {
    error: error?.message || String(error),
    stack: error?.stack,
    timestamp: new Date().toISOString(),
  });
};

class DerivWebSocket {
  constructor(url = null) {
    this.url = url;
    this.ws = null;
    this.messageId = 1;
    this.listeners = {};
    this.pendingRequests = {};
    this.activeSubscriptions = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 7;
    this.reconnectDelay = 2000;
    this.isIntentionallyClosed = false;
    this.status = 'disconnected';
    this.authorized = false;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
    logWebSocket('Token set for websocket authorization', {
      tokenLength: token?.length || 0,
      hasToken: !!token,
    });
  }

  /**
   * Store the info needed to mint a fresh OTP on reconnect - the OTP embedded
   * in the websocket URL is single-use and short-lived, so a plain retry of
   * the old URL will fail.
   */
  setSessionInfo({ accessToken, appId, accountId } = {}) {
    if (accessToken) this.token = accessToken;
    if (appId) this.appId = appId;
    if (accountId) this.accountId = accountId;
  }

  async connect(otpUrl) {
    if (otpUrl) {
      this.url = otpUrl;
    }

    if (!this.url) {
      throw new Error(
        'No websocket URL available. Call requestOtpWebsocketUrl() first and pass the result to connect().'
      );
    }

    if (this.isConnected() && this.authorized) {
      logWebSocket('Already connected and authorized, skipping reconnect', {
        isConnected: this.isConnected(),
        isAuthorized: this.authorized,
      });
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.status = 'connecting';
        this.emit('status', this.status);

        logWebSocket('Initiating websocket connection', {
          // Don't log the URL itself - it embeds a single-use OTP credential.
          status: this.status,
        });

        this.ws = new WebSocket(this.url);

        this.ws.onopen = async () => {
          this.reconnectAttempts = 0;
          this.isIntentionallyClosed = false;
          this.emit('connected');

          // The connection is already authenticated via the OTP embedded in the
          // URL - no separate `authorize` message is needed or supported.
          this.authorized = true;
          this.status = 'connected';
          this.emit('status', this.status);

          logWebSocket('Websocket connected and authenticated via OTP', {
            authorized: this.authorized,
          });

          try {
            await this.restoreSubscriptions();
            resolve();
          } catch (err) {
            logWebSocketError('Failed to restore subscriptions', err);
            resolve();
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (err) {
            logWebSocketError('Failed to parse websocket message', err);
            this.emit('error', err);
          }
        };

        this.ws.onerror = (error) => {
          logWebSocketError('Websocket error occurred', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.status = 'disconnected';
          this.authorized = false;
          this.emit('disconnected');
          this.emit('status', this.status);
          logWebSocket('Websocket connection closed', {
            intentionallyClosed: this.isIntentionallyClosed,
            reconnectAttempts: this.reconnectAttempts,
          });
          if (!this.isIntentionallyClosed) {
            this.attemptReconnect();
          }
        };
      } catch (err) {
        this.status = 'error';
        this.emit('status', this.status);
        logWebSocketError('Websocket initialization failed', err);
        reject(err);
      }
    });
  }

  handleMessage(data) {
    if (data.req_id && this.pendingRequests[data.req_id]) {
      const callback = this.pendingRequests[data.req_id];
      delete this.pendingRequests[data.req_id];
      callback(data);
      return;
    }

    if (data.subscription && data.subscription.id) {
      this.emit(`subscription:${data.subscription.id}`, data);
    }

    if (data.tick && data.tick.symbol) {
      this.emit(`tick:${data.tick.symbol}`, data.tick);
    }

    if (data.authorize) {
      this.emit('authorized', data);
    }

    this.emit('message', data);
  }

  async send(request, timeout = 15000) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('WebSocket is not connected'));
    }

    return new Promise((resolve, reject) => {
      const reqId = this.messageId++;
      const payload = { ...request, req_id: reqId };

      const timeoutId = window.setTimeout(() => {
        delete this.pendingRequests[reqId];
        reject(new Error(`Request timeout for ${JSON.stringify(request)}`));
      }, timeout);

      this.pendingRequests[reqId] = (response) => {
        window.clearTimeout(timeoutId);
        if (response.error) {
          reject(new Error(response.error.message || 'Deriv request error'));
        } else {
          resolve(response);
        }
      };

      try {
        this.ws.send(JSON.stringify(payload));
      } catch (err) {
        window.clearTimeout(timeoutId);
        delete this.pendingRequests[reqId];
        reject(err);
      }
    });
  }

  /**
   * @deprecated Deriv's current API authenticates the websocket via the OTP
   * embedded in the connection URL (see requestOtpWebsocketUrl/connect). There
   * is no `authorize` message in this protocol anymore. Kept as a safe no-op
   * so any old callers don't crash.
   */
  async authorize() {
    if (!this.isConnected()) {
      throw new Error('WebSocket must be open to authorize');
    }
    logWebSocket('authorize() called - no-op, connection is pre-authenticated via OTP', {});
    this.authorized = true;
    const response = { authorize: {} };
    this.emit('authorized', response);
    return response;
  }

  async restoreSubscriptions() {
    const keys = Object.keys(this.activeSubscriptions);
    if (!keys.length) return;

    for (const symbol of keys) {
      const record = this.activeSubscriptions[symbol];
      if (!record || !record.callback) continue;

      try {
        const response = await this.send({ ticks: symbol, subscribe: 1 });
        const subscriptionId = response.subscription?.id;
        if (subscriptionId) {
          record.subscriptionId = subscriptionId;
          this.activeSubscriptions[symbol] = record;
        }
      } catch (err) {
        this.emit('error', err);
      }
    }
  }

  async subscribeTicks(symbol, callback) {
    if (!symbol) {
      throw new Error('Symbol is required for tick subscription');
    }

    const handler = (tick) => callback(tick);
    const unsubscribeEvent = this.on(`tick:${symbol}`, handler);
    const response = await this.send({ ticks: symbol, subscribe: 1 });
    const subscriptionId = response.subscription?.id;

    this.activeSubscriptions[symbol] = {
      callback,
      handler,
      subscriptionId,
      unsubscribeEvent,
    };

    return () => {
      unsubscribeEvent();
      const record = this.activeSubscriptions[symbol];
      if (record?.subscriptionId) {
        this.send({ forget: record.subscriptionId }).catch(() => {});
      }
      delete this.activeSubscriptions[symbol];
    };
  }

  async getWebsiteStatus() {
    return this.send({ website_status: 1 });
  }

  async getActiveSymbols(market = 'synthetic_index') {
    return this.send({ active_symbols: 'brief', product_type: market });
  }

  async getBalance(accountId) {
    return this.send({ balance: 1, account: accountId });
  }

  async getProposal(proposal) {
    return this.send({ proposal: 1, ...proposal });
  }

  async buyContract(contractProposal) {
    return this.send({ buy: contractProposal.contract_id, price: contractProposal.ask_price });
  }

  async getHistoricalCandles(symbol, granularity = 60, count = 80) {
    return this.send({
      ticks_history: symbol,
      adjust_start_time: 1,
      count,
      granularity,
      style: 'candles',
    });
  }

  async getOpenContracts() {
    return this.send({ portfolio: 1 });
  }

  async sellContract(contractId, price) {
    return this.send({ sell: contractId, price });
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error('Maximum reconnect attempts reached'));
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    setTimeout(async () => {
      try {
        if (this.token && this.appId && this.accountId) {
          const freshUrl = await requestOtpWebsocketUrl(this.accountId, this.token, this.appId);
          await this.connect(freshUrl);
        } else {
          await this.connect();
        }
      } catch (err) {
        this.emit('error', err);
      }
    }, delay);
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    return () => {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    };
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => callback(data));
  }

  disconnect() {
    this.isIntentionallyClosed = true;
    Object.values(this.activeSubscriptions).forEach((record) => record?.unsubscribeEvent?.());
    this.activeSubscriptions = {};
    if (this.ws) {
      this.ws.close();
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

let derivInstance = null;
export const initDeriv = () => {
  if (!derivInstance) {
    derivInstance = new DerivWebSocket();
  }
  return derivInstance;
};

export const getDeriv = () => {
  if (!derivInstance) {
    throw new Error('Deriv not initialized. Call initDeriv first.');
  }
  return derivInstance;
};

export default DerivWebSocket;
