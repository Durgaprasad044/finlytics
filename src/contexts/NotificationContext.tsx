import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useFinance } from './FinanceContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  settings: {
    budgetAlerts: boolean;
    spendingAlerts: boolean;
    monthlyReports: boolean;
    emailNotifications: boolean;
    realTimeUpdates: boolean;
  };
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<NotificationState['settings']> }
  | { type: 'LOAD_NOTIFICATIONS'; payload: Notification[] };

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  settings: {
    budgetAlerts: true,
    spendingAlerts: true,
    monthlyReports: true,
    emailNotifications: false,
    realTimeUpdates: true,
  },
};

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications];
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length,
      };
    case 'MARK_AS_READ':
      const updatedNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.read).length,
      };
    case 'MARK_ALL_AS_READ':
      const allReadNotifications = state.notifications.map(n => ({ ...n, read: true }));
      return {
        ...state,
        notifications: allReadNotifications,
        unreadCount: 0,
      };
    case 'DELETE_NOTIFICATION':
      const filteredNotifications = state.notifications.filter(n => n.id !== action.payload);
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.read).length,
      };
    case 'CLEAR_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case 'LOAD_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.read).length,
      };
    default:
      return state;
  }
};

interface NotificationContextType extends NotificationState {
  dispatch: React.Dispatch<NotificationAction>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateSettings: (settings: Partial<NotificationState['settings']>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { currentUser } = useAuth();
  const { transactions, budgets, goals, totalBalance, monthlyExpenses } = useFinance();

  // Get user-specific storage key
  const getStorageKey = () => {
    return currentUser ? `notifications_${currentUser.uid}` : 'notifications_guest';
  };

  // Save notifications to localStorage
  const saveToLocalStorage = (notifications: Notification[]) => {
    try {
      const storageKey = getStorageKey();
      const dataToSave = {
        notifications: notifications.map(n => ({
          ...n,
          timestamp: n.timestamp.toISOString()
        })),
        settings: state.settings
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error);
    }
  };

  // Load notifications from localStorage
  const loadFromLocalStorage = () => {
    try {
      const storageKey = getStorageKey();
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const loadedNotifications = parsedData.notifications?.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })) || [];
        
        dispatch({ type: 'LOAD_NOTIFICATIONS', payload: loadedNotifications });
        if (parsedData.settings) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: parsedData.settings });
        }
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
    }
  };

  // Save to localStorage whenever notifications change
  useEffect(() => {
    saveToLocalStorage(state.notifications);
  }, [state.notifications, state.settings]);

  // Load notifications on mount or user change
  useEffect(() => {
    loadFromLocalStorage();
  }, [currentUser]);

  // Real-time monitoring for budget alerts
  useEffect(() => {
    if (!state.settings.budgetAlerts || !state.settings.realTimeUpdates) return;

    budgets.forEach(budget => {
      const spentPercentage = (budget.spent / budget.limit) * 100;
      
      // Check if we should send a budget alert
      if (spentPercentage >= 80 && spentPercentage < 100) {
        const existingAlert = state.notifications.find(n => 
          n.title === 'Budget Alert' && 
          n.message.includes(budget.category) &&
          n.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
        );
        
        if (!existingAlert) {
          addNotification({
            title: 'Budget Alert',
            message: `You've spent ${spentPercentage.toFixed(0)}% of your ${budget.category} budget`,
            type: 'warning',
            actionUrl: '/app/budget'
          });
        }
      } else if (spentPercentage >= 100) {
        const existingAlert = state.notifications.find(n => 
          n.title === 'Budget Exceeded' && 
          n.message.includes(budget.category) &&
          n.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        
        if (!existingAlert) {
          addNotification({
            title: 'Budget Exceeded',
            message: `You've exceeded your ${budget.category} budget by ₹${(budget.spent - budget.limit).toFixed(2)}`,
            type: 'error',
            actionUrl: '/app/budget'
          });
        }
      }
    });
  }, [budgets, state.settings.budgetAlerts, state.settings.realTimeUpdates]);

  // Real-time monitoring for spending alerts
  useEffect(() => {
    if (!state.settings.spendingAlerts || !state.settings.realTimeUpdates) return;

    const today = new Date();
    const todayTransactions = transactions.filter(t => 
      t.type === 'expense' && 
      t.date.toDateString() === today.toDateString()
    );
    
    const todaySpending = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Alert if daily spending exceeds ₹1000
    if (todaySpending > 1000) {
      const existingAlert = state.notifications.find(n => 
        n.title === 'High Daily Spending' && 
        n.timestamp.toDateString() === today.toDateString()
      );
      
      if (!existingAlert) {
        addNotification({
          title: 'High Daily Spending',
          message: `You've spent ₹${todaySpending.toFixed(2)} today`,
          type: 'warning',
          actionUrl: '/app/expenses'
        });
      }
    }
  }, [transactions, state.settings.spendingAlerts, state.settings.realTimeUpdates]);

  // Goal achievement monitoring
  useEffect(() => {
    if (!state.settings.realTimeUpdates) return;

    goals.forEach(goal => {
      const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
      
      if (progressPercentage >= 100) {
        const existingAlert = state.notifications.find(n => 
          n.title === 'Goal Achieved!' && 
          n.message.includes(goal.title) &&
          n.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        
        if (!existingAlert) {
          addNotification({
            title: 'Goal Achieved!',
            message: `Congratulations! You've reached your goal: ${goal.title}`,
            type: 'success',
            actionUrl: '/app/goals'
          });
        }
      } else if (progressPercentage >= 75) {
        const existingAlert = state.notifications.find(n => 
          n.title === 'Goal Progress' && 
          n.message.includes(goal.title) &&
          n.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Within last 7 days
        );
        
        if (!existingAlert) {
          addNotification({
            title: 'Goal Progress',
            message: `You're ${progressPercentage.toFixed(0)}% towards your goal: ${goal.title}`,
            type: 'info',
            actionUrl: '/app/goals'
          });
        }
      }
    });
  }, [goals, state.settings.realTimeUpdates]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
  };

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  };

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  const deleteNotification = (id: string) => {
    dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
  };

  const clearAllNotifications = () => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  };

  const updateSettings = (settings: Partial<NotificationState['settings']>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const value: NotificationContextType = {
    ...state,
    dispatch,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updateSettings,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};