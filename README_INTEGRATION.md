# AI Finance Assistant - Frontend-Backend Integration

This document explains how the frontend and backend are connected to enable AI agent functionality.

## 🚀 Quick Start

### Option 1: Using the Startup Script (Windows)
```bash
# Run both frontend and backend together
./start_dev.bat
```

### Option 2: Manual Setup
```bash
# Terminal 1 - Start Backend
python start_backend.py

# Terminal 2 - Start Frontend
npm run dev
```

## 🔗 Integration Overview

### API Service Layer (`src/services/api.ts`)
- Centralized API communication with backend
- Handles authentication with Firebase tokens
- Provides methods for all 5 AI agents:
  - Expense Query Agent
  - Receipt Parsing Agent
  - Anomaly Detection Agent
  - Budget Planner Agent
  - Spending Coach Agent

### AI Chat Hook (`src/hooks/useAIChat.ts`)
- Custom React hook for AI chat functionality
- Automatically determines which agent to use based on user input
- Handles real-time communication with backend agents
- Manages chat state and message processing

### Enhanced Chat Interface (`src/pages/Chat.tsx`)
- Real-time AI agent communication
- Visual indicators for agent status
- Enhanced message types with rich content cards
- Receipt upload and processing
- Voice input support

### Finance Context Integration (`src/contexts/FinanceContext.tsx`)
- Syncs local state with backend database
- Automatic transaction loading from backend
- Real-time data synchronization

## 🤖 AI Agent Features

### 1. Expense Query Agent
- **Trigger**: Natural language questions about expenses
- **Examples**: 
  - "How much did I spend on food this month?"
  - "Show me my transportation expenses"
  - "What's my biggest expense category?"

### 2. Receipt Parsing Agent
- **Trigger**: Upload receipt images
- **Features**:
  - OCR text extraction
  - Automatic categorization
  - Transaction creation
  - Vendor and amount detection

### 3. Budget Planner Agent
- **Trigger**: Budget-related queries
- **Examples**:
  - "Create a budget plan for me"
  - "Help me plan my monthly budget"
  - "Set up budget allocations"

### 4. Spending Coach Agent
- **Trigger**: Coaching and advice requests
- **Examples**:
  - "Give me spending tips"
  - "How can I save more money?"
  - "Analyze my spending patterns"

### 5. Anomaly Detection Agent
- **Trigger**: Unusual transaction detection
- **Examples**:
  - "Check for unusual transactions"
  - "Detect suspicious spending"
  - "Find anomalies in my expenses"

## 🎨 Enhanced UI Components

### AI Response Cards (`src/components/Chat/AIResponseCard.tsx`)
- Rich visual representations of AI responses
- Different card types for each agent:
  - Budget cards with allocation breakdowns
  - Coaching cards with insights and tips
  - Anomaly cards with detected issues
  - Expense cards with category analysis

### Agent Status Indicators
- Real-time status of all 5 AI agents
- Visual feedback in chat header
- Green dots indicate operational agents

## 🔧 Configuration

### Backend Configuration
- Backend runs on `http://localhost:8000`
- All agents initialize on startup
- CORS enabled for frontend communication

### Frontend Configuration
- Frontend runs on `http://localhost:5173`
- API base URL configured in `src/services/api.ts`
- Firebase authentication integration

## 📱 User Experience Flow

1. **User Authentication**: Firebase handles user login
2. **Data Loading**: Transactions automatically loaded from backend
3. **AI Interaction**: Users can chat with AI agents naturally
4. **Agent Selection**: System automatically chooses appropriate agent
5. **Rich Responses**: Enhanced cards display detailed information
6. **Data Sync**: All changes synchronized with backend database

## 🛠️ Development Features

### Error Handling
- Comprehensive error handling in API calls
- User-friendly error messages
- Fallback responses for failed requests

### Performance Optimization
- Local state updates for immediate feedback
- Background synchronization with backend
- Optimistic UI updates

### Real-time Features
- Live chat interface
- Processing indicators
- Automatic scrolling to new messages

## 🔍 Testing the Integration

1. **Start both servers** using the startup script
2. **Login** to the application
3. **Try different agent interactions**:
   - Ask about expenses: "What did I spend on food?"
   - Upload a receipt image
   - Request budget planning: "Create a budget for me"
   - Ask for coaching: "Give me spending tips"
   - Check for anomalies: "Find unusual transactions"

## 📊 Data Flow

```
Frontend (React) 
    ↓ (API calls with Firebase token)
Backend (FastAPI)
    ↓ (AI agent processing)
AI Agents (5 specialized agents)
    ↓ (Database operations)
SQLite Database
    ↓ (Response data)
Frontend (Enhanced UI display)
```

## 🚨 Troubleshooting

### Backend Issues
- Ensure Python dependencies are installed: `pip install -r requirements.txt`
- Check if backend is running on port 8000
- Verify AI agents initialize successfully

### Frontend Issues
- Ensure Node.js dependencies are installed: `npm install`
- Check if frontend is running on port 5173
- Verify Firebase configuration

### Integration Issues
- Check CORS settings in backend
- Verify API base URL in frontend
- Ensure Firebase authentication is working

## 🎯 Next Steps

The integration is now complete with:
- ✅ All 5 AI agents connected
- ✅ Real-time chat interface
- ✅ Enhanced response cards
- ✅ Receipt processing
- ✅ Data synchronization
- ✅ Error handling
- ✅ Performance optimization

Users can now interact with all AI agents through the chat interface and get intelligent financial insights!