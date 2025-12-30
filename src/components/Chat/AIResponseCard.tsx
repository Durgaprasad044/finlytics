/**
 * Enhanced AI Response Card Component
 * Displays rich content from AI agents
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, DollarSign } from 'lucide-react';

interface AIResponseCardProps {
  type: 'budget' | 'coaching' | 'anomaly' | 'expense';
  data: any;
}

const AIResponseCard: React.FC<AIResponseCardProps> = ({ type, data }) => {
  const renderBudgetCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mt-2"
    >
      <div className="flex items-center mb-3">
        <Target className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="font-semibold text-blue-900">Budget Plan</h3>
      </div>
      
      {data.budget_allocation && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          {Object.entries(data.budget_allocation).map(([category, amount]: [string, any]) => (
            <div key={category} className="bg-white rounded p-2">
              <div className="text-xs text-gray-600 capitalize">{category}</div>
              <div className="font-semibold text-gray-900">₹{amount.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
      
      {data.recommendations && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-800">Recommendations:</h4>
          {data.recommendations.slice(0, 3).map((rec: string, index: number) => (
            <div key={index} className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{rec}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderCoachingCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mt-2"
    >
      <div className="flex items-center mb-3">
        <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
        <h3 className="font-semibold text-green-900">Spending Insights</h3>
      </div>
      
      {data.insights && (
        <div className="space-y-3">
          {data.insights.slice(0, 3).map((insight: any, index: number) => (
            <div key={index} className="bg-white rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{insight.category}</span>
                <span className={`text-sm ${insight.trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                  {insight.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </span>
              </div>
              <div className="text-xs text-gray-600">{insight.message}</div>
            </div>
          ))}
        </div>
      )}
      
      {data.tips && (
        <div className="mt-3 space-y-2">
          <h4 className="text-sm font-medium text-green-800">Coaching Tips:</h4>
          {data.tips.slice(0, 2).map((tip: string, index: number) => (
            <div key={index} className="flex items-start">
              <Target className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{tip}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderAnomalyCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 mt-2"
    >
      <div className="flex items-center mb-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
        <h3 className="font-semibold text-yellow-900">Anomaly Detection</h3>
      </div>
      
      {data.anomalies && data.anomalies.length > 0 ? (
        <div className="space-y-2">
          {data.anomalies.slice(0, 3).map((anomaly: any, index: number) => (
            <div key={index} className="bg-white rounded p-3 border-l-4 border-yellow-400">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{anomaly.description}</span>
                <span className="text-sm text-yellow-600">₹{anomaly.amount?.toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-600">{anomaly.reason}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center text-green-700">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">No unusual spending patterns detected</span>
        </div>
      )}
    </motion.div>
  );

  const renderExpenseCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mt-2"
    >
      <div className="flex items-center mb-3">
        <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
        <h3 className="font-semibold text-purple-900">Expense Analysis</h3>
      </div>
      
      {data.summary && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white rounded p-2">
            <div className="text-xs text-gray-600">Total Spent</div>
            <div className="font-semibold text-gray-900">₹{data.summary.total?.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded p-2">
            <div className="text-xs text-gray-600">Transactions</div>
            <div className="font-semibold text-gray-900">{data.summary.count}</div>
          </div>
        </div>
      )}
      
      {data.categories && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-purple-800">Top Categories:</h4>
          {Object.entries(data.categories).slice(0, 3).map(([category, amount]: [string, any]) => (
            <div key={category} className="flex justify-between items-center bg-white rounded p-2">
              <span className="text-sm text-gray-700 capitalize">{category}</span>
              <span className="text-sm font-medium text-gray-900">₹{amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  switch (type) {
    case 'budget':
      return renderBudgetCard();
    case 'coaching':
      return renderCoachingCard();
    case 'anomaly':
      return renderAnomalyCard();
    case 'expense':
      return renderExpenseCard();
    default:
      return null;
  }
};

export default AIResponseCard;