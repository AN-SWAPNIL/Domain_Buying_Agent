#!/bin/bash

# Stop all Domain Buying Agent services

echo "🛑 Stopping Domain Buying Agent services..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to stop process by PID file
stop_by_pid_file() {
    local pidfile=$1
    local service_name=$2
    
    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            echo -e "${GREEN}✅ Stopped $service_name (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}⚠️ $service_name was not running${NC}"
        fi
        rm "$pidfile"
    else
        echo -e "${YELLOW}⚠️ $service_name PID file not found${NC}"
    fi
}

# Stop services by PID files
stop_by_pid_file "logs/server.pid" "Backend Server"
stop_by_pid_file "logs/ngrok.pid" "ngrok Tunnel"
stop_by_pid_file "logs/client.pid" "Frontend Client"

# Also try to kill by process name as backup
echo -e "${YELLOW}🧹 Cleaning up any remaining processes...${NC}"

# Kill any remaining node processes on ports 5000 and 5176
pkill -f "node.*5000" 2>/dev/null || true
pkill -f "vite.*5176" 2>/dev/null || true
pkill -f "ngrok.*5000" 2>/dev/null || true

# Check if ports are still in use
if lsof -ti:5000 >/dev/null 2>&1; then
    echo -e "${RED}⚠️ Port 5000 still in use${NC}"
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
fi

if lsof -ti:5176 >/dev/null 2>&1; then
    echo -e "${RED}⚠️ Port 5176 still in use${NC}"
    lsof -ti:5176 | xargs kill -9 2>/dev/null || true
fi

echo -e "${GREEN}🎉 All services stopped successfully!${NC}"
echo "You can now restart with: ./deploy.sh"
