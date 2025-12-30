"""
Real-time Data Synchronization Service
Handles real-time updates between receipt scanning, transactions, goals, and budgets
"""

import asyncio
import json
import logging
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime
import uuid
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

class EventType(Enum):
    TRANSACTION_ADDED = "transaction_added"
    TRANSACTION_UPDATED = "transaction_updated"
    TRANSACTION_DELETED = "transaction_deleted"
    RECEIPT_PROCESSED = "receipt_processed"
    GOAL_CREATED = "goal_created"
    GOAL_UPDATED = "goal_updated"
    GOAL_PROGRESS_UPDATED = "goal_progress_updated"
    BUDGET_UPDATED = "budget_updated"
    MILESTONE_ACHIEVED = "milestone_achieved"
    AUTO_SAVE_TRIGGERED = "auto_save_triggered"

@dataclass
class SyncEvent:
    id: str
    event_type: EventType
    user_id: str
    data: Dict[str, Any]
    timestamp: datetime
    processed: bool = False
    related_entities: List[str] = None

    def to_dict(self):
        return {
            **asdict(self),
            'event_type': self.event_type.value,
            'timestamp': self.timestamp.isoformat(),
            'related_entities': self.related_entities or []
        }

class RealtimeSyncService:
    """
    Service for real-time data synchronization across all financial components
    """
    
    def __init__(self):
        self.event_queue: asyncio.Queue = asyncio.Queue()
        self.subscribers: Dict[str, List[Callable]] = {}
        self.active_connections: Dict[str, List] = {}  # WebSocket connections per user
        self.processing_task: Optional[asyncio.Task] = None
        self.running = False
        
        # Entity relationship mappings
        self.entity_relationships = {
            'transaction': ['budget', 'goal', 'analytics'],
            'receipt': ['transaction', 'budget', 'goal'],
            'goal': ['transaction', 'budget'],
            'budget': ['transaction', 'goal']
        }
    
    async def start(self):
        """Start the real-time sync service"""
        if self.running:
            return
        
        self.running = True
        self.processing_task = asyncio.create_task(self._process_events())
        logger.info("🚀 Real-time sync service started")
    
    async def stop(self):
        """Stop the real-time sync service"""
        self.running = False
        if self.processing_task:
            self.processing_task.cancel()
            try:
                await self.processing_task
            except asyncio.CancelledError:
                pass
        logger.info("🛑 Real-time sync service stopped")
    
    async def emit_event(
        self,
        event_type: EventType,
        user_id: str,
        data: Dict[str, Any],
        related_entities: List[str] = None
    ):
        """Emit a new sync event"""
        event = SyncEvent(
            id=str(uuid.uuid4()),
            event_type=event_type,
            user_id=user_id,
            data=data,
            timestamp=datetime.now(),
            related_entities=related_entities or []
        )
        
        await self.event_queue.put(event)
        logger.info(f"📡 Event emitted: {event_type.value} for user {user_id}")
    
    async def subscribe(self, event_type: EventType, callback: Callable):
        """Subscribe to specific event types"""
        event_key = event_type.value
        if event_key not in self.subscribers:
            self.subscribers[event_key] = []
        self.subscribers[event_key].append(callback)
        logger.info(f"📝 Subscribed to {event_type.value}")
    
    async def add_websocket_connection(self, user_id: str, websocket):
        """Add WebSocket connection for real-time updates"""
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"🔌 WebSocket connected for user {user_id}")
    
    async def remove_websocket_connection(self, user_id: str, websocket):
        """Remove WebSocket connection"""
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            except ValueError:
                pass
        logger.info(f"🔌 WebSocket disconnected for user {user_id}")
    
    async def _process_events(self):
        """Process events from the queue"""
        while self.running:
            try:
                # Wait for event with timeout
                event = await asyncio.wait_for(self.event_queue.get(), timeout=1.0)
                await self._handle_event(event)
                self.event_queue.task_done()
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error processing event: {str(e)}")
    
    async def _handle_event(self, event: SyncEvent):
        """Handle individual sync event"""
        try:
            logger.info(f"🔄 Processing event: {event.event_type.value}")
            
            # Process event based on type
            await self._process_event_by_type(event)
            
            # Notify subscribers
            await self._notify_subscribers(event)
            
            # Send real-time updates to connected clients
            await self._send_realtime_updates(event)
            
            # Update related entities
            await self._update_related_entities(event)
            
            event.processed = True
            logger.info(f"✅ Event processed: {event.id}")
            
        except Exception as e:
            logger.error(f"❌ Error handling event {event.id}: {str(e)}")
    
    async def _process_event_by_type(self, event: SyncEvent):
        """Process event based on its type"""
        
        if event.event_type == EventType.RECEIPT_PROCESSED:
            await self._handle_receipt_processed(event)
        elif event.event_type == EventType.TRANSACTION_ADDED:
            await self._handle_transaction_added(event)
        elif event.event_type == EventType.GOAL_PROGRESS_UPDATED:
            await self._handle_goal_progress_updated(event)
        elif event.event_type == EventType.BUDGET_UPDATED:
            await self._handle_budget_updated(event)
        # Add more event type handlers as needed
    
    async def _handle_receipt_processed(self, event: SyncEvent):
        """Handle receipt processing completion"""
        receipt_data = event.data
        
        if receipt_data.get('success') and receipt_data.get('parsed_data'):
            parsed_data = receipt_data['parsed_data']
            
            # Create transaction from receipt
            transaction_data = {
                'amount': parsed_data.get('total', 0),
                'category': parsed_data.get('category', 'Unknown'),
                'description': f"Receipt from {parsed_data.get('vendor', 'Unknown')}",
                'date': parsed_data.get('date', datetime.now().isoformat()),
                'type': 'expense',
                'receipt_id': receipt_data.get('receipt_id'),
                'receipt_url': receipt_data.get('receipt_url')
            }
            
            # Emit transaction added event
            await self.emit_event(
                EventType.TRANSACTION_ADDED,
                event.user_id,
                transaction_data,
                ['budget', 'goal']
            )
    
    async def _handle_transaction_added(self, event: SyncEvent):
        """Handle new transaction addition"""
        transaction = event.data
        
        # Update budget spending
        await self._update_budget_from_transaction(event.user_id, transaction)
        
        # Check goal progress if it's a savings transaction
        if transaction.get('type') == 'income' or transaction.get('category') == 'Savings':
            await self._update_goal_progress_from_transaction(event.user_id, transaction)
        
        # Check for spending anomalies
        await self._check_spending_anomalies(event.user_id, transaction)
    
    async def _handle_goal_progress_updated(self, event: SyncEvent):
        """Handle goal progress updates"""
        goal_data = event.data
        
        # Check for milestone achievements
        if goal_data.get('milestone_achieved'):
            await self.emit_event(
                EventType.MILESTONE_ACHIEVED,
                event.user_id,
                {
                    'goal_id': goal_data.get('goal_id'),
                    'milestone': goal_data.get('milestone_achieved'),
                    'celebration_message': goal_data.get('celebration_message')
                }
            )
        
        # Update related budgets if goal affects savings allocation
        await self._update_budget_from_goal_progress(event.user_id, goal_data)
    
    async def _handle_budget_updated(self, event: SyncEvent):
        """Handle budget updates"""
        budget_data = event.data
        
        # Check if budget changes affect goal timelines
        await self._update_goal_timelines_from_budget(event.user_id, budget_data)
    
    async def _notify_subscribers(self, event: SyncEvent):
        """Notify all subscribers of the event"""
        event_key = event.event_type.value
        if event_key in self.subscribers:
            for callback in self.subscribers[event_key]:
                try:
                    await callback(event)
                except Exception as e:
                    logger.error(f"Error in subscriber callback: {str(e)}")
    
    async def _send_realtime_updates(self, event: SyncEvent):
        """Send real-time updates to connected WebSocket clients"""
        user_id = event.user_id
        if user_id in self.active_connections:
            message = {
                'type': 'sync_event',
                'event': event.to_dict()
            }
            
            # Send to all connections for this user
            disconnected = []
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.warning(f"Failed to send WebSocket message: {str(e)}")
                    disconnected.append(websocket)
            
            # Remove disconnected WebSockets
            for ws in disconnected:
                await self.remove_websocket_connection(user_id, ws)
    
    async def _update_related_entities(self, event: SyncEvent):
        """Update entities related to the event"""
        entity_type = self._get_entity_type_from_event(event.event_type)
        
        if entity_type in self.entity_relationships:
            related_entities = self.entity_relationships[entity_type]
            
            for related_entity in related_entities:
                await self._update_entity(event.user_id, related_entity, event.data)
    
    def _get_entity_type_from_event(self, event_type: EventType) -> str:
        """Get entity type from event type"""
        if 'transaction' in event_type.value:
            return 'transaction'
        elif 'receipt' in event_type.value:
            return 'receipt'
        elif 'goal' in event_type.value:
            return 'goal'
        elif 'budget' in event_type.value:
            return 'budget'
        return 'unknown'
    
    async def _update_entity(self, user_id: str, entity_type: str, data: Dict[str, Any]):
        """Update specific entity based on data changes"""
        # This would integrate with your database/storage layer
        logger.info(f"🔄 Updating {entity_type} for user {user_id}")
        
        # Placeholder for actual entity updates
        # In a real implementation, this would call appropriate services
        pass
    
    async def _update_budget_from_transaction(self, user_id: str, transaction: Dict[str, Any]):
        """Update budget based on new transaction"""
        if transaction.get('type') == 'expense':
            category = transaction.get('category', 'Unknown')
            amount = transaction.get('amount', 0)
            
            # This would update the actual budget in your storage
            logger.info(f"💰 Updating budget for category {category}: -${amount}")
            
            # Emit budget update event
            await self.emit_event(
                EventType.BUDGET_UPDATED,
                user_id,
                {
                    'category': category,
                    'amount_spent': amount,
                    'transaction_id': transaction.get('id')
                }
            )
    
    async def _update_goal_progress_from_transaction(self, user_id: str, transaction: Dict[str, Any]):
        """Update goal progress based on savings transaction"""
        if transaction.get('category') == 'Savings' or transaction.get('type') == 'income':
            amount = transaction.get('amount', 0)
            
            # This would identify which goals to update and update them
            logger.info(f"🎯 Updating goal progress: +${amount}")
            
            # Emit goal progress update event
            await self.emit_event(
                EventType.GOAL_PROGRESS_UPDATED,
                user_id,
                {
                    'amount_added': amount,
                    'transaction_id': transaction.get('id'),
                    'source': 'transaction'
                }
            )
    
    async def _check_spending_anomalies(self, user_id: str, transaction: Dict[str, Any]):
        """Check for spending anomalies in new transaction"""
        # This would integrate with your anomaly detection agent
        logger.info(f"🔍 Checking spending anomalies for transaction: {transaction.get('id')}")
        
        # Placeholder for anomaly detection logic
        pass
    
    async def _update_budget_from_goal_progress(self, user_id: str, goal_data: Dict[str, Any]):
        """Update budget allocations based on goal progress"""
        # This would adjust budget allocations based on goal progress
        logger.info(f"📊 Updating budget based on goal progress: {goal_data.get('goal_id')}")
        
        # Placeholder for budget adjustment logic
        pass
    
    async def _update_goal_timelines_from_budget(self, user_id: str, budget_data: Dict[str, Any]):
        """Update goal timelines based on budget changes"""
        # This would recalculate goal timelines based on budget changes
        logger.info(f"⏰ Updating goal timelines based on budget changes")
        
        # Placeholder for timeline adjustment logic
        pass
    
    # Utility methods for external integration
    
    async def sync_receipt_to_transaction(
        self,
        user_id: str,
        receipt_data: Dict[str, Any]
    ):
        """Sync receipt processing result to create transaction"""
        await self.emit_event(
            EventType.RECEIPT_PROCESSED,
            user_id,
            receipt_data,
            ['transaction', 'budget']
        )
    
    async def sync_transaction_to_goals(
        self,
        user_id: str,
        transaction_data: Dict[str, Any]
    ):
        """Sync transaction to update related goals"""
        await self.emit_event(
            EventType.TRANSACTION_ADDED,
            user_id,
            transaction_data,
            ['goal', 'budget']
        )
    
    async def sync_goal_progress(
        self,
        user_id: str,
        goal_id: str,
        progress_data: Dict[str, Any]
    ):
        """Sync goal progress updates"""
        await self.emit_event(
            EventType.GOAL_PROGRESS_UPDATED,
            user_id,
            {
                'goal_id': goal_id,
                **progress_data
            },
            ['budget', 'analytics']
        )
    
    async def trigger_auto_save(
        self,
        user_id: str,
        goal_id: str,
        auto_save_data: Dict[str, Any]
    ):
        """Trigger automatic savings for a goal"""
        await self.emit_event(
            EventType.AUTO_SAVE_TRIGGERED,
            user_id,
            {
                'goal_id': goal_id,
                **auto_save_data
            },
            ['transaction', 'goal']
        )
    
    async def get_sync_status(self, user_id: str) -> Dict[str, Any]:
        """Get current sync status for a user"""
        return {
            'connected': user_id in self.active_connections,
            'active_connections': len(self.active_connections.get(user_id, [])),
            'queue_size': self.event_queue.qsize(),
            'service_running': self.running,
            'last_sync': datetime.now().isoformat()
        }

# Global instance
realtime_sync = RealtimeSyncService()