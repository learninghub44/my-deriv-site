// Legacy Deriv websocket app id used only for websocket connectivity and market subscriptions
const DERIV_APP_ID = '134275';
const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`;

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
  constructor(url = DERIV_WS_URL) {
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

  async connect() {
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
          url: this.url,
          hasToken: !!this.token,
          status: this.status,
        });

        this.ws = new WebSocket(this.url);

        this.ws.onopen = async () => {
          this.reconnectAttempts = 0;
          this.isIntentionallyClosed = false;
          this.emit('connected');
          this.emit('status', 'authorizing');

          logWebSocket('Websocket connection established, authorizing...', {
            hasToken: !!this.token,
          });

          try {
            await this.authorize();
            this.status = 'connected';
            this.emit('status', this.status);
            logWebSocket('Websocket authorized successfully', {
              authorized: this.authorized,
            });
            await this.restoreSubscriptions();
            resolve();
          } catch (err) {
            this.status = 'error';
            this.emit('status', this.status);
            logWebSocketError('Websocket authorization failed', err);
            reject(err);
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

  async authorize(token) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      const errorMsg = 'WebSocket must be open to authorize';
      logWebSocketError('Authorization failed - websocket not open', { readyState: this.ws?.readyState });
      throw new Error(errorMsg);
    }

    const authToken = token || this.token;
    if (!authToken) {
      const errorMsg = 'No token provided for authorization';
      logWebSocketError('Authorization failed - no token', {});
      throw new Error(errorMsg);
    }

    logWebSocket('Sending authorization request to websocket', {
      tokenLength: authToken.length,
      wsReadyState: this.ws.readyState,
    });

    const response = await this.send({ authorize: authToken });
    
    if (response.error) {
      const errorMsg = response.error.message || 'Authorization failed';
      logWebSocketError('Authorization error from Deriv', {
        error: response.error.message,
        errorCode: response.error.code,
      });
      throw new Error(errorMsg);
    }

    this.authorized = true;
    logWebSocket('Websocket authorization successful', {
      accountNumber: response.authorize?.account_number,
      loginId: response.authorize?.loginid,
      isVirtual: response.authorize?.is_virtual,
    });
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

  async getAccountList() {
    return this.send({ account_list: 1 });
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
    setTimeout(() => {
      this.connect().catch((err) => this.emit('error', err));
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
