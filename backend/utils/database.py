"""
Database utilities for the AI Finance Assistant Backend
"""

import asyncio
import json
import logging
import sqlite3
import aiosqlite
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Database manager for handling user data and transactions"""
    
    def __init__(self, db_path: str = "finance_assistant.db"):
        self.db_path = db_path
    
    async def initialize(self):
        """Initialize database tables"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                # Users table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        email TEXT UNIQUE,
                        profile_data TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Transactions table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS transactions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT,
                        amount REAL,
                        category TEXT,
                        description TEXT,
                        merchant TEXT,
                        date DATE,
                        transaction_type TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """)
                
                # Budget plans table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS budget_plans (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT,
                        plan_data TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """)
                
                # Coaching sessions table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS coaching_sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT,
                        session_data TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                """)
                
                await db.commit()
                logger.info("✅ Database initialized successfully")
                
        except Exception as e:
            logger.error(f"❌ Error initializing database: {str(e)}")
            raise
    
    async def get_user_transactions(
        self, 
        user_id: str, 
        limit: int = 1000, 
        offset: int = 0,
        time_period: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get user's transactions"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                query = "SELECT * FROM transactions WHERE user_id = ?"
                params = [user_id]
                
                # Add time period filter
                if time_period:
                    if time_period == "week":
                        query += " AND date >= date('now', '-7 days')"
                    elif time_period == "month":
                        query += " AND date >= date('now', '-30 days')"
                    elif time_period == "quarter":
                        query += " AND date >= date('now', '-90 days')"
                    elif time_period == "year":
                        query += " AND date >= date('now', '-365 days')"
                
                query += " ORDER BY date DESC LIMIT ? OFFSET ?"
                params.extend([limit, offset])
                
                async with db.execute(query, params) as cursor:
                    rows = await cursor.fetchall()
                    columns = [description[0] for description in cursor.description]
                    
                    transactions = []
                    for row in rows:
                        transaction = dict(zip(columns, row))
                        transactions.append(transaction)
                    
                    return transactions
                    
        except Exception as e:
            logger.error(f"Error getting user transactions: {str(e)}")
            return []
    
    async def add_transaction(self, user_id: str, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new transaction"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    INSERT INTO transactions (user_id, amount, category, description, merchant, date, transaction_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    user_id,
                    transaction_data.get('amount'),
                    transaction_data.get('category'),
                    transaction_data.get('description'),
                    transaction_data.get('merchant'),
                    transaction_data.get('date'),
                    transaction_data.get('transaction_type', 'debit')
                ))
                
                await db.commit()
                
                return {"success": True, "message": "Transaction added successfully"}
                
        except Exception as e:
            logger.error(f"Error adding transaction: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def update_transaction(self, user_id: str, transaction_id: str, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing transaction"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    UPDATE transactions 
                    SET amount = ?, category = ?, description = ?, merchant = ?, date = ?, transaction_type = ?
                    WHERE id = ? AND user_id = ?
                """, (
                    transaction_data.get('amount'),
                    transaction_data.get('category'),
                    transaction_data.get('description'),
                    transaction_data.get('merchant'),
                    transaction_data.get('date'),
                    transaction_data.get('transaction_type', 'debit'),
                    transaction_id,
                    user_id
                ))
                
                await db.commit()
                
                # Check if any rows were affected
                cursor = await db.execute("SELECT changes()")
                changes = await cursor.fetchone()
                
                if changes[0] > 0:
                    return {"success": True, "message": "Transaction updated successfully"}
                else:
                    return {"success": False, "error": "Transaction not found or not authorized"}
                
        except Exception as e:
            logger.error(f"Error updating transaction: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def delete_transaction(self, user_id: str, transaction_id: str) -> Dict[str, Any]:
        """Delete a transaction"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    DELETE FROM transactions 
                    WHERE id = ? AND user_id = ?
                """, (transaction_id, user_id))
                
                await db.commit()
                
                # Check if any rows were affected
                cursor = await db.execute("SELECT changes()")
                changes = await cursor.fetchone()
                
                if changes[0] > 0:
                    return {"success": True, "message": "Transaction deleted successfully"}
                else:
                    return {"success": False, "error": "Transaction not found or not authorized"}
                
        except Exception as e:
            logger.error(f"Error deleting transaction: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_user_financial_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user's financial profile"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                async with db.execute("SELECT profile_data FROM users WHERE id = ?", (user_id,)) as cursor:
                    row = await cursor.fetchone()
                    
                    if row and row[0]:
                        return json.loads(row[0])
                    else:
                        # Return default profile
                        return {
                            "monthly_income": None,
                            "budget_strategy": "balanced",
                            "financial_goals": [],
                            "risk_tolerance": "medium"
                        }
                        
        except Exception as e:
            logger.error(f"Error getting user profile: {str(e)}")
            return {}
    
    async def update_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Update user's financial profile"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    INSERT OR REPLACE INTO users (id, profile_data, updated_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                """, (user_id, json.dumps(profile_data)))
                
                await db.commit()
                return True
                
        except Exception as e:
            logger.error(f"Error updating user profile: {str(e)}")
            return False
    
    async def save_budget_plan(self, user_id: str, plan_data: Dict[str, Any]) -> bool:
        """Save user's budget plan"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    INSERT INTO budget_plans (user_id, plan_data)
                    VALUES (?, ?)
                """, (user_id, json.dumps(plan_data)))
                
                await db.commit()
                return True
                
        except Exception as e:
            logger.error(f"Error saving budget plan: {str(e)}")
            return False
    
    async def save_coaching_session(self, user_id: str, session_data: Dict[str, Any]) -> bool:
        """Save coaching session data"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    INSERT INTO coaching_sessions (user_id, session_data)
                    VALUES (?, ?)
                """, (user_id, json.dumps(session_data)))
                
                await db.commit()
                return True
                
        except Exception as e:
            logger.error(f"Error saving coaching session: {str(e)}")
            return False