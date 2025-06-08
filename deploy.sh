#!/bin/bash

# Domain Buying Agent - Complete Deployment Script
# Automatically handles ngrok URL changes and server startup

echo "🚀 Starting Domain Buying Agent Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to get current ngrok URL
get_ngrok_url() {
    curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4
}

# Function to update environment with new ngrok URL
update_env_with_ngrok() {
    local ngrok_url=$1
    if [ ! -z "$ngrok_url" ]; then
        echo -e "${BLUE}🔧 Updating environment with ngrok URL: $ngrok_url${NC}"
        sed -i "s|NGROK_URL=.*|NGROK_URL=$ngrok_url|g" server/.env
        sed -i "s|SERVER_URL=.*|SERVER_URL=$ngrok_url|g" server/.env
        sed -i "s|VITE_NGROK_URL=.*|VITE_NGROK_URL=$ngrok_url/api|g" client/.env
    fi
}

# Create logs directory
mkdir -p logs

echo -e "${YELLOW}🖥️ Starting backend server...${NC}"
cd server
npm start > ../logs/server.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
cd ..

# Wait for server to start
sleep 5

# Check if server is running
if ! curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${RED}❌ Failed to start backend server${NC}"
    echo "Server log:"
    cat logs/server.log
    exit 1
fi

echo -e "${GREEN}✅ Backend server started successfully${NC}"

# Start ngrok tunnel
echo -e "${YELLOW}🌐 Starting ngrok tunnel...${NC}"
ngrok http 5000 --log=stdout > logs/ngrok.log 2>&1 &
NGROK_PID=$!
echo "ngrok PID: $NGROK_PID"

# Wait for ngrok to start
sleep 10

# Get ngrok URL and update environment
NGROK_URL=$(get_ngrok_url)
if [ ! -z "$NGROK_URL" ]; then
    echo -e "${GREEN}✅ ngrok tunnel created: $NGROK_URL${NC}"
    update_env_with_ngrok "$NGROK_URL"
    
    # Auto-update Stripe webhook if credentials are available
    if [ -f "server/.env" ] && grep -q "STRIPE_SECRET_KEY=sk_" "server/.env"; then
        echo -e "${BLUE}🔄 Auto-updating Stripe webhook...${NC}"
        cd server
        if node utils/webhook-manager.js update 2>/dev/null; then
            echo -e "${GREEN}✅ Stripe webhook updated automatically${NC}"
        else
            echo -e "${YELLOW}⚠️ Could not auto-update webhook. Use manual method below.${NC}"
        fi
        cd ..
    fi
else
    echo -e "${YELLOW}⚠️ Could not get ngrok URL, continuing with localhost${NC}"
fi

# Start the client
echo -e "${YELLOW}🎨 Starting frontend client...${NC}"
cd client
npm run dev > ../logs/client.log 2>&1 &
CLIENT_PID=$!
echo "Client PID: $CLIENT_PID"
cd ..

# Wait for client to start
sleep 5

# Check if client is running
if ! curl -s http://localhost:5176 > /dev/null; then
    echo -e "${YELLOW}⚠️ Client might still be starting...${NC}"
fi

echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo "📋 Access Information:"
echo "======================"
echo -e "🖥️  Backend Server: ${GREEN}http://localhost:5000${NC}"
echo -e "🎨 Frontend Client: ${GREEN}http://localhost:5176${NC}"
if [ ! -z "$NGROK_URL" ]; then
    echo -e "🌐 Public ngrok URL: ${GREEN}$NGROK_URL${NC}"
    echo -e "🔗 Webhook URL: ${GREEN}$NGROK_URL/api/payments/webhook${NC}"
fi
echo -e "📊 ngrok Dashboard: ${GREEN}http://localhost:4040${NC}"

# Save PIDs for cleanup
echo "$SERVER_PID" > logs/server.pid
echo "$NGROK_PID" > logs/ngrok.pid
echo "$CLIENT_PID" > logs/client.pid

echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "1. The app automatically detects ngrok URL changes"
echo "2. Configure Stripe webhook with the URL shown above"
echo "3. Use 'npm run stop' or './stop.sh' to stop all services"
echo "4. Check logs/ directory for troubleshooting"

# Monitor and auto-update ngrok URL
echo -e "${YELLOW}📡 Monitoring for ngrok URL changes...${NC}"

while true; do
    sleep 30
    
    # Check if all services are still running
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "${RED}❌ Server stopped unexpectedly${NC}"
        break
    fi
    if ! kill -0 $NGROK_PID 2>/dev/null; then
        echo -e "${RED}❌ ngrok stopped unexpectedly${NC}"
        break
    fi
    if ! kill -0 $CLIENT_PID 2>/dev/null; then
        echo -e "${RED}❌ Client stopped unexpectedly${NC}"
        break
    fi
    
    # Check for ngrok URL changes
    NEW_NGROK_URL=$(get_ngrok_url)
    if [ ! -z "$NEW_NGROK_URL" ] && [ "$NEW_NGROK_URL" != "$NGROK_URL" ]; then
        echo -e "${BLUE}🔄 ngrok URL changed: $NEW_NGROK_URL${NC}"
        NGROK_URL="$NEW_NGROK_URL"
        update_env_with_ngrok "$NGROK_URL"
    fi
done

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping services...${NC}"
    [ -f logs/server.pid ] && kill $(cat logs/server.pid) 2>/dev/null && rm logs/server.pid
    [ -f logs/ngrok.pid ] && kill $(cat logs/ngrok.pid) 2>/dev/null && rm logs/ngrok.pid
    [ -f logs/client.pid ] && kill $(cat logs/client.pid) 2>/dev/null && rm logs/client.pid
    echo -e "${GREEN}✅ All services stopped${NC}"
}

trap cleanup INT TERM EXIT
