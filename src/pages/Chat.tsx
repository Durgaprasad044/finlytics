"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Bot, User, Upload, Brain, Calculator, Target } from 'lucide-react';
import { useAIChat, ChatMessage } from '../hooks/useAIChat';
import AIResponseCard from '../components/Chat/AIResponseCard';
import toast from 'react-hot-toast';

const Chat: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, isProcessing, processUserMessage, processReceiptUpload } = useAIChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const message = inputMessage;
    setInputMessage('');

    await processUserMessage(message);
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Voice recognition failed');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      toast.error('Voice recognition not supported in this browser');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await processReceiptUpload(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      toast.error('Please upload a valid image file');
    }
  };



  // Helper function to get message type icon
  const getMessageTypeIcon = (type?: ChatMessage['type']) => {
    switch (type) {
      case 'receipt':
        return <Upload className="h-4 w-4" />;
      case 'budget':
        return <Calculator className="h-4 w-4" />;
      case 'coaching':
        return <Target className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className=" bg-white dark:bg-[#0F1117] border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <Bot className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">IRIS</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Finlytics Assistant</p>
            </div>
          </div>

          {/* Agent Status Indicators */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Expense Query Agent"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Receipt Parser Agent"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Anomaly Detection Agent"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Budget Planner Agent"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Spending Coach Agent"></div>
              </div>
              <span>All agents online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-xs md:max-w-md ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === 'user' ? 'bg-primary-500' : 'bg-gray-200'
                  }`}>
                  {message.sender === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <div className="text-gray-600">
                      {getMessageTypeIcon(message.type)}
                    </div>
                  )}
                </div>
                <div className={`chat-bubble ${message.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'
                  }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-primary-100' : 'text-gray-500'
                    }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>

                  {/* Enhanced AI Response Cards */}
                  {message.sender === 'assistant' && message.data && message.type && (
                    <AIResponseCard type={message.type as any} data={message.data} />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <Brain className="h-4 w-4 text-gray-600 animate-pulse" />
              </div>
              <div className="chat-bubble chat-bubble-assistant">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">AI agents processing...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>



      {/* Input */}
      <div className="bg-white dark:bg-[#0F1117] border-t border-gray-800 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Upload receipt"
          >
            <Upload className="h-5 w-5" />
          </button>

          <button
            onClick={handleVoiceInput}
            className={`p-2 transition-colors ${isListening ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me about your finances..."
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isProcessing}
            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;