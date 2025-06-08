# 🎯 Stripe Webhook Setup Guide - Static Domain

## ✅ Your Current Configuration

- **ngrok URL**: `https://regular-innocent-pony.ngrok-free.app`
- **Webhook Endpoint**: `https://regular-innocent-pony.ngrok-free.app/api/payments/webhook`
- **Advantage**: Static domain means **ONE-TIME SETUP** only!

---

## 📋 Step-by-Step Webhook Setup

### Step 1: Access Stripe Dashboard

1. Go to: **https://dashboard.stripe.com/test/webhooks**
2. Log in to your Stripe account

### Step 2: Create New Webhook (First Time)

1. Click **"+ Add endpoint"**
2. Enter endpoint URL:
   ```
   https://regular-innocent-pony.ngrok-free.app/api/payments/webhook
   ```
3. Select **Events to send**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Step 3: Get Webhook Secret

1. After creating the webhook, click on it
2. Go to **"Signing secret"** section
3. Click **"Reveal"** and copy the secret (starts with `whsec_`)

### Step 4: Update Server Environment

1. Open your server `.env` file
2. Replace the dummy webhook secret:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
   ```

---

## 🚀 Quick Setup Script

I'll create a verification script for you:

```bash
# Test webhook endpoint
curl -X POST https://regular-innocent-pony.ngrok-free.app/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

---

## 🔧 Webhook Events Explanation

### Critical Events for Domain Buying Agent:

1. **`payment_intent.succeeded`**

   - Triggers when payment is successful
   - Updates order status to "completed"
   - Initiates domain purchase process

2. **`payment_intent.payment_failed`**

   - Triggers when payment fails
   - Updates order status to "failed"
   - Sends failure notification

3. **`payment_intent.canceled`**
   - Triggers when payment is canceled
   - Updates order status to "canceled"

---

## 🧪 Testing Your Webhook

### Method 1: Stripe CLI (Recommended)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward events:
   ```bash
   stripe listen --forward-to https://regular-innocent-pony.ngrok-free.app/api/payments/webhook
   ```

### Method 2: Manual Test Payment

1. Use your frontend to create a test payment
2. Use Stripe test card: `4242 4242 4242 4242`
3. Check webhook receives events in your server logs

### Method 3: Stripe Dashboard Test

1. Go to your webhook in Stripe Dashboard
2. Click **"Send test webhook"**
3. Select event type and send

---

## 📊 Verification Checklist

### ✅ Before Testing:

- [ ] ngrok tunnel is running (`https://regular-innocent-pony.ngrok-free.app`)
- [ ] Server is running on localhost:5000
- [ ] Webhook endpoint returns 200 OK
- [ ] Webhook secret is configured in server `.env`

### ✅ During Testing:

- [ ] Webhook receives events (check server logs)
- [ ] Events are processed correctly
- [ ] Database updates as expected
- [ ] No error messages in console

### ✅ After Setup:

- [ ] Test payments work end-to-end
- [ ] Domain purchase flow completes
- [ ] Payment confirmations are sent

---

## 🛠️ Troubleshooting

### Common Issues:

1. **Webhook returns 404**

   - Verify ngrok is forwarding to port 5000
   - Check server routes are properly configured

2. **Webhook signature verification fails**

   - Ensure webhook secret is correct in `.env`
   - Check raw body is passed to verification

3. **Events not processing**
   - Check server logs for errors
   - Verify event types match what you're listening for

### Debug Commands:

```bash
# Check ngrok status
curl -s http://localhost:4040/api/tunnels

# Test webhook endpoint
curl -X POST https://regular-innocent-pony.ngrok-free.app/api/payments/webhook

# Check server logs
tail -f /mnt/AN_Swapnil_D/Codes/SocioFi/Domain_Buying_Agent/logs/server.log
```

---

## 🎉 Benefits of Static Domain

✅ **No webhook URL changes** - Set it once, works forever  
✅ **No manual updates** - Same domain every time  
✅ **Reliable webhooks** - No missed events  
✅ **Production ready** - Can use same approach in production

---

**🔗 Your Webhook URL**: `https://regular-innocent-pony.ngrok-free.app/api/payments/webhook`

**Status**: Ready for one-time Stripe configuration!
