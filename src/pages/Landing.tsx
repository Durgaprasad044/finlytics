"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Receipt,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
  Menu,
  X,
  ChevronDown,
  Star,
  Users,
  Award,
  Globe,
  Smartphone,
  Laptop,
  Tablet
} from 'lucide-react';
import Logo from '../components/Logo';

const Landing: React.FC = () => {
  /* const [isDark, setIsDark] = useState(false); Removed for no-toggle requirement */
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  /* const [activeSection, setActiveSection] = useState('home'); Removed as unused */
  const [isScrolled, setIsScrolled] = useState(false);
  const isDark = false; // Forced to false

  // Theme toggle effect removed

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: MessageCircle,
      title: 'Conversational Interface',
      description: 'Chat with your finances using natural language powered by AI'
    },
    {
      icon: Receipt,
      title: 'Smart Receipt Processing',
      description: 'Upload receipts and let AI automatically categorize and log expenses'
    },
    {
      icon: TrendingUp,
      title: 'Intelligent Analytics',
      description: 'Get insights into spending patterns and anomaly detection'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Bank-level security with Firebase and Google Cloud infrastructure'
    }
  ];

  const benefits = [
    'Ask questions like "What did I spend on food last month?"',
    'Upload receipts for instant expense logging',
    'Get personalized budget recommendations',
    'Detect unusual spending patterns automatically',
    'Set and track financial goals with AI guidance',
    'Multi-language support for global users'
  ];

  const stats = [
    { number: '50K+', label: 'Active Users', icon: Users },
    { number: '99.9%', label: 'Uptime', icon: Award },
    { number: '150+', label: 'Countries', icon: Globe },
    { number: '4.9★', label: 'Rating', icon: Star }
  ];

  const platforms = [
    { name: 'Web App', icon: Laptop, description: 'Full-featured web application' },
    { name: 'Mobile App', icon: Smartphone, description: 'iOS & Android apps' },
    { name: 'Tablet', icon: Tablet, description: 'Optimized for tablets' }
  ];

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${isDark
      ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
      : 'bg-gradient-to-br from-primary-50 via-white to-secondary-50 text-gray-900'
      }`}>
      {/* Header */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-lg ${isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-xl'
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm'
          }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Logo size="md" />
          </motion.div>



          {/* Right Side - Theme Toggle & CTA */}
          <motion.div
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Theme Toggle Removed */}

            {/* CTA Button */}
            <Link
              href="/login"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-105"
            >
              Get Started
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >

            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className={`text-5xl md:text-6xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'
              }`}>
              Your Financial Future
              <span className="text-primary-600 block">Reimagined</span>
            </h1>
            <p className={`text-xl mb-8 max-w-3xl mx-auto leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
              Experience the next generation of personal finance with Finlytics.
              AI-powered insights, smart automation, and intelligent financial planning—all in one beautiful platform.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link
              href="/login"
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center group shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Your Financial Journey
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
            <button className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 hover:border-primary-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:shadow-lg transform hover:scale-105">
              Watch Demo
            </button>
          </motion.div>

          {/* Floating Elements Animation */}
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Floating circles */}
            <motion.div
              className={`absolute top-20 left-10 w-20 h-20 rounded-full opacity-20 ${isDark ? 'bg-primary-400' : 'bg-primary-200'
                }`}
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className={`absolute top-40 right-20 w-16 h-16 rounded-full opacity-20 ${isDark ? 'bg-secondary-400' : 'bg-secondary-200'
                }`}
              animate={{
                y: [0, 15, 0],
                x: [0, -15, 0],
                scale: [1, 0.9, 1],
                rotate: [0, -180, -360],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
            <motion.div
              className={`absolute bottom-40 left-20 w-12 h-12 rounded-full opacity-30 ${isDark ? 'bg-primary-500' : 'bg-primary-300'
                }`}
              animate={{
                y: [0, -10, 0],
                x: [0, 5, 0],
                scale: [1, 1.2, 1],
                rotate: [0, 90, 180],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
            <motion.div
              className={`absolute top-60 right-40 w-8 h-8 rounded-full opacity-25 ${isDark ? 'bg-secondary-500' : 'bg-secondary-300'
                }`}
              animate={{
                y: [0, 20, 0],
                x: [0, -10, 0],
                scale: [1, 0.8, 1],
                rotate: [0, -90, -180],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 3
              }}
            />
            <motion.div
              className={`absolute bottom-20 right-10 w-16 h-16 rounded-full opacity-20 ${isDark ? 'bg-primary-300' : 'bg-primary-100'
                }`}
              animate={{
                y: [0, -15, 0],
                x: [0, 8, 0],
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 4
              }}
            />

            {/* Additional floating elements for more visual interest */}
            <motion.div
              className={`absolute top-80 left-1/4 w-6 h-6 rounded-full opacity-15 ${isDark ? 'bg-yellow-400' : 'bg-yellow-300'
                }`}
              animate={{
                y: [0, -15, 0],
                x: [0, 8, 0],
                scale: [1, 1.3, 1],
                rotate: [0, 90, 180],
              }}
              transition={{
                duration: 13,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 5
              }}
            />
            <motion.div
              className={`absolute bottom-60 right-1/3 w-10 h-10 rounded-full opacity-20 ${isDark ? 'bg-green-400' : 'bg-green-300'
                }`}
              animate={{
                y: [0, 12, 0],
                x: [0, -6, 0],
                scale: [1, 0.8, 1],
                rotate: [0, -180, -360],
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 6
              }}
            />
          </motion.div>

          {/* Demo Chat Preview */}
          <motion.div
            className="max-w-2xl mx-auto bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            whileHover={{
              y: -5,
              transition: { duration: 0.3 }
            }}
          >
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center space-x-3">
              <motion.div
                whileHover={{
                  rotate: 360,
                  transition: { duration: 0.5 }
                }}
              >
                <Logo size="sm" showText={false} className="text-white" />
              </motion.div>
              <span className="text-white font-semibold text-lg">Finlytics Assistant</span>
            </div>
            <div className="p-6 space-y-4">
              <motion.div
                className="flex justify-end"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 px-4 py-3 rounded-2xl max-w-xs shadow-md">
                  What did I spend on food last month?
                </div>
              </motion.div>
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 px-4 py-3 rounded-2xl max-w-xs shadow-md">
                  You spent ₹4,250 on food last month. That's 15% less than the previous month!
                  Your biggest expense was ₹850 at Fresh Market on Jan 15th.
                </div>
              </motion.div>
              <motion.div
                className="flex justify-end"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                <div className="bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 px-4 py-3 rounded-2xl max-w-xs shadow-md">
                  Any unusual expenses this week?
                </div>
              </motion.div>
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 px-4 py-3 rounded-2xl max-w-xs shadow-md">
                  I noticed a ₹2,100 expense at Electronics Store on Tuesday.
                  This is 3x higher than your usual electronics spending. Would you like me to categorize it?
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          className="max-w-4xl mx-auto mt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isDark ? 'bg-gray-700 text-primary-400' : 'bg-primary-100 text-primary-600'
                  }`}>
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                  {stat.number}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className={`px-6 py-20 transition-colors duration-500 ${isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'
              }`}>
              Powered by Google Cloud AI
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
              Advanced AI capabilities that understand your financial behavior and provide intelligent insights
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className={`text-center p-8 rounded-2xl border transition-all duration-500 transform hover:scale-105 group ${isDark
                  ? 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border-gray-600 hover:border-primary-500 hover:shadow-2xl'
                  : 'bg-gradient-to-br from-white to-gray-50 hover:from-white hover:to-primary-50 border-gray-100 hover:border-primary-200 hover:shadow-xl'
                  }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div
                  className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-primary-200 group-hover:to-primary-300 transition-all duration-300 shadow-lg"
                  whileHover={{
                    rotate: 360,
                    scale: 1.1,
                    transition: { duration: 0.5 }
                  }}
                >
                  <feature.icon className="h-10 w-10 text-primary-600 group-hover:text-primary-700 transition-colors duration-300" />
                </motion.div>
                <h3 className={`text-xl font-bold mb-3 transition-colors duration-300 ${isDark
                  ? 'text-white group-hover:text-primary-400'
                  : 'text-gray-900 group-hover:text-primary-700'
                  }`}>
                  {feature.title}
                </h3>
                <p className={`leading-relaxed transition-colors duration-300 ${isDark
                  ? 'text-gray-300 group-hover:text-gray-200'
                  : 'text-gray-600 group-hover:text-gray-700'
                  }`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className={`px-6 py-20 transition-colors duration-500 ${isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className={`text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'
                }`}>
                What You Can Do
              </h2>
              <p className={`text-xl mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                Experience the future of personal finance management with AI-powered conversations
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300 group ${isDark
                      ? 'hover:bg-gray-800 hover:shadow-lg'
                      : 'hover:bg-white hover:shadow-md'
                      }`}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{
                      x: 10,
                      transition: { duration: 0.3 }
                    }}
                  >
                    <motion.div
                      whileHover={{
                        scale: 1.2,
                        rotate: 5,
                        transition: { duration: 0.2 }
                      }}
                    >
                      <CheckCircle className="h-6 w-6 text-success-500 flex-shrink-0 mt-0.5 group-hover:text-success-600 transition-colors duration-300" />
                    </motion.div>
                    <span className={`transition-colors duration-300 font-medium ${isDark
                      ? 'text-gray-300 group-hover:text-white'
                      : 'text-gray-700 group-hover:text-gray-900'
                      }`}>
                      {benefit}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <motion.div
                className={`rounded-3xl shadow-2xl p-8 border transition-colors duration-500 ${isDark
                  ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600'
                  : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'
                  }`}
                whileHover={{
                  y: -5,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <motion.div
                    className="p-2 bg-gradient-to-r from-warning-400 to-warning-500 rounded-xl"
                    whileHover={{
                      rotate: 360,
                      transition: { duration: 0.5 }
                    }}
                  >
                    <Zap className="h-6 w-6 text-white" />
                  </motion.div>
                  <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    AI Insights
                  </span>
                </div>
                <div className="space-y-4">
                  <motion.div
                    className="bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300"
                    whileHover={{
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <p className="text-success-800 font-semibold text-lg">Great news!</p>
                    <p className="text-success-700">You're 23% under budget this month. Consider moving ₹2,000 to your emergency fund.</p>
                  </motion.div>
                  <motion.div
                    className="bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300"
                    whileHover={{
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <p className="text-warning-800 font-semibold text-lg">Spending Alert</p>
                    <p className="text-warning-700">Your dining out expenses are 40% higher than usual. Would you like to set a reminder?</p>
                  </motion.div>
                  <motion.div
                    className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300"
                    whileHover={{
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <p className="text-primary-800 font-semibold text-lg">Goal Update</p>
                    <p className="text-primary-700">You're 65% towards your vacation goal! At this rate, you'll reach it 2 weeks early.</p>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className={`px-6 py-20 transition-colors duration-500 ${isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'
              }`}>
              Available on All Platforms
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
              Access Finlytics from anywhere - web, mobile, or tablet. Your financial data syncs seamlessly across all devices.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                className={`text-center p-8 rounded-2xl border transition-all duration-500 transform hover:scale-105 group ${isDark
                  ? 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border-gray-600 hover:border-primary-500 hover:shadow-2xl'
                  : 'bg-gradient-to-br from-white to-gray-50 hover:from-white hover:to-primary-50 border-gray-100 hover:border-primary-200 hover:shadow-xl'
                  }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div
                  className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${isDark
                    ? 'bg-gray-600 group-hover:bg-gray-500'
                    : 'bg-primary-100 group-hover:bg-primary-200'
                    }`}
                  whileHover={{
                    rotate: 360,
                    scale: 1.1,
                    transition: { duration: 0.5 }
                  }}
                >
                  <platform.icon className={`h-10 w-10 transition-colors duration-300 ${isDark ? 'text-primary-400' : 'text-primary-600'
                    }`} />
                </motion.div>
                <h3 className={`text-xl font-bold mb-3 transition-colors duration-300 ${isDark
                  ? 'text-white group-hover:text-primary-400'
                  : 'text-gray-900 group-hover:text-primary-700'
                  }`}>
                  {platform.name}
                </h3>
                <p className={`transition-colors duration-300 ${isDark
                  ? 'text-gray-300 group-hover:text-gray-200'
                  : 'text-gray-600 group-hover:text-gray-700'
                  }`}>
                  {platform.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Financial Life?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of users who are already chatting with their money and making smarter financial decisions.
            </p>
            <Link
              href="/login"
              className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-flex items-center group"
            >
              Start Your Financial Journey
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>



      {/* Scroll to Top Button */}
      <AnimatePresence>
        {isScrolled && (
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed bottom-8 right-8 z-40 p-3 rounded-full shadow-lg transition-all duration-200 ${isDark
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronDown className="h-5 w-5 rotate-180" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;