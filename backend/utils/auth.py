"""
Authentication utilities for the AI Finance Assistant Backend
"""

import jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Simple auth for development - replace with proper Firebase/OAuth in production
class AuthManager:
    """Simple authentication manager"""
    
    def __init__(self, secret_key: str = "dev-secret-key"):
        self.secret_key = secret_key
        self.algorithm = "HS256"
    
    def create_token(self, user_data: Dict[str, Any]) -> str:
        """Create JWT token"""
        payload = {
            "user_id": user_data.get("user_id"),
            "email": user_data.get("email"),
            "exp": datetime.utcnow() + timedelta(hours=24)
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise Exception("Token has expired")
        except jwt.InvalidTokenError:
            raise Exception("Invalid token")

# Global auth manager
auth_manager = AuthManager()

def verify_token(token: str) -> Dict[str, Any]:
    """Verify token - simplified for development"""
    try:
        return auth_manager.verify_token(token)
    except Exception:
        # For development, return a default user
        return {
            "user_id": "dev_user",
            "email": "dev@example.com"
        }