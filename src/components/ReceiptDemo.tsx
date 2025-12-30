import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Receipt, CheckCircle, DollarSign, Calendar, Tag, Store } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import toast from 'react-hot-toast';

interface DemoReceiptData {
  vendor: string;
  total: number;
  date: string;
  category: string;
  items: Array<{
    name: string;
    price: number;
  }>;
  confidence_score: number;
}

const demoReceipts: DemoReceiptData[] = [
  {
    vendor: "Walmart Supercenter",
    total: 87.45,
    date: "2024-01-15",
    category: "Groceries",
    items: [
      { name: "Milk 2%", price: 4.99 },
      { name: "Bread Whole Wheat", price: 3.49 },
      { name: "Bananas", price: 2.98 },
      { name: "Chicken Breast", price: 12.99 },
      { name: "Rice 5lb", price: 8.99 }
    ],
    confidence_score: 0.95
  },
  {
    vendor: "Starbucks Coffee",
    total: 12.75,
    date: "2024-01-14",
    category: "Coffee Shops",
    items: [
      { name: "Grande Latte", price: 5.85 },
      { name: "Blueberry Muffin", price: 3.95 },
      { name: "Bottled Water", price: 2.95 }
    ],
    confidence_score: 0.88
  },
  {
    vendor: "Shell Gas Station",
    total: 45.20,
    date: "2024-01-13",
    category: "Gas & Fuel",
    items: [
      { name: "Regular Gasoline", price: 42.50 },
      { name: "Car Wash", price: 2.70 }
    ],
    confidence_score: 0.92
  }
];

const ReceiptDemo: React.FC = () => {
  const { addTransaction } = useFinance();
  const [selectedReceipt, setSelectedReceipt] = useState<DemoReceiptData | null>(null);
  const [processedReceipts, setProcessedReceipts] = useState<DemoReceiptData[]>([]);

  const handleDemoProcessing = () => {
    // Simulate processing delay
    toast.loading('Processing demo receipt...', { duration: 2000 });

    setTimeout(() => {
      const randomReceipt = demoReceipts[Math.floor(Math.random() * demoReceipts.length)];
      setProcessedReceipts(prev => [randomReceipt, ...prev]);
      setSelectedReceipt(randomReceipt);
      toast.success('Demo receipt processed successfully!');
    }, 2000);
  };

  const handleAddTransaction = async (data: DemoReceiptData) => {
    try {
      await addTransaction({
        amount: data.total,
        category: data.category,
        description: `Receipt from ${data.vendor}`,
        date: new Date(data.date),
        type: 'expense',
      });

      toast.success('Transaction added successfully!');
      setSelectedReceipt(null);
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  return (
    <div className="space-y-4">
      {/* Demo Button */}
      <div className="text-center">
        <button
          onClick={handleDemoProcessing}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center mx-auto"
        >
          <Receipt className="h-5 w-5 mr-2" />
          Try Demo Receipt Processing
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Click to simulate AI receipt processing with sample data
        </p>
      </div>

      {/* Processed Receipts */}
      {processedReceipts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="floating-card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Processed Receipts</h3>
          <div className="space-y-3">
            {processedReceipts.map((receipt, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-success-100">
                    <CheckCircle className="h-5 w-5 text-success-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{receipt.vendor}</p>
                    <p className="text-xs text-gray-500">₹{receipt.total} - {receipt.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-success-100 text-success-700">
                    {Math.round(receipt.confidence_score * 100)}% confidence
                  </span>
                  <button
                    onClick={() => setSelectedReceipt(receipt)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Receipt Details Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Demo Receipt Details</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Parsed Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Store className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Vendor</p>
                      <p className="text-sm font-medium">{selectedReceipt.vendor}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-sm font-medium">₹{selectedReceipt.total}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-sm font-medium">
                        {new Date(selectedReceipt.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="text-sm font-medium">{selectedReceipt.category}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                  {selectedReceipt.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span>₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confidence Score */}
              <div className="bg-success-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-success-800">AI Confidence</span>
                  <span className="text-sm font-bold text-success-700">
                    {Math.round(selectedReceipt.confidence_score * 100)}%
                  </span>
                </div>
                <div className="w-full bg-success-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-success-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${selectedReceipt.confidence_score * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddTransaction(selectedReceipt)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add Transaction
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ReceiptDemo;