"""
Spending Coach Agent - Personalized spending coaching and behavioral insights
Uses Gemini Pro, GPT-4 + Behavioral Prompting
"""

import asyncio
import json
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import re

# AI Models
import google.generativeai as genai
try:
    import openai
except ImportError:
    openai = None

# Local imports
from config.settings import settings, MODEL_CONFIGS

logger = logging.getLogger(__name__)

class SpendingCoachAgent:
    """
    AI agent for providing personalized spending coaching and behavioral insights
    """
    
    def __init__(self):
        self.gemini_model = None
        self.openai_client = None
        
        # Behavioral patterns to detect
        self.behavioral_patterns = {
            'impulse_buying': {
                'indicators': ['frequent_small_purchases', 'weekend_spikes'],
                'threshold': 0.3,
                'coaching_approach': 'mindful_spending'
            },
            'lifestyle_inflation': {
                'indicators': ['increasing_discretionary', 'luxury_category_growth'],
                'threshold': 0.2,
                'coaching_approach': 'value_alignment'
            },
            'emotional_spending': {
                'indicators': ['stress_correlation', 'mood_based_patterns'],
                'threshold': 0.25,
                'coaching_approach': 'emotional_awareness'
            },
            'social_spending': {
                'indicators': ['peer_pressure_purchases', 'social_media_influence'],
                'threshold': 0.2,
                'coaching_approach': 'social_boundaries'
            }
        }
    
    async def initialize(self):
        """Initialize the spending coach agent"""
        try:
            logger.info("🚀 Initializing Spending Coach Agent...")
            
            # Initialize Gemini
            if settings.GOOGLE_API_KEY:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                self.gemini_model = genai.GenerativeModel(MODEL_CONFIGS["spending_coach"]["primary_model"])
                logger.info("✅ Gemini model initialized")
            
            # Initialize OpenAI as fallback
            if settings.OPENAI_API_KEY and openai:
                openai.api_key = settings.OPENAI_API_KEY
                self.openai_client = openai
                logger.info("✅ OpenAI client initialized")
            
            logger.info("✅ Spending Coach Agent initialized successfully!")
            
        except Exception as e:
            logger.error(f"❌ Error initializing Spending Coach Agent: {str(e)}")
            raise
    
    async def generate_coaching_insights(
        self,
        user_id: str,
        transactions: List[Dict[str, Any]],
        user_profile: Dict[str, Any],
        time_period: str = "month"
    ) -> Dict[str, Any]:
        """
        Generate comprehensive coaching insights and recommendations
        """
        try:
            logger.info(f"Generating coaching insights for user: {user_id}")
            
            # Step 1: Analyze behavioral patterns
            behavioral_analysis = await self._analyze_behavioral_patterns(transactions, user_profile)
            
            # Step 2: Identify spending triggers and habits
            triggers_analysis = await self._identify_spending_triggers(transactions, behavioral_analysis)
            
            # Step 3: Generate personalized coaching recommendations
            coaching_recommendations = await self._generate_coaching_recommendations(
                behavioral_analysis, triggers_analysis, user_profile
            )
            
            # Step 4: Create action plan
            action_plan = await self._create_action_plan(
                coaching_recommendations, behavioral_analysis, user_profile
            )
            
            # Step 5: Generate motivational insights
            motivational_insights = await self._generate_motivational_insights(
                transactions, behavioral_analysis, user_profile
            )
            
            # Step 6: Generate AI-powered coaching message
            ai_coaching_message = await self._generate_ai_coaching_message(
                behavioral_analysis, coaching_recommendations, user_profile
            )
            
            return {
                "user_id": user_id,
                "time_period": time_period,
                "behavioral_analysis": behavioral_analysis,
                "spending_triggers": triggers_analysis,
                "coaching_recommendations": coaching_recommendations,
                "action_plan": action_plan,
                "motivational_insights": motivational_insights,
                "ai_coaching_message": ai_coaching_message,
                "next_check_in": (datetime.now() + timedelta(days=7)).isoformat(),
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating coaching insights: {str(e)}")
            return {
                "error": str(e),
                "user_id": user_id
            }
    
    async def _analyze_behavioral_patterns(
        self,
        transactions: List[Dict[str, Any]],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze behavioral spending patterns"""
        
        if not transactions:
            return {
                "patterns_detected": [],
                "confidence_scores": {},
                "behavioral_insights": [],
                "spending_personality": "balanced_spender",
                "behavioral_score": 70
            }
        
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').abs()
        
        patterns_detected = []
        confidence_scores = {}
        
        # Analyze each behavioral pattern
        for pattern_name, pattern_config in self.behavioral_patterns.items():
            confidence = await self._calculate_pattern_confidence(df, pattern_name, pattern_config)
            confidence_scores[pattern_name] = confidence
            
            if confidence >= pattern_config['threshold']:
                patterns_detected.append({
                    'pattern': pattern_name,
                    'confidence': confidence,
                    'coaching_approach': pattern_config['coaching_approach'],
                    'description': await self._get_pattern_description(pattern_name, df)
                })
        
        # Generate behavioral insights
        behavioral_insights = await self._generate_behavioral_insights(df, patterns_detected)
        
        return {
            "patterns_detected": patterns_detected,
            "confidence_scores": confidence_scores,
            "behavioral_insights": behavioral_insights,
            "spending_personality": await self._determine_spending_personality(patterns_detected),
            "behavioral_score": await self._calculate_behavioral_score(confidence_scores)
        }
    
    async def _calculate_pattern_confidence(
        self,
        df: pd.DataFrame,
        pattern_name: str,
        pattern_config: Dict[str, Any]
    ) -> float:
        """Calculate confidence score for a behavioral pattern"""
        
        confidence = 0.0
        
        if pattern_name == 'impulse_buying':
            # Check for frequent small purchases
            small_purchases = df[df['amount'] < 50]
            if len(small_purchases) > len(df) * 0.4:
                confidence += 0.3
            
            # Check for weekend spending spikes
            df['is_weekend'] = df['date'].dt.dayofweek.isin([5, 6])
            weekend_avg = df[df['is_weekend']]['amount'].mean()
            weekday_avg = df[~df['is_weekend']]['amount'].mean()
            
            if pd.notna(weekend_avg) and pd.notna(weekday_avg) and weekend_avg > weekday_avg * 1.3:
                confidence += 0.4
        
        elif pattern_name == 'lifestyle_inflation':
            # Check for increasing discretionary spending over time
            df_sorted = df.sort_values('date')
            if len(df_sorted) > 30:  # Need sufficient data
                first_half = df_sorted.iloc[:len(df_sorted)//2]
                second_half = df_sorted.iloc[len(df_sorted)//2:]
                
                first_avg = first_half['amount'].mean()
                second_avg = second_half['amount'].mean()
                
                if second_avg > first_avg * 1.2:  # 20% increase
                    confidence += 0.5
        
        elif pattern_name == 'emotional_spending':
            # Check for spending spikes (potential emotional triggers)
            daily_spending = df.groupby(df['date'].dt.date)['amount'].sum()
            spending_mean = daily_spending.mean()
            spending_std = daily_spending.std()
            
            if spending_std > 0:
                spikes = daily_spending[daily_spending > spending_mean + 2 * spending_std]
                if len(spikes) > len(daily_spending) * 0.1:  # More than 10% spike days
                    confidence += 0.4
        
        elif pattern_name == 'social_spending':
            # Check for restaurant and entertainment spending
            social_categories = ['Restaurants', 'Entertainment', 'Bars & Clubs']
            social_spending = df[df['category'].isin(social_categories)]['amount'].sum()
            total_spending = df['amount'].sum()
            
            if total_spending > 0 and (social_spending / total_spending) > 0.25:
                confidence += 0.4
        
        return min(confidence, 1.0)  # Cap at 1.0
    
    async def _get_pattern_description(self, pattern_name: str, df: pd.DataFrame) -> str:
        """Get description of detected behavioral pattern"""
        
        descriptions = {
            'impulse_buying': f"Frequent small purchases detected ({len(df[df['amount'] < 50])} transactions under $50)",
            'lifestyle_inflation': "Increasing spending on discretionary categories over time",
            'emotional_spending': "Irregular spending patterns suggesting emotional triggers",
            'social_spending': f"High social spending ({df[df['category'].isin(['Restaurants', 'Entertainment'])]['amount'].sum():.2f} total)"
        }
        
        return descriptions.get(pattern_name, f"Pattern detected: {pattern_name}")
    
    async def _generate_behavioral_insights(
        self,
        df: pd.DataFrame,
        patterns_detected: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate insights from behavioral analysis"""
        
        insights = []
        
        # Time-based insights
        if len(df) > 0:
            # Day of week analysis
            dow_spending = df.groupby(df['date'].dt.day_name())['amount'].mean()
            if len(dow_spending) > 0:
                highest_day = dow_spending.idxmax()
                highest_amount = dow_spending.max()
                insights.append(f"You spend most on {highest_day}s (avg: ${highest_amount:.2f})")
        
        # Pattern-specific insights
        for pattern in patterns_detected:
            pattern_name = pattern['pattern']
            confidence = pattern['confidence']
            
            if pattern_name == 'impulse_buying' and confidence > 0.5:
                insights.append("Strong impulse buying tendency detected - consider implementing a 24-hour rule")
            elif pattern_name == 'lifestyle_inflation' and confidence > 0.4:
                insights.append("Your spending has increased significantly - review if this aligns with your goals")
            elif pattern_name == 'emotional_spending' and confidence > 0.3:
                insights.append("Spending patterns suggest emotional triggers - consider alternative coping strategies")
        
        return insights
    
    async def _determine_spending_personality(self, patterns_detected: List[Dict[str, Any]]) -> str:
        """Determine user's spending personality type"""
        
        if not patterns_detected:
            return "balanced_spender"
        
        # Count pattern types
        pattern_counts = {}
        for pattern in patterns_detected:
            pattern_type = pattern['pattern']
            pattern_counts[pattern_type] = pattern_counts.get(pattern_type, 0) + pattern['confidence']
        
        # Determine dominant personality
        if pattern_counts.get('impulse_buying', 0) > 0.5:
            return "impulse_spender"
        elif pattern_counts.get('social_spending', 0) > 0.4:
            return "social_spender"
        elif pattern_counts.get('lifestyle_inflation', 0) > 0.4:
            return "lifestyle_inflator"
        elif pattern_counts.get('emotional_spending', 0) > 0.3:
            return "emotional_spender"
        else:
            return "balanced_spender"
    
    async def _calculate_behavioral_score(self, confidence_scores: Dict[str, float]) -> float:
        """Calculate overall behavioral health score (0-100)"""
        
        # Start with perfect score
        score = 100.0
        
        # Deduct points for negative patterns
        negative_patterns = ['impulse_buying', 'lifestyle_inflation', 'emotional_spending']
        
        for pattern, confidence in confidence_scores.items():
            if pattern in negative_patterns:
                # Deduct more points for higher confidence negative patterns
                deduction = confidence * 30  # Max 30 points per pattern
                score -= deduction
        
        return max(0, min(100, score))
    
    async def _identify_spending_triggers(
        self,
        transactions: List[Dict[str, Any]],
        behavioral_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Identify specific spending triggers and habits"""
        
        if not transactions:
            return {
                "triggers": [],
                "habits": [],
                "recommendations": []
            }
        
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').abs()
        
        triggers = []
        habits = []
        
        # Time-based triggers
        # Weekend spending
        df['is_weekend'] = df['date'].dt.dayofweek.isin([5, 6])
        weekend_spending = df[df['is_weekend']]['amount'].sum()
        weekday_spending = df[~df['is_weekend']]['amount'].sum()
        
        if weekend_spending > weekday_spending * 0.4:  # Weekends are 2/7 of week
            triggers.append({
                'type': 'temporal',
                'trigger': 'weekend_spending',
                'description': 'Higher spending on weekends',
                'impact': weekend_spending - (weekday_spending * 2/5),
                'frequency': 'weekly'
            })
        
        # Category-based habits
        if 'category' in df.columns:
            category_frequency = df['category'].value_counts()
            for category, count in category_frequency.items():
                if count > len(df) * 0.2:  # More than 20% of transactions
                    habits.append({
                        'type': 'category',
                        'habit': f'frequent_{category.lower().replace(" ", "_")}_purchases',
                        'description': f'Frequent {category} purchases',
                        'frequency': count,
                        'total_amount': df[df['category'] == category]['amount'].sum()
                    })
        
        return {
            "triggers": triggers,
            "habits": habits,
            "intervention_opportunities": await self._identify_intervention_opportunities(triggers, habits)
        }
    
    async def _identify_intervention_opportunities(
        self,
        triggers: List[Dict[str, Any]],
        habits: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Identify opportunities for behavioral interventions"""
        
        opportunities = []
        
        # Weekend spending intervention
        weekend_triggers = [t for t in triggers if t.get('trigger') == 'weekend_spending']
        if weekend_triggers:
            opportunities.append({
                'opportunity': 'weekend_budget_limit',
                'description': 'Set a weekend spending limit',
                'potential_savings': weekend_triggers[0].get('impact', 0) * 0.3,
                'difficulty': 'medium',
                'strategy': 'budgeting'
            })
        
        # Frequent category spending
        frequent_habits = [h for h in habits if h.get('frequency', 0) > 10]
        for habit in frequent_habits:
            if habit.get('total_amount', 0) > 200:  # More than $200 spent
                opportunities.append({
                    'opportunity': f'reduce_{habit.get("habit", "category")}_frequency',
                    'description': f'Reduce frequency of {habit.get("description", "category spending")}',
                    'potential_savings': habit.get('total_amount', 0) * 0.25,
                    'difficulty': 'medium',
                    'strategy': 'substitution'
                })
        
        return opportunities
    
    async def _generate_coaching_recommendations(
        self,
        behavioral_analysis: Dict[str, Any],
        triggers_analysis: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate personalized coaching recommendations"""
        
        recommendations = []
        patterns_detected = behavioral_analysis.get('patterns_detected', [])
        spending_personality = behavioral_analysis.get('spending_personality', 'balanced_spender')
        
        # Pattern-specific recommendations
        for pattern in patterns_detected:
            pattern_name = pattern['pattern']
            confidence = pattern['confidence']
            
            if pattern_name == 'impulse_buying' and confidence > 0.4:
                recommendations.append({
                    'type': 'behavioral_change',
                    'priority': 'high',
                    'recommendation': 'Implement the 24-hour rule for non-essential purchases',
                    'description': 'Wait 24 hours before making any purchase over $50',
                    'expected_impact': 'Reduce impulse purchases by 30-50%',
                    'difficulty': 'medium',
                    'timeframe': '2-4 weeks'
                })
            
            elif pattern_name == 'emotional_spending' and confidence > 0.3:
                recommendations.append({
                    'type': 'emotional_regulation',
                    'priority': 'high',
                    'recommendation': 'Develop alternative coping strategies',
                    'description': 'Create a list of free/low-cost activities for stress relief',
                    'expected_impact': 'Reduce stress-related spending by 40%',
                    'difficulty': 'medium',
                    'timeframe': '3-6 weeks'
                })
        
        # Personality-specific recommendations
        personality_recommendations = await self._get_personality_recommendations(spending_personality)
        recommendations.extend(personality_recommendations)
        
        # General financial health recommendations
        behavioral_score = behavioral_analysis.get('behavioral_score', 70)
        if behavioral_score < 60:
            recommendations.append({
                'type': 'comprehensive_review',
                'priority': 'high',
                'recommendation': 'Comprehensive spending review needed',
                'description': 'Schedule weekly spending reviews for the next month',
                'expected_impact': 'Improve overall spending awareness',
                'difficulty': 'medium',
                'timeframe': '4 weeks'
            })
        
        return recommendations[:6]  # Limit to 6 recommendations
    
    async def _get_personality_recommendations(self, spending_personality: str) -> List[Dict[str, Any]]:
        """Get recommendations based on spending personality"""
        
        personality_recs = {
            'impulse_spender': [
                {
                    'type': 'impulse_control',
                    'priority': 'high',
                    'recommendation': 'Use the envelope method for discretionary spending',
                    'description': 'Allocate cash for different spending categories',
                    'expected_impact': 'Reduce overspending by 25-40%',
                    'difficulty': 'medium',
                    'timeframe': '2-3 weeks'
                }
            ],
            'social_spender': [
                {
                    'type': 'social_budgeting',
                    'priority': 'medium',
                    'recommendation': 'Suggest alternative social activities',
                    'description': 'Plan low-cost social activities with friends',
                    'expected_impact': 'Maintain social life while reducing costs',
                    'difficulty': 'easy',
                    'timeframe': '1-2 weeks'
                }
            ],
            'emotional_spender': [
                {
                    'type': 'emotional_awareness',
                    'priority': 'high',
                    'recommendation': 'Keep a spending emotion journal',
                    'description': 'Track your mood before making purchases',
                    'expected_impact': 'Increase awareness of emotional triggers',
                    'difficulty': 'easy',
                    'timeframe': '2-4 weeks'
                }
            ]
        }
        
        return personality_recs.get(spending_personality, [])
    
    async def _create_action_plan(
        self,
        recommendations: List[Dict[str, Any]],
        behavioral_analysis: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a structured action plan"""
        
        # Group recommendations by timeframe
        immediate_actions = [r for r in recommendations if r.get('timeframe', '').startswith('1')]
        short_term_actions = [r for r in recommendations if '2-' in r.get('timeframe', '') or '3-' in r.get('timeframe', '')]
        long_term_actions = [r for r in recommendations if '4' in r.get('timeframe', '') or 'month' in r.get('timeframe', '')]
        
        return {
            'immediate_actions': immediate_actions,
            'short_term_actions': short_term_actions,
            'long_term_actions': long_term_actions,
            'success_metrics': [
                'Stay within budget 80% of the time',
                'Reduce impulse purchases by 30%',
                'Increase savings rate by 2% within 6 months'
            ]
        }
    
    async def _generate_motivational_insights(
        self,
        transactions: List[Dict[str, Any]],
        behavioral_analysis: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate motivational insights and positive reinforcement"""
        
        insights = {
            'positive_patterns': [],
            'achievements': [],
            'motivational_messages': []
        }
        
        # Generate achievements
        behavioral_score = behavioral_analysis.get('behavioral_score', 70)
        if behavioral_score >= 80:
            insights['achievements'].append({
                'achievement': 'high_behavioral_score',
                'title': 'Excellent Spending Behavior',
                'description': f'Your behavioral score of {behavioral_score:.0f} indicates healthy spending habits'
            })
        
        # Motivational messages
        spending_personality = behavioral_analysis.get('spending_personality', 'balanced_spender')
        
        personality_messages = {
            'balanced_spender': [
                "You have a naturally balanced approach to spending - keep it up!",
                "Your spending habits show good self-control and awareness."
            ],
            'impulse_spender': [
                "Recognizing your impulse spending is the first step to improvement!",
                "Every small step towards mindful spending counts."
            ],
            'social_spender': [
                "Your social spending shows you value relationships - let's optimize it!",
                "You can maintain your social life while being financially smart."
            ]
        }
        
        insights['motivational_messages'] = personality_messages.get(
            spending_personality, 
            ["You're taking positive steps towards better financial health!"]
        )
        
        return insights
    
    async def _generate_ai_coaching_message(
        self,
        behavioral_analysis: Dict[str, Any],
        recommendations: List[Dict[str, Any]],
        user_profile: Dict[str, Any]
    ) -> str:
        """Generate personalized AI coaching message"""
        
        try:
            if not self.gemini_model:
                return await self._generate_rule_based_coaching_message(
                    behavioral_analysis, recommendations, user_profile
                )
            
            # Prepare context for AI
            context = {
                'spending_personality': behavioral_analysis.get('spending_personality', 'balanced_spender'),
                'behavioral_score': behavioral_analysis.get('behavioral_score', 70),
                'patterns_detected': [p['pattern'] for p in behavioral_analysis.get('patterns_detected', [])],
                'top_recommendations': [r['recommendation'] for r in recommendations[:3]]
            }
            
            prompt = f"""
            You are a supportive financial coach providing personalized guidance. Create a motivational and actionable coaching message based on this profile:
            
            Spending Personality: {context['spending_personality']}
            Behavioral Health Score: {context['behavioral_score']}/100
            Patterns Detected: {', '.join(context['patterns_detected']) if context['patterns_detected'] else 'None'}
            
            Top Recommendations:
            {chr(10).join([f"- {rec}" for rec in context['top_recommendations']])}
            
            Create a personalized message that:
            1. Acknowledges their current situation positively
            2. Highlights their strengths
            3. Provides encouragement for areas of improvement
            4. Gives 2-3 specific, actionable next steps
            5. Ends with motivation and support
            
            Keep it conversational, supportive, and under 200 words.
            """
            
            response = await asyncio.to_thread(
                self.gemini_model.generate_content, prompt
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"AI coaching message generation failed: {str(e)}")
            return await self._generate_rule_based_coaching_message(
                behavioral_analysis, recommendations, user_profile
            )
    
    async def _generate_rule_based_coaching_message(
        self,
        behavioral_analysis: Dict[str, Any],
        recommendations: List[Dict[str, Any]],
        user_profile: Dict[str, Any]
    ) -> str:
        """Generate rule-based coaching message as fallback"""
        
        behavioral_score = behavioral_analysis.get('behavioral_score', 70)
        spending_personality = behavioral_analysis.get('spending_personality', 'balanced_spender')
        
        # Start with personalized greeting
        personality_greetings = {
            'balanced_spender': "Great job maintaining balanced spending habits! 🌟",
            'impulse_spender': "I see you're working on managing impulse purchases - that's a great first step! 💪",
            'social_spender': "Your social spending shows you value relationships, which is wonderful! 🤝",
            'emotional_spender': "Recognizing emotional spending patterns takes courage - you're on the right path! 🌱"
        }
        
        message = personality_greetings.get(spending_personality, "You're taking positive steps towards better financial health! 🎯")
        
        # Add score-based encouragement
        if behavioral_score >= 80:
            message += f" Your behavioral score of {behavioral_score:.0f} shows excellent financial habits."
        elif behavioral_score >= 70:
            message += f" Your behavioral score of {behavioral_score:.0f} indicates you're doing well with room for improvement."
        else:
            message += f" Your behavioral score of {behavioral_score:.0f} shows there's opportunity for positive change."
        
        # Add actionable steps
        message += "\n\n🎯 Your next steps:\n"
        for i, rec in enumerate(recommendations[:3], 1):
            message += f"{i}. {rec['recommendation']}\n"
        
        # End with motivation
        message += "\nRemember, small consistent changes lead to big results! I'm here to support you every step of the way. 🚀"
        
        return message