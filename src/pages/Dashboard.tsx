"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  Calendar,
  PieChart,
  BarChart3,
  Plus,
  Receipt
} from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useRouter } from 'next/navigation';

const Dashboard: React.FC = () => {
  const { transactions, budgets, totalBalance, addTransaction } = useFinance();
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate current month data
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const currentMonthTransactions = transactions.filter(t =>
    isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
  );

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  // Recent transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Budget alerts
  const budgetAlerts = budgets.filter(budget => {
    const spent = currentMonthTransactions
      .filter(t => t.category === budget.category && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return spent > budget.limit * 0.8; // Alert when 80% of budget is used
  });

  const stats = [
    {
      title: 'Total Balance',
      value: `₹${totalBalance.toLocaleString()}`,
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: DollarSign,
    },
    {
      title: 'Monthly Income',
      value: `₹${monthlyIncome.toLocaleString()}`,
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
    {
      title: 'Monthly Expenses',
      value: `₹${monthlyExpenses.toLocaleString()}`,
      change: '-3.1%',
      changeType: 'negative' as const,
      icon: TrendingDown,
    },
    {
      title: 'Savings Rate',
      value: `${savingsRate.toFixed(1)}%`,
      change: '+5.4%',
      changeType: 'positive' as const,
      icon: Target,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>

        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </button>
          <button
            onClick={() => router.push('/app/expenses')}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View All Transactions
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="floating-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <span
                    className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-success-600' : 'text-danger-600'
                      }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-gray-500 text-sm ml-1">vs last month</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.changeType === 'positive' ? 'bg-success-100' : 'bg-primary-100'
                }`}>
                <stat.icon className={`h-6 w-6 ${stat.changeType === 'positive' ? 'text-success-600' : 'text-primary-600'
                  }`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {budgetAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-warning-50 border border-warning-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-warning-600 mr-2" />
            <h3 className="text-sm font-medium text-warning-800">Budget Alerts</h3>
          </div>
          <div className="mt-2 space-y-1">
            {budgetAlerts.map((budget) => (
              <p key={budget.id} className="text-sm text-warning-700">
                You've used 80%+ of your {budget.category} budget this month
              </p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2 floating-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
            <button
              onClick={() => router.push('/app/expenses')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All
            </button>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${transaction.type === 'income' ? 'bg-success-100' : 'bg-danger-100'
                      }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-5 w-5 text-success-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-danger-600" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                      }`}>
                      {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(transaction.date), 'MMM dd')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Welcome to your Finance Dashboard!</p>
              <p className="text-gray-400 text-sm mt-1">Start by adding your first transaction or setting up your monthly salary</p>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium block mx-auto"
                >
                  Add your first transaction
                </button>
                <button
                  onClick={() => router.push('/app/settings')}
                  className="text-success-600 hover:text-success-700 text-sm font-medium block mx-auto"
                >
                  Set up monthly salary
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="floating-card"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/app/expenses')}
              className="w-full flex items-center p-3 text-left bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <PieChart className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-sm font-medium text-primary-700">View Expense Breakdown</span>
            </button>
            <button
              onClick={() => router.push('/app/goals')}
              className="w-full flex items-center p-3 text-left bg-success-50 hover:bg-success-100 rounded-lg transition-colors"
            >
              <Target className="h-5 w-5 text-success-600 mr-3" />
              <span className="text-sm font-medium text-success-700">Set New Goal</span>
            </button>
            <button
              onClick={() => router.push('/app/budget')}
              className="w-full flex items-center p-3 text-left bg-warning-50 hover:bg-warning-100 rounded-lg transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-warning-600 mr-3" />
              <span className="text-sm font-medium text-warning-700">Create Budget</span>
            </button>
            <button
              onClick={() => router.push('/app/receipts')}
              className="w-full flex items-center p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <Receipt className="h-5 w-5 text-purple-600 mr-3" />
              <span className="text-sm font-medium text-purple-700">Scan Receipt</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Add Transaction Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Transaction</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              addTransaction({
                amount: Number(formData.get('amount')),
                category: formData.get('category') as string,
                description: formData.get('description') as string,
                date: new Date(formData.get('date') as string),
                type: formData.get('type') as 'income' | 'expense',
              });
              setShowAddForm(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select name="type" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    onClick={() => {
                      router.push('/app/expenses');
                      // Assuming clearSearch is defined elsewhere or should be removed if not applicable
                      // clearSearch(); 
                    }}
                    type="number"
                    name="amount"
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    name="description"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Transaction description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select name="category" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Bills & Utilities">Bills & Utilities</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Travel">Travel</option>
                    <option value="Salary">Salary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;