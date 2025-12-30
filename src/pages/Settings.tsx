"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe,
  DollarSign,
  Save,
  Lock,
  Trash2,
  Brain,
  Activity,
  Database,
  RefreshCw,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useProfile } from '../contexts/ProfileContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { monthlySalary, setMonthlySalary, setDeletePassword, clearAllData } = useFinance();
  const { settings: notificationSettings, updateSettings } = useNotifications();
  const { profileData, updateProfile, saveProfile, isLoading } = useProfile();
  const [salaryInput, setSalaryInput] = useState(monthlySalary > 0 ? monthlySalary.toString() : '');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('general');

  // AI and Backend Status
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [agentStatus, setAgentStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [lastStatusCheck, setLastStatusCheck] = useState<Date | null>(null);

  // Additional settings states
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginAlerts: true
  });
  const [languageSettings, setLanguageSettings] = useState({
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'indian'
  });

  const handleSalarySave = () => {
    const newSalary = parseFloat(salaryInput);
    if (isNaN(newSalary) || newSalary < 0) {
      toast.error('Please enter a valid salary amount');
      return;
    }
    setMonthlySalary(newSalary);
    toast.success('Monthly salary updated successfully!');
  };

  const handlePasswordSave = () => {
    if (!passwordInput.trim()) {
      toast.error('Please enter a password');
      return;
    }
    if (passwordInput !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordInput.length < 4) {
      toast.error('Password must be at least 4 characters long');
      return;
    }
    setDeletePassword(passwordInput);
    setPasswordInput('');
    setConfirmPassword('');
  };

  const handleClearAllData = () => {
    clearAllData();
    setShowClearConfirm(false);
  };

  // Check backend and AI agent status
  const checkSystemStatus = async () => {
    setLoadingStatus(true);
    try {
      // Check backend health
      const healthResponse = await apiService.healthCheck();
      setBackendStatus(healthResponse);

      // Check AI agents status
      const agentsResponse = await apiService.getAgentsStatus();
      setAgentStatus(agentsResponse);

      setLastStatusCheck(new Date());
      toast.success('System status updated');
    } catch (error) {
      console.error('Status check failed:', error);
      setBackendStatus({ status: 'error', error: 'Backend unreachable' });
      setAgentStatus({ error: 'Unable to check agent status' });
      toast.error('Failed to check system status');
    } finally {
      setLoadingStatus(false);
    }
  };

  // Update salary input when monthlySalary changes (e.g., when data loads from localStorage)
  useEffect(() => {
    setSalaryInput(monthlySalary > 0 ? monthlySalary.toString() : '');
  }, [monthlySalary]);

  // Tab configuration
  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'system', label: 'System', icon: Activity }
  ];

  // Handler functions for additional settings
  const handleProfileSave = async () => {
    try {
      await saveProfile();
    } catch (error) {
      // Error is already handled in saveProfile
    }
  };

  const handleNotificationToggle = (key: string) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key as keyof typeof notificationSettings]
    };
    updateSettings(newSettings);
    toast.success('Notification settings updated!');
  };

  const handleSecurityToggle = (key: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
    toast.success('Security settings updated!');
  };

  const handleLanguageChange = (key: string, value: string) => {
    setLanguageSettings(prev => ({
      ...prev,
      [key]: value
    }));
    toast.success('Language settings updated!');
  };

  // Check status on component mount
  useEffect(() => {
    checkSystemStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 mt-1 dark:text-white">Manage your account and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="floating-card">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-white'
                  }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <>
          {/* Monthly Salary Setting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="floating-card"
          >
            <div className="flex items-center mb-4 ">
              <DollarSign className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Salary</h2>
            </div>
            <p className="text-gray-600 mb-4 dark:text-white">
              Set your monthly salary to enable automatic salary crediting on the 2nd of each month.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                  Monthly Salary (₹)
                </label>
                <input
                  type="number"
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  className="w-full px-4 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your monthly salary"
                />
              </div>
              <button
                onClick={handleSalarySave}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </button>
            </div>
            {monthlySalary === 0 && (
              <p className="text-warning-600 text-sm mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                ⚠️ Set your monthly salary to enable automatic salary crediting on the 2nd of each month.
              </p>
            )}
          </motion.div>

          {/* Delete Password Setting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="floating-card"
          >
            <div className="flex items-center mb-4">
              <Lock className="h-6 w-6 text-warning-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Protection</h2>
            </div>
            <p className="text-gray-600 mb-4 dark:text-white">
              Set a password to protect your transactions from accidental deletion.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full w-full px-4 py-2 dark:bg-[#0F1117] text-white placeholder-gray-400 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter delete password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border w-full px-4 py-2 dark:bg-[#0F1117] text-white placeholder-gray-400 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Confirm delete password"
                />
              </div>
              <button
                onClick={handlePasswordSave}
                className="bg-warning-600 text-white px-4 py-2 rounded-lg hover:bg-warning-700 transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Set Password
              </button>
            </div>
          </motion.div>

          {/* Clear All Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="floating-card"
          >
            <div className="flex items-center mb-4">
              <Trash2 className="h-6 w-6 text-danger-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Clear All Data</h2>
            </div>
            <p className="text-gray-600 mb-4">
              This will permanently delete all your transactions, budgets, and goals. This action cannot be undone.
            </p>
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="bg-danger-600 text-white px-4 py-2 rounded-lg hover:bg-danger-700 transition-colors flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-danger-600 font-medium">Are you sure? This action cannot be undone!</p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleClearAllData}
                    className="bg-danger-600 text-white px-4 py-2 rounded-lg hover:bg-danger-700 transition-colors"
                  >
                    Yes, Clear All Data
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}

      {activeTab === 'system' && (
        <>
          {/* AI System Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="floating-card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Brain className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI System Status</h2>
              </div>
              <button
                onClick={checkSystemStatus}
                disabled={loadingStatus}
                className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors flex items-center text-sm "
              >
                {loadingStatus ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </button>
            </div>

            {/* Backend Status */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center dark:text-white">
                <Database className="h-4 w-4 mr-2" />
                Backend Server
              </h3>
              <div className="flex items-center space-x-3">
                {backendStatus ? (
                  <>
                    <div className={`w-3 h-3 rounded-full ${backendStatus.status === 'healthy' ? 'bg-green-500' :
                      backendStatus.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                    <span className={`text-sm font-medium ${backendStatus.status === 'healthy' ? 'text-green-700' :
                      backendStatus.status === 'error' ? 'text-red-700' : 'text-yellow-700'
                      }`}>
                      {backendStatus.status === 'healthy' ? 'Online' :
                        backendStatus.status === 'error' ? 'Offline' : 'Unknown'}
                    </span>
                    {backendStatus.timestamp && (
                      <span className="text-xs text-gray-500">
                        Last checked: {new Date(backendStatus.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-gray-500">Checking...</span>
                )}
              </div>
            </div>

            {/* AI Agents Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center dark:text-white">
                <Zap className="h-4 w-4 mr-2" />
                AI Agents ({agentStatus?.operational_agents || 0}/{agentStatus?.total_agents || 5})
              </h3>

              {agentStatus && !agentStatus.error ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(agentStatus).map(([agentName, status]) => {
                    if (['operational_agents', 'total_agents', 'timestamp'].includes(agentName)) return null;

                    return (
                      <div key={agentName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${status === 'operational' ? 'bg-green-500' :
                            status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {agentName.replace('_', ' ')} Agent
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${status === 'operational' ? 'bg-green-100 text-green-700' :
                          status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {String(status)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {agentStatus?.error || 'Unable to check agent status'}
                  </p>
                </div>
              )}
            </div>

            {lastStatusCheck && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Last updated: {lastStatusCheck.toLocaleString()}
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}

      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="floating-card"
        >
          <div className="flex items-center mb-4">
            <User className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Settings</h2>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => updateProfile({ email: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                  Currency
                </label>
                <select
                  value={profileData.currency}
                  onChange={(e) => updateProfile({ currency: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                  Timezone
                </label>
                <select
                  value={profileData.timezone}
                  onChange={(e) => updateProfile({ timezone: e.target.value })}
                  className="w-full px-3 py-2 border w-full px-4 py-2 dark:bg-[#0F1117] text-white placeholder-gray-400 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone || ''}
                  onChange={(e) => updateProfile({ phone: e.target.value })}
                  className="w-full px-3 py-2 border w-full px-4 py-2 dark:bg-[#0F1117] text-white placeholder-gray-400 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                  Occupation
                </label>
                <input
                  type="text"
                  value={profileData.occupation || ''}
                  onChange={(e) => updateProfile({ occupation: e.target.value })}
                  className="w-full px-3 py-2 border w-full px-4 py-2 dark:bg-[#0F1117] text-white placeholder-gray-400 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your occupation"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={profileData.dateOfBirth || ''}
                  onChange={(e) => updateProfile({ dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border w-full px-4 py-2 dark:bg-[#0F1117] text-white placeholder-gray-400 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                  Monthly Income (₹)
                </label>
                <input
                  type="number"
                  value={profileData.monthlyIncome || ''}
                  onChange={(e) => updateProfile({ monthlyIncome: parseFloat(e.target.value) || undefined })}
                  className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your monthly income"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                Address
              </label>
              <textarea
                value={profileData.address || ''}
                onChange={(e) => updateProfile({ address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your address"
              />
            </div>
            <button
              onClick={handleProfileSave}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </motion.div>
      )}

      {activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="floating-card"
        >
          <div className="flex items-center mb-4">
            <Bell className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Budget Alerts</h3>
                <p className="text-sm text-gray-500">Get notified when you exceed budget limits</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('budgetAlerts')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSettings.budgetAlerts ? 'bg-green-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.budgetAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Spending Alerts</h3>
                <p className="text-sm text-gray-500">Get alerts for unusual spending patterns</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('spendingAlerts')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSettings.spendingAlerts ? 'bg-green-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.spendingAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Monthly Reports</h3>
                <p className="text-sm text-gray-500">Receive monthly spending summaries</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('monthlyReports')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSettings.monthlyReports ? 'bg-green-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.monthlyReports ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('emailNotifications')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSettings.emailNotifications ? 'bg-green-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Real-time Updates</h3>
                <p className="text-sm text-gray-500">Enable real-time notification monitoring</p>
              </div>
              <button
                onClick={() => handleNotificationToggle('realTimeUpdates')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSettings.realTimeUpdates ? 'bg-green-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.realTimeUpdates ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'security' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="floating-card"
        >
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-red-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <button
                onClick={() => handleSecurityToggle('twoFactorAuth')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${securitySettings.twoFactorAuth ? 'bg-red-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${securitySettings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Timeout (minutes)
              </label>
              <select
                value={securitySettings.sessionTimeout}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border w-full px-4 py-2 dark:bg-[#0F1117] text-white placeholder-gray-400 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Login Alerts</h3>
                <p className="text-sm text-gray-500">Get notified of new login attempts</p>
              </div>
              <button
                onClick={() => handleSecurityToggle('loginAlerts')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${securitySettings.loginAlerts ? 'bg-red-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${securitySettings.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'language' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="floating-card"
        >
          <div className="flex items-center mb-4">
            <Globe className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Language & Region</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                Language
              </label>
              <select
                value={languageSettings.language}
                onChange={(e) => handleLanguageChange('language', e.target.value)}
                className="w-full px-3 py-2 border w-full px-4 py-2 dark:bg-[#0F1117] text-white placeholder-gray-400 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                Date Format
              </label>
              <select
                value={languageSettings.dateFormat}
                onChange={(e) => handleLanguageChange('dateFormat', e.target.value)}
                className="w-full px-3 py-2 w-full px-4 py-2 dark:bg-[#0F1117] text-white placeholder-gray-400 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                Number Format
              </label>
              <select
                value={languageSettings.numberFormat}
                onChange={(e) => handleLanguageChange('numberFormat', e.target.value)}
                className="w-full px-3 py-2 w-full px-4 py-2 dark:bg-[#0F1117] text-white placeholder-gray-400 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="indian">Indian (1,00,000)</option>
                <option value="international">International (100,000)</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Settings;