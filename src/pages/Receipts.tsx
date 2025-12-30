"use client";
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  Upload,
  Scan,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  FileImage,
  DollarSign,
  Calendar,
  Tag,
  Store,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import ReceiptDemo from '../components/ReceiptDemo';

interface ParsedReceiptData {
  vendor?: string;
  total?: number;
  date?: string;
  category?: string;
  items?: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  tax?: number;
  raw_text?: string;
  confidence_score?: number;
}

interface ReceiptProcessingResult {
  success: boolean;
  filename: string;
  parsed_data?: ParsedReceiptData;
  error?: string;
  confidence_score?: number;
  ocr_methods_used?: string[];
}

const Receipts: React.FC = () => {
  const { addTransaction } = useFinance();
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processedReceipts, setProcessedReceipts] = useState<ReceiptProcessingResult[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptProcessingResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<ParsedReceiptData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Process receipt with AI
      const result = await apiService.parseReceipt(file);

      if (result.success) {
        setProcessedReceipts(prev => [result, ...prev]);
        toast.success('Receipt processed successfully!');

        // Auto-add transaction if confidence is high
        if (result.confidence_score && result.confidence_score > 0.8 && result.parsed_data) {
          await handleAddTransaction(result.parsed_data);
        } else {
          // Show for manual review
          setSelectedReceipt(result);
        }
      } else {
        toast.error(result.error || 'Failed to process receipt');
      }
    } catch (error) {
      console.error('Receipt processing error:', error);
      toast.error('Failed to process receipt. Please try again.');
    } finally {
      setIsUploading(false);
      setShowUploadModal(false);
    }
  }, []);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  // Add transaction from parsed data
  const handleAddTransaction = async (data: ParsedReceiptData) => {
    try {
      if (!data.total || data.total <= 0) {
        toast.error('Invalid transaction amount');
        return;
      }

      await addTransaction({
        amount: data.total,
        category: data.category || 'Uncategorized',
        description: data.vendor ? `Receipt from ${data.vendor}` : 'Receipt transaction',
        date: data.date ? new Date(data.date) : new Date(),
        type: 'expense',
        receiptUrl: previewImage || undefined,
      });

      toast.success('Transaction added successfully!');
      setSelectedReceipt(null);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  // Edit transaction before adding
  const handleEditTransaction = (data: ParsedReceiptData) => {
    setEditingTransaction(data);
  };

  const handleSaveEditedTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const updatedData: ParsedReceiptData = {
      ...editingTransaction,
      total: Number(formData.get('amount')),
      category: formData.get('category') as string,
      vendor: formData.get('vendor') as string,
      date: formData.get('date') as string,
    };

    await handleAddTransaction(updatedData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Receipt Scanner</h1>
          <p className="text-gray-600 mt-1 dark:text-white">Upload and process receipts with AI</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Receipt
        </button>
      </div>

      {/* Features Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="floating-card"
      >
        <div className="text-center py-8">
          <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2 dark:text-white">AI Receipt Processing</h3>
          <p className="text-gray-600 mb-6 dark:text-white">
            Upload receipt images and let AI extract details, categorize expenses, and add transactions automatically.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 bg-primary-50 rounded-lg">
              <Upload className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-primary-700">Smart Upload</p>
              <p className="text-xs text-primary-600 mt-1">Drag & drop or click to upload</p>
            </div>
            <div className="p-4 bg-success-50 rounded-lg">
              <Scan className="h-8 w-8 text-success-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-success-700">OCR Processing</p>
              <p className="text-xs text-success-600 mt-1">Multiple AI engines for accuracy</p>
            </div>
            <div className="p-4 bg-warning-50 rounded-lg">
              <Receipt className="h-8 w-8 text-warning-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-warning-700">Auto Categorization</p>
              <p className="text-xs text-warning-600 mt-1">Smart expense categorization</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Demo Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="floating-card"
      >
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">Try AI Receipt Processing</h2>
          <p className="text-sm text-gray-600 dark:text-white">
            Experience the power of AI receipt processing with our demo feature
          </p>
        </div>
        <ReceiptDemo />
      </motion.div>

      {/* Processed Receipts */}
      {processedReceipts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="floating-card"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Receipts</h2>
          <div className="space-y-3">
            {processedReceipts.map((receipt, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${receipt.success ? 'bg-success-100' : 'bg-danger-100'
                    }`}>
                    {receipt.success ? (
                      <CheckCircle className="h-5 w-5 text-success-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-danger-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 ">{receipt.filename}</p>
                    <p className="text-xs text-gray-500">
                      {receipt.success ?
                        `${receipt.parsed_data?.vendor || 'Unknown'} - ₹${receipt.parsed_data?.total || 0}` :
                        receipt.error
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {receipt.confidence_score && (
                    <span className={`text-xs px-2 py-1 rounded-full ${receipt.confidence_score > 0.8 ? 'bg-success-100 text-success-700' :
                      receipt.confidence_score > 0.6 ? 'bg-warning-100 text-warning-700' :
                        'bg-danger-100 text-danger-700'
                      }`}>
                      {Math.round(receipt.confidence_score * 100)}% confidence
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedReceipt(receipt)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload Receipt</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 text-primary-600 animate-spin mb-2" />
                    <p className="text-sm text-gray-600">Processing receipt...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-4">
                      Drag and drop your receipt here, or click to browse
                    </p>
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                      >
                        <FileImage className="h-4 w-4 mr-2" />
                        Browse Files
                      </button>
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </button>
                    </div>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />

              <p className="text-xs text-gray-500 mt-4 text-center">
                Supported formats: JPG, PNG, HEIC. Max size: 10MB
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Details Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Receipt Details</h3>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {selectedReceipt.success && selectedReceipt.parsed_data ? (
                <div className="space-y-4">
                  {/* Parsed Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Store className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Vendor</p>
                          <p className="text-sm font-medium">{selectedReceipt.parsed_data.vendor || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-sm font-medium">₹{selectedReceipt.parsed_data.total || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Date</p>
                          <p className="text-sm font-medium">
                            {selectedReceipt.parsed_data.date ?
                              new Date(selectedReceipt.parsed_data.date).toLocaleDateString() :
                              'Today'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Category</p>
                          <p className="text-sm font-medium">{selectedReceipt.parsed_data.category || 'Uncategorized'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  {selectedReceipt.parsed_data.items && selectedReceipt.parsed_data.items.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        {selectedReceipt.parsed_data.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name} {item.quantity && `(${item.quantity})`}</span>
                            <span>₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => handleEditTransaction(selectedReceipt.parsed_data!)}
                      className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit & Add
                    </button>
                    <button
                      onClick={() => handleAddTransaction(selectedReceipt.parsed_data!)}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Add Transaction
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-danger-400 mx-auto mb-3" />
                  <p className="text-gray-600">{selectedReceipt.error || 'Failed to process receipt'}</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {editingTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Transaction</h3>
                <button
                  onClick={() => setEditingTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <input
                    type="text"
                    name="vendor"
                    defaultValue={editingTransaction.vendor || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Vendor name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    defaultValue={editingTransaction.total || ''}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    defaultValue={editingTransaction.category || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="Groceries">Groceries</option>
                    <option value="Dining">Dining</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Gas & Fuel">Gas & Fuel</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingTransaction.date || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingTransaction(null)}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Add Transaction
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Receipts;