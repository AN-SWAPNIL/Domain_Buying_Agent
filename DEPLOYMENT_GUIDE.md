# Domain Buying Agent - Static Deployment Guide

## 🎉 Static ngrok Domain Approach

**Breakthrough**: Using static ngrok domain `regular-innocent-pony.ngrok-free.app` eliminates all dynamic URL complexity!

## Quick Start

```bash
# Install dependencies
npm run install-all

# Start everything
npm start
```

## Access Points

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Public URL**: https://regular-innocent-pony.ngrok-free.app
- **Webhook URL**: https://regular-innocent-pony.ngrok-free.app/api/payments/webhook

## Benefits of Static Domain

✅ **No URL monitoring needed**  
✅ **No environment file updates**  
✅ **No webhook URL changes**  
✅ **No complex deployment scripts**  
✅ **Always the same domain**  
✅ **Reliable and simple**

## Stripe Webhook Setup (One-time)

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Add endpoint: `https://regular-innocent-pony.ngrok-free.app/api/payments/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret to `server/.env` as `STRIPE_WEBHOOK_SECRET`

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    ngrok         │    │    Backend      │
│   localhost:5173│◄──►│  Static Domain   │◄──►│  localhost:5000 │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Public Users   │
                       │ & Webhooks       │
                       └──────────────────┘
```

## Environment Variables

### Server (.env)

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret

# Namecheap API
NAMECHEAP_API_USER=Ans2003
NAMECHEAP_API_KEY=your_key
NAMECHEAP_CLIENT_IP=43.246.202.66
NAMECHEAP_SANDBOX=true

# Stripe API
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Gemini AI
GOOGLE_AI_API_KEY=your_api_key
```

### Client (.env)

```
VITE_API_URL=http://localhost:5000/api
VITE_NGROK_URL=https://regular-innocent-pony.ngrok-free.app/api
VITE_API_TIMEOUT=10000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_APP_NAME=Domain Buying Agent
VITE_APP_VERSION=1.0.0
```

## Commands

```bash
# Start development
npm start

# Stop all services
npm stop

# Install dependencies
npm run install-all

# Clean install
npm run clean && npm run install-all
```

## Features Tested

✅ Frontend React app  
✅ Backend Express API  
✅ Static ngrok tunnel  
✅ MongoDB connection  
✅ API endpoints working  
✅ CORS configuration  
✅ Environment variables  
✅ Public access via static domain

## Next Steps

1. **Complete Stripe webhook setup** (one-time configuration)
2. **Test domain search functionality**
3. **Test AI consultation features**
4. **Test payment processing**
5. **Deploy to production** (same static domain!)

---

**🚀 The static domain approach has transformed this from a complex dynamic system to a simple, reliable deployment!**
