# DigitPrinters - Advanced Trading Platform

A modern, professional third-party trading platform built with React, Vite, TailwindCSS, and Firebase. Connects to Deriv via WebSocket API for real-time trading data.

**Important:** This is NOT a broker. All deposits and withdrawals remain on Deriv. DigitPrinters is a trading interface powered by Deriv technology.

## 🚀 Features

### Trading Interface (DTrader)
- **Live Charts** - Real-time candlestick charts with TradingView Lightweight Charts
- **Multiple Synthetic Indices** - R_10, R_25, R_50, R_75, R_100
- **Quick Trading** - Buy/Sell buttons with amount and duration selector
- **Technical Indicators** - RSI, MACD, Moving Averages display
- **Real-time Market Data** - WebSocket-powered live ticks and updates

### Dashboard
- **Account Overview** - Balance, P&L, Win Rate, Open Trades
- **Market Overview** - All synthetic indices with current prices
- **Recent Activity** - Trade history and performance tracking
- **Quick Actions** - Direct links to all platform features

### Free Trading Bots
- **RSI Bot** - Relative Strength Index trading signals
- **MACD Bot** - MACD momentum-based strategies
- **Trend Bot** - Support/Resistance trend following
- **Martingale Bot** - Progressive bet sizing strategies

### Copy Trading
- **Leaderboard** - Top traders ranked by ROI and performance
- **Follow Traders** - Automatically copy trades from top performers
- **Performance Tracking** - Monitor your copied trades and returns
- **Win Rate Analytics** - Detailed trader statistics

### AI Analysis
- **Market Signals** - AI-generated buy/sell signals with confidence scores
- **Trend Analysis** - Automatic uptrend, downtrend, and consolidation detection
- **Price Levels** - Support, resistance, and entry points
- **Sentiment Analysis** - Overall market sentiment indicator

## 🛠️ Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS 3 with glass morphism effects
- **Icons**: Lucide React
- **Charts**: TradingView Lightweight Charts
- **State Management**: React Context
- **Routing**: React Router v7
- **Backend/Database**: Firebase (Firestore, Auth, Storage)
- **WebSocket**: Deriv API v3 WebSocket

## 📋 Prerequisites

- Node.js 16+ and npm 8+
- Deriv App ID ([Register here](https://deriv.com))
- Firebase project ([Create here](https://console.firebase.google.com))

## ⚙️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd digitprinters.site/digitprinters
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Update `.env` with your credentials:
```
# Deriv Configuration - Get from https://deriv.com/app-registration
VITE_DERIV_APP_ID=your_app_id
VITE_DERIV_OAUTH_REDIRECT_URI=https://digitprinters.site/auth/callback

# Use a secure server-side secret for OAuth token exchange on Vercel
DERIV_OAUTH_CLIENT_SECRET=your_deriv_oauth_client_secret
DERIV_OAUTH_REDIRECT_URI=https://digitprinters.site/auth/callback

# Firebase Configuration - Get from Firebase Console
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Start the development server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🚀 Running the App

### Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── common/         # Shared components (Navbar, Card, Button, etc.)
│   └── trading/        # Trading-specific components
├── pages/              # Page components
│   ├── Home.jsx        # Landing page
│   ├── Dashboard.jsx   # Main dashboard
│   ├── Trading.jsx     # DTrader interface
│   ├── Bots.jsx        # Trading bots
│   ├── CopyTrading.jsx # Copy trading
│   └── AIAnalysis.jsx  # AI analysis
├── context/            # React Context for state management
│   ├── AuthContext.jsx    # Authentication and Deriv connection
│   └── TradingContext.jsx # Trading state management
├── services/
│   └── deriv.js        # Deriv WebSocket service
├── firebase/
│   └── config.js       # Firebase initialization
├── hooks/              # Custom React hooks
├── layouts/
│   └── MainLayout.jsx  # Main layout wrapper
├── utils/
│   ├── constants.js    # Application constants
│   └── helpers.js      # Utility functions
├── App.jsx             # Main app component with routing
├── main.jsx            # React entry point
└── index.css           # Global styles
```

## 🔐 Security Notes

- Never commit `.env` file to version control
- Keep your Deriv App ID confidential
- Protect your Firebase credentials
- All deposits and withdrawals go through Deriv's secure system
- User trade data is encrypted in transit and at rest

## 💰 Business Model

- **No Internal Payments** - All deposits/withdrawals through Deriv
- **Real Trading** - Uses actual Deriv accounts
- **Revenue Model** - Optional platform fees or commissions (configurable)
- **User Trust** - Transparent, non-broker model

## 📚 Documentation

- [Deriv API Documentation](https://deriv.com/api)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [Firebase Documentation](https://firebase.google.com/docs)

## ⚠️ Disclaimer

DigitPrinters is NOT a regulated financial broker. This is a trading interface for Deriv. Trading involves substantial risk of loss. Not suitable for all investors. Please trade responsibly.

---

**Built with ❤️ using React + Vite + TailwindCSS**

