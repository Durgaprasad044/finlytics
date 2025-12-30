# AI Finance Assistant - Setup Guide

## Quick Start

### 1. Install Dependencies

#### Backend Dependencies
```bash
pip install -r requirements.txt
```

#### Frontend Dependencies
```bash
npm install
```

### 2. Environment Configuration (Optional)

Create a `.env` file in the root directory:

```env
# OpenAI API (for advanced AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Google Cloud Vision API (for OCR)
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CLOUD_PROJECT=your_project_id

# AWS Textract (for document analysis)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Firebase (for authentication)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Database (optional - defaults to SQLite)
DATABASE_URL=sqlite:///./finance_assistant.db

# Security
SECRET_KEY=your_secret_key_change_in_production
```

**Note:** The application works without API keys using basic functionality and demo mode.

### 3. Start the Application

#### Option 1: Start Both Frontend and Backend
```bash
npm run dev:full
```

#### Option 2: Start Separately

**Backend:**
```bash
python start_backend.py
```

**Frontend:**
```bash
npm run dev
```

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

## Features Overview

### 🧾 Receipt Processing
- **Upload receipts** via drag & drop or file browser
- **AI-powered OCR** extracts text from images
- **Smart categorization** automatically categorizes expenses
- **Multi-engine processing** uses multiple OCR engines for accuracy
- **Demo mode** available without backend setup

### 💰 Expense Tracking
- **Manual transaction entry** with categories
- **Automatic receipt processing** adds transactions
- **Real-time balance calculation**
- **Monthly salary automation**
- **Category-based organization**

### 📊 Financial Analytics
- **Spending insights** and patterns
- **Budget planning** with AI recommendations
- **Anomaly detection** for unusual transactions
- **Goal tracking** and progress monitoring
- **Personalized coaching** for better financial habits

### 🔒 Security & Privacy
- **Firebase authentication** for secure access
- **User-specific data** isolation
- **Local storage** for offline functionality
- **Encrypted data** transmission

## AI Agents Architecture

### 1. Receipt Parsing Agent
- **OCR Processing:** EasyOCR, Tesseract, Google Vision API
- **Data Extraction:** Vendor, amount, date, items, tax
- **Categorization:** Smart expense categorization
- **Validation:** Confidence scoring and error detection

### 2. Expense Query Agent
- **Natural Language Processing:** Understand expense queries
- **Transaction Analysis:** Filter and analyze spending data
- **Insights Generation:** Provide spending insights
- **Pattern Recognition:** Identify spending patterns

### 3. Anomaly Detection Agent
- **Statistical Analysis:** Detect unusual spending patterns
- **Machine Learning:** Use ML models for anomaly detection
- **Real-time Monitoring:** Continuous transaction monitoring
- **Alert System:** Notify users of suspicious activities

### 4. Budget Planner Agent
- **Budget Creation:** Generate personalized budgets
- **Forecasting:** Predict future expenses
- **Optimization:** Recommend budget improvements
- **Goal Setting:** Help set and track financial goals

### 5. Spending Coach Agent
- **Behavioral Analysis:** Understand spending behavior
- **Personalized Advice:** Provide tailored recommendations
- **Motivation:** Encourage good financial habits
- **Progress Tracking:** Monitor improvement over time

## Testing

### Test Receipt Processing
```bash
python test_receipt_processing.py
```

### Test Individual Agents
```bash
# Test all agents
python -m pytest backend/tests/

# Test specific agent
python -m pytest backend/tests/test_receipt_agent.py
```

### Frontend Testing
```bash
npm test
```

## Development

### Project Structure
```
├── backend/
│   ├── agents/           # AI agents
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration
│   └── main.py          # FastAPI application
├── src/
│   ├── components/      # React components
│   ├── pages/          # Application pages
│   ├── contexts/       # React contexts
│   └── services/       # API services
├── public/             # Static assets
└── docs/              # Documentation
```

### Adding New Features

1. **Backend:** Add new endpoints in `backend/main.py`
2. **Frontend:** Create components in `src/components/`
3. **Agents:** Extend agents in `backend/agents/`
4. **API:** Update `src/services/api.ts`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT models | No |
| `GOOGLE_API_KEY` | Google Vision API key | No |
| `AWS_ACCESS_KEY_ID` | AWS access key for Textract | No |
| `FIREBASE_PROJECT_ID` | Firebase project ID | No |
| `DATABASE_URL` | Database connection string | No |
| `SECRET_KEY` | JWT secret key | No |

## Troubleshooting

### Common Issues

#### 1. Backend Won't Start
```bash
# Check dependencies
pip install -r requirements.txt

# Check Python path
python -c "import sys; print(sys.path)"

# Check port availability
netstat -an | grep 8000
```

#### 2. Frontend Build Errors
```bash
# Clear cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be >= 16
```

#### 3. Receipt Processing Not Working
- **Without API keys:** Use demo mode for testing
- **With API keys:** Check API key configuration
- **File upload issues:** Ensure file size < 10MB
- **OCR accuracy:** Use clear, well-lit images

#### 4. Database Issues
```bash
# Reset database (development only)
rm finance_assistant.db

# Check database permissions
ls -la finance_assistant.db
```

#### 5. Authentication Issues
- Check Firebase configuration
- Verify API keys in `.env` file
- Clear browser cache and cookies
- Check network connectivity

### Performance Optimization

#### Backend
- **Caching:** Enable Redis for better performance
- **Database:** Use PostgreSQL for production
- **Load Balancing:** Use multiple server instances
- **Monitoring:** Add application monitoring

#### Frontend
- **Code Splitting:** Lazy load components
- **Image Optimization:** Compress receipt images
- **Caching:** Enable service worker caching
- **Bundle Analysis:** Analyze bundle size

## Production Deployment

### Backend Deployment
```bash
# Install production dependencies
pip install -r requirements.txt

# Set environment variables
export ENVIRONMENT=production
export SECRET_KEY=your_production_secret_key

# Start with Gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serve static files
npm run preview
```

### Docker Deployment
```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

## API Documentation

### Receipt Processing Endpoints

#### Parse Receipt
```http
POST /api/parse-receipt
Content-Type: multipart/form-data

file: [receipt image]
user_id: [user identifier]
```

#### Response
```json
{
  "success": true,
  "filename": "receipt.jpg",
  "parsed_data": {
    "vendor": "Walmart Supercenter",
    "total": 87.45,
    "date": "2024-01-15",
    "category": "Groceries",
    "items": [...],
    "confidence_score": 0.95
  }
}
```

### Agent Status Endpoints

#### Get Agent Status
```http
GET /api/agents/status
```

#### Health Check
```http
GET /api/agents/health
```

#### Restart Agent
```http
POST /api/agents/{agent_name}/restart
```

## Support

### Getting Help
1. Check this setup guide
2. Review the troubleshooting section
3. Check the API documentation
4. Test with demo mode first
5. Verify environment configuration

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Reporting Issues
When reporting issues, please include:
- Operating system and version
- Python and Node.js versions
- Error messages and logs
- Steps to reproduce
- Expected vs actual behavior

---

**Happy Financial Management! 💰🤖**