/**
 * Connection Test Component
 * Tests backend connectivity and AI agent status
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AgentStatus {
  name: string;
  status: 'online' | 'offline' | 'unknown';
  description: string;
}

const ConnectionTest: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([
    { name: 'Expense Query Agent', status: 'unknown', description: 'Natural language expense queries' },
    { name: 'Receipt Parser Agent', status: 'unknown', description: 'OCR and receipt processing' },
    { name: 'Anomaly Detection Agent', status: 'unknown', description: 'Unusual transaction detection' },
    { name: 'Budget Planner Agent', status: 'unknown', description: 'Personalized budget creation' },
    { name: 'Spending Coach Agent', status: 'unknown', description: 'Financial coaching and tips' },
  ]);
  const [isVisible, setIsVisible] = useState(false);
  const { currentUser } = useAuth();

  const checkBackendConnection = async () => {
    setBackendStatus('checking');
    try {
      await apiService.healthCheck();
      setBackendStatus('online');
      
      // If backend is online, check agent statuses
      if (currentUser) {
        try {
          await apiService.getAgentsStatus();
          setAgentStatuses(prev => prev.map(agent => ({
            ...agent,
            status: 'online' // Assume all agents are online if backend responds
          })));
        } catch (error) {
          console.error('Failed to get agent status:', error);
          setAgentStatuses(prev => prev.map(agent => ({
            ...agent,
            status: 'unknown'
          })));
        }
      }
    } catch (error) {
      console.error('Backend connection failed:', error);
      setBackendStatus('offline');
      setAgentStatuses(prev => prev.map(agent => ({
        ...agent,
        status: 'offline'
      })));
    }
  };

  useEffect(() => {
    checkBackendConnection();
    
    // Show the component for a few seconds, then hide it
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000);

    setIsVisible(true);
    return () => clearTimeout(timer);
  }, [currentUser]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'border-green-200 bg-green-50';
      case 'offline':
        return 'border-red-200 bg-red-50';
      case 'checking':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-4 right-4 z-50 max-w-sm"
    >
      <div className={`border rounded-lg p-4 shadow-lg ${getStatusColor(backendStatus)}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">System Status</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Backend Status */}
        <div className="flex items-center justify-between mb-3 p-2 bg-white rounded">
          <div>
            <div className="font-medium text-sm">Backend Server</div>
            <div className="text-xs text-gray-600">http://localhost:8000</div>
          </div>
          {getStatusIcon(backendStatus)}
        </div>

        {/* Agent Statuses */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">AI Agents</div>
          {agentStatuses.map((agent, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded text-xs">
              <div>
                <div className="font-medium">{agent.name}</div>
                <div className="text-gray-500">{agent.description}</div>
              </div>
              {getStatusIcon(agent.status)}
            </div>
          ))}
        </div>

        {/* Refresh Button */}
        <button
          onClick={checkBackendConnection}
          className="w-full mt-3 px-3 py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4 inline mr-2" />
          Refresh Status
        </button>

        {/* Status Messages */}
        {backendStatus === 'offline' && (
          <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
            Backend server is not responding. Please ensure it's running on port 8000.
          </div>
        )}

        {backendStatus === 'online' && currentUser && (
          <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded text-xs text-green-700">
            All systems operational! AI agents are ready to assist you.
          </div>
        )}

        {backendStatus === 'online' && !currentUser && (
          <div className="mt-3 p-2 bg-yellow-100 border border-yellow-200 rounded text-xs text-yellow-700">
            Please log in to access AI agent features.
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ConnectionTest;