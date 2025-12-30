"""
AI Finance Assistant Backend - FastAPI Application
Integrates 5 specialized AI agents with pre-trained models
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import asyncio
from datetime import datetime
import json

# Import AI Agents
from agents.expense_query_agent import ExpenseQueryAgent
from agents.receipt_parsing_agent import ReceiptParsingAgent
from agents.anomaly_detection_agent import AnomalyDetectionAgent
from agents.budget_planner_agent import BudgetPlannerAgent
from agents.spending_coach_agent import SpendingCoachAgent
from agents.agent_manager import agent_manager

# Import utilities
from utils.auth import verify_token
from utils.database import DatabaseManager
from config.settings import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Finance Assistant Backend",
    description="Backend API with 5 specialized AI agents for financial intelligence",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Global instances
db_manager = DatabaseManager()

# Agent instances will be managed by agent_manager
expense_agent = None
receipt_agent = None
anomaly_agent = None
budget_agent = None
coach_agent = None

# Pydantic models
class ExpenseQuery(BaseModel):
    query: str
    user_id: str
    time_period: Optional[str] = "month"

class TransactionData(BaseModel):
    transactions: List[Dict[str, Any]]
    user_id: str

class BudgetPlanRequest(BaseModel):
    user_id: str
    monthly_income: Optional[float] = None
    savings_goal: float = 0.2
    financial_goals: List[str] = []

class CoachingRequest(BaseModel):
    user_id: str
    time_period: str = "month"

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        user_data = verify_token(credentials.credentials)
        return user_data
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.on_event("startup")
async def startup_event():
    """Initialize all agents and database on startup"""
    global expense_agent, receipt_agent, anomaly_agent, budget_agent, coach_agent
    
    logger.info("🚀 Starting AI Finance Assistant Backend...")
    
    try:
        # Initialize database
        await db_manager.initialize()
        logger.info("✅ Database initialized")
        
        # Initialize all AI agents using agent manager
        agent_results = await agent_manager.initialize_all_agents()
        
        # Get agent instances from manager
        expense_agent = agent_manager.get_agent('expense_query')
        receipt_agent = agent_manager.get_agent('receipt_parsing')
        anomaly_agent = agent_manager.get_agent('anomaly_detection')
        budget_agent = agent_manager.get_agent('budget_planner')
        coach_agent = agent_manager.get_agent('spending_coach')
        
        # Check if all agents initialized successfully
        successful_agents = sum(1 for success in agent_results.values() if success)
        total_agents = len(agent_results)
        
        if successful_agents == total_agents:
            logger.info("🎉 All agents initialized successfully!")
        else:
            logger.warning(f"⚠️ {successful_agents}/{total_agents} agents initialized successfully")
            logger.info("Backend will continue with available agents")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {str(e)}")
        raise

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Finance Assistant Backend",
        "version": "1.0.0",
        "agents": [
            "Expense Query Agent",
            "Receipt Parsing Agent", 
            "Anomaly Detection Agent",
            "Budget Planner Agent",
            "Spending Coach Agent"
        ],
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "agents_status": "operational"
    }

@app.post("/api/test-chat")
async def test_chat(request: dict):
    """Test chat endpoint without authentication"""
    try:
        query = request.get("query", "hello")
        
        if not expense_agent:
            return {
                "response": {
                    "text_response": "I'm here to help with your finances! The AI agents are currently initializing. Please try again in a moment.",
                    "model_used": "fallback",
                    "confidence": 0.5
                },
                "success": True
            }
        
        # Test with empty transactions
        result = await expense_agent.process_query(
            query=query,
            user_id="test-user",
            transactions=[]
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Test chat error: {str(e)}")
        return {
            "response": {
                "text_response": f"I'm here to help with your finances! I can assist with budgeting, expense tracking, and financial planning. What would you like to know?",
                "model_used": "fallback",
                "confidence": 0.5
            },
            "success": True,
            "error": str(e)
        }

# Expense Query Agent Endpoints
@app.post("/api/expense-query")
async def process_expense_query(
    request: ExpenseQuery,
    current_user: dict = Depends(get_current_user)
):
    """Process natural language expense queries"""
    try:
        if not expense_agent:
            raise HTTPException(status_code=503, detail="Expense Query Agent not available")
        
        # Get user transactions
        transactions = await db_manager.get_user_transactions(
            request.user_id, 
            time_period=request.time_period
        )
        
        # Process query with AI agent
        result = await expense_agent.process_query(
            query=request.query,
            user_id=request.user_id,
            transactions=transactions
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Expense query error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Receipt Parsing Agent Endpoints
@app.post("/api/parse-receipt")
async def parse_receipt(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Parse receipt from uploaded image/PDF"""
    try:
        if not receipt_agent:
            raise HTTPException(status_code=503, detail="Receipt Parsing Agent not available")
        
        # Read file content
        file_content = await file.read()
        
        # Parse receipt with AI agent
        result = await receipt_agent.parse_receipt(
            file_content=file_content,
            filename=file.filename,
            user_id=user_id
        )
        
        # Save parsed transaction to database if successful
        if result.get("success") and result.get("parsed_data"):
            parsed_data = result["parsed_data"]
            await db_manager.add_transaction(
                user_id=user_id,
                transaction_data={
                    "amount": parsed_data.get("total", 0),
                    "category": parsed_data.get("category", "Unknown"),
                    "description": f"Receipt from {parsed_data.get('vendor', 'Unknown')}",
                    "merchant": parsed_data.get("vendor"),
                    "date": parsed_data.get("date", datetime.now().date().isoformat()),
                    "transaction_type": "debit"
                }
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Receipt parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Anomaly Detection Agent Endpoints
@app.post("/api/detect-anomalies")
async def detect_anomalies(
    request: TransactionData,
    current_user: dict = Depends(get_current_user)
):
    """Detect anomalies in spending patterns"""
    try:
        if not anomaly_agent:
            raise HTTPException(status_code=503, detail="Anomaly Detection Agent not available")
        
        # Get historical data for context
        historical_data = await db_manager.get_user_transactions(
            request.user_id,
            limit=1000
        )
        
        # Detect anomalies with AI agent
        result = await anomaly_agent.detect_anomalies(
            transactions=request.transactions,
            historical_data=historical_data,
            user_id=request.user_id
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Anomaly detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Budget Planner Agent Endpoints
@app.post("/api/create-budget-plan")
async def create_budget_plan(
    request: BudgetPlanRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create personalized budget plan"""
    try:
        # Get user's financial profile and transaction history
        user_profile = await db_manager.get_user_financial_profile(request.user_id)
        historical_data = await db_manager.get_user_transactions(request.user_id, limit=500)
        
        # Create budget plan with AI agent
        result = await budget_agent.create_budget_plan(
            user_id=request.user_id,
            monthly_income=request.monthly_income,
            savings_goal=request.savings_goal,
            financial_goals=request.financial_goals,
            historical_data=historical_data,
            user_profile=user_profile
        )
        
        # Save budget plan to database
        if result and not result.get("error"):
            await db_manager.save_budget_plan(request.user_id, result)
        
        return result
        
    except Exception as e:
        logger.error(f"Budget planning error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Spending Coach Agent Endpoints
@app.post("/api/spending-coaching")
async def get_spending_coaching(
    request: CoachingRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get personalized spending coaching insights"""
    try:
        # Get user transactions and profile
        transactions = await db_manager.get_user_transactions(
            request.user_id,
            time_period=request.time_period
        )
        user_profile = await db_manager.get_user_financial_profile(request.user_id)
        
        # Generate coaching insights with AI agent
        result = await coach_agent.generate_coaching_insights(
            user_id=request.user_id,
            transactions=transactions,
            user_profile=user_profile,
            time_period=request.time_period
        )
        
        # Save coaching session to database
        if result and not result.get("error"):
            await db_manager.save_coaching_session(request.user_id, result)
        
        return result
        
    except Exception as e:
        logger.error(f"Spending coaching error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# User Management Endpoints
@app.post("/api/transactions")
async def add_transaction(
    transaction_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Add a new transaction"""
    try:
        user_id = current_user.get("user_id")
        result = await db_manager.add_transaction(user_id, transaction_data)
        return result
    except Exception as e:
        logger.error(f"Add transaction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/transactions")
async def get_transactions(
    limit: int = 100,
    offset: int = 0,
    time_period: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user transactions"""
    try:
        user_id = current_user.get("user_id")
        transactions = await db_manager.get_user_transactions(
            user_id, limit, offset, time_period
        )
        return {"transactions": transactions}
    except Exception as e:
        logger.error(f"Get transactions error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/transactions/{transaction_id}")
async def update_transaction(
    transaction_id: str,
    transaction_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update a transaction"""
    try:
        user_id = current_user.get("user_id")
        result = await db_manager.update_transaction(user_id, transaction_id, transaction_data)
        return result
    except Exception as e:
        logger.error(f"Update transaction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a transaction"""
    try:
        user_id = current_user.get("user_id")
        result = await db_manager.delete_transaction(user_id, transaction_id)
        return result
    except Exception as e:
        logger.error(f"Delete transaction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get user financial profile"""
    try:
        user_id = current_user.get("user_id")
        profile = await db_manager.get_user_financial_profile(user_id)
        return profile
    except Exception as e:
        logger.error(f"Get profile error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/profile")
async def update_user_profile(
    profile_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user financial profile"""
    try:
        user_id = current_user.get("user_id")
        success = await db_manager.update_user_profile(user_id, profile_data)
        return {"success": success}
    except Exception as e:
        logger.error(f"Update profile error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Agent Status Endpoints
@app.get("/api/agents/status")
async def get_agents_status():
    """Get status of all AI agents"""
    try:
        agent_status = agent_manager.get_all_agent_status()
        return {
            **agent_status,
            "timestamp": datetime.now().isoformat(),
            "total_agents": len(agent_status),
            "operational_agents": sum(1 for status in agent_status.values() if status == "operational")
        }
    except Exception as e:
        logger.error(f"Error getting agent status: {str(e)}")
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/agents/health")
async def get_agents_health():
    """Perform comprehensive health check on all agents"""
    try:
        health_status = await agent_manager.health_check()
        return health_status
    except Exception as e:
        logger.error(f"Error performing health check: {str(e)}")
        return {
            "overall_status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/agents/capabilities")
async def get_agents_capabilities():
    """Get capabilities of all agents"""
    try:
        capabilities = agent_manager.get_agent_capabilities()
        return {
            "capabilities": capabilities,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting agent capabilities: {str(e)}")
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/agents/{agent_name}/restart")
async def restart_agent(agent_name: str, current_user: dict = Depends(get_current_user)):
    """Restart a specific agent"""
    try:
        success = await agent_manager.restart_agent(agent_name)
        
        if success:
            # Update global agent references
            global expense_agent, receipt_agent, anomaly_agent, budget_agent, coach_agent
            if agent_name == 'expense_query':
                expense_agent = agent_manager.get_agent('expense_query')
            elif agent_name == 'receipt_parsing':
                receipt_agent = agent_manager.get_agent('receipt_parsing')
            elif agent_name == 'anomaly_detection':
                anomaly_agent = agent_manager.get_agent('anomaly_detection')
            elif agent_name == 'budget_planner':
                budget_agent = agent_manager.get_agent('budget_planner')
            elif agent_name == 'spending_coach':
                coach_agent = agent_manager.get_agent('spending_coach')
        
        return {
            "success": success,
            "agent_name": agent_name,
            "status": agent_manager.get_agent_status(agent_name),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error restarting agent {agent_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agents/multi-request")
async def process_multi_agent_request(
    request_type: str,
    request_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Process requests that require multiple agents"""
    try:
        result = await agent_manager.process_multi_agent_request(request_type, request_data)
        return result
    except Exception as e:
        logger.error(f"Multi-agent request error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)