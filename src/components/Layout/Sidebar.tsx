"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  MessageCircle,
  Receipt,
  PiggyBank,
  Target,
  CreditCard,
  Settings,
  Bot
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'AI Chat', href: '/app/chat', icon: MessageCircle },
  { name: 'Expenses', href: '/app/expenses', icon: CreditCard },
  { name: 'Budget', href: '/app/budget', icon: PiggyBank },
  { name: 'Goals', href: '/app/goals', icon: Target },
  { name: 'Receipts', href: '/app/receipts', icon: Receipt },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  return (
    <div className="bg-white dark:bg-gray-800 w-64 min-h-screen shadow-lg">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <motion.div
          className="flex items-center space-x-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Finlytics</span>
        </motion.div>
      </div>

      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {navigation.map((item, index) => (
            <motion.li
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${(item.href === '/app' ? pathname === item.href : pathname.startsWith(item.href))
                  ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border-r-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            </motion.li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;