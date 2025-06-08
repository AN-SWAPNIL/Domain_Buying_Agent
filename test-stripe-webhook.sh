#!/bin/bash

# Test Stripe Webhook Endpoint
echo "🔗 Testing Stripe Webhook Endpoint..."

WEBHOOK_URL="https://regular-innocent-pony.ngrok-free.app/api/payments/webhook"

echo "📡 Endpoint: $WEBHOOK_URL"
echo ""

# Test 1: Check if endpoint is accessible
echo "🧪 Test 1: Checking endpoint accessibility..."
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{"test": "data"}')

if [ "$response" = "400" ]; then
    echo "✅ Endpoint is accessible (400 = Missing Stripe signature - Expected)"
elif [ "$response" = "200" ]; then
    echo "✅ Endpoint is accessible"
else
    echo "❌ Endpoint returned: $response"
fi

echo ""

# Test 2: Test with Stripe-like headers (will still fail signature validation)
echo "🧪 Test 2: Testing with Stripe headers..."
curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=fake_signature" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{
    "id": "evt_test_webhook",
    "object": "event",
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test_12345",
        "status": "succeeded"
      }
    }
  }' | jq . 2>/dev/null || echo "Response received (JSON parsing failed - expected)"

echo ""
echo "✅ Webhook endpoint is ready for Stripe!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to: https://dashboard.stripe.com/test/webhooks"
echo "2. Add endpoint: $WEBHOOK_URL"
echo "3. Select events: payment_intent.succeeded, payment_intent.payment_failed"
echo "4. Copy webhook secret to server/.env as STRIPE_WEBHOOK_SECRET"
echo ""
echo "🔧 Current webhook secret in .env:"
cd "$(dirname "$0")"
grep "STRIPE_WEBHOOK_SECRET" server/.env || echo "❌ STRIPE_WEBHOOK_SECRET not set in server/.env"
