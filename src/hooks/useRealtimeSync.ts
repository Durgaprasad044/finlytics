import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import toast from 'react-hot-toast';

interface SyncEvent {
  id: string;
  event_type: string;
  user_id: string;
  data: any;
  timestamp: string;
  related_entities: string[];
}

interface RealtimeSyncHook {
  connected: boolean;
  lastSync: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnect: () => void;
}

export const useRealtimeSync = (): RealtimeSyncHook => {
  const { currentUser } = useAuth();
  const { addTransaction, updateGoal, addGoal } = useFinance();
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = async () => {
    if (!currentUser) return;

    try {
      setConnectionStatus('connecting');
      
      // Get auth token
      const token = await currentUser.getIdToken();
      
      // Create WebSocket connection
      const wsUrl = `ws://localhost:8000/ws/sync?token=${token}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('🔌 Real-time sync connected');
        setConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        // Send initial sync request
        ws.send(JSON.stringify({
          type: 'sync_request',
          user_id: currentUser.uid
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleSyncEvent(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 Real-time sync disconnected:', event.code, event.reason);
        setConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      wsRef.current = ws;
      
    } catch (error) {
      console.error('Failed to connect to real-time sync:', error);
      setConnectionStatus('error');
      scheduleReconnect();
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff, max 30s
    reconnectAttempts.current++;

    console.log(`🔄 Scheduling reconnect attempt ${reconnectAttempts.current} in ${delay}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (reconnectAttempts.current <= maxReconnectAttempts) {
        connect();
      }
    }, delay);
  };

  const handleSyncEvent = (message: any) => {
    if (message.type === 'sync_event') {
      const event: SyncEvent = message.event;
      setLastSync(event.timestamp);
      
      console.log('📡 Received sync event:', event.event_type, event.data);
      
      switch (event.event_type) {
        case 'receipt_processed':
          handleReceiptProcessed(event.data);
          break;
        case 'transaction_added':
          handleTransactionAdded(event.data);
          break;
        case 'goal_created':
          handleGoalCreated(event.data);
          break;
        case 'goal_progress_updated':
          handleGoalProgressUpdated(event.data);
          break;
        case 'milestone_achieved':
          handleMilestoneAchieved(event.data);
          break;
        case 'auto_save_triggered':
          handleAutoSaveTriggered(event.data);
          break;
        default:
          console.log('Unknown sync event type:', event.event_type);
      }
    } else if (message.type === 'sync_status') {
      console.log('📊 Sync status:', message.status);
    }
  };

  const handleReceiptProcessed = (data: any) => {
    if (data.success && data.transaction_data) {
      toast.success(`📄 Receipt processed! Transaction of $${data.transaction_data.amount} added.`, {
        duration: 4000,
        icon: '🤖'
      });
    }
  };

  const handleTransactionAdded = (data: any) => {
    // Transaction is already added through the normal flow
    // This is for real-time updates from other sources
    console.log('💰 Transaction added via sync:', data);
  };

  const handleGoalCreated = (data: any) => {
    if (data.id) {
      const newGoal = {
        id: data.id,
        title: data.title,
        targetAmount: data.target_amount,
        currentAmount: data.current_amount,
        deadline: new Date(data.deadline),
        category: data.category,
        description: data.description
      };
      
      // Only add if not already in local state
      addGoal(newGoal);
      toast.success(`🎯 New goal "${data.title}" synced!`);
    }
  };

  const handleGoalProgressUpdated = (data: any) => {
    if (data.goal_id && data.amount_added) {
      toast.success(`🎯 Goal progress updated: +$${data.amount_added}`, {
        duration: 3000
      });
    }
  };

  const handleMilestoneAchieved = (data: any) => {
    if (data.milestone && data.celebration_message) {
      toast.success(data.celebration_message, {
        duration: 6000,
        icon: '🎉'
      });
    }
  };

  const handleAutoSaveTriggered = (data: any) => {
    if (data.amount) {
      toast.success(`💰 Auto-save triggered: $${data.amount} saved to your goal!`, {
        duration: 4000,
        icon: '⚡'
      });
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setConnected(false);
    setConnectionStatus('disconnected');
  };

  const reconnect = () => {
    disconnect();
    reconnectAttempts.current = 0;
    connect();
  };

  // Connect when user is authenticated
  useEffect(() => {
    if (currentUser) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [currentUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (connected && wsRef.current) {
      const heartbeat = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Send ping every 30 seconds

      return () => clearInterval(heartbeat);
    }
  }, [connected]);

  return {
    connected,
    lastSync,
    connectionStatus,
    reconnect
  };
};