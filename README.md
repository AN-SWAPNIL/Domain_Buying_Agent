# Domain Buying Agent

AI-powered domain discovery and management platform built with MERN stack.

## Features

- **Domain Search**: Advanced search with AI-powered suggestions
- **Domain Management**: Complete portfolio management with DNS controls
- **AI Consultant**: Interactive domain advisory chat
- **Payment Integration**: Stripe payment processing
- **Namecheap Integration**: Direct domain registration

## Quick Start

1. **Install Dependencies**:

   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

2. **Setup Environment**:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Fill in your API keys (Google Gemini, Namecheap, Stripe, MongoDB).

3. **Run Development**:
   ```bash
   npm start
   ```

## Tech Stack

- **Frontend**: React, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, MongoDB
- **AI**: LangChain, Google Gemini
- **Payment**: Stripe
- **Domain**: Namecheap API

## License

MIT License
