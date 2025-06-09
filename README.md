# Domain Buying Agent - AI-Powered Domain Management Platform

A comprehensive MERN stack application with AI integration for domain discovery, analysis, and management. This platform helps users find, evaluate, and purchase domain names with the assistance of AI-powered recommendations.

## 🚀 Features

### Core Functionality

- **Domain Search & Discovery**: Advanced search with multiple TLD support
- **AI-Powered Suggestions**: Get intelligent domain recommendations based on business descriptions
- **Domain Portfolio Management**: Track and manage your domain investments
- **DNS Management**: Complete DNS record management interface
- **AI Consultant**: Interactive chat-based domain advisory
- **User Authentication**: Secure login and registration system

### AI Integration

- **Smart Domain Suggestions**: AI analyzes business descriptions to suggest relevant domains
- **Domain Value Analysis**: AI-powered domain valuation and market analysis
- **SEO Analysis**: Comprehensive SEO scoring and recommendations
- **Brand Analysis**: Brandability and memorability scoring
- **Interactive Chat**: Real-time AI consultant for domain advice

### Technical Features

- **Payment Integration**: Stripe payment processing for domain purchases
- **Namecheap API**: Direct integration with Namecheap for domain operations
- **Real-time Updates**: Live domain availability checking
- **Responsive Design**: Mobile-first design with TailwindCSS
- **Modern UI/UX**: Smooth animations with Framer Motion

## 🛠️ Tech Stack

### Frontend

- **React 18** with hooks and functional components
- **React Router DOM** for navigation
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **React Hook Form** with Yup validation
- **Axios** for API communication
- **Heroicons** for UI icons
- **Vite** for fast development and building

### Backend

- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **LangChain & LangGraph** for AI integration
- **Google Gemini AI** for natural language processing
- **Stripe** for payment processing
- **Namecheap API** for domain operations

## 📦 Quick Start

### Development Servers

Both client (port 5173) and server (port 5000) are currently running and functional with mock data.

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

### Current Status

✅ **Completed:**

- All React components with modern UI/UX
- Complete domain search functionality with AI suggestions
- Interactive AI consultant with chat interface
- Domain portfolio management with DNS controls
- User profile management with multiple tabs
- Mock data integration for offline functionality
- Responsive design with TailwindCSS
- Framer Motion animations throughout
- Error handling and loading states
- Server-side LangChain integration setup

🔄 **Next Steps:**

- Add real API keys for production (Google Gemini, Namecheap, Stripe)
- Set up MongoDB database connection
- Implement user authentication
- Add comprehensive testing
- Deploy to production environment

## 🎯 Key Features Implemented

### 1. Domain Search Page

- Tab-based interface (Search vs AI Suggestions)
- Real-time domain availability checking
- AI-powered business description analysis
- Bulk domain selection and actions
- Advanced filtering and sorting

### 2. AI Consultant

- Interactive chat interface with message bubbles
- Quick suggestion buttons for common queries
- Real-time AI responses with loading states
- Domain action buttons within chat
- Conversation history management

### 3. My Domains

- Portfolio overview with statistics
- Domain management cards with status indicators
- DNS record management modal
- Domain renewal functionality
- Search and filter capabilities

### 4. Profile Management

- Tabbed interface (Profile, Security, Notifications, Billing)
- Form validation with React Hook Form
- Password management with security features
- Notification preferences
- Payment method management

## 🔧 Environment Setup

> **Important**: Make sure to copy the `.env.example` files to `.env` and fill in your actual API keys and configuration values.

### Server (.env)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/domain-buying-agent
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Google Gemini AI
GOOGLE_API_KEY=your-google-ai-api-key

# Namecheap API
NAMECHEAP_API_USER=your-namecheap-username
NAMECHEAP_API_KEY=your-namecheap-api-key
NAMECHEAP_CLIENT_IP=your-client-ip
NAMECHEAP_SANDBOX=true

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email Configuration (Optional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=Domain Buying Agent <noreply@yourdomain.com>
```

### Client (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_API_TIMEOUT=10000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
VITE_APP_NAME=Domain Buying Agent
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=true
```

## 📁 Project Structure

```
Domain_Buying_Agent/
├── client/                 # React frontend (Vite + TailwindCSS)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── services/       # API service layers with mock data
│   │   ├── contexts/       # React context providers
│   │   └── utils/          # Utility functions
├── server/                 # Express.js backend
│   ├── controllers/        # Route controllers
│   ├── services/          # Business logic (AI, Namecheap, Stripe)
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   └── middleware/        # Custom middleware
└── README.md              # This file
```

## 🚀 Development Commands

```bash
# Start both servers (from root directory)
# Server: http://localhost:5000
# Client: http://localhost:5173
npm start

# Start server only
cd server && npm run dev

# Start client only
cd client && npm run dev

# Install dependencies
npm run install-all
# OR individually:
cd server && npm install
cd client && npm install
```

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface with consistent styling
- **Responsive Layout**: Mobile-first design that works on all devices
- **Smooth Animations**: Framer Motion for enhanced user experience
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: User-friendly error messages and fallbacks
- **Form Validation**: Real-time validation with helpful error messages
- **Dark Mode Ready**: Prepared for dark mode implementation

## 🔒 Security & Best Practices

- JWT-based authentication system
- Input validation and sanitization
- Error boundaries for React components
- Secure API communication with Axios interceptors
- Environment variable management
- CORS configuration for cross-origin requests

---

**Status**: ✅ Development Environment Ready | 🔄 Production Setup Pending

Built with ❤️ using React, Node.js, MongoDB, and AI integration
