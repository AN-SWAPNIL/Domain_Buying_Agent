#!/bin/bash

# Stripe Webhook Verification Script
echo "🔗 Stripe Webhook Setup Verification"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Static domain
WEBHOOK_URL="https://regular-innocent-pony.ngrok-free.app/api/payments/webhook"

echo -e "${YELLOW}📡 Testing webhook endpoint...${NC}"
echo "URL: $WEBHOOK_URL"
echo ""

# Test if ngrok is running
echo -e "${YELLOW}1. Checking ngrok tunnel...${NC}"
if curl -s http://localhost:4040/api/tunnels > /dev/null; then
    echo -e "${GREEN}✅ ngrok is running${NC}"
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   Domain: $NGROK_URL"
else
    echo -e "${RED}❌ ngrok is not running${NC}"
    exit 1
fi

# Test if server is running
echo -e "${YELLOW}2. Checking server...${NC}"
if curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running${NC}"
    exit 1
fi

# Test webhook endpoint
echo -e "${YELLOW}3. Testing webhook endpoint...${NC}"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -H "ngrok-skip-browser-warning: true" \
    -d '{"test": "verification"}' \
    -o /tmp/webhook_response.txt)

if [ "$RESPONSE" = "400" ] || [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Webhook endpoint is accessible${NC}"
    echo "   HTTP Status: $RESPONSE"
else
    echo -e "${RED}❌ Webhook endpoint failed${NC}"
    echo "   HTTP Status: $RESPONSE"
    echo "   Response: $(cat /tmp/webhook_response.txt)"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Webhook verification complete!${NC}"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Go to: https://dashboard.stripe.com/test/webhooks"
echo "2. Click '+ Add endpoint'"
echo "3. Enter URL: $WEBHOOK_URL"
echo "4. Select events:"
echo "   - payment_intent.succeeded"
echo "   - payment_intent.payment_failed"
echo "   - payment_intent.canceled"
echo "5. Copy webhook secret to server/.env"
echo ""
echo -e "${YELLOW}💡 Your webhook URL (copy this):${NC}"
echo "$WEBHOOK_URL"
