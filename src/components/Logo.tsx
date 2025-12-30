import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', showText = true }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <motion.div 
      className={`flex items-center space-x-2 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo Icon */}
      <motion.div
        className={`${sizeClasses[size]} bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg`}
        whileHover={{ 
          rotate: 5,
          scale: 1.05,
          transition: { duration: 0.2 }
        }}
      >
        {/* Financial Chart Icon */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-3/4 h-3/4 text-white"
        >
          {/* Chart bars */}
          <rect x="3" y="16" width="2" height="4" fill="currentColor" opacity="0.8" />
          <rect x="6" y="12" width="2" height="8" fill="currentColor" opacity="0.9" />
          <rect x="9" y="8" width="2" height="12" fill="currentColor" />
          <rect x="12" y="6" width="2" height="14" fill="currentColor" />
          <rect x="15" y="10" width="2" height="10" fill="currentColor" opacity="0.9" />
          <rect x="18" y="14" width="2" height="6" fill="currentColor" opacity="0.8" />
          
          {/* Trend line */}
          <path 
            d="M3 16 L6 12 L9 8 L12 6 L15 10 L18 14" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            opacity="0.3"
          />
          
          {/* Sparkle effect */}
          <circle cx="12" cy="6" r="0.5" fill="currentColor" opacity="0.6" />
        </svg>
      </motion.div>
      
      {/* Logo Text */}
      {showText && (
        <motion.span 
          className={`font-bold text-gray-900 dark:text-white ${textSizes[size]}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Finlytics
        </motion.span>
      )}
    </motion.div>
  );
};

export default Logo;
