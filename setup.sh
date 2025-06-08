#!/bin/bash

# Domain Buying Agent - Quick Setup Script
echo "🚀 Setting up Domain Buying Agent..."

# Make script executable
chmod +x deploy.sh

# Create logs directory
mkdir -p logs

# Install dependencies
echo "📦 Installing server dependencies..."
cd server && npm install

echo "📦 Installing client dependencies..."
cd ../client && npm install

echo "✅ Setup completed! Run ./deploy.sh to start the application."
