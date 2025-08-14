#!/bin/bash

# Domain Buying Agent - Simple Static Domain Deployment
echo "🚀 Starting Domain Buying Agent with Static ngrok Domain..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Static ngrok domain
STATIC_DOMAIN="regular-innocent-pony.ngrok-free.app"
WEBHOOK_URL="https://$STATIC_DOMAIN/api/payments/webhook"

echo -e "${GREEN}🌐 Using static domain: https://$STATIC_DOMAIN${NC}"

# Create logs directory
mkdir -p logs

# Start backend server
echo -e "${YELLOW}🖥️ Starting backend server...${NC}"
cd server
npm run dev > ../logs/server.log 2>&1 &
SERVER_PID=$!
cd ..

# Wait for server to start
sleep 5

# Check if server is running
if ! curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${RED}❌ Failed to start backend server${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend server started${NC}"

# Start ngrok with static domain
echo -e "${YELLOW}🌐 Starting ngrok with static domain...${NC}"
./ngrok.exe http --url=$STATIC_DOMAIN 5000 > logs/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok
sleep 5

echo -e "${GREEN}✅ ngrok tunnel active${NC}"

# Start frontend
echo -e "${YELLOW}🎨 Starting frontend...${NC}"
cd client
npm run dev > ../logs/client.log 2>&1 &
CLIENT_PID=$!
cd ..

sleep 3

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "📋 Access Information:"
echo "======================"
echo -e "🖥️  Backend: ${GREEN}http://localhost:5000${NC}"
echo -e "🎨 Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "🌐 Public URL: ${GREEN}https://$STATIC_DOMAIN${NC}"
echo -e "🔗 Webhook URL: ${GREEN}$WEBHOOK_URL${NC}"
echo ""
echo -e "${YELLOW}🔧 Stripe Webhook Setup (One-time):${NC}"
echo "1. Go to: https://dashboard.stripe.com/test/webhooks"
echo "2. Add endpoint: $WEBHOOK_URL"
echo "3. Select events: payment_intent.succeeded, payment_intent.payment_failed"
echo "4. Copy webhook secret to server/.env"
echo ""
echo -e "${GREEN}💡 No more URL changes! Always the same domain!${NC}"

# Save PIDs
echo "$SERVER_PID" > logs/server.pid
echo "$NGROK_PID" > logs/ngrok.pid
echo "$CLIENT_PID" > logs/client.pid

# Monitor
echo -e "${YELLOW}📡 Monitoring services... Press Ctrl+C to stop${NC}"

cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping services...${NC}"
    [ -f logs/server.pid ] && kill $(cat logs/server.pid) 2>/dev/null && rm logs/server.pid
    [ -f logs/ngrok.pid ] && kill $(cat logs/ngrok.pid) 2>/dev/null && rm logs/ngrok.pid
    [ -f logs/client.pid ] && kill $(cat logs/client.pid) 2>/dev/null && rm logs/client.pid
    echo -e "${GREEN}✅ All services stopped${NC}"
}

trap cleanup INT TERM EXIT

while true; do
    sleep 30
    # Check if services are still running
    if ! kill -0 $SERVER_PID 2>/dev/null || ! kill -0 $NGROK_PID 2>/dev/null || ! kill -0 $CLIENT_PID 2>/dev/null; then
        echo -e "${RED}❌ A service stopped unexpectedly${NC}"
        break
    fi
done
