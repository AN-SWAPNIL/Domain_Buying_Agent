# Domain Buying Agent - Quick Start Guide

## 🚀 Every Time You Want to Run the Project:

### Simple Method (Recommended):

```bash
npm start
```

This single command will:

- Start the backend server
- Start ngrok tunnel (new URL each time)
- Automatically detect and update the ngrok URL
- Start the frontend client
- Monitor for URL changes

### Alternative Method:

```bash
./deploy-static.sh
```

## 🛑 To Stop Everything:

```bash
npm stop
# or
./stop.sh
```

## 📋 What Happens Automatically:

1. **Dynamic URL Detection**: The app automatically detects when ngrok creates a new URL
2. **Environment Updates**: All environment variables are updated with the new ngrok URL
3. **API Configuration**: The frontend automatically switches to use the new ngrok URL
4. **Webhook Ready**: The webhook URL is displayed for Stripe configuration

## 🔧 One-Time Setup (First Time Only):

1. **Install Dependencies**:

   ```bash
   npm run setup
   ```

2. **Setup Environment Variables**:

   ```bash
   # Copy environment files
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Then edit the `.env` files and fill in your API keys:

   - Google Gemini AI API key
   - Namecheap API credentials
   - Stripe API keys
   - MongoDB connection string

3. **Configure Stripe Webhook**:
   - After running `npm start`, copy the webhook URL shown in terminal
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
   - Add endpoint with the webhook URL
   - Copy webhook secret to `server/.env` as `STRIPE_WEBHOOK_SECRET`

## 📱 Access Points:

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **ngrok Dashboard**: http://localhost:4040
- **Public URL**: Changes each time (displayed in terminal)

## 🐛 Troubleshooting:

### If ports are busy:

```bash
npm stop
npm start
```

### If ngrok URL doesn't work:

- The app automatically retries every 30 seconds
- Check ngrok dashboard at http://localhost:4040
- Restart ngrok: `npm stop && npm start`

### Reset everything:

```bash
npm run clean
npm run setup
npm start
```

## 💡 Pro Tips:

1. **Keep Terminal Open**: Don't close the terminal running `npm start` - it monitors URL changes
2. **Bookmark ngrok Dashboard**: http://localhost:4040 shows current tunnel status
3. **Use Local for Development**: The app works on localhost when ngrok isn't running
4. **Check Logs**: All service logs are in the `logs/` directory

## 🔗 Important URLs to Configure:

### Stripe Webhook Endpoint:

`[NGROK_URL]/api/payments/webhook`

### API Endpoints:

- Domain Search: `[NGROK_URL]/api/domains/search`
- AI Consultation: `[NGROK_URL]/api/ai/chat`
- Payments: `[NGROK_URL]/api/payments/create-payment-intent`

---

**Remember**: Each time you run `npm start`, you'll get a NEW ngrok URL. The app handles this automatically, but you may need to update external webhook configurations like Stripe.
