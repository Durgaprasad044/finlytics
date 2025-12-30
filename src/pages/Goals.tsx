"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  Calendar,
  Plus,
  DollarSign,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Brain,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { apiService } from '../services/api';
import { format, differenceInDays, addMonths } from 'date-fns';
import toast from 'react-hot-toast';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  priority: 'high' | 'medium' | 'low';
  description?: string;
  monthlyContribution?: number;
  isCompleted: boolean;
  createdAt: Date;
}

const Goals: React.FC = () => {
  const { transactions } = useFinance();
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      name: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 25000,
      targetDate: addMonths(new Date(), 12),
      category: 'Emergency',
      priority: 'high',
      description: 'Build 6 months of expenses as emergency fund',
      monthlyContribution: 6250,
      isCompleted: false,
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Vacation to Europe',
      targetAmount: 150000,
      currentAmount: 45000,
      targetDate: addMonths(new Date(), 8),
      category: 'Travel',
      priority: 'medium',
      description: '2-week Europe trip with family',
      monthlyContribution: 13125,
      isCompleted: false,
      createdAt: new Date()
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: 0,
    targetDate: '',
    category: 'Savings',
    priority: 'medium' as 'high' | 'medium' | 'low',
    description: '',
    monthlyContribution: 0
  });

  const categories = [
    'Emergency',
    'Travel',
    'Education',
    'Home',
    'Car',
    'Investment',
    'Retirement',
    'Health',
    'Other'
  ];

  // Get AI suggestions for goal planning
  const getAISuggestions = async () => {
    setLoading(true);
    try {
      const result = await apiService.createBudgetPlan();

      if (result.financial_goals) {
        setAiSuggestions(result.financial_goals);
        setShowAIAssistant(true);
        toast.success('AI goal suggestions generated!');
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      toast.error('Failed to get AI suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate goal progress
  const calculateProgress = (goal: Goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysLeft = differenceInDays(goal.targetDate, new Date());
    const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
    const requiredMonthly = Math.max(0, (goal.targetAmount - goal.currentAmount) / monthsLeft);

    return {
      progress: Math.min(progress, 100),
      daysLeft,
      monthsLeft,
      requiredMonthly,
      isOnTrack: goal.monthlyContribution ? goal.monthlyContribution >= requiredMonthly : false
    };
  };

  // Handle goal creation
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newGoal.name || newGoal.targetAmount <= 0 || !newGoal.targetDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      name: newGoal.name,
      targetAmount: newGoal.targetAmount,
      currentAmount: 0,
      targetDate: new Date(newGoal.targetDate),
      category: newGoal.category,
      priority: newGoal.priority,
      description: newGoal.description,
      monthlyContribution: newGoal.monthlyContribution,
      isCompleted: false,
      createdAt: new Date()
    };

    if (editingGoal) {
      setGoals(goals.map(g => g.id === editingGoal.id ? { ...goal, id: editingGoal.id, currentAmount: editingGoal.currentAmount } : g));
      toast.success('Goal updated successfully!');
    } else {
      setGoals([...goals, goal]);
      toast.success('Goal created successfully!');
    }

    setNewGoal({
      name: '',
      targetAmount: 0,
      targetDate: '',
      category: 'Savings',
      priority: 'medium',
      description: '',
      monthlyContribution: 0
    });
    setShowAddForm(false);
    setEditingGoal(null);
  };

  // Handle goal deletion
  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
    toast.success('Goal deleted successfully!');
  };

  // Handle goal editing
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoal({
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: format(goal.targetDate, 'yyyy-MM-dd'),
      category: goal.category,
      priority: goal.priority,
      description: goal.description || '',
      monthlyContribution: goal.monthlyContribution || 0
    });
    setShowAddForm(true);
  };

  // Update goal progress
  const updateGoalProgress = (goalId: string, amount: number) => {
    setGoals(goals.map(goal =>
      goal.id === goalId
        ? {
          ...goal,
          currentAmount: Math.min(goal.currentAmount + amount, goal.targetAmount),
          isCompleted: goal.currentAmount + amount >= goal.targetAmount
        }
        : goal
    ));
    toast.success('Goal progress updated!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Goals</h1>
          <p className="text-gray-600 mt-1 dark:text-white">Set and track your savings goals with AI assistance</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={getAISuggestions}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            AI Suggestions
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </button>
        </div>
      </div>

      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="floating-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-white">Total Goals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{goals.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Target className="h-6 w-6 text-primary-600" />
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
              <p className="text-sm font-medium text-gray-600 dark:text-white">Completed Goals</p>
              <p className="text-2xl font-bold text-success-600 ">{goals.filter(g => g.isCompleted).length}</p>
            </div>
            <div className="p-3 bg-success-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-success-600" />
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
              <p className="text-sm font-medium text-gray-600 dark:text-white">Total Target</p>
              <p className="text-2xl font-bold text-warning-600">
                ₹{goals.reduce((sum, g) => sum + g.targetAmount, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-warning-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal, index) => {
          const progress = calculateProgress(goal);

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="floating-card"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${goal.priority === 'high' ? 'bg-red-100 text-red-700' :
                      goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                      {goal.priority} priority
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {goal.category}
                    </span>
                  </div>
                  {goal.description && (
                    <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 ">Target Amount</p>
                      <p className="font-medium">₹{goal.targetAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Current Amount</p>
                      <p className="font-medium text-success-600">₹{goal.currentAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Target Date</p>
                      <p className="font-medium ">{format(goal.targetDate, 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 ">Days Left</p>
                      <p className={`font-medium dark:text-white  ${progress.daysLeft < 30 ? 'text-red-600' : 'text-gray-900'}`}>
                        {progress.daysLeft} days
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4 ">
                  <button
                    onClick={() => handleEditGoal(goal)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-white">Progress</span>
                  <span className="text-sm font-medium text-gray-900 ">{progress.progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${goal.isCompleted ? 'bg-success-500' :
                      progress.progress >= 75 ? 'bg-success-500' :
                        progress.progress >= 50 ? 'bg-warning-500' :
                          'bg-primary-500'
                      }`}
                    style={{ width: `${progress.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {!progress.isOnTrack && !goal.isCompleted && (
                    <div className="flex items-center text-warning-600">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span>Need ₹{progress.requiredMonthly.toLocaleString()}/month</span>
                    </div>
                  )}
                  {progress.isOnTrack && !goal.isCompleted && (
                    <div className="flex items-center text-success-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span>On track</span>
                    </div>
                  )}
                </div>

                {!goal.isCompleted && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const amount = prompt('Enter contribution amount:');
                        if (amount && !isNaN(Number(amount))) {
                          updateGoalProgress(goal.id, Number(amount));
                        }
                      }}
                      className="bg-success-600 text-white px-3 py-1 rounded text-sm hover:bg-success-700 transition-colors"
                    >
                      Add Contribution
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="floating-card text-center py-12"
        >
          <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Goals Yet</h3>
          <p className="text-gray-600 mb-6">
            Start by setting your first financial goal and let AI help you achieve it.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create Your First Goal
          </button>
        </motion.div>
      )}

      {/* Add/Edit Goal Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </h3>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
                <input
                  type="text"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Emergency Fund"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  value={newGoal.targetAmount || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="100000"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as 'high' | 'medium' | 'low' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Contribution (₹)</label>
                <input
                  type="number"
                  value={newGoal.monthlyContribution || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, monthlyContribution: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="5000"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your goal..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingGoal(null);
                    setNewGoal({
                      name: '',
                      targetAmount: 0,
                      targetDate: '',
                      category: 'Savings',
                      priority: 'medium',
                      description: '',
                      monthlyContribution: 0
                    });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* AI Assistant Modal */}
      {showAIAssistant && aiSuggestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Brain className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">AI Goal Suggestions</h3>
              </div>
              <button
                onClick={() => setShowAIAssistant(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {aiSuggestions.goals && aiSuggestions.goals.map((suggestion: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{suggestion.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                      suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                      {suggestion.priority}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Target: </span>
                      ₹{suggestion.target_amount?.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Monthly: </span>
                      ₹{suggestion.monthly_allocation?.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Timeline: </span>
                      {suggestion.months_to_achieve} months
                    </div>
                    <div>
                      <span className="font-medium">Target Date: </span>
                      {suggestion.completion_date}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNewGoal({
                        name: suggestion.name,
                        targetAmount: suggestion.target_amount,
                        targetDate: suggestion.completion_date,
                        category: suggestion.type === 'emergency_fund' ? 'Emergency' : 'Savings',
                        priority: suggestion.priority,
                        description: `AI suggested goal: ${suggestion.name}`,
                        monthlyContribution: suggestion.monthly_allocation
                      });
                      setShowAIAssistant(false);
                      setShowAddForm(true);
                    }}
                    className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700 transition-colors"
                  >
                    Use This Goal
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <Lightbulb className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">AI Insights</h4>
                  <p className="text-sm text-blue-800">
                    Based on your spending patterns, you need ₹{aiSuggestions.total_monthly_savings_needed?.toLocaleString()}
                    per month to achieve all suggested goals. Consider prioritizing high-priority goals first.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Goals;