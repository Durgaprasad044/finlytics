"""
Financial Goals Agent - AI-powered goal setting, tracking, and achievement coaching
Provides SMART goal creation, progress monitoring, and personalized recommendations
"""

import asyncio
import json
import logging
import numpy as np
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import uuid

from config.settings import settings, MODEL_CONFIGS
from utils.text_processing import TextProcessor

logger = logging.getLogger(__name__)

class GoalsAgent:
    """
    AI agent for financial goal management and achievement coaching
    """
    
    def __init__(self):
        self.text_processor = TextProcessor()
        
        # Goal categories and their typical characteristics
        self.goal_categories = {
            'emergency_fund': {
                'name': 'Emergency Fund',
                'description': 'Build emergency savings for unexpected expenses',
                'typical_amount_months': 6,
                'priority': 'high',
                'timeline_months': 12
            },
            'debt_payoff': {
                'name': 'Debt Payoff',
                'description': 'Pay off credit cards, loans, or other debts',
                'priority': 'high',
                'timeline_months': 24
            },
            'vacation': {
                'name': 'Vacation/Travel',
                'description': 'Save for vacation or travel expenses',
                'priority': 'medium',
                'timeline_months': 12
            },
            'home_purchase': {
                'name': 'Home Purchase',
                'description': 'Save for down payment and home buying costs',
                'priority': 'high',
                'timeline_months': 36
            },
            'car_purchase': {
                'name': 'Car Purchase',
                'description': 'Save for vehicle down payment or full purchase',
                'priority': 'medium',
                'timeline_months': 18
            },
            'retirement': {
                'name': 'Retirement',
                'description': 'Long-term retirement savings',
                'priority': 'high',
                'timeline_months': 360
            },
            'education': {
                'name': 'Education',
                'description': 'Save for education expenses or student loan payoff',
                'priority': 'medium',
                'timeline_months': 24
            },
            'investment': {
                'name': 'Investment',
                'description': 'Build investment portfolio',
                'priority': 'medium',
                'timeline_months': 60
            },
            'wedding': {
                'name': 'Wedding',
                'description': 'Save for wedding expenses',
                'priority': 'medium',
                'timeline_months': 18
            },
            'business': {
                'name': 'Business/Startup',
                'description': 'Save for business investment or startup costs',
                'priority': 'medium',
                'timeline_months': 24
            }
        }
        
        # Achievement milestones
        self.milestones = [0.1, 0.25, 0.5, 0.75, 0.9, 1.0]
        
    async def initialize(self):
        """Initialize the goals agent"""
        try:
            logger.info("🚀 Initializing Goals Agent...")
            logger.info("✅ Goals Agent initialized successfully!")
            
        except Exception as e:
            logger.error(f"❌ Error initializing Goals Agent: {str(e)}")
            raise
    
    async def create_smart_goal(
        self,
        user_id: str,
        goal_data: Dict[str, Any],
        user_profile: Dict[str, Any] = None,
        historical_data: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a SMART financial goal with AI recommendations
        """
        try:
            logger.info(f"Creating SMART goal for user: {user_id}")
            
            # Extract goal information
            title = goal_data.get('title', '').strip()
            target_amount = float(goal_data.get('target_amount', 0))
            deadline = goal_data.get('deadline')
            category = goal_data.get('category', 'custom')
            description = goal_data.get('description', '')
            
            # Validate inputs
            if not title or target_amount <= 0:
                return {
                    "success": False,
                    "error": "Goal title and target amount are required"
                }
            
            # Parse deadline
            if isinstance(deadline, str):
                deadline = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
            elif not isinstance(deadline, datetime):
                deadline = datetime.now() + timedelta(days=365)  # Default 1 year
            
            # Calculate timeline
            timeline_months = max(1, (deadline - datetime.now()).days / 30)
            
            # Analyze user's financial capacity
            capacity_analysis = await self._analyze_savings_capacity(
                user_profile, historical_data, target_amount, timeline_months
            )
            
            # Generate SMART goal recommendations
            smart_recommendations = await self._generate_smart_recommendations(
                title, target_amount, timeline_months, category, capacity_analysis
            )
            
            # Create goal structure
            goal_id = str(uuid.uuid4())
            smart_goal = {
                "id": goal_id,
                "title": title,
                "description": description,
                "category": category,
                "target_amount": target_amount,
                "current_amount": 0.0,
                "deadline": deadline.isoformat(),
                "created_date": datetime.now().isoformat(),
                "status": "active",
                "priority": self.goal_categories.get(category, {}).get('priority', 'medium'),
                "smart_analysis": smart_recommendations,
                "capacity_analysis": capacity_analysis,
                "milestones": self._create_milestones(target_amount),
                "progress_history": [],
                "recommendations": [],
                "auto_save_enabled": False,
                "auto_save_amount": 0.0
            }
            
            # Generate initial recommendations
            initial_recommendations = await self._generate_initial_recommendations(
                smart_goal, user_profile, historical_data
            )
            smart_goal["recommendations"] = initial_recommendations
            
            return {
                "success": True,
                "goal": smart_goal,
                "message": "SMART goal created successfully",
                "next_steps": smart_recommendations.get("action_plan", [])
            }
            
        except Exception as e:
            logger.error(f"Error creating SMART goal: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def update_goal_progress(
        self,
        user_id: str,
        goal_id: str,
        amount_added: float,
        transaction_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Update goal progress and provide coaching insights
        """
        try:
            logger.info(f"Updating goal progress: {goal_id} for user: {user_id}")
            
            # This would typically fetch from database
            # For now, we'll return a structured response
            
            progress_update = {
                "goal_id": goal_id,
                "amount_added": amount_added,
                "timestamp": datetime.now().isoformat(),
                "transaction_reference": transaction_data.get('id') if transaction_data else None
            }
            
            # Calculate new progress
            # This would be calculated based on current goal data
            new_progress_percentage = min(100, (amount_added / 1000) * 100)  # Example calculation
            
            # Check for milestone achievements
            milestone_achieved = await self._check_milestone_achievement(
                new_progress_percentage, goal_id
            )
            
            # Generate progress insights
            insights = await self._generate_progress_insights(
                goal_id, new_progress_percentage, amount_added, milestone_achieved
            )
            
            return {
                "success": True,
                "progress_update": progress_update,
                "new_progress_percentage": new_progress_percentage,
                "milestone_achieved": milestone_achieved,
                "insights": insights,
                "next_milestone": self._get_next_milestone(new_progress_percentage),
                "estimated_completion": await self._estimate_completion_date(
                    goal_id, new_progress_percentage
                )
            }
            
        except Exception as e:
            logger.error(f"Error updating goal progress: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_goal_recommendations(
        self,
        user_id: str,
        goal_id: str,
        user_profile: Dict[str, Any] = None,
        recent_transactions: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get personalized recommendations for goal achievement
        """
        try:
            logger.info(f"Generating goal recommendations for: {goal_id}")
            
            # Analyze current financial situation
            financial_analysis = await self._analyze_current_finances(
                user_profile, recent_transactions
            )
            
            # Generate specific recommendations
            recommendations = await self._generate_goal_recommendations(
                goal_id, financial_analysis, user_profile
            )
            
            return {
                "success": True,
                "goal_id": goal_id,
                "recommendations": recommendations,
                "financial_analysis": financial_analysis,
                "action_items": recommendations.get("action_items", []),
                "optimization_tips": recommendations.get("optimization_tips", [])
            }
            
        except Exception as e:
            logger.error(f"Error generating goal recommendations: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def analyze_goal_portfolio(
        self,
        user_id: str,
        goals: List[Dict[str, Any]],
        user_profile: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Analyze entire goal portfolio and provide optimization insights
        """
        try:
            logger.info(f"Analyzing goal portfolio for user: {user_id}")
            
            if not goals:
                return {
                    "success": True,
                    "portfolio_analysis": {
                        "total_goals": 0,
                        "total_target_amount": 0,
                        "average_progress": 0,
                        "recommendations": ["Consider setting your first financial goal to start building wealth"]
                    }
                }
            
            # Calculate portfolio metrics
            total_target = sum(goal.get('target_amount', 0) for goal in goals)
            total_current = sum(goal.get('current_amount', 0) for goal in goals)
            average_progress = (total_current / total_target * 100) if total_target > 0 else 0
            
            # Analyze goal distribution
            category_distribution = {}
            priority_distribution = {}
            
            for goal in goals:
                category = goal.get('category', 'custom')
                priority = goal.get('priority', 'medium')
                
                category_distribution[category] = category_distribution.get(category, 0) + 1
                priority_distribution[priority] = priority_distribution.get(priority, 0) + 1
            
            # Generate portfolio recommendations
            portfolio_recommendations = await self._generate_portfolio_recommendations(
                goals, user_profile, {
                    'total_target': total_target,
                    'total_current': total_current,
                    'average_progress': average_progress,
                    'category_distribution': category_distribution,
                    'priority_distribution': priority_distribution
                }
            )
            
            return {
                "success": True,
                "portfolio_analysis": {
                    "total_goals": len(goals),
                    "total_target_amount": total_target,
                    "total_current_amount": total_current,
                    "average_progress": round(average_progress, 2),
                    "category_distribution": category_distribution,
                    "priority_distribution": priority_distribution,
                    "recommendations": portfolio_recommendations,
                    "optimization_score": await self._calculate_optimization_score(goals),
                    "risk_assessment": await self._assess_portfolio_risk(goals, user_profile)
                }
            }
            
        except Exception as e:
            logger.error(f"Error analyzing goal portfolio: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def setup_auto_savings(
        self,
        user_id: str,
        goal_id: str,
        auto_save_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Setup automatic savings for a goal
        """
        try:
            logger.info(f"Setting up auto-savings for goal: {goal_id}")
            
            frequency = auto_save_config.get('frequency', 'monthly')  # weekly, bi-weekly, monthly
            amount = float(auto_save_config.get('amount', 0))
            start_date = auto_save_config.get('start_date', datetime.now().isoformat())
            
            if amount <= 0:
                return {
                    "success": False,
                    "error": "Auto-save amount must be greater than 0"
                }
            
            # Calculate savings schedule
            savings_schedule = await self._calculate_savings_schedule(
                amount, frequency, start_date, goal_id
            )
            
            auto_save_setup = {
                "goal_id": goal_id,
                "enabled": True,
                "amount": amount,
                "frequency": frequency,
                "start_date": start_date,
                "next_save_date": savings_schedule["next_save_date"],
                "schedule": savings_schedule["schedule"][:12],  # Next 12 occurrences
                "total_annual_savings": savings_schedule["annual_total"]
            }
            
            return {
                "success": True,
                "auto_save_setup": auto_save_setup,
                "message": f"Auto-save of ${amount} {frequency} has been set up",
                "impact_analysis": await self._analyze_auto_save_impact(
                    goal_id, amount, frequency
                )
            }
            
        except Exception as e:
            logger.error(f"Error setting up auto-savings: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    # Helper methods
    
    async def _analyze_savings_capacity(
        self,
        user_profile: Dict[str, Any],
        historical_data: List[Dict[str, Any]],
        target_amount: float,
        timeline_months: float
    ) -> Dict[str, Any]:
        """Analyze user's capacity to save for the goal"""
        
        monthly_income = user_profile.get('monthly_income', 0) if user_profile else 0
        monthly_expenses = user_profile.get('monthly_expenses', 0) if user_profile else 0
        
        # Calculate required monthly savings
        required_monthly_savings = target_amount / timeline_months
        
        # Estimate available savings capacity
        estimated_surplus = monthly_income - monthly_expenses
        savings_feasibility = (required_monthly_savings / estimated_surplus * 100) if estimated_surplus > 0 else 0
        
        return {
            "required_monthly_savings": round(required_monthly_savings, 2),
            "estimated_monthly_surplus": round(estimated_surplus, 2),
            "feasibility_percentage": min(100, round(savings_feasibility, 2)),
            "feasibility_rating": self._get_feasibility_rating(savings_feasibility),
            "timeline_assessment": "realistic" if savings_feasibility <= 50 else "challenging" if savings_feasibility <= 80 else "very_challenging"
        }
    
    async def _generate_smart_recommendations(
        self,
        title: str,
        target_amount: float,
        timeline_months: float,
        category: str,
        capacity_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate SMART goal recommendations"""
        
        # SMART criteria analysis
        smart_analysis = {
            "specific": {
                "score": 8,  # Based on title clarity
                "feedback": f"Goal '{title}' is well-defined"
            },
            "measurable": {
                "score": 10,
                "feedback": f"Target amount of ${target_amount:,.2f} is clearly measurable"
            },
            "achievable": {
                "score": max(1, min(10, 11 - (capacity_analysis["feasibility_percentage"] / 10))),
                "feedback": f"Goal is {capacity_analysis['feasibility_rating']} based on your financial capacity"
            },
            "relevant": {
                "score": 9,  # Assume high relevance for user-created goals
                "feedback": f"{category.replace('_', ' ').title()} goals are important for financial health"
            },
            "time_bound": {
                "score": 8,
                "feedback": f"Timeline of {timeline_months:.1f} months provides clear deadline"
            }
        }
        
        # Calculate overall SMART score
        overall_score = sum(criteria["score"] for criteria in smart_analysis.values()) / len(smart_analysis)
        
        # Generate action plan
        action_plan = [
            f"Set up automatic transfer of ${capacity_analysis['required_monthly_savings']:.2f} monthly",
            "Track progress weekly and adjust if needed",
            "Review and optimize expenses to increase savings capacity",
            "Consider additional income sources if timeline is challenging"
        ]
        
        return {
            "smart_analysis": smart_analysis,
            "overall_smart_score": round(overall_score, 1),
            "action_plan": action_plan,
            "success_probability": min(95, max(20, 100 - capacity_analysis["feasibility_percentage"]))
        }
    
    def _create_milestones(self, target_amount: float) -> List[Dict[str, Any]]:
        """Create milestone structure for goal tracking"""
        
        milestones = []
        for percentage in self.milestones:
            milestones.append({
                "percentage": int(percentage * 100),
                "amount": round(target_amount * percentage, 2),
                "achieved": False,
                "achieved_date": None,
                "reward_suggestion": self._get_milestone_reward(percentage)
            })
        
        return milestones
    
    def _get_milestone_reward(self, percentage: float) -> str:
        """Get reward suggestion for milestone achievement"""
        
        rewards = {
            0.1: "Treat yourself to a favorite coffee or snack",
            0.25: "Enjoy a nice dinner out or movie night",
            0.5: "Plan a small weekend getaway or hobby purchase",
            0.75: "Consider a larger reward like new clothes or gadget",
            0.9: "Plan something special - you're almost there!",
            1.0: "Celebrate your achievement! You've reached your goal!"
        }
        
        return rewards.get(percentage, "Celebrate your progress!")
    
    async def _check_milestone_achievement(
        self,
        progress_percentage: float,
        goal_id: str
    ) -> Dict[str, Any]:
        """Check if a milestone has been achieved"""
        
        for milestone_pct in self.milestones:
            milestone_percentage = milestone_pct * 100
            if progress_percentage >= milestone_percentage:
                return {
                    "achieved": True,
                    "milestone_percentage": milestone_percentage,
                    "reward_suggestion": self._get_milestone_reward(milestone_pct),
                    "congratulations_message": f"🎉 Congratulations! You've reached {milestone_percentage}% of your goal!"
                }
        
        return {"achieved": False}
    
    def _get_next_milestone(self, current_progress: float) -> Dict[str, Any]:
        """Get the next milestone to achieve"""
        
        for milestone_pct in self.milestones:
            milestone_percentage = milestone_pct * 100
            if current_progress < milestone_percentage:
                return {
                    "percentage": milestone_percentage,
                    "progress_needed": milestone_percentage - current_progress,
                    "reward": self._get_milestone_reward(milestone_pct)
                }
        
        return {"percentage": 100, "progress_needed": 0, "reward": "Goal completed!"}
    
    async def _estimate_completion_date(
        self,
        goal_id: str,
        current_progress: float
    ) -> str:
        """Estimate goal completion date based on current progress"""
        
        # This would use historical progress data in a real implementation
        # For now, we'll provide a simple estimation
        
        if current_progress >= 100:
            return "Goal completed!"
        
        # Assume linear progress for simplicity
        estimated_months = (100 - current_progress) / 10  # Assume 10% progress per month
        completion_date = datetime.now() + timedelta(days=estimated_months * 30)
        
        return completion_date.strftime("%B %Y")
    
    def _get_feasibility_rating(self, feasibility_percentage: float) -> str:
        """Get feasibility rating based on percentage"""
        
        if feasibility_percentage <= 30:
            return "very_feasible"
        elif feasibility_percentage <= 50:
            return "feasible"
        elif feasibility_percentage <= 70:
            return "challenging"
        elif feasibility_percentage <= 90:
            return "very_challenging"
        else:
            return "unrealistic"
    
    async def _generate_initial_recommendations(
        self,
        goal: Dict[str, Any],
        user_profile: Dict[str, Any],
        historical_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Generate initial recommendations for new goal"""
        
        recommendations = [
            {
                "type": "setup",
                "title": "Set up automatic savings",
                "description": f"Automate ${goal['smart_analysis']['action_plan'][0].split('$')[1].split(' ')[0]} monthly transfers",
                "priority": "high",
                "estimated_impact": "high"
            },
            {
                "type": "tracking",
                "title": "Enable progress notifications",
                "description": "Get weekly progress updates and milestone alerts",
                "priority": "medium",
                "estimated_impact": "medium"
            },
            {
                "type": "optimization",
                "title": "Review monthly expenses",
                "description": "Identify areas to cut expenses and boost savings",
                "priority": "medium",
                "estimated_impact": "high"
            }
        ]
        
        return recommendations
    
    async def _analyze_current_finances(
        self,
        user_profile: Dict[str, Any],
        recent_transactions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze current financial situation"""
        
        # This would perform detailed financial analysis
        # For now, return a basic structure
        
        return {
            "monthly_income": user_profile.get('monthly_income', 0) if user_profile else 0,
            "monthly_expenses": user_profile.get('monthly_expenses', 0) if user_profile else 0,
            "savings_rate": 20,  # Example
            "expense_trends": "stable",
            "savings_potential": 500  # Example
        }
    
    async def _generate_goal_recommendations(
        self,
        goal_id: str,
        financial_analysis: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate specific recommendations for goal achievement"""
        
        return {
            "action_items": [
                "Increase automatic savings by $50/month",
                "Review and reduce subscription services",
                "Consider side income opportunities"
            ],
            "optimization_tips": [
                "Use the 50/30/20 budgeting rule",
                "Track expenses daily for better awareness",
                "Set up separate savings account for this goal"
            ],
            "timeline_adjustments": [],
            "risk_mitigation": [
                "Build emergency fund alongside goal savings",
                "Diversify savings across multiple accounts"
            ]
        }
    
    async def _generate_portfolio_recommendations(
        self,
        goals: List[Dict[str, Any]],
        user_profile: Dict[str, Any],
        portfolio_metrics: Dict[str, Any]
    ) -> List[str]:
        """Generate portfolio-level recommendations"""
        
        recommendations = []
        
        # Check for emergency fund
        has_emergency_fund = any(goal.get('category') == 'emergency_fund' for goal in goals)
        if not has_emergency_fund:
            recommendations.append("Consider adding an emergency fund goal as your top priority")
        
        # Check goal diversity
        if len(portfolio_metrics['category_distribution']) < 3:
            recommendations.append("Diversify your goals across different categories for balanced financial health")
        
        # Check timeline distribution
        short_term_goals = sum(1 for goal in goals if (datetime.fromisoformat(goal.get('deadline', datetime.now().isoformat())) - datetime.now()).days < 365)
        if short_term_goals == 0:
            recommendations.append("Add some short-term goals (< 1 year) for quick wins and motivation")
        
        return recommendations
    
    async def _calculate_optimization_score(self, goals: List[Dict[str, Any]]) -> float:
        """Calculate portfolio optimization score"""
        
        if not goals:
            return 0.0
        
        # Simple scoring based on goal diversity, progress, and timeline distribution
        score = 70.0  # Base score
        
        # Bonus for goal diversity
        categories = set(goal.get('category', 'custom') for goal in goals)
        score += min(20, len(categories) * 5)
        
        # Bonus for progress
        avg_progress = sum(goal.get('current_amount', 0) / goal.get('target_amount', 1) for goal in goals) / len(goals)
        score += avg_progress * 10
        
        return min(100, round(score, 1))
    
    async def _assess_portfolio_risk(
        self,
        goals: List[Dict[str, Any]],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Assess portfolio risk factors"""
        
        risks = []
        risk_level = "low"
        
        # Check for over-ambitious timelines
        challenging_goals = sum(1 for goal in goals if goal.get('smart_analysis', {}).get('achievable', {}).get('score', 10) < 5)
        if challenging_goals > len(goals) * 0.5:
            risks.append("Multiple goals have challenging timelines")
            risk_level = "high"
        
        # Check for lack of emergency fund
        has_emergency_fund = any(goal.get('category') == 'emergency_fund' for goal in goals)
        if not has_emergency_fund:
            risks.append("No emergency fund goal detected")
            risk_level = "medium" if risk_level == "low" else risk_level
        
        return {
            "level": risk_level,
            "factors": risks,
            "mitigation_suggestions": [
                "Prioritize emergency fund if missing",
                "Adjust timelines for challenging goals",
                "Ensure adequate income stability"
            ]
        }
    
    async def _calculate_savings_schedule(
        self,
        amount: float,
        frequency: str,
        start_date: str,
        goal_id: str
    ) -> Dict[str, Any]:
        """Calculate automatic savings schedule"""
        
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        schedule = []
        
        # Calculate frequency in days
        frequency_days = {
            'weekly': 7,
            'bi-weekly': 14,
            'monthly': 30
        }.get(frequency, 30)
        
        # Generate next 12 occurrences
        current_date = start
        for i in range(12):
            schedule.append({
                "date": current_date.isoformat(),
                "amount": amount,
                "status": "scheduled"
            })
            current_date += timedelta(days=frequency_days)
        
        # Calculate annual total
        annual_occurrences = 365 / frequency_days
        annual_total = amount * annual_occurrences
        
        return {
            "schedule": schedule,
            "next_save_date": schedule[0]["date"] if schedule else None,
            "annual_total": round(annual_total, 2)
        }
    
    async def _analyze_auto_save_impact(
        self,
        goal_id: str,
        amount: float,
        frequency: str
    ) -> Dict[str, Any]:
        """Analyze impact of auto-save setup"""
        
        # Calculate annual savings
        frequency_multiplier = {
            'weekly': 52,
            'bi-weekly': 26,
            'monthly': 12
        }.get(frequency, 12)
        
        annual_savings = amount * frequency_multiplier
        
        return {
            "annual_savings": annual_savings,
            "impact_rating": "high" if annual_savings > 5000 else "medium" if annual_savings > 2000 else "low",
            "time_to_goal": "Estimated based on target amount",  # Would calculate based on actual goal
            "compound_effect": f"With 2% interest, you could earn an additional ${annual_savings * 0.02:.2f} annually"
        }
    
    async def _generate_progress_insights(
        self,
        goal_id: str,
        progress_percentage: float,
        amount_added: float,
        milestone_achieved: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate insights about goal progress"""
        
        insights = {
            "progress_trend": "positive" if amount_added > 0 else "neutral",
            "momentum_score": min(100, progress_percentage * 1.2),
            "encouragement_message": self._get_encouragement_message(progress_percentage),
            "next_steps": [
                "Keep up the great momentum!",
                "Consider increasing your savings rate if possible",
                "Review your budget for additional savings opportunities"
            ]
        }
        
        if milestone_achieved.get("achieved"):
            insights["celebration"] = milestone_achieved
        
        return insights
    
    def _get_encouragement_message(self, progress_percentage: float) -> str:
        """Get encouraging message based on progress"""
        
        if progress_percentage >= 90:
            return "🎉 You're so close to achieving your goal! Keep pushing!"
        elif progress_percentage >= 75:
            return "💪 Great progress! You're in the final stretch!"
        elif progress_percentage >= 50:
            return "🚀 You're halfway there! Excellent work!"
        elif progress_percentage >= 25:
            return "📈 Good momentum! You're making solid progress!"
        else:
            return "🌟 Every step counts! You're building great financial habits!"