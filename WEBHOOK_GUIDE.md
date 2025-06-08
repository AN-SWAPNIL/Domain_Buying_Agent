# Webhook Management for Dynamic IP - Complete Guide

## 🌟 **Recommended Approach: Manual Update (Easiest)**

Since ngrok URLs change each time, the simplest approach is:

### Every time you start the project:

1. **Start the project:**

   ```bash
   npm start
   ```

2. **Copy the webhook URL** (displayed in terminal)

3. **Update Stripe webhook:**
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click on your existing webhook endpoint
   - Update the URL to the new ngrok URL
   - Keep the same webhook secret

### 📋 **Quick Update Script:**

```bash
./update-webhook.sh
```

This script will:

- Show you the current ngrok URL
- Give you the exact steps to update Stripe
- Test the webhook endpoint

---

## 🤖 **Automated Approach (Advanced)**

### Setup (One Time):

1. Add to your `server/.env`:

   ```env
   STRIPE_WEBHOOK_ENDPOINT_ID=we_your_webhook_id_here
   ```

2. Use the auto-manager:
   ```bash
   cd server
   node utils/webhook-manager.js update
   ```

### Features:

- ✅ Automatically creates/updates webhook endpoints
- ✅ Manages webhook secrets
- ✅ Integrated with deploy script

---

## 💰 **Alternative Solutions**

### 1. **ngrok Reserved Domain (Paid)**

- Cost: $8/month
- Benefit: Same URL every time
- Setup: `ngrok http 5000 --domain=your-domain.ngrok.app`

### 2. **Cloud Deployment**

- Use services like Heroku, Railway, or Vercel
- Get a fixed URL
- No ngrok needed for production

### 3. **Local Network Tunnel**

- Use services like localtunnel or serveo
- Free alternatives to ngrok
- May have reliability issues

---

## 🔧 **Current Project Setup**

Your project is configured to handle dynamic URLs automatically:

### ✅ **What's Already Working:**

- Frontend automatically detects ngrok URL changes
- Environment variables update automatically
- Webhook endpoints are ready for Stripe
- Fallback to localhost when ngrok isn't available

### 🎯 **What You Need to Do:**

1. Run `npm start`
2. Update Stripe webhook URL (manual or auto)
3. That's it!

---

## 🐛 **Troubleshooting**

### Webhook not receiving events:

```bash
# Test webhook endpoint
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=test" \
  -d '{"type":"test"}' \
  https://your-ngrok-url.ngrok.app/api/payments/webhook
```

### Check webhook status:

```bash
cd server
node utils/webhook-manager.js list
```

### Reset webhook:

```bash
cd server
node utils/webhook-manager.js create
```

---

## 💡 **Pro Tips**

1. **Bookmark Stripe Dashboard**: Keep the webhook page open for quick updates
2. **Save Webhook Secret**: Only changes when you create a new endpoint
3. **Use Test Events**: Stripe dashboard has a "Send test webhook" feature
4. **Monitor Logs**: Check `logs/server.log` for webhook events
5. **Keep ngrok Running**: Don't restart ngrok unless necessary

Remember: The webhook secret stays the same - only the URL changes!
