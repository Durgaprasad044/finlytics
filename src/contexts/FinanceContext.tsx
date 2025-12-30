import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  type: 'income' | 'expense';
  tags?: string[];
  receiptUrl?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'weekly';
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: string;
  description?: string;
}

interface FinanceState {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySalary: number;
  lastSalaryDate: string | null;
}

type FinanceAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'SET_BALANCE'; payload: number }
  | { type: 'SET_MONTHLY_SALARY'; payload: number }
  | { type: 'SET_LAST_SALARY_DATE'; payload: string }
  | { type: 'LOAD_STATE'; payload: Partial<FinanceState> };

const initialState: FinanceState = {
  transactions: [],
  budgets: [],
  goals: [],
  totalBalance: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  monthlySalary: 0, // No default salary - user must set it
  lastSalaryDate: null,
};

const financeReducer = (state: FinanceState, action: FinanceAction): FinanceState => {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t => 
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload,
      };
    case 'ADD_BUDGET':
      return {
        ...state,
        budgets: [...state.budgets, action.payload],
      };
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(b => 
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter(b => b.id !== action.payload),
      };
    case 'ADD_GOAL':
      return {
        ...state,
        goals: [...state.goals, action.payload],
      };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g => 
          g.id === action.payload.id ? action.payload : g
        ),
      };
    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(g => g.id !== action.payload),
      };
    case 'SET_BALANCE':
      return {
        ...state,
        totalBalance: action.payload,
      };
    case 'SET_MONTHLY_SALARY':
      return {
        ...state,
        monthlySalary: action.payload,
      };
    case 'SET_LAST_SALARY_DATE':
      return {
        ...state,
        lastSalaryDate: action.payload,
      };
    case 'LOAD_STATE':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

interface FinanceContextType extends FinanceState {
  dispatch: React.Dispatch<FinanceAction>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string, password: string) => Promise<boolean>;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  loadTransactions: () => Promise<void>;
  refreshData: () => Promise<void>;
  setMonthlySalary: (amount: number) => void;
  checkAndAddMonthlySalary: () => void;
  clearAllData: () => void;
  setDeletePassword: (password: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(financeReducer, initialState);
  const { currentUser } = useAuth();

  // Get user-specific storage key
  const getStorageKey = () => {
    return currentUser ? `financeData_${currentUser.uid}` : 'financeData_guest';
  };

  // Save state to localStorage with user-specific key
  const saveToLocalStorage = (stateToSave: FinanceState) => {
    try {
      const storageKey = getStorageKey();
      const dataToSave = {
        ...stateToSave,
        transactions: stateToSave.transactions.map(t => ({
          ...t,
          date: t.date.toISOString()
        })),
        goals: stateToSave.goals.map(g => ({
          ...g,
          deadline: g.deadline.toISOString()
        }))
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  // Load state from localStorage with user-specific key
  const loadFromLocalStorage = () => {
    try {
      const storageKey = getStorageKey();
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const loadedState = {
          ...parsedData,
          transactions: parsedData.transactions?.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          })) || [],
          goals: parsedData.goals?.map((g: any) => ({
            ...g,
            deadline: new Date(g.deadline)
          })) || []
        };
        
        dispatch({ type: 'LOAD_STATE', payload: loadedState });
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  };

  // Load transactions from backend (keeping for compatibility)
  const loadTransactions = async () => {
    if (!currentUser) return;
    
    try {
      const response = await apiService.getTransactions();
      const backendTransactions = response.transactions || [];
      
      // Convert backend transactions to frontend format
      const formattedTransactions: Transaction[] = backendTransactions.map((t: any) => ({
        id: t.id || Date.now().toString(),
        amount: t.amount,
        category: t.category || 'Uncategorized',
        description: t.description || t.merchant || 'Transaction',
        date: new Date(t.date),
        type: t.transaction_type === 'credit' ? 'income' : 'expense',
        receiptUrl: t.receipt_url,
      }));
      
      dispatch({ type: 'SET_TRANSACTIONS', payload: formattedTransactions });
      
      // Also sync with localStorage for offline access
      const newState = { ...state, transactions: formattedTransactions };
      localStorage.setItem(getStorageKey(), JSON.stringify(newState));
    } catch (error) {
      console.error('Failed to load transactions:', error);
      // Don't show error toast as we're using localStorage as primary storage
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      // Add to local state immediately for better UX
      const newTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString(),
      };
      dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
      toast.success('Transaction added successfully');

      // Sync with backend if user is authenticated (optional)
      if (currentUser) {
        try {
          const backendTransaction = {
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description,
            date: transaction.date.toISOString(),
            transaction_type: transaction.type === 'income' ? 'credit' : 'debit',
          };
          
          await apiService.addTransaction(backendTransaction);
        } catch (backendError) {
          console.error('Failed to sync with backend:', backendError);
          // Don't show error as local storage is primary
        }
      }
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    try {
      // Update local state immediately
      dispatch({ type: 'UPDATE_TRANSACTION', payload: transaction });
      
      // Sync with backend if user is authenticated
      if (currentUser) {
        try {
          const backendTransaction = {
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description,
            date: transaction.date.toISOString(),
            transaction_type: transaction.type === 'income' ? 'credit' : 'debit',
          };
          
          await apiService.updateTransaction(transaction.id, backendTransaction);
        } catch (backendError) {
          console.error('Failed to sync update with backend:', backendError);
          // Don't show error as local storage is primary
        }
      }
    } catch (error) {
      console.error('Failed to update transaction:', error);
      toast.error('Failed to update transaction');
    }
  };

  const deleteTransaction = async (id: string, password: string): Promise<boolean> => {
    try {
      // Get stored password
      const storedPassword = localStorage.getItem(`deletePassword_${getStorageKey()}`);
      
      if (!storedPassword) {
        toast.error('No delete password set. Please set a password in Settings first.');
        return false;
      }

      if (password !== storedPassword) {
        toast.error('Incorrect password. Transaction not deleted.');
        return false;
      }

      // Delete from backend database first
      try {
        await apiService.deleteTransaction(id);
      } catch (apiError) {
        console.warn('Backend deletion failed, continuing with local deletion:', apiError);
        // Continue with local deletion even if backend fails
      }

      // Delete from local state
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      toast.success('Transaction deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      toast.error('Failed to delete transaction');
      return false;
    }
  };

  const addBudget = (budget: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
    };
    dispatch({ type: 'ADD_BUDGET', payload: newBudget });
  };

  const updateBudget = (budget: Budget) => {
    dispatch({ type: 'UPDATE_BUDGET', payload: budget });
  };

  const deleteBudget = (id: string) => {
    dispatch({ type: 'DELETE_BUDGET', payload: id });
  };

  const addGoal = (goal: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
    };
    dispatch({ type: 'ADD_GOAL', payload: newGoal });
  };

  const updateGoal = (goal: Goal) => {
    dispatch({ type: 'UPDATE_GOAL', payload: goal });
  };

  const deleteGoal = (id: string) => {
    dispatch({ type: 'DELETE_GOAL', payload: id });
  };

  const refreshData = async () => {
    await loadTransactions();
  };

  const setMonthlySalary = (amount: number) => {
    dispatch({ type: 'SET_MONTHLY_SALARY', payload: amount });
  };

  const checkAndAddMonthlySalary = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const secondOfMonth = new Date(currentYear, currentMonth, 2); // 2nd of the month
    
    // Only add salary if today is the 2nd or later in the month
    if (now.getDate() < 2) {
      return;
    }
    
    // Check if we need to add salary for this month
    const lastSalaryDate = state.lastSalaryDate ? new Date(state.lastSalaryDate) : null;
    const shouldAddSalary = !lastSalaryDate || 
      lastSalaryDate.getMonth() !== currentMonth || 
      lastSalaryDate.getFullYear() !== currentYear;

    if (shouldAddSalary && state.monthlySalary > 0) {
      const salaryTransaction: Transaction = {
        id: `salary-${currentYear}-${currentMonth}`,
        amount: state.monthlySalary,
        category: 'Salary',
        description: `Monthly Salary - ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        date: secondOfMonth,
        type: 'income',
      };

      dispatch({ type: 'ADD_TRANSACTION', payload: salaryTransaction });
      dispatch({ type: 'SET_LAST_SALARY_DATE', payload: secondOfMonth.toISOString() });
      toast.success('Monthly salary credited on 2nd!');
    }
  };

  // Clean up old non-user-specific data and load user-specific data
  useEffect(() => {
    // Remove old non-user-specific data if it exists
    const oldData = localStorage.getItem('financeData');
    if (oldData) {
      localStorage.removeItem('financeData');
    }
    
    // Also remove any other old keys that might exist
    const keysToRemove = ['deletePassword_financeData_guest', 'deletePassword_financeData'];
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Data has been cleared - now only your manually added data will persist
    // localStorage.clear(); // Removed - data will now persist
    
    // Load user-specific data
    loadFromLocalStorage();
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveToLocalStorage(state);
  }, [state]);

  // Check for monthly salary on mount and when month changes
  useEffect(() => {
    const timer = setTimeout(() => {
      checkAndAddMonthlySalary();
    }, 1000); // Delay to ensure state is loaded
    
    return () => clearTimeout(timer);
  }, []);

  // Check for monthly salary when salary amount changes
  useEffect(() => {
    if (state.monthlySalary > 0) {
      checkAndAddMonthlySalary();
    }
  }, [state.monthlySalary]);

  const clearAllData = () => {
    // Clear localStorage
    localStorage.removeItem(getStorageKey());
    localStorage.removeItem(`deletePassword_${getStorageKey()}`);
    
    // Reset state to initial
    dispatch({ type: 'LOAD_STATE', payload: initialState });
    toast.success('All data cleared successfully');
  };

  const setDeletePassword = (password: string) => {
    localStorage.setItem(`deletePassword_${getStorageKey()}`, password);
    toast.success('Delete password set successfully');
  };

  // Load data when user changes
  useEffect(() => {
    // Clear current state and load user-specific data
    dispatch({ type: 'LOAD_STATE', payload: initialState });
    loadFromLocalStorage();
    
    if (currentUser) {
      // Optional: sync with backend
      loadTransactions();
    }
  }, [currentUser]);

  // Calculate derived values
  useEffect(() => {
    // Monthly analytics variables (available for future use)
    // const currentMonth = new Date().getMonth();
    // const currentYear = new Date().getFullYear();
    
    // Filter monthly transactions (available for future analytics)
    // const monthlyTransactions = state.transactions.filter(t => {
    //   const transactionDate = new Date(t.date);
    //   return transactionDate.getMonth() === currentMonth && 
    //          transactionDate.getFullYear() === currentYear;
    // });

    // Calculate monthly income and expenses (available for future use)
    // const monthlyIncome = monthlyTransactions
    //   .filter(t => t.type === 'income')
    //   .reduce((sum, t) => sum + t.amount, 0);

    // const monthlyExpenses = monthlyTransactions
    //   .filter(t => t.type === 'expense')
    //   .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = state.transactions.reduce((sum, t) => {
      return t.type === 'income' ? sum + t.amount : sum - t.amount;
    }, 0);

    dispatch({ type: 'SET_BALANCE', payload: totalBalance });
  }, [state.transactions]);

  const value = {
    ...state,
    dispatch,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    loadTransactions,
    refreshData,
    setMonthlySalary,
    checkAndAddMonthlySalary,
    clearAllData,
    setDeletePassword,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};