# AI Finance Assistant Backend

A comprehensive backend API with integrated pre-trained models for financial intelligence, featuring 5 specialized AI agents.

## 🤖 AI Agents

### 1. Expense Query Agent
- **Models**: Gemini Pro, GPT-4, LangChain
- **Capabilities**: Natural language expense queries, spending analysis, trend identification
- **Example**: "How much did I spend on travel in June?"

### 2. Receipt Parsing Agent
- **Models**: Google Vision API, Donut, AWS Textract, EasyOCR
- **Capabilities**: Extract vendor, items, total from receipt images/PDFs
- **Formats**: JPG, PNG, PDF

### 3. Anomaly Detection Agent
- **Models**: Isolation Forest, BigQuery ML, Autoencoders
- **Capabilities**: Detect unusual spending patterns, fraud detection, behavioral analysis
- **Methods**: Statistical analysis, machine learning, deep learning

### 4. Budget Planner Agent
- **Models**: Gemini Pro, Prophet, Regression Models
- **Capabilities**: Personalized budget plans, financial forecasting, goal optimization
- **Features**: 50/30/20 rule, custom strategies, goal tracking

### 5. Spending Coach Agent
- **Models**: Gemini Pro, GPT-4 + Behavioral Prompting
- **Capabilities**: Behavioral analysis, personalized coaching, habit formation
- **Approaches**: Supportive guidance, accountability, motivation

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- API keys for AI services (see Environment Setup)

### Installation

1. **Install Dependencies**
```bash
pip install -r requirements.txt
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

3. **Start the Server**
```bash
python start_backend.py
```

The API will be available at `http://localhost:8000`

### API Documentation
Visit `http://localhost:8000/docs` for interactive API documentation.

## 🔧 Environment Variables

### Required API Keys

#### OpenAI (GPT-4, GPT-3.5-turbo)
```env
OPENAI_API_KEY=sk-your-openai-key
```

#### Google AI (Gemini, Vision API)
```env
GOOGLE_API_KEY=your-google-api-key
GOOGLE_CLOUD_PROJECT=your-project-id
```

#### AWS (Textract)
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

## 📡 API Endpoints

### Expense Query
```http
POST /api/expense-query
Content-Type: application/json

{
  "query": "How much did I spend on restaurants last month?",
  "user_id": "user123"
}
```

### Receipt Parsing
```http
POST /api/parse-receipt
Content-Type: multipart/form-data

file: [receipt image/PDF]
```

### Anomaly Detection
```http
POST /api/detect-anomalies
Content-Type: application/json

{
  "transactions": [...],
  "user_id": "user123"
}
```

### Budget Planning
```http
POST /api/create-budget-plan
Content-Type: application/json

{
  "user_id": "user123",
  "monthly_income": 5000,
  "savings_goal": 0.2,
  "financial_goals": ["emergency_fund", "retirement"]
}
```

### Spending Coaching
```http
POST /api/spending-coaching
Content-Type: application/json

{
  "user_id": "user123",
  "time_period": "month"
}
```

## 🏗️ Architecture

```
backend/
├── main.py                 # FastAPI application
├── agents/                 # AI agent implementations
│   ├── expense_query_agent.py
│   ├── receipt_parsing_agent.py
│   ├── anomaly_detection_agent.py
│   ├── budget_planner_agent.py
│   └── spending_coach_agent.py
├── config/
│   └── settings.py         # Configuration management
├── utils/                  # Utility functions
│   ├── auth.py            # Authentication
│   ├── database.py        # Database operations
│   ├── text_processing.py # Text utilities
│   ├── date_parser.py     # Date parsing
│   └── image_processing.py # Image processing
└── start_backend.py       # Server startup script
```

## 🔒 Authentication

The API supports JWT tokens for authentication. For development, a simplified auth system is used.

Include the token in the Authorization header:
```http
Authorization: Bearer your-token-here
```

## 💾 Database

The backend uses SQLite by default for development. The database includes:

### Tables
- `users` - User profiles and settings
- `transactions` - Financial transactions
- `budget_plans` - Budget plans and goals
- `coaching_sessions` - Coaching session data

## 🧠 AI Model Configuration

Each agent can be configured with different models and parameters in `config/settings.py`:

```python
MODEL_CONFIGS = {
    "expense_query": {
        "primary_model": "gemini-pro",
        "fallback_model": "gpt-3.5-turbo",
        "temperature": 0.3
    },
    "receipt_parsing": {
        "vision_api": "google-vision",
        "ocr_model": "easyocr",
        "fallback_ocr": "tesseract"
    },
    # ... other configurations
}
```

## 📊 Features

### Expense Query Agent
- Natural language processing for expense queries
- Multi-model approach (Gemini + GPT-4 + LangChain)
- Intelligent query parsing and response generation
- Historical data analysis and insights

### Receipt Parsing Agent
- Multi-OCR approach for maximum accuracy
- Support for images and PDFs
- Intelligent vendor and category detection
- Confidence scoring and validation

### Anomaly Detection Agent
- Multiple detection methods (Isolation Forest, Statistical, Z-score, Business Rules)
- Real-time anomaly scoring
- Behavioral pattern recognition
- Risk assessment and recommendations

### Budget Planner Agent
- AI-powered budget optimization
- Multiple allocation strategies (50/30/20, custom)
- Financial goal planning and tracking
- Forecasting with Prophet and regression models

### Spending Coach Agent
- Behavioral pattern analysis
- Personalized coaching recommendations
- Motivational insights and progress tracking
- Multiple coaching styles and approaches

## 🔧 Development

### Running Tests
```bash
python test_backend.py
```

### Adding New Agents

1. Create agent class in `agents/` directory
2. Implement required methods: `initialize()`, main processing method
3. Add agent to `main.py`
4. Update API endpoints and documentation

## 🚀 Deployment

### Production Considerations
- Use a production WSGI server (Gunicorn)
- Configure proper database (PostgreSQL/MySQL)
- Set up Redis for caching
- Configure proper logging
- Use environment-specific settings
- Set up monitoring and health checks

## 📈 Performance

### Optimization Tips
- Enable Redis caching for frequent queries
- Use database connection pooling
- Implement request rate limiting
- Optimize model loading and inference
- Use async/await for I/O operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the API documentation at `/docs`
2. Review the logs for error details
3. Ensure all environment variables are set correctly
4. Verify API keys and permissions

## 🔮 Future Enhancements

- Real-time transaction processing
- Advanced ML model fine-tuning
- Multi-language support
- Mobile app integration
- Advanced analytics dashboard
- Integration with more financial institutions