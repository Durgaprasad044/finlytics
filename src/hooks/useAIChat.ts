/**
 * Custom hook for AI Chat functionality
 * Integrates with backend AI agents
 */

import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { useFinance } from '../contexts/FinanceContext';
import toast from 'react-hot-toast';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'receipt' | 'chart' | 'budget' | 'coaching';
  data?: any; // Additional data for specific message types
}

export const useAIChat = () => {
  const { addTransaction } = useFinance();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hi! I'm IRIS, your Finlytics assistant. I can help you manage your finances, analyze spending, and provide insights. What would you like to know?",
      sender: 'assistant',
      timestamp: new Date(),
    }
  ]);
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine which AI agent to use based on user input
  const determineAgentType = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('receipt') || lowerInput.includes('upload') || lowerInput.includes('scan')) {
      return 'receipt';
    }
    
    if (lowerInput.includes('budget') || lowerInput.includes('plan') || lowerInput.includes('allocat')) {
      return 'budget';
    }
    
    if (lowerInput.includes('coach') || lowerInput.includes('advice') || lowerInput.includes('tip') || 
        lowerInput.includes('improve') || lowerInput.includes('save more')) {
      return 'coaching';
    }
    
    if (lowerInput.includes('anomal') || lowerInput.includes('unusual') || lowerInput.includes('strange') ||
        lowerInput.includes('detect') || lowerInput.includes('suspicious')) {
      return 'anomaly';
    }
    
    // Default to expense query for most questions
    return 'expense';
  };

  const addMessage = useCallback((message: Omit<ChatMessage, 'id'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  // Simple offline response generator
  const generateOfflineResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return "Hello! I'm IRIS, your Finlytics assistant. I'm currently in offline mode, but I can still help you with basic financial guidance. What would you like to know?";
    }
    
    if (input.includes('spend') || input.includes('expense')) {
      return "I can help you track and analyze your spending! To get detailed insights, I'd need access to your transaction data. In the meantime, here are some tips: categorize your expenses, set spending limits for each category, and review your spending weekly.";
    }
    
    if (input.includes('budget')) {
      return "Creating a budget is essential for financial health! A good starting point is the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. Would you like me to help you create a personalized budget plan?";
    }
    
    if (input.includes('save') || input.includes('saving')) {
      return "Great question about saving! Here are some effective strategies: automate your savings, start with small amounts, cut unnecessary subscriptions, cook at home more often, and set specific savings goals. What's your current savings goal?";
    }
    
    if (input.includes('debt')) {
      return "Managing debt is crucial for financial freedom. Consider the debt snowball method (pay minimums on all debts, then focus extra payments on the smallest debt) or debt avalanche method (focus on highest interest rate first). Would you like specific advice for your situation?";
    }
    
    return "I'm here to help with your finances! I can provide guidance on budgeting, saving, expense tracking, debt management, and financial planning. What specific area would you like to explore?";
  };

  const processUserMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim()) return;

    // Add user message
    addMessage({
      content: userInput,
      sender: 'user',
      timestamp: new Date(),
    });

    setIsProcessing(true);

    try {
      const agentType = determineAgentType(userInput);
      let response: any;
      let responseContent: string;
      let messageType: ChatMessage['type'] = 'text';
      let additionalData: any = null;

      switch (agentType) {
        case 'expense':
          response = await apiService.processExpenseQuery(userInput);
          responseContent = response.response?.text_response || response.response || response.answer || 'I processed your expense query.';
          if (response.data_result) {
            additionalData = response.data_result;
          }
          break;

        case 'budget':
          response = await apiService.createBudgetPlan();
          responseContent = response.explanation || 'I\'ve created a personalized budget plan for you.';
          messageType = 'budget';
          additionalData = response;
          break;

        case 'coaching':
          response = await apiService.getSpendingCoaching();
          responseContent = response.coaching_summary || response.insights || 'Here are your personalized spending insights.';
          messageType = 'coaching';
          additionalData = response;
          break;

        case 'anomaly':
          // Get recent transactions for anomaly detection
          const transactionsResponse = await apiService.getTransactions(50);
          const transactions = transactionsResponse.transactions || [];
          
          response = await apiService.detectAnomalies(transactions);
          responseContent = response.summary || 'I\'ve analyzed your transactions for unusual patterns.';
          additionalData = response;
          break;

        default:
          response = await apiService.processExpenseQuery(userInput);
          responseContent = response.response?.text_response || response.response || response.answer || 'I\'m here to help with your finances.';
      }

      // Ensure we have a valid response content
      if (!responseContent || responseContent.trim() === '') {
        responseContent = "I understand your question about finances. Let me help you with that. Could you please provide more specific details about what you'd like to know?";
      }

      // Add AI response
      addMessage({
        content: responseContent,
        sender: 'assistant',
        timestamp: new Date(),
        type: messageType,
        data: additionalData,
      });

    } catch (error) {
      console.error('AI processing error:', error);
      
      // Use offline response generator for better user experience
      const fallbackResponse = generateOfflineResponse(userInput);
      
      // Add helpful fallback message instead of error
      addMessage({
        content: fallbackResponse,
        sender: 'assistant',
        timestamp: new Date(),
      });
      
      // Only show error toast, not error message in chat
      toast.error('Connection issue - using offline mode');
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage]);

  const processReceiptUpload = useCallback(async (file: File) => {
    if (!file) return;

    // Add user message for receipt upload
    addMessage({
      content: `📄 Receipt uploaded: ${file.name}`,
      sender: 'user',
      timestamp: new Date(),
      type: 'receipt',
    });

    setIsProcessing(true);

    try {
      const response = await apiService.parseReceipt(file);
      
      if (response.success && response.parsed_data) {
        const parsedData = response.parsed_data;
        const responseContent = `✅ Receipt processed successfully!\n\n` +
          `💰 Amount: ₹${parsedData.total || 'N/A'}\n` +
          `🏪 Vendor: ${parsedData.vendor || 'Unknown'}\n` +
          `📅 Date: ${parsedData.date || 'Today'}\n` +
          `🏷️ Category: ${parsedData.category || 'Uncategorized'}\n\n` +
          `The transaction has been automatically added to your expenses.`;

        addMessage({
          content: responseContent,
          sender: 'assistant',
          timestamp: new Date(),
          type: 'receipt',
          data: parsedData,
        });

        // Add transaction to local state
        await addTransaction({
          amount: parsedData.total || 0,
          category: parsedData.category || 'Uncategorized',
          description: `Receipt from ${parsedData.vendor || 'Unknown'}`,
          date: parsedData.date ? new Date(parsedData.date) : new Date(),
          type: 'expense',
        });

        toast.success('Receipt processed and transaction added!');
      } else {
        throw new Error(response.error || 'Failed to process receipt');
      }

    } catch (error) {
      console.error('Receipt processing error:', error);
      
      addMessage({
        content: `❌ Sorry, I couldn't process your receipt: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure the image is clear and try again.`,
        sender: 'assistant',
        timestamp: new Date(),
      });
      
      toast.error('Failed to process receipt');
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage, addTransaction]);

  const clearChat = useCallback(() => {
    setMessages([{
      id: '1',
      content: "Hi! I'm your Finlytics assistant. How can I help you today?",
      sender: 'assistant',
      timestamp: new Date(),
    }]);
  }, []);

  return {
    messages,
    isProcessing,
    processUserMessage,
    processReceiptUpload,
    addMessage,
    clearChat,
  };
};

export default useAIChat;