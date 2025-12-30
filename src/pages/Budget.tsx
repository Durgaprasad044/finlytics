"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PiggyBank,
  Plus,
  Target,
  DollarSign,
  Lightbulb,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Loader,
  Brain,
  TrendingDown,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { apiService } from '../services/api';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import toast from 'react-hot-toast';

interface BudgetPlan {
  user_id: string;
  monthly_income: number;
  savings_goal_percentage: number;
  budget_allocation: {
    monthly_income: number;
    strategy: string;
    high_level_allocation: {
      needs: number;
      wants: number;
      savings: number;
      debt_payment: number;
    };
    category_allocations: Record<string, number>;
    total_allocated: number;
    remaining_buffer: number;
    allocation_percentages: Record<string, number>;
  };
  spending_analysis: {
    total_monthly_spending: number;
    category_breakdown: Record<string, any>;
    monthly_trend: Record<string, number>;
    trends: any;
    insights: string[];
  };
  forecasts: any;
  financial_goals: {
    goals: Array<{
      type: string;
      name: string;
      target_amount: number;
      monthly_allocation: number;
      months_to_achieve: number;
      priority: string;
      completion_date: string;
    }>;
    total_monthly_savings_needed: number;
  };
  ai_recommendations: string[];
  metrics: {
    savings_rate: number;
    debt_to_income_ratio: number;
    budget_efficiency_score: number;
    financial_health_grade: string;
  };
  created_at: string;
  next_review_date: string;
}

const Budget: React.FC = () => {
  const { transactions, budgets, addBudget, updateBudget, deleteBudget } = useFinance();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAIPlanner, setShowAIPlanner] = useState(false);
  const [budgetPlan, setBudgetPlan] = useState<BudgetPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);

  // AI Budget Planning Form State
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [savingsGoal, setSavingsGoal] = useState<number>(0.2);
  const [financialGoals, setFinancialGoals] = useState<string[]>(['emergency_fund']);

  // Manual Budget Form State
  const [newBudget, setNewBudget] = useState({
    category: '',
    limit: 0,
    period: 'monthly' as 'monthly' | 'weekly'
  });

  // Calculate current month data for budget tracking
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const currentMonthTransactions = transactions.filter(t =>
    isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
  );

  // Calculate spending for each budget category
  const budgetsWithSpending = budgets.map(budget => {
    const spent = currentMonthTransactions
      .filter(t => t.category === budget.category && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      ...budget,
      spent,
      remaining: budget.limit - spent,
      percentage: (spent / budget.limit) * 100
    };
  });

  // Generate AI Budget Plan
  const generateAIBudgetPlan = async () => {
    setLoading(true);
    try {
      const result = await apiService.createBudgetPlan(
        monthlyIncome || undefined,
        savingsGoal,
        financialGoals
      );

      if (result.error) {
        toast.error(`Failed to generate budget plan: ${result.error}`);
        return;
      }

      setBudgetPlan(result);
      toast.success('AI Budget Plan generated successfully!');
    } catch (error) {
      console.error('Budget plan generation failed:', error);
      toast.error('Failed to generate budget plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Apply AI Budget Plan to local budgets
  const applyAIBudgetPlan = () => {
    if (!budgetPlan) return;

    const categoryAllocations = budgetPlan.budget_allocation.category_allocations;

    // Clear existing budgets and add new ones from AI plan
    Object.entries(categoryAllocations).forEach(([category, limit]) => {
      const existingBudget = budgets.find(b => b.category === category);

      if (existingBudget) {
        updateBudget({
          ...existingBudget,
          limit: Number(limit),
          spent: 0
        });
      } else {
        addBudget({
          category,
          limit: Number(limit),
          spent: 0,
          period: 'monthly'
        });
      }
    });

    toast.success('AI Budget Plan applied successfully!');
    setShowAIPlanner(false);
  };

  // Handle manual budget creation
  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newBudget.category || newBudget.limit <= 0) {
      toast.error('Please fill in all fields correctly');
      return;
    }

    addBudget({
      category: newBudget.category,
      limit: newBudget.limit,
      spent: 0,
      period: newBudget.period
    });

    setNewBudget({ category: '', limit: 0, period: 'monthly' });
    setShowCreateForm(false);
    toast.success('Budget created successfully!');
  };

  // Handle budget editing
  const handleEditBudget = (budget: any) => {
    setEditingBudget(budget);
    setNewBudget({
      category: budget.category,
      limit: budget.limit,
      period: budget.period
    });
    setShowCreateForm(true);
  };

  // Handle budget update
  const handleUpdateBudget = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingBudget) return;

    updateBudget({
      ...editingBudget,
      category: newBudget.category,
      limit: newBudget.limit,
      period: newBudget.period
    });

    setEditingBudget(null);
    setNewBudget({ category: '', limit: 0, period: 'monthly' });
    setShowCreateForm(false);
    toast.success('Budget updated successfully!');
  };

  // Handle budget deletion
  const handleDeleteBudget = (budgetId: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      deleteBudget(budgetId);
      toast.success('Budget deleted successfully!');
    }
  };

  // Calculate overall budget metrics
  const totalBudgetLimit = budgetsWithSpending.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudgetLimit - totalSpent;
  const overallPercentage = totalBudgetLimit > 0 ? (totalSpent / totalBudgetLimit) * 100 : 0;

  // Budget alerts
  const budgetAlerts = budgetsWithSpending.filter(budget => budget.percentage > 80);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Budget Planning</h1>
          <p className="text-gray-600 mt-1 dark:text-white">Manage your budgets and spending limits</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAIPlanner(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Budget Planner
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </button>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="floating-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-white">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalBudgetLimit.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary-100">
              <DollarSign className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="floating-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-white">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalSpent.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-danger-100">
              <TrendingDown className="h-6 w-6 text-danger-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="floating-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-white">Remaining</p>
              <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                ₹{totalRemaining.toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${totalRemaining >= 0 ? 'bg-success-100' : 'bg-danger-100'}`}>
              <Target className={`h-6 w-6 ${totalRemaining >= 0 ? 'text-success-600' : 'text-danger-600'}`} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="floating-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-white">Usage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{overallPercentage.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-warning-100">
              <BarChart3 className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-warning-50 border border-warning-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-warning-600 mr-2" />
            <h3 className="text-sm font-medium text-warning-800 ">Budget Alerts</h3>
          </div>
          <div className="mt-2 space-y-1">
            {budgetAlerts.map((budget) => (
              <p key={budget.id} className="text-sm text-warning-700">
                {budget.category}: {budget.percentage.toFixed(1)}% used (₹{budget.spent.toLocaleString()} of ₹{budget.limit.toLocaleString()})
              </p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Budget List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="floating-card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Budgets</h2>
          <span className="text-sm text-gray-500">
            {format(new Date(), 'MMMM yyyy')}
          </span>
        </div>

        {budgetsWithSpending.length > 0 ? (
          <div className="space-y-4">
            {budgetsWithSpending.map((budget) => (
              <div key={budget.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{budget.category}</h3>
                    <p className="text-sm text-gray-500">
                      ₹{budget.spent.toLocaleString()} of ₹{budget.limit.toLocaleString()} spent
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${budget.percentage > 100 ? 'text-danger-600' :
                      budget.percentage > 80 ? 'text-warning-600' : 'text-success-600'
                      }`}>
                      {budget.percentage.toFixed(1)}%
                    </span>
                    <button
                      onClick={() => handleEditBudget(budget)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="p-1 text-gray-400 hover:text-danger-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${budget.percentage > 100 ? 'bg-danger-600' :
                      budget.percentage > 80 ? 'bg-warning-600' : 'bg-success-600'
                      }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>₹0</span>
                  <span>₹{budget.limit.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <PiggyBank className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No budgets created yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first budget or use AI Budget Planner</p>
          </div>
        )}
      </motion.div>

      {/* AI Budget Planner Modal */}
      {showAIPlanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Brain className="h-6 w-6 mr-2 text-purple-600" />
                AI Budget Planner
              </h3>
              <button
                onClick={() => setShowAIPlanner(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {!budgetPlan ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Income (Optional)
                    </label>
                    <input
                      type="number"
                      value={monthlyIncome || ''}
                      onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Leave empty for AI estimation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Savings Goal (%)
                    </label>
                    <select
                      value={savingsGoal}
                      onChange={(e) => setSavingsGoal(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value={0.1}>10% - Conservative</option>
                      <option value={0.15}>15% - Moderate</option>
                      <option value={0.2}>20% - Recommended</option>
                      <option value={0.25}>25% - Aggressive</option>
                      <option value={0.3}>30% - Very Aggressive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Financial Goals
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: 'emergency_fund', label: 'Emergency Fund' },
                      { id: 'retirement', label: 'Retirement' },
                      { id: 'vacation', label: 'Vacation' }
                    ].map((goal) => (
                      <label key={goal.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={financialGoals.includes(goal.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFinancialGoals([...financialGoals, goal.id]);
                            } else {
                              setFinancialGoals(financialGoals.filter(g => g !== goal.id));
                            }
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{goal.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAIPlanner(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateAIBudgetPlan}
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Generate AI Budget Plan
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Budget Plan Results */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-primary-50 p-4 rounded-lg">
                    <h4 className="font-medium text-primary-900">Monthly Income</h4>
                    <p className="text-2xl font-bold text-primary-600">
                      ₹{budgetPlan.monthly_income.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-success-50 p-4 rounded-lg">
                    <h4 className="font-medium text-success-900">Savings Rate</h4>
                    <p className="text-2xl font-bold text-success-600">
                      {budgetPlan.metrics.savings_rate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-warning-50 p-4 rounded-lg">
                    <h4 className="font-medium text-warning-900">Health Grade</h4>
                    <p className="text-2xl font-bold text-warning-600">
                      {budgetPlan.metrics.financial_health_grade}
                    </p>
                  </div>
                </div>

                {/* High Level Allocation */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Budget Allocation Strategy: {budgetPlan.budget_allocation.strategy}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Needs</p>
                      <p className="font-semibold">₹{budgetPlan.budget_allocation.high_level_allocation.needs.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Wants</p>
                      <p className="font-semibold">₹{budgetPlan.budget_allocation.high_level_allocation.wants.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Savings</p>
                      <p className="font-semibold">₹{budgetPlan.budget_allocation.high_level_allocation.savings.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Debt Payment</p>
                      <p className="font-semibold">₹{budgetPlan.budget_allocation.high_level_allocation.debt_payment.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                {budgetPlan.ai_recommendations.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2" />
                      AI Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {budgetPlan.ai_recommendations.map((recommendation, index) => (
                        <li key={index} className="text-sm text-blue-800 flex items-start">
                          <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Financial Goals */}
                {budgetPlan.financial_goals.goals.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-3">Financial Goals</h4>
                    <div className="space-y-3">
                      {budgetPlan.financial_goals.goals.map((goal, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-green-800">{goal.name}</p>
                            <p className="text-sm text-green-600">
                              ₹{goal.monthly_allocation.toLocaleString()}/month for {goal.months_to_achieve} months
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-800">₹{goal.target_amount.toLocaleString()}</p>
                            <p className="text-sm text-green-600">{goal.priority} priority</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setBudgetPlan(null)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Generate New Plan
                  </button>
                  <button
                    onClick={applyAIBudgetPlan}
                    className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Apply This Budget Plan
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Create/Edit Budget Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingBudget ? 'Edit Budget' : 'Create New Budget'}
            </h3>
            <form onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newBudget.category}
                    onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Groceries, Entertainment"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Limit</label>
                  <input
                    type="number"
                    value={newBudget.limit || ''}
                    onChange={(e) => setNewBudget({ ...newBudget, limit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select
                    value={newBudget.period}
                    onChange={(e) => setNewBudget({ ...newBudget, period: e.target.value as 'monthly' | 'weekly' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingBudget(null);
                    setNewBudget({ category: '', limit: 0, period: 'monthly' });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingBudget ? 'Update Budget' : 'Create Budget'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Budget;