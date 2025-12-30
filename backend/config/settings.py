"""
Configuration settings for AI Finance Assistant Backend
"""

import os
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """Application settings"""
    
    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GOOGLE_CLOUD_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    
    # AWS Credentials
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./finance_assistant.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Firebase
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_PRIVATE_KEY: str = os.getenv("FIREBASE_PRIVATE_KEY", "")
    FIREBASE_CLIENT_EMAIL: str = os.getenv("FIREBASE_CLIENT_EMAIL", "")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

# Global settings instance
settings = Settings()

# Model configurations for each agent
MODEL_CONFIGS: Dict[str, Dict[str, Any]] = {
    "expense_query": {
        "primary_model": "gemini-pro",
        "fallback_model": "gpt-3.5-turbo",
        "temperature": 0.3,
        "max_tokens": 1000,
        "langchain_model": "gpt-3.5-turbo"
    },
    "receipt_parsing": {
        "vision_api": "google-vision",
        "ocr_models": ["easyocr", "tesseract", "donut"],
        "fallback_ocr": "tesseract",
        "confidence_threshold": 0.7,
        "aws_textract_enabled": bool(settings.AWS_ACCESS_KEY_ID)
    },
    "anomaly_detection": {
        "isolation_forest": {
            "contamination": 0.1,
            "n_estimators": 100,
            "random_state": 42
        },
        "autoencoder": {
            "encoding_dim": 32,
            "epochs": 50,
            "batch_size": 32
        },
        "statistical_methods": ["z_score", "iqr", "modified_z_score"],
        "bigquery_ml_enabled": bool(settings.GOOGLE_CLOUD_PROJECT)
    },
    "budget_planning": {
        "forecasting_model": "gemini-pro",
        "prophet_params": {
            "yearly_seasonality": True,
            "weekly_seasonality": True,
            "daily_seasonality": False
        },
        "regression_models": ["linear", "ridge", "random_forest"],
        "optimization_method": "scipy"
    },
    "spending_coach": {
        "primary_model": "gemini-pro",
        "behavioral_model": "gpt-4",
        "coaching_style": "supportive",
        "personality_analysis": True,
        "behavioral_prompting": True
    }
}

# File upload settings
UPLOAD_SETTINGS = {
    "max_file_size": 10 * 1024 * 1024,  # 10MB
    "allowed_extensions": [".jpg", ".jpeg", ".png", ".pdf"],
    "upload_directory": "uploads/"
}

# Database settings
DATABASE_SETTINGS = {
    "pool_size": 10,
    "max_overflow": 20,
    "pool_timeout": 30,
    "pool_recycle": 3600
}