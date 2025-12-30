"""
AI Agent Manager - Coordinates all AI agents
"""

import logging
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime

from .expense_query_agent import ExpenseQueryAgent
from .receipt_parsing_agent import ReceiptParsingAgent
from .anomaly_detection_agent import AnomalyDetectionAgent
from .budget_planner_agent import BudgetPlannerAgent
from .spending_coach_agent import SpendingCoachAgent

logger = logging.getLogger(__name__)

class AgentManager:
    """
    Manages all AI agents and coordinates their interactions
    """
    
    def __init__(self):
        self.agents: Dict[str, Any] = {}
        self.agent_status: Dict[str, str] = {}
        self.initialization_order = [
            'expense_query',
            'receipt_parsing', 
            'anomaly_detection',
            'budget_planner',
            'spending_coach'
        ]
        
    async def initialize_all_agents(self) -> Dict[str, bool]:
        """Initialize all agents in the correct order"""
        
        logger.info("🚀 Starting AI Agent Manager initialization...")
        results = {}
        
        for agent_name in self.initialization_order:
            try:
                logger.info(f"Initializing {agent_name} agent...")
                success = await self._initialize_agent(agent_name)
                results[agent_name] = success
                
                if success:
                    self.agent_status[agent_name] = "operational"
                    logger.info(f"✅ {agent_name} agent initialized successfully")
                else:
                    self.agent_status[agent_name] = "failed"
                    logger.error(f"❌ {agent_name} agent initialization failed")
                    
            except Exception as e:
                logger.error(f"❌ Error initializing {agent_name} agent: {str(e)}")
                results[agent_name] = False
                self.agent_status[agent_name] = "error"
        
        # Log summary
        successful = sum(1 for success in results.values() if success)
        total = len(results)
        
        if successful == total:
            logger.info(f"🎉 All {total} agents initialized successfully!")
        else:
            logger.warning(f"⚠️ {successful}/{total} agents initialized successfully")
            
        return results
    
    async def _initialize_agent(self, agent_name: str) -> bool:
        """Initialize a specific agent"""
        
        try:
            if agent_name == 'expense_query':
                agent = ExpenseQueryAgent()
                await agent.initialize()
                self.agents['expense_query'] = agent
                
            elif agent_name == 'receipt_parsing':
                agent = ReceiptParsingAgent()
                await agent.initialize()
                self.agents['receipt_parsing'] = agent
                
            elif agent_name == 'anomaly_detection':
                agent = AnomalyDetectionAgent()
                await agent.initialize()
                self.agents['anomaly_detection'] = agent
                
            elif agent_name == 'budget_planner':
                agent = BudgetPlannerAgent()
                await agent.initialize()
                self.agents['budget_planner'] = agent
                
            elif agent_name == 'spending_coach':
                agent = SpendingCoachAgent()
                await agent.initialize()
                self.agents['spending_coach'] = agent
                
            else:
                logger.error(f"Unknown agent: {agent_name}")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize {agent_name}: {str(e)}")
            return False
    
    def get_agent(self, agent_name: str) -> Optional[Any]:
        """Get a specific agent instance"""
        return self.agents.get(agent_name)
    
    def get_agent_status(self, agent_name: str) -> str:
        """Get the status of a specific agent"""
        return self.agent_status.get(agent_name, "unknown")
    
    def get_all_agent_status(self) -> Dict[str, str]:
        """Get status of all agents"""
        return self.agent_status.copy()
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on all agents"""
        
        health_status = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "healthy",
            "agents": {}
        }
        
        unhealthy_count = 0
        
        for agent_name, agent in self.agents.items():
            try:
                # Try to call a simple method on each agent
                if hasattr(agent, 'health_check'):
                    agent_health = await agent.health_check()
                else:
                    # Basic health check - just verify agent exists and has required methods
                    agent_health = {
                        "status": "healthy" if agent else "unhealthy",
                        "initialized": agent is not None,
                        "methods": [method for method in dir(agent) if not method.startswith('_')]
                    }
                
                health_status["agents"][agent_name] = agent_health
                
                if agent_health.get("status") != "healthy":
                    unhealthy_count += 1
                    
            except Exception as e:
                health_status["agents"][agent_name] = {
                    "status": "error",
                    "error": str(e)
                }
                unhealthy_count += 1
        
        # Set overall status
        if unhealthy_count == 0:
            health_status["overall_status"] = "healthy"
        elif unhealthy_count < len(self.agents):
            health_status["overall_status"] = "degraded"
        else:
            health_status["overall_status"] = "unhealthy"
            
        return health_status
    
    async def shutdown_all_agents(self):
        """Gracefully shutdown all agents"""
        
        logger.info("🔄 Shutting down all agents...")
        
        for agent_name, agent in self.agents.items():
            try:
                if hasattr(agent, 'shutdown'):
                    await agent.shutdown()
                    logger.info(f"✅ {agent_name} agent shut down successfully")
                else:
                    logger.info(f"ℹ️ {agent_name} agent doesn't require shutdown")
                    
            except Exception as e:
                logger.error(f"❌ Error shutting down {agent_name} agent: {str(e)}")
        
        self.agents.clear()
        self.agent_status.clear()
        logger.info("🏁 All agents shut down")
    
    async def restart_agent(self, agent_name: str) -> bool:
        """Restart a specific agent"""
        
        logger.info(f"🔄 Restarting {agent_name} agent...")
        
        try:
            # Shutdown existing agent if it exists
            if agent_name in self.agents:
                agent = self.agents[agent_name]
                if hasattr(agent, 'shutdown'):
                    await agent.shutdown()
                del self.agents[agent_name]
            
            # Reinitialize the agent
            success = await self._initialize_agent(agent_name)
            
            if success:
                self.agent_status[agent_name] = "operational"
                logger.info(f"✅ {agent_name} agent restarted successfully")
            else:
                self.agent_status[agent_name] = "failed"
                logger.error(f"❌ {agent_name} agent restart failed")
                
            return success
            
        except Exception as e:
            logger.error(f"❌ Error restarting {agent_name} agent: {str(e)}")
            self.agent_status[agent_name] = "error"
            return False
    
    def get_agent_capabilities(self) -> Dict[str, List[str]]:
        """Get capabilities of all agents"""
        
        capabilities = {}
        
        for agent_name, agent in self.agents.items():
            if agent_name == 'expense_query':
                capabilities[agent_name] = [
                    "Natural language expense queries",
                    "Transaction analysis",
                    "Spending pattern insights",
                    "Category-based filtering",
                    "Time-based analysis"
                ]
            elif agent_name == 'receipt_parsing':
                capabilities[agent_name] = [
                    "OCR text extraction",
                    "Multi-engine processing",
                    "Vendor identification",
                    "Amount extraction",
                    "Item parsing",
                    "Auto-categorization"
                ]
            elif agent_name == 'anomaly_detection':
                capabilities[agent_name] = [
                    "Unusual spending detection",
                    "Pattern analysis",
                    "Statistical anomalies",
                    "Machine learning models",
                    "Real-time monitoring"
                ]
            elif agent_name == 'budget_planner':
                capabilities[agent_name] = [
                    "Budget creation",
                    "Spending forecasting",
                    "Goal setting",
                    "Financial planning",
                    "Optimization recommendations"
                ]
            elif agent_name == 'spending_coach':
                capabilities[agent_name] = [
                    "Personalized coaching",
                    "Behavioral insights",
                    "Spending recommendations",
                    "Goal tracking",
                    "Motivational guidance"
                ]
        
        return capabilities
    
    async def process_multi_agent_request(self, request_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process requests that require multiple agents"""
        
        if request_type == "comprehensive_analysis":
            return await self._comprehensive_financial_analysis(data)
        elif request_type == "receipt_with_coaching":
            return await self._receipt_processing_with_coaching(data)
        elif request_type == "budget_with_anomaly_check":
            return await self._budget_planning_with_anomaly_detection(data)
        else:
            return {"error": f"Unknown multi-agent request type: {request_type}"}
    
    async def _comprehensive_financial_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Comprehensive analysis using multiple agents"""
        
        results = {}
        
        try:
            # Get expense insights
            if 'expense_query' in self.agents:
                expense_agent = self.agents['expense_query']
                results['expense_analysis'] = await expense_agent.process_query(
                    query="Analyze my spending patterns",
                    user_id=data.get('user_id'),
                    transactions=data.get('transactions', [])
                )
            
            # Detect anomalies
            if 'anomaly_detection' in self.agents:
                anomaly_agent = self.agents['anomaly_detection']
                results['anomalies'] = await anomaly_agent.detect_anomalies(
                    transactions=data.get('transactions', []),
                    user_id=data.get('user_id')
                )
            
            # Get coaching insights
            if 'spending_coach' in self.agents:
                coach_agent = self.agents['spending_coach']
                results['coaching'] = await coach_agent.generate_coaching_insights(
                    user_id=data.get('user_id'),
                    transactions=data.get('transactions', [])
                )
            
            return {
                "success": True,
                "comprehensive_analysis": results
            }
            
        except Exception as e:
            logger.error(f"Comprehensive analysis failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _receipt_processing_with_coaching(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process receipt and provide coaching insights"""
        
        try:
            # Process receipt
            receipt_agent = self.agents.get('receipt_parsing')
            if not receipt_agent:
                return {"error": "Receipt parsing agent not available"}
            
            receipt_result = await receipt_agent.parse_receipt(
                file_content=data.get('file_content'),
                filename=data.get('filename'),
                user_id=data.get('user_id')
            )
            
            # If receipt processing successful, get coaching insights
            if receipt_result.get('success') and 'spending_coach' in self.agents:
                coach_agent = self.agents['spending_coach']
                
                # Create mock transaction for coaching context
                mock_transaction = {
                    'amount': receipt_result.get('parsed_data', {}).get('total', 0),
                    'category': receipt_result.get('parsed_data', {}).get('category', 'Unknown'),
                    'vendor': receipt_result.get('parsed_data', {}).get('vendor', 'Unknown')
                }
                
                coaching_result = await coach_agent.analyze_single_transaction(
                    transaction=mock_transaction,
                    user_id=data.get('user_id')
                )
                
                receipt_result['coaching_insights'] = coaching_result
            
            return receipt_result
            
        except Exception as e:
            logger.error(f"Receipt processing with coaching failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _budget_planning_with_anomaly_detection(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create budget plan with anomaly detection"""
        
        try:
            # Create budget plan
            budget_agent = self.agents.get('budget_planner')
            if not budget_agent:
                return {"error": "Budget planner agent not available"}
            
            budget_result = await budget_agent.create_budget_plan(
                user_id=data.get('user_id'),
                monthly_income=data.get('monthly_income'),
                savings_goal=data.get('savings_goal', 0.2),
                financial_goals=data.get('financial_goals', []),
                historical_data=data.get('historical_data', [])
            )
            
            # Check for anomalies in historical data
            if budget_result.get('success') and 'anomaly_detection' in self.agents:
                anomaly_agent = self.agents['anomaly_detection']
                
                anomaly_result = await anomaly_agent.detect_anomalies(
                    transactions=data.get('historical_data', []),
                    user_id=data.get('user_id')
                )
                
                budget_result['anomaly_insights'] = anomaly_result
            
            return budget_result
            
        except Exception as e:
            logger.error(f"Budget planning with anomaly detection failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

# Global agent manager instance
agent_manager = AgentManager()