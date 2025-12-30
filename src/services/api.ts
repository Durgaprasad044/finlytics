/**
 * API Service Layer for AI Finance Assistant
 * Connects frontend to backend AI agents
 */

import { auth } from '../config/firebase';

const API_BASE_URL = 'http://localhost:8000';

// Helper function to get auth token
const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
};

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);

    // Handle specific error cases
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to backend server. Please ensure the backend is running on http://localhost:8000');
    }

    throw error;
  }
};

// Helper function for file uploads
const apiUpload = async (endpoint: string, formData: FormData): Promise<any> => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API upload failed:', error);
    throw error;
  }
};

// API Service Functions
export const apiService = {
  // Health check
  healthCheck: async () => {
    return await apiRequest('/health');
  },

  // Expense Query Agent
  processExpenseQuery: async (query: string, timePeriod: string = 'month') => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    return await apiRequest('/api/expense-query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        user_id: user.uid,
        time_period: timePeriod,
      }),
    });
  },

  // Receipt Parsing Agent
  parseReceipt: async (file: File) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user.uid);

    return await apiUpload('/api/parse-receipt', formData);
  },

  // Anomaly Detection Agent
  detectAnomalies: async (transactions: any[]) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    return await apiRequest('/api/detect-anomalies', {
      method: 'POST',
      body: JSON.stringify({
        transactions,
        user_id: user.uid,
      }),
    });
  },

  // Budget Planner Agent
  createBudgetPlan: async (monthlyIncome?: number, savingsGoal: number = 0.2, financialGoals: string[] = []) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    return await apiRequest('/api/create-budget-plan', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.uid,
        monthly_income: monthlyIncome,
        savings_goal: savingsGoal,
        financial_goals: financialGoals,
      }),
    });
  },

  // Spending Coach Agent
  getSpendingCoaching: async (timePeriod: string = 'month') => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    return await apiRequest('/api/spending-coaching', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.uid,
        time_period: timePeriod,
      }),
    });
  },

  // Transaction Management
  addTransaction: async (transactionData: any) => {
    return await apiRequest('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  getTransactions: async (limit: number = 100, offset: number = 0, timePeriod?: string) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (timePeriod) {
      params.append('time_period', timePeriod);
    }

    return await apiRequest(`/api/transactions?${params.toString()}`);
  },



  updateTransaction: async (id: string, transaction: any) => {
    return await apiRequest(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  },

  deleteTransaction: async (id: string) => {
    return await apiRequest(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  // User Profile Management
  getUserProfile: async () => {
    return await apiRequest('/api/profile');
  },

  updateUserProfile: async (profileData: any) => {
    return await apiRequest('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Agent Status
  getAgentsStatus: async () => {
    return await apiRequest('/api/agents/status');
  },
};

export default apiService;