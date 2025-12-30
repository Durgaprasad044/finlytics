"""
Expense Query Agent - Natural Language Processing for Financial Queries
Uses Gemini Pro, GPT-4, and LangChain for intelligent expense analysis
"""

import asyncio
import json
import logging
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import re

# AI Models
import google.generativeai as genai
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory

# Local imports
from config.settings import settings, MODEL_CONFIGS
from utils.text_processing import TextProcessor
from utils.date_parser import DateParser

logger = logging.getLogger(__name__)

class ExpenseQueryAgent:
    """
    AI agent for processing natural language expense queries
    """
    
    def __init__(self):
        self.gemini_model = None
        self.openai_client = None
        self.langchain_model = None
        self.memory = ConversationBufferMemory()
        self.text_processor = TextProcessor()
        self.date_parser = DateParser()
        
        # Query patterns and intents
        self.query_patterns = {
            'spending_amount': [
                r'how much.*spend.*on',
                r'total.*spent.*on',
                r'amount.*spent.*on',
                r'cost.*of.*in'
            ],
            'spending_trend': [
                r'spending.*trend',
                r'spending.*over.*time',
                r'increase.*decrease.*spending'
            ],
            'category_analysis': [
                r'breakdown.*by.*category',
                r'spending.*categories',
                r'most.*spent.*category'
            ],
            'time_comparison': [
                r'compare.*spending.*between',
                r'spending.*vs.*last',
                r'difference.*spending'
            ],
            'budget_status': [
                r'budget.*status',
                r'over.*under.*budget',
                r'remaining.*budget'
            ]
        }
    
    async def initialize(self):
        """Initialize the expense query agent"""
        try:
            logger.info("🚀 Initializing Expense Query Agent...")
            
            # Initialize Gemini
            if settings.GOOGLE_API_KEY:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                self.gemini_model = genai.GenerativeModel(MODEL_CONFIGS["expense_query"]["primary_model"])
                logger.info("✅ Gemini model initialized")
            
            # Initialize OpenAI
            if settings.OPENAI_API_KEY:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("✅ OpenAI client initialized")
            
            # Initialize LangChain
            if settings.OPENAI_API_KEY:
                self.langchain_model = ChatOpenAI(
                    openai_api_key=settings.OPENAI_API_KEY,
                    model_name=MODEL_CONFIGS["expense_query"]["langchain_model"],
                    temperature=MODEL_CONFIGS["expense_query"]["temperature"]
                )
                logger.info("✅ LangChain model initialized")
            
            logger.info("✅ Expense Query Agent initialized successfully!")
            
        except Exception as e:
            logger.error(f"❌ Error initializing Expense Query Agent: {str(e)}")
            raise
    
    async def process_query(
        self,
        query: str,
        user_id: str,
        transactions: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process a natural language expense query
        """
        try:
            logger.info(f"Processing query: {query[:100]}...")
            
            # Step 1: Parse and understand the query
            query_analysis = await self._analyze_query(query)
            
            # Step 2: Process transaction data
            df = pd.DataFrame(transactions) if transactions else pd.DataFrame()
            
            # Step 3: Execute query based on intent
            query_result = await self._execute_query(query_analysis, df, query)
            
            # Step 4: Generate AI response
            ai_response = await self._generate_ai_response(query, query_result, query_analysis)
            
            # Step 5: Create structured response
            response = {
                "query": query,
                "user_id": user_id,
                "query_analysis": query_analysis,
                "data_result": query_result,
                "response": ai_response,
                "timestamp": datetime.now().isoformat(),
                "success": True
            }
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            return {
                "query": query,
                "user_id": user_id,
                "error": str(e),
                "success": False,
                "timestamp": datetime.now().isoformat()
            }
    
    async def _analyze_query(self, query: str) -> Dict[str, Any]:
        """Analyze query to understand intent and extract parameters"""
        
        query_lower = query.lower()
        
        # Detect query intent
        intent = "general"
        confidence = 0.0
        
        for intent_type, patterns in self.query_patterns.items():
            for pattern in patterns:
                if re.search(pattern, query_lower):
                    intent = intent_type
                    confidence = 0.8
                    break
            if confidence > 0:
                break
        
        # Extract entities
        entities = {
            "categories": self.text_processor.extract_categories(query),
            "amounts": self.text_processor.extract_amounts(query),
            "dates": self.date_parser.extract_dates(query),
            "time_periods": self._extract_time_periods(query)
        }
        
        # Extract comparison terms
        comparison_terms = self._extract_comparison_terms(query)
        
        return {
            "intent": intent,
            "confidence": confidence,
            "entities": entities,
            "comparison_terms": comparison_terms,
            "original_query": query
        }
    
    def _extract_time_periods(self, query: str) -> List[str]:
        """Extract time period references from query"""
        
        time_periods = []
        query_lower = query.lower()
        
        # Common time period patterns
        patterns = {
            'this_month': r'this month',
            'last_month': r'last month',
            'this_year': r'this year',
            'last_year': r'last year',
            'this_week': r'this week',
            'last_week': r'last week',
            'today': r'today',
            'yesterday': r'yesterday',
            'quarter': r'quarter|q[1-4]',
            'january': r'january|jan',
            'february': r'february|feb',
            'march': r'march|mar',
            'april': r'april|apr',
            'may': r'may',
            'june': r'june|jun',
            'july': r'july|jul',
            'august': r'august|aug',
            'september': r'september|sep',
            'october': r'october|oct',
            'november': r'november|nov',
            'december': r'december|dec'
        }
        
        for period, pattern in patterns.items():
            if re.search(pattern, query_lower):
                time_periods.append(period)
        
        return time_periods
    
    def _extract_comparison_terms(self, query: str) -> List[str]:
        """Extract comparison terms from query"""
        
        comparison_terms = []
        query_lower = query.lower()
        
        patterns = [
            'more than', 'less than', 'greater than', 'higher than', 'lower than',
            'compared to', 'versus', 'vs', 'against', 'between', 'difference'
        ]
        
        for term in patterns:
            if term in query_lower:
                comparison_terms.append(term)
        
        return comparison_terms
    
    async def _execute_query(
        self,
        query_analysis: Dict[str, Any],
        df: pd.DataFrame,
        original_query: str
    ) -> Dict[str, Any]:
        """Execute the query based on analyzed intent"""
        
        if df.empty:
            return {
                "result_type": "no_data",
                "message": "No transaction data available",
                "data": {}
            }
        
        # Ensure required columns
        if 'amount' not in df.columns:
            df['amount'] = 0
        if 'category' not in df.columns:
            df['category'] = 'Unknown'
        if 'date' not in df.columns:
            df['date'] = datetime.now()
        
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        
        intent = query_analysis.get("intent", "general")
        entities = query_analysis.get("entities", {})
        
        try:
            if intent == "spending_amount":
                return await self._calculate_spending_amount(df, entities, original_query)
            elif intent == "spending_trend":
                return await self._analyze_spending_trend(df, entities)
            elif intent == "category_analysis":
                return await self._analyze_categories(df, entities)
            elif intent == "time_comparison":
                return await self._compare_time_periods(df, entities)
            elif intent == "budget_status":
                return await self._check_budget_status(df, entities)
            else:
                return await self._general_analysis(df, entities, original_query)
                
        except Exception as e:
            logger.error(f"Error executing query: {str(e)}")
            return {
                "result_type": "error",
                "message": f"Error analyzing data: {str(e)}",
                "data": {}
            }
    
    async def _calculate_spending_amount(
        self,
        df: pd.DataFrame,
        entities: Dict[str, Any],
        query: str
    ) -> Dict[str, Any]:
        """Calculate spending amounts based on query"""
        
        # Filter by categories if specified
        categories = entities.get("categories", [])
        if categories:
            df_filtered = df[df['category'].str.contains('|'.join(categories), case=False, na=False)]
        else:
            df_filtered = df
        
        # Filter by time periods if specified
        time_periods = entities.get("time_periods", [])
        if time_periods:
            df_filtered = self._filter_by_time_periods(df_filtered, time_periods)
        
        # Calculate totals
        total_amount = df_filtered['amount'].sum()
        transaction_count = len(df_filtered)
        average_amount = df_filtered['amount'].mean() if transaction_count > 0 else 0
        
        # Category breakdown
        category_breakdown = df_filtered.groupby('category')['amount'].agg([
            'sum', 'count', 'mean'
        ]).to_dict('index')
        
        return {
            "result_type": "spending_amount",
            "data": {
                "total_amount": float(total_amount),
                "transaction_count": transaction_count,
                "average_amount": float(average_amount),
                "category_breakdown": {
                    cat: {
                        'total': float(data['sum']),
                        'count': int(data['count']),
                        'average': float(data['mean'])
                    }
                    for cat, data in category_breakdown.items()
                },
                "filtered_categories": categories,
                "time_periods": time_periods
            }
        }
    
    async def _analyze_spending_trend(self, df: pd.DataFrame, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze spending trends over time"""
        
        # Group by month
        df['month'] = df['date'].dt.to_period('M')
        monthly_spending = df.groupby('month')['amount'].sum()
        
        # Calculate trend
        if len(monthly_spending) > 1:
            trend_direction = "increasing" if monthly_spending.iloc[-1] > monthly_spending.iloc[0] else "decreasing"
            trend_percentage = ((monthly_spending.iloc[-1] - monthly_spending.iloc[0]) / monthly_spending.iloc[0]) * 100
        else:
            trend_direction = "stable"
            trend_percentage = 0
        
        return {
            "result_type": "spending_trend",
            "data": {
                "trend_direction": trend_direction,
                "trend_percentage": float(trend_percentage),
                "monthly_data": {
                    str(period): float(amount) 
                    for period, amount in monthly_spending.items()
                },
                "total_months": len(monthly_spending)
            }
        }
    
    async def _analyze_categories(self, df: pd.DataFrame, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze spending by categories"""
        
        category_analysis = df.groupby('category')['amount'].agg([
            'sum', 'count', 'mean', 'std'
        ]).sort_values('sum', ascending=False)
        
        # Calculate percentages
        total_spending = df['amount'].sum()
        category_percentages = (category_analysis['sum'] / total_spending * 100).to_dict()
        
        return {
            "result_type": "category_analysis",
            "data": {
                "categories": {
                    cat: {
                        'total': float(data['sum']),
                        'count': int(data['count']),
                        'average': float(data['mean']),
                        'std': float(data['std']) if pd.notna(data['std']) else 0,
                        'percentage': float(category_percentages.get(cat, 0))
                    }
                    for cat, data in category_analysis.iterrows()
                },
                "top_category": category_analysis.index[0] if len(category_analysis) > 0 else "None",
                "total_categories": len(category_analysis)
            }
        }
    
    async def _compare_time_periods(self, df: pd.DataFrame, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Compare spending between time periods"""
        
        # Simple comparison: current month vs last month
        current_month = datetime.now().replace(day=1)
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        
        current_month_data = df[df['date'] >= current_month]
        last_month_data = df[
            (df['date'] >= last_month) & 
            (df['date'] < current_month)
        ]
        
        current_total = current_month_data['amount'].sum()
        last_total = last_month_data['amount'].sum()
        
        difference = current_total - last_total
        percentage_change = (difference / last_total * 100) if last_total > 0 else 0
        
        return {
            "result_type": "time_comparison",
            "data": {
                "current_period": {
                    "total": float(current_total),
                    "count": len(current_month_data)
                },
                "previous_period": {
                    "total": float(last_total),
                    "count": len(last_month_data)
                },
                "difference": float(difference),
                "percentage_change": float(percentage_change),
                "comparison_type": "month_over_month"
            }
        }
    
    async def _check_budget_status(self, df: pd.DataFrame, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Check budget status (simplified)"""
        
        # This would typically compare against user's budget
        # For now, we'll provide spending summary
        current_month = datetime.now().replace(day=1)
        current_month_spending = df[df['date'] >= current_month]['amount'].sum()
        
        # Estimate budget as 1.2x of average monthly spending
        avg_monthly = df.groupby(df['date'].dt.to_period('M'))['amount'].sum().mean()
        estimated_budget = avg_monthly * 1.2 if pd.notna(avg_monthly) else 0
        
        remaining_budget = estimated_budget - current_month_spending
        budget_utilization = (current_month_spending / estimated_budget * 100) if estimated_budget > 0 else 0
        
        return {
            "result_type": "budget_status",
            "data": {
                "current_spending": float(current_month_spending),
                "estimated_budget": float(estimated_budget),
                "remaining_budget": float(remaining_budget),
                "budget_utilization_percentage": float(budget_utilization),
                "status": "over_budget" if remaining_budget < 0 else "on_track"
            }
        }
    
    async def _general_analysis(
        self,
        df: pd.DataFrame,
        entities: Dict[str, Any],
        query: str
    ) -> Dict[str, Any]:
        """General analysis for unspecified queries"""
        
        total_spending = df['amount'].sum()
        transaction_count = len(df)
        avg_transaction = df['amount'].mean() if transaction_count > 0 else 0
        
        # Top categories
        top_categories = df.groupby('category')['amount'].sum().sort_values(ascending=False).head(5)
        
        return {
            "result_type": "general_analysis",
            "data": {
                "total_spending": float(total_spending),
                "transaction_count": transaction_count,
                "average_transaction": float(avg_transaction),
                "top_categories": {
                    cat: float(amount) 
                    for cat, amount in top_categories.items()
                },
                "date_range": {
                    "start": df['date'].min().isoformat() if not df.empty else None,
                    "end": df['date'].max().isoformat() if not df.empty else None
                }
            }
        }
    
    def _filter_by_time_periods(self, df: pd.DataFrame, time_periods: List[str]) -> pd.DataFrame:
        """Filter dataframe by time periods"""
        
        if not time_periods:
            return df
        
        # Simple time filtering logic
        now = datetime.now()
        
        if 'this_month' in time_periods:
            start_of_month = now.replace(day=1)
            df = df[df['date'] >= start_of_month]
        elif 'last_month' in time_periods:
            start_of_last_month = (now.replace(day=1) - timedelta(days=1)).replace(day=1)
            end_of_last_month = now.replace(day=1)
            df = df[(df['date'] >= start_of_last_month) & (df['date'] < end_of_last_month)]
        
        return df
    
    async def _generate_ai_response(
        self,
        query: str,
        query_result: Dict[str, Any],
        query_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate AI-powered response using available models"""
        
        try:
            # Prepare context for AI
            context = {
                "query": query,
                "result_type": query_result.get("result_type"),
                "data": query_result.get("data", {}),
                "intent": query_analysis.get("intent")
            }
            
            # Try Gemini first
            if self.gemini_model:
                ai_text = await self._generate_gemini_response(context)
                if ai_text:
                    return {
                        "text_response": ai_text,
                        "model_used": "gemini-pro",
                        "confidence": 0.9
                    }
            
            # Fallback to OpenAI
            if self.openai_client:
                ai_text = await self._generate_openai_response(context)
                if ai_text:
                    return {
                        "text_response": ai_text,
                        "model_used": "gpt-3.5-turbo",
                        "confidence": 0.8
                    }
            
            # Fallback to rule-based response
            return self._generate_rule_based_response(context)
            
        except Exception as e:
            logger.error(f"Error generating AI response: {str(e)}")
            return self._generate_rule_based_response(context)
    
    async def _generate_gemini_response(self, context: Dict[str, Any]) -> Optional[str]:
        """Generate response using Gemini"""
        
        try:
            prompt = f"""
            You are a helpful financial assistant. Answer this expense query based on the analysis results:
            
            Query: {context['query']}
            Analysis Type: {context['result_type']}
            Data: {json.dumps(context['data'], indent=2)}
            
            Provide a clear, conversational response that directly answers the user's question.
            Include specific numbers and insights from the data.
            Keep it concise but informative.
            """
            
            response = await asyncio.to_thread(
                self.gemini_model.generate_content, prompt
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"Gemini response generation failed: {str(e)}")
            return None
    
    async def _generate_openai_response(self, context: Dict[str, Any]) -> Optional[str]:
        """Generate response using OpenAI"""
        
        try:
            prompt = f"""
            You are a helpful financial assistant. Answer this expense query based on the analysis results:
            
            Query: {context['query']}
            Analysis Type: {context['result_type']}
            Data: {json.dumps(context['data'], indent=2)}
            
            Provide a clear, conversational response that directly answers the user's question.
            Include specific numbers and insights from the data.
            Keep it concise but informative.
            """
            
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.3
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"OpenAI response generation failed: {str(e)}")
            return None
    
    def _generate_rule_based_response(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate rule-based response as fallback"""
        
        result_type = context.get("result_type")
        data = context.get("data", {})
        query = context.get("query", "").lower()
        
        # Generate contextual responses based on query content
        if query.strip() in ["hello", "hi", "hey"] or query.startswith("hello ") or query.startswith("hi ") or query.startswith("hey "):
            text = "Hello! I'm IRIS, your AI finance assistant. I'm here to help you manage your finances, track expenses, analyze spending patterns, and provide budgeting advice. What would you like to know about your finances?"
        
        elif "help" in query:
            text = "I can help you with various financial tasks:\n• Track and analyze your expenses\n• Create and manage budgets\n• Provide spending insights and trends\n• Set and monitor financial goals\n• Parse receipts automatically\n• Detect unusual spending patterns\n\nWhat specific area would you like assistance with?"
        
        elif result_type == "spending_amount":
            total = data.get("total_amount", 0)
            count = data.get("transaction_count", 0)
            if count > 0:
                text = f"Based on your transaction data, you spent ${total:.2f} across {count} transactions."
                
                if data.get("category_breakdown"):
                    top_category = max(data["category_breakdown"].items(), key=lambda x: x[1]["total"])
                    text += f" Your highest spending category was {top_category[0]} with ${top_category[1]['total']:.2f}."
            else:
                text = "I don't see any transaction data yet. Once you start adding expenses or uploading receipts, I'll be able to provide detailed spending analysis!"
        
        elif result_type == "category_analysis":
            categories = data.get("categories", {})
            if categories:
                top_category = list(categories.keys())[0]
                top_amount = categories[top_category]["total"]
                text = f"Your top spending category is {top_category} with ${top_amount:.2f}."
            else:
                text = "I'd love to analyze your spending by category! Start by adding some transactions or uploading receipts, and I'll show you detailed breakdowns of where your money goes."
        
        elif result_type == "no_data":
            text = "I don't have any transaction data to analyze yet. Here's how you can get started:\n• Upload receipts using the camera icon\n• Manually add transactions in the Expenses section\n• Connect your bank account (if available)\n\nOnce you have some data, I can provide detailed insights about your spending!"
        
        elif "budget" in query:
            text = "I can help you create a personalized budget! A good starting point is the 50/30/20 rule:\n• 50% for needs (rent, groceries, utilities)\n• 30% for wants (entertainment, dining out)\n• 20% for savings and debt repayment\n\nWould you like me to create a budget plan based on your spending patterns?"
        
        elif "save" in query or "saving" in query:
            text = "Great question about saving! Here are some effective strategies:\n• Automate your savings (pay yourself first)\n• Track your expenses to find areas to cut back\n• Set specific, achievable savings goals\n• Use the envelope method for discretionary spending\n• Consider high-yield savings accounts\n\nWhat's your current savings goal?"
        
        elif "spend" in query or "expense" in query:
            text = "I can help you understand your spending patterns! To provide detailed analysis, I'll need some transaction data. You can:\n• Upload receipts for automatic parsing\n• Add expenses manually\n• Ask me specific questions like 'How much did I spend on food this month?'\n\nWhat aspect of your spending would you like to explore?"
        
        else:
            text = "I'm here to help with your finances! I can assist with expense tracking, budgeting, savings goals, and financial planning. What specific financial question can I help you with today?"
        
        return {
            "text_response": text,
            "model_used": "rule-based",
            "confidence": 0.8
        }