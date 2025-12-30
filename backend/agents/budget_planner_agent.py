"""
Budget Planner Agent - AI-powered budget planning and financial forecasting
Uses Gemini Pro, Prophet, and Regression Models
"""

import asyncio
import json
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Forecasting models
try:
    from prophet import Prophet
except ImportError:
    Prophet = None

from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error

# AI Models
import google.generativeai as genai

# Local imports
from config.settings import settings, MODEL_CONFIGS

logger = logging.getLogger(__name__)

class BudgetPlannerAgent:
    """
    AI agent for creating personalized budget plans and financial forecasts
    """
    
    def __init__(self):
        self.gemini_model = None
        self.prophet_models = {}
        self.regression_models = {}
        self.scaler = StandardScaler()
        
        # Budget allocation rules (50/30/20 rule variations)
        self.allocation_rules = {
            'conservative': {'needs': 0.60, 'wants': 0.20, 'savings': 0.20},
            'balanced': {'needs': 0.50, 'wants': 0.30, 'savings': 0.20},
            'aggressive_savings': {'needs': 0.45, 'wants': 0.25, 'savings': 0.30},
            'debt_payoff': {'needs': 0.50, 'wants': 0.15, 'savings': 0.10, 'debt': 0.25}
        }
        
        # Essential vs discretionary categories
        self.essential_categories = [
            'Mortgage & Rent', 'Utilities', 'Groceries', 'Transportation',
            'Insurance', 'Minimum Debt Payments', 'Phone', 'Internet'
        ]
        
        self.discretionary_categories = [
            'Restaurants', 'Entertainment', 'Shopping', 'Coffee Shops',
            'Subscriptions', 'Hobbies', 'Travel', 'Personal Care'
        ]
    
    async def initialize(self):
        """Initialize the budget planner agent"""
        try:
            logger.info("🚀 Initializing Budget Planner Agent...")
            
            # Initialize Gemini for intelligent budget advice
            if settings.GOOGLE_API_KEY:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                self.gemini_model = genai.GenerativeModel(MODEL_CONFIGS["budget_planning"]["forecasting_model"])
                logger.info("✅ Gemini model initialized")
            
            logger.info("✅ Budget Planner Agent initialized successfully!")
            
        except Exception as e:
            logger.error(f"❌ Error initializing Budget Planner Agent: {str(e)}")
            raise
    
    async def create_budget_plan(
        self,
        user_id: str,
        monthly_income: Optional[float] = None,
        savings_goal: float = 0.2,
        financial_goals: List[str] = None,
        historical_data: List[Dict[str, Any]] = None,
        user_profile: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Create a comprehensive, personalized budget plan
        """
        try:
            logger.info(f"Creating budget plan for user: {user_id}")
            
            # Step 1: Analyze historical spending patterns
            spending_analysis = await self._analyze_spending_patterns(historical_data or [])
            
            # Step 2: Estimate income if not provided
            if monthly_income is None:
                monthly_income = await self._estimate_income(historical_data or [], user_profile or {})
            
            # Step 3: Create spending forecasts
            forecasts = await self._create_spending_forecasts(historical_data or [])
            
            # Step 4: Optimize budget allocation
            budget_allocation = await self._optimize_budget_allocation(
                monthly_income, savings_goal, spending_analysis, user_profile or {}
            )
            
            # Step 5: Create financial goals plan
            goals_plan = await self._create_goals_plan(
                monthly_income, financial_goals or [], user_profile or {}
            )
            
            # Step 6: Generate AI-powered recommendations
            ai_recommendations = await self._generate_ai_recommendations(
                monthly_income, budget_allocation, spending_analysis, goals_plan
            )
            
            # Step 7: Calculate budget metrics
            metrics = await self._calculate_budget_metrics(
                monthly_income, budget_allocation, spending_analysis
            )
            
            return {
                "user_id": user_id,
                "monthly_income": monthly_income,
                "savings_goal_percentage": savings_goal,
                "budget_allocation": budget_allocation,
                "spending_analysis": spending_analysis,
                "forecasts": forecasts,
                "financial_goals": goals_plan,
                "ai_recommendations": ai_recommendations,
                "metrics": metrics,
                "created_at": datetime.now().isoformat(),
                "next_review_date": (datetime.now() + timedelta(days=30)).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error creating budget plan: {str(e)}")
            return {
                "error": str(e),
                "user_id": user_id
            }
    
    async def _analyze_spending_patterns(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze historical spending patterns"""
        
        if not historical_data:
            return {
                "total_monthly_spending": 0,
                "category_breakdown": {},
                "trends": {},
                "insights": []
            }
        
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').abs()
        
        # Monthly spending analysis
        df['month'] = df['date'].dt.to_period('M')
        monthly_spending = df.groupby('month')['amount'].sum()
        
        # Category breakdown
        category_breakdown = df.groupby('category')['amount'].agg([
            'sum', 'mean', 'count', 'std'
        ]).to_dict('index')
        
        # Trend analysis
        trends = await self._analyze_trends(df)
        
        # Generate insights
        insights = await self._generate_spending_insights(df, trends)
        
        return {
            "total_monthly_spending": float(monthly_spending.mean()) if len(monthly_spending) > 0 else 0,
            "category_breakdown": {
                cat: {
                    'total': float(data['sum']),
                    'average': float(data['mean']),
                    'frequency': int(data['count']),
                    'volatility': float(data['std']) if pd.notna(data['std']) else 0
                }
                for cat, data in category_breakdown.items()
            },
            "monthly_trend": {
                str(period): float(amount) 
                for period, amount in monthly_spending.items()
            },
            "trends": trends,
            "insights": insights
        }
    
    async def _analyze_trends(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze spending trends using statistical methods"""
        
        # Monthly aggregation
        monthly_data = df.groupby(df['date'].dt.to_period('M'))['amount'].sum()
        
        if len(monthly_data) < 3:
            return {"trend": "insufficient_data", "slope": 0, "r_squared": 0}
        
        # Linear regression for trend
        X = np.arange(len(monthly_data)).reshape(-1, 1)
        y = monthly_data.values
        
        model = LinearRegression()
        model.fit(X, y)
        
        trend_direction = "increasing" if model.coef_[0] > 0 else "decreasing"
        if abs(model.coef_[0]) < monthly_data.std() * 0.1:
            trend_direction = "stable"
        
        r_squared = model.score(X, y)
        
        return {
            "trend": trend_direction,
            "slope": float(model.coef_[0]),
            "r_squared": float(r_squared),
            "monthly_change": float(model.coef_[0]),
            "confidence": "high" if r_squared > 0.7 else "medium" if r_squared > 0.4 else "low"
        }
    
    async def _generate_spending_insights(self, df: pd.DataFrame, trends: Dict[str, Any]) -> List[str]:
        """Generate insights from spending analysis"""
        
        insights = []
        
        # Trend insights
        if trends["trend"] == "increasing":
            insights.append(f"Your spending has been increasing by ${trends['monthly_change']:.2f} per month")
        elif trends["trend"] == "decreasing":
            insights.append(f"Your spending has been decreasing by ${abs(trends['monthly_change']):.2f} per month")
        
        # Category insights
        if not df.empty:
            category_totals = df.groupby('category')['amount'].sum().sort_values(ascending=False)
            if len(category_totals) > 0:
                top_category = category_totals.index[0]
                top_amount = category_totals.iloc[0]
                insights.append(f"Your highest spending category is {top_category} (${top_amount:.2f})")
        
        return insights
    
    async def _estimate_income(
        self, 
        historical_data: List[Dict[str, Any]], 
        user_profile: Dict[str, Any]
    ) -> float:
        """Estimate monthly income from historical data and profile"""
        
        # Try to get from user profile first
        if user_profile.get('monthly_income'):
            return float(user_profile['monthly_income'])
        
        if not historical_data:
            return 4000.0  # Default estimate
        
        df = pd.DataFrame(historical_data)
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        
        # Estimate from spending patterns (assume 70% of income is spent)
        if not df.empty:
            monthly_spending = df.groupby(
                pd.to_datetime(df['date']).dt.to_period('M')
            )['amount'].sum().mean()
            estimated_income = monthly_spending / 0.7  # Assume 70% spending rate
            return float(estimated_income)
        
        return 4000.0  # Default fallback
    
    async def _create_spending_forecasts(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create spending forecasts using Prophet and regression models"""
        
        if len(historical_data) < 30:  # Need at least 30 data points
            return {
                "forecast_available": False,
                "reason": "Insufficient historical data (minimum 30 transactions required)"
            }
        
        try:
            df = pd.DataFrame(historical_data)
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce').abs()
            
            # Aggregate daily spending
            daily_spending = df.groupby(df['date'].dt.date)['amount'].sum().reset_index()
            daily_spending.columns = ['ds', 'y']
            daily_spending['ds'] = pd.to_datetime(daily_spending['ds'])
            
            # Use simple linear regression if Prophet is not available
            if Prophet is None:
                return await self._simple_forecast(daily_spending)
            
            # Create Prophet model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False
            )
            
            model.fit(daily_spending)
            
            # Create future dataframe for next 90 days
            future = model.make_future_dataframe(periods=90)
            forecast = model.predict(future)
            
            # Extract forecasts
            future_forecast = forecast.tail(90)
            
            # Calculate monthly forecasts
            future_forecast['month'] = future_forecast['ds'].dt.to_period('M')
            monthly_forecast = future_forecast.groupby('month').agg({
                'yhat': 'sum',
                'yhat_lower': 'sum',
                'yhat_upper': 'sum'
            })
            
            return {
                "forecast_available": True,
                "model_type": "Prophet",
                "monthly_forecast": {
                    str(month): {
                        "predicted": float(data['yhat']),
                        "lower_bound": float(data['yhat_lower']),
                        "upper_bound": float(data['yhat_upper'])
                    }
                    for month, data in monthly_forecast.iterrows()
                }
            }
            
        except Exception as e:
            logger.error(f"Error creating forecasts: {str(e)}")
            return {
                "forecast_available": False,
                "reason": f"Forecast generation failed: {str(e)}"
            }
    
    async def _simple_forecast(self, daily_spending: pd.DataFrame) -> Dict[str, Any]:
        """Simple linear regression forecast when Prophet is not available"""
        
        try:
            # Prepare data for linear regression
            daily_spending['days'] = (daily_spending['ds'] - daily_spending['ds'].min()).dt.days
            
            X = daily_spending[['days']].values
            y = daily_spending['y'].values
            
            # Fit linear regression
            model = LinearRegression()
            model.fit(X, y)
            
            # Predict next 90 days
            last_day = daily_spending['days'].max()
            future_days = np.arange(last_day + 1, last_day + 91).reshape(-1, 1)
            future_predictions = model.predict(future_days)
            
            # Create monthly aggregates
            future_dates = pd.date_range(
                start=daily_spending['ds'].max() + timedelta(days=1),
                periods=90,
                freq='D'
            )
            
            future_df = pd.DataFrame({
                'ds': future_dates,
                'predicted': future_predictions
            })
            
            future_df['month'] = future_df['ds'].dt.to_period('M')
            monthly_forecast = future_df.groupby('month')['predicted'].sum()
            
            return {
                "forecast_available": True,
                "model_type": "Linear Regression",
                "monthly_forecast": {
                    str(month): {
                        "predicted": float(amount),
                        "lower_bound": float(amount * 0.9),
                        "upper_bound": float(amount * 1.1)
                    }
                    for month, amount in monthly_forecast.items()
                }
            }
            
        except Exception as e:
            logger.error(f"Simple forecast failed: {str(e)}")
            return {
                "forecast_available": False,
                "reason": f"Simple forecast failed: {str(e)}"
            }
    
    async def _optimize_budget_allocation(
        self,
        monthly_income: float,
        savings_goal: float,
        spending_analysis: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Optimize budget allocation based on income, goals, and spending patterns"""
        
        # Determine allocation strategy
        strategy = user_profile.get('budget_strategy', 'balanced')
        if strategy not in self.allocation_rules:
            strategy = 'balanced'
        
        allocation_rule = self.allocation_rules[strategy]
        
        # Calculate base allocations
        needs_budget = monthly_income * allocation_rule['needs']
        wants_budget = monthly_income * allocation_rule['wants']
        savings_budget = monthly_income * max(savings_goal, allocation_rule['savings'])
        debt_budget = monthly_income * allocation_rule.get('debt', 0)
        
        # Allocate to specific categories based on historical data
        category_allocations = {}
        category_breakdown = spending_analysis.get('category_breakdown', {})
        
        # Essential categories (needs)
        essential_total = 0
        for category in self.essential_categories:
            if category in category_breakdown:
                historical_avg = category_breakdown[category]['average']
                allocation = min(historical_avg * 1.1, monthly_income * 0.15)
            else:
                # Default allocations for essential categories
                default_allocations = {
                    'Mortgage & Rent': monthly_income * 0.25,
                    'Utilities': monthly_income * 0.05,
                    'Groceries': monthly_income * 0.10,
                    'Transportation': monthly_income * 0.08,
                    'Insurance': monthly_income * 0.03,
                    'Phone': monthly_income * 0.02,
                    'Internet': monthly_income * 0.01
                }
                allocation = default_allocations.get(category, monthly_income * 0.02)
            
            category_allocations[category] = float(allocation)
            essential_total += allocation
        
        # Adjust if essential spending exceeds needs budget
        if essential_total > needs_budget:
            adjustment_factor = needs_budget / essential_total
            for category in self.essential_categories:
                if category in category_allocations:
                    category_allocations[category] *= adjustment_factor
        
        # Discretionary categories (wants)
        discretionary_total = 0
        for category in self.discretionary_categories:
            if category in category_breakdown:
                historical_avg = category_breakdown[category]['average']
                allocation = min(historical_avg * 0.9, wants_budget * 0.3)
                category_allocations[category] = float(allocation)
                discretionary_total += allocation
        
        # Adjust discretionary spending if it exceeds wants budget
        if discretionary_total > wants_budget:
            adjustment_factor = wants_budget / discretionary_total
            for category in self.discretionary_categories:
                if category in category_allocations:
                    category_allocations[category] *= adjustment_factor
        
        # Calculate totals
        total_allocated = sum(category_allocations.values())
        remaining_budget = monthly_income - total_allocated - savings_budget - debt_budget
        
        return {
            "monthly_income": monthly_income,
            "strategy": strategy,
            "high_level_allocation": {
                "needs": needs_budget,
                "wants": wants_budget,
                "savings": savings_budget,
                "debt_payment": debt_budget
            },
            "category_allocations": category_allocations,
            "total_allocated": total_allocated,
            "remaining_buffer": max(0, remaining_budget),
            "allocation_percentages": {
                category: (amount / monthly_income) * 100
                for category, amount in category_allocations.items()
            }
        }
    
    async def _create_goals_plan(
        self,
        monthly_income: float,
        financial_goals: List[str],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a financial goals achievement plan"""
        
        goals_plan = {
            "goals": [],
            "total_monthly_savings_needed": 0,
            "timeline": {}
        }
        
        # Add default essential goals if not specified
        if not financial_goals:
            financial_goals = ['emergency_fund', 'retirement']
        
        goal_templates = {
            'emergency_fund': {
                'name': 'Emergency Fund',
                'target_amount': monthly_income * 0.7 * 6,  # 6 months expenses
                'monthly_allocation': monthly_income * 0.05,
                'priority': 'high'
            },
            'retirement': {
                'name': 'Retirement Savings',
                'target_amount': monthly_income * 0.15 * 12,  # Annual retirement savings
                'monthly_allocation': monthly_income * 0.15,
                'priority': 'high'
            },
            'vacation': {
                'name': 'Vacation Fund',
                'target_amount': monthly_income * 0.05 * 12,  # Annual vacation budget
                'monthly_allocation': monthly_income * 0.05,
                'priority': 'medium'
            }
        }
        
        for goal_type in financial_goals:
            if goal_type in goal_templates:
                template = goal_templates[goal_type]
                
                target_amount = template['target_amount']
                monthly_allocation = template['monthly_allocation']
                months_to_goal = target_amount / monthly_allocation if monthly_allocation > 0 else float('inf')
                
                goal_info = {
                    "type": goal_type,
                    "name": template['name'],
                    "target_amount": float(target_amount),
                    "monthly_allocation": float(monthly_allocation),
                    "months_to_achieve": int(months_to_goal) if months_to_goal != float('inf') else None,
                    "priority": template['priority'],
                    "completion_date": (
                        datetime.now() + timedelta(days=int(months_to_goal * 30))
                    ).isoformat() if months_to_goal != float('inf') else None
                }
                
                goals_plan["goals"].append(goal_info)
                goals_plan["total_monthly_savings_needed"] += monthly_allocation
        
        return goals_plan
    
    async def _generate_ai_recommendations(
        self,
        monthly_income: float,
        budget_allocation: Dict[str, Any],
        spending_analysis: Dict[str, Any],
        goals_plan: Dict[str, Any]
    ) -> List[str]:
        """Generate AI-powered budget recommendations using Gemini"""
        
        try:
            if not self.gemini_model:
                return await self._generate_rule_based_recommendations(
                    monthly_income, budget_allocation, spending_analysis, goals_plan
                )
            
            # Prepare context for AI
            context = {
                "monthly_income": monthly_income,
                "budget_allocation": budget_allocation,
                "spending_trends": spending_analysis.get("trends", {}),
                "financial_goals": [goal["name"] for goal in goals_plan.get("goals", [])],
                "savings_rate": (budget_allocation.get("high_level_allocation", {}).get("savings", 0) / monthly_income) * 100
            }
            
            prompt = f"""
            As a financial advisor, provide personalized budget recommendations based on this financial profile:
            
            Monthly Income: ${monthly_income:.2f}
            Current Savings Rate: {context['savings_rate']:.1f}%
            
            Budget Allocation:
            {json.dumps(budget_allocation.get('category_allocations', {}), indent=2)}
            
            Spending Trends: {spending_analysis.get('trends', {}).get('trend', 'stable')}
            
            Financial Goals: {', '.join(context['financial_goals'])}
            
            Please provide 5-7 specific, actionable recommendations to improve this budget. Focus on:
            1. Optimizing spending in high-cost categories
            2. Increasing savings rate if possible
            3. Achieving financial goals faster
            4. Reducing financial risks
            5. Improving overall financial health
            
            Format as a numbered list with brief explanations.
            """
            
            response = await asyncio.to_thread(
                self.gemini_model.generate_content, prompt
            )
            
            # Parse response into list
            recommendations = []
            lines = response.text.split('\n')
            for line in lines:
                line = line.strip()
                if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                    clean_line = line.lstrip('0123456789.-• ').strip()
                    if clean_line:
                        recommendations.append(clean_line)
            
            return recommendations[:7]  # Limit to 7 recommendations
            
        except Exception as e:
            logger.error(f"AI recommendation generation failed: {str(e)}")
            return await self._generate_rule_based_recommendations(
                monthly_income, budget_allocation, spending_analysis, goals_plan
            )
    
    async def _generate_rule_based_recommendations(
        self,
        monthly_income: float,
        budget_allocation: Dict[str, Any],
        spending_analysis: Dict[str, Any],
        goals_plan: Dict[str, Any]
    ) -> List[str]:
        """Generate rule-based recommendations as fallback"""
        
        recommendations = []
        
        # Savings rate recommendations
        savings_rate = (budget_allocation.get("high_level_allocation", {}).get("savings", 0) / monthly_income) * 100
        if savings_rate < 10:
            recommendations.append("Increase your savings rate to at least 10% of income")
        elif savings_rate < 20:
            recommendations.append("Great start! Try to increase savings to 20% for better financial security")
        
        # Category-specific recommendations
        category_allocations = budget_allocation.get("category_allocations", {})
        
        # Housing cost check
        housing_categories = ['Mortgage & Rent', 'Utilities']
        housing_total = sum(category_allocations.get(cat, 0) for cat in housing_categories)
        housing_percentage = (housing_total / monthly_income) * 100
        
        if housing_percentage > 30:
            recommendations.append(f"Housing costs are {housing_percentage:.1f}% of income - consider reducing to under 30%")
        
        # Emergency fund priority
        emergency_goals = [g for g in goals_plan.get("goals", []) if g["type"] == "emergency_fund"]
        if not emergency_goals:
            recommendations.append("Prioritize building an emergency fund of 3-6 months expenses")
        
        return recommendations[:7]
    
    async def _calculate_budget_metrics(
        self,
        monthly_income: float,
        budget_allocation: Dict[str, Any],
        spending_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate key budget performance metrics"""
        
        high_level = budget_allocation.get("high_level_allocation", {})
        
        metrics = {
            "savings_rate": (high_level.get("savings", 0) / monthly_income) * 100,
            "debt_to_income_ratio": (high_level.get("debt_payment", 0) / monthly_income) * 100,
            "budget_efficiency_score": 0,  # Composite score
            "financial_health_grade": "B"  # A-F grade
        }
        
        # Calculate budget efficiency score (0-100)
        efficiency_score = 0
        
        # Savings rate component (30 points max)
        savings_rate = metrics["savings_rate"]
        if savings_rate >= 20:
            efficiency_score += 30
        elif savings_rate >= 10:
            efficiency_score += 20
        elif savings_rate >= 5:
            efficiency_score += 10
        
        # Debt management component (20 points max)
        debt_ratio = metrics["debt_to_income_ratio"]
        if debt_ratio <= 10:
            efficiency_score += 20
        elif debt_ratio <= 20:
            efficiency_score += 15
        elif debt_ratio <= 30:
            efficiency_score += 10
        
        # Budget balance component (50 points max)
        category_allocations = budget_allocation.get("category_allocations", {})
        total_allocated = sum(category_allocations.values()) + high_level.get("savings", 0)
        if total_allocated <= monthly_income:
            efficiency_score += 50
        
        metrics["budget_efficiency_score"] = efficiency_score
        
        # Assign financial health grade
        if efficiency_score >= 90:
            metrics["financial_health_grade"] = "A"
        elif efficiency_score >= 80:
            metrics["financial_health_grade"] = "B"
        elif efficiency_score >= 70:
            metrics["financial_health_grade"] = "C"
        elif efficiency_score >= 60:
            metrics["financial_health_grade"] = "D"
        else:
            metrics["financial_health_grade"] = "F"
        
        return metrics