#!/bin/bash

# Dynamic ngrok URL updater for Domain Buying Agent
echo "🔄 Starting dynamic ngrok setup..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to get current ngrok URL
get_ngrok_url() {
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local url=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
        if [ ! -z "$url" ]; then
            echo "$url"
            return 0
        fi
        echo "Waiting for ngrok tunnel... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    return 1
}

# Function to update environment files
update_env_files() {
    local ngrok_url=$1
    
    echo -e "${YELLOW}🔧 Updating environment files with new URL: $ngrok_url${NC}"
    
    # Update server .env
    sed -i "s|NGROK_URL=.*|NGROK_URL=$ngrok_url|g" server/.env
    sed -i "s|SERVER_URL=.*|SERVER_URL=$ngrok_url|g" server/.env
    
    # Update client .env
    sed -i "s|VITE_NGROK_URL=.*|VITE_NGROK_URL=$ngrok_url/api|g" client/.env
    
    echo -e "${GREEN}✅ Environment files updated${NC}"
}

# Function to restart development servers
restart_servers() {
    echo -e "${YELLOW}🔄 Restarting development servers...${NC}"
    
    # Kill existing processes
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    
    sleep 3
    
    # Start server
    cd server
    npm start > ../logs/server.log 2>&1 &
    SERVER_PID=$!
    echo "Server PID: $SERVER_PID"
    
    # Wait a bit for server to start
    sleep 5
    
    # Start client
    cd ../client
    npm run dev > ../logs/client.log 2>&1 &
    CLIENT_PID=$!
    echo "Client PID: $CLIENT_PID"
    
    # Save PIDs
    echo "$SERVER_PID" > ../logs/server.pid
    echo "$CLIENT_PID" > ../logs/client.pid
    
    cd ..
    
    echo -e "${GREEN}✅ Development servers restarted${NC}"
    echo "Server: http://localhost:5000"
    echo "Client: http://localhost:5176"
}

# Main execution
main() {
    # Create logs directory
    mkdir -p logs
    
    # Check if ngrok is running
    if ! curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
        echo -e "${YELLOW}🌐 Starting ngrok tunnel...${NC}"
        ngrok http 5000 --log=stdout > logs/ngrok.log 2>&1 &
        NGROK_PID=$!
        echo "$NGROK_PID" > logs/ngrok.pid
        echo "ngrok PID: $NGROK_PID"
        
        # Wait for ngrok to start
        sleep 10
    fi
    
    # Get current ngrok URL
    echo -e "${YELLOW}🔍 Getting ngrok URL...${NC}"
    NGROK_URL=$(get_ngrok_url)
    
    if [ -z "$NGROK_URL" ]; then
        echo -e "${RED}❌ Failed to get ngrok URL${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ ngrok URL obtained: $NGROK_URL${NC}"
    
    # Update environment files
    update_env_files "$NGROK_URL"
    
    # Restart servers to pick up new environment
    restart_servers
    
    echo ""
    echo -e "${GREEN}🎉 Setup completed!${NC}"
    echo "==================="
    echo -e "🖥️  Backend: ${GREEN}http://localhost:5000${NC}"
    echo -e "🎨 Frontend: ${GREEN}http://localhost:5176${NC}"
    echo -e "🌐 Public URL: ${GREEN}$NGROK_URL${NC}"
    echo -e "📊 ngrok Dashboard: ${GREEN}http://localhost:4040${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Stripe Webhook URL:${NC}"
    echo "$NGROK_URL/api/payments/webhook"
    echo ""
    echo -e "${YELLOW}💡 Tip: Run this script whenever ngrok URL changes${NC}"
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🛑 Cleaning up...${NC}"
    
    if [ -f logs/server.pid ]; then
        kill $(cat logs/server.pid) 2>/dev/null || true
        rm logs/server.pid
    fi
    
    if [ -f logs/client.pid ]; then
        kill $(cat logs/client.pid) 2>/dev/null || true
        rm logs/client.pid
    fi
    
    if [ -f logs/ngrok.pid ]; then
        kill $(cat logs/ngrok.pid) 2>/dev/null || true
        rm logs/ngrok.pid
    fi
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM EXIT

# Run main function
main

# Monitor mode (optional)
if [ "$1" = "--monitor" ]; then
    echo -e "${YELLOW}📡 Monitoring mode enabled. Press Ctrl+C to stop${NC}"
    
    while true; do
        sleep 60
        
        # Check if ngrok URL changed
        NEW_URL=$(get_ngrok_url)
        if [ "$NEW_URL" != "$NGROK_URL" ] && [ ! -z "$NEW_URL" ]; then
            echo -e "${YELLOW}🔄 ngrok URL changed: $NEW_URL${NC}"
            NGROK_URL="$NEW_URL"
            update_env_files "$NGROK_URL"
            restart_servers
        fi
    done
fi
