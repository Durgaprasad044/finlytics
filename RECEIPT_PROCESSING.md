# AI Receipt Processing Feature

## Overview

The AI Receipt Processing feature allows users to upload receipt images and automatically extract transaction details using advanced OCR (Optical Character Recognition) and AI technologies. The system processes receipts, categorizes expenses, and adds transactions automatically to the user's financial records.

## Features

### 🚀 Smart Upload
- **Drag & Drop Interface**: Simply drag receipt images into the upload area
- **File Browser**: Click to browse and select receipt images from your device
- **Camera Capture**: Take photos of receipts directly using your device camera
- **Multiple Format Support**: JPG, PNG, HEIC, and other common image formats
- **File Size Validation**: Supports files up to 10MB

### 🔍 OCR Processing
The system uses multiple OCR engines for maximum accuracy:
- **EasyOCR**: Advanced neural network-based OCR
- **Tesseract**: Google's open-source OCR engine
- **Google Vision API**: Cloud-based OCR with high accuracy
- **AWS Textract**: Amazon's document analysis service

### 🎯 Auto Categorization
- **Vendor Recognition**: Automatically identifies merchants and stores
- **Smart Categorization**: Maps vendors to appropriate expense categories
- **Confidence Scoring**: Provides accuracy confidence for each processed receipt
- **Manual Review**: Low-confidence results are flagged for user review

## How It Works

### 1. Upload Process
```typescript
// User uploads receipt image
const handleFileUpload = async (file: File) => {
  // Validate file type and size
  // Show preview
  // Process with AI backend
  const result = await apiService.parseReceipt(file);
}
```

### 2. AI Processing Pipeline
1. **Image Preprocessing**: Enhance image quality for better OCR results
2. **Multi-OCR Extraction**: Extract text using multiple OCR engines
3. **Data Parsing**: Parse receipt data using regex patterns and AI
4. **Validation**: Validate extracted data for accuracy
5. **Categorization**: Automatically categorize the expense

### 3. Transaction Creation
- **High Confidence (>80%)**: Automatically adds transaction
- **Medium Confidence (60-80%)**: Shows for user review
- **Low Confidence (<60%)**: Requires manual editing

## Backend Architecture

### Receipt Parsing Agent
Located in `backend/agents/receipt_parsing_agent.py`

```python
class ReceiptParsingAgent:
    def __init__(self):
        self.vision_client = None      # Google Vision API
        self.textract_client = None    # AWS Textract
        self.easyocr_reader = None     # EasyOCR
        self.image_processor = ImageProcessor()
        self.text_processor = TextProcessor()
```

### Key Methods
- `parse_receipt()`: Main processing method
- `_preprocess_image()`: Image enhancement
- `_extract_text_multi_ocr()`: Multi-OCR text extraction
- `_parse_receipt_data()`: Data parsing and validation
- `_validate_and_enhance()`: Data validation and categorization

### Supported Data Extraction
- **Vendor/Merchant Name**
- **Total Amount**
- **Transaction Date**
- **Individual Items** (with prices)
- **Tax Amount**
- **Payment Method** (when available)

## Frontend Components

### Main Receipt Page
`src/pages/Receipts.tsx` - Main receipt processing interface

### Demo Component
`src/components/ReceiptDemo.tsx` - Interactive demo with sample data

### Key Features
- **Upload Modal**: Drag & drop interface
- **Processing Status**: Real-time processing feedback
- **Receipt Details**: Detailed view of extracted data
- **Edit Transaction**: Manual editing before adding
- **Confidence Indicators**: Visual confidence scoring

## API Endpoints

### Parse Receipt
```http
POST /api/parse-receipt
Content-Type: multipart/form-data

file: [receipt image file]
user_id: [user identifier]
```

### Response Format
```json
{
  "success": true,
  "filename": "receipt.jpg",
  "parsed_data": {
    "vendor": "Walmart Supercenter",
    "total": 87.45,
    "date": "2024-01-15",
    "category": "Groceries",
    "items": [
      {"name": "Milk 2%", "price": 4.99},
      {"name": "Bread", "price": 3.49}
    ],
    "tax": 6.12,
    "confidence_score": 0.95
  },
  "ocr_methods_used": ["easyocr", "tesseract"],
  "confidence_score": 0.95
}
```

## Configuration

### Environment Variables
```bash
# Google Vision API
GOOGLE_API_KEY=your_google_api_key

# AWS Textract
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
```

### Vendor Categories Mapping
```python
vendor_categories = {
    'walmart': 'Groceries',
    'target': 'Shopping',
    'starbucks': 'Coffee Shops',
    'mcdonalds': 'Fast Food',
    'shell': 'Gas & Fuel',
    'cvs': 'Pharmacy',
    # ... more mappings
}
```

## Installation & Setup

### Backend Dependencies
```bash
pip install -r requirements.txt
```

Required packages:
- `fastapi` - Web framework
- `easyocr` - OCR processing
- `opencv-python` - Image processing
- `pytesseract` - Tesseract OCR
- `google-cloud-vision` - Google Vision API
- `boto3` - AWS services
- `python-dateutil` - Date parsing

### Frontend Dependencies
All required dependencies are already included in `package.json`:
- `react` - UI framework
- `framer-motion` - Animations
- `lucide-react` - Icons
- `react-hot-toast` - Notifications

## Usage Examples

### Basic Upload
1. Navigate to Receipt Scanner page
2. Click "Upload Receipt" button
3. Select or drag receipt image
4. Wait for AI processing
5. Review extracted data
6. Add transaction to records

### Demo Mode
1. Click "Try Demo Receipt Processing"
2. View sample processed receipts
3. Explore extracted data details
4. Add demo transactions

## Error Handling

### Common Issues
- **File Size Too Large**: Maximum 10MB supported
- **Invalid File Type**: Only image files accepted
- **OCR Processing Failed**: Multiple OCR engines provide fallback
- **Low Confidence**: Manual review required

### Error Messages
- Clear, user-friendly error messages
- Specific guidance for resolution
- Fallback options when available

## Performance Optimization

### Image Processing
- Automatic image enhancement
- Skew correction
- Optimal resolution for OCR

### Caching
- Processed results cached locally
- Reduced API calls for repeated processing

### Async Processing
- Non-blocking UI during processing
- Real-time status updates
- Background processing support

## Security Considerations

### Data Privacy
- Images processed securely
- No permanent storage of receipt images
- User data encryption

### API Security
- Authentication required for all endpoints
- Rate limiting implemented
- Input validation and sanitization

## Future Enhancements

### Planned Features
- **Bulk Processing**: Upload multiple receipts at once
- **Receipt Templates**: Custom parsing for specific vendors
- **Expense Reports**: Generate reports from receipt data
- **Mobile App**: Dedicated mobile receipt scanning
- **Integration**: Connect with accounting software

### AI Improvements
- **Custom Models**: Train models on user-specific data
- **Better Accuracy**: Continuous model improvements
- **Multi-language**: Support for non-English receipts
- **Handwriting**: Support for handwritten receipts

## Troubleshooting

### Backend Not Running
- Demo mode available for testing
- Sample data provided for exploration
- Full functionality requires backend setup

### OCR Accuracy Issues
- Ensure good image quality
- Proper lighting when taking photos
- Flat, unfolded receipts work best
- Manual editing available for corrections

### API Connection Issues
- Check backend server status
- Verify API endpoints
- Review authentication tokens
- Check network connectivity

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review error messages carefully
3. Test with demo mode first
4. Verify backend configuration
5. Check API documentation

## Contributing

To contribute to the receipt processing feature:
1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request with description
5. Follow code style guidelines

---

*This feature represents the cutting edge of AI-powered financial management, making expense tracking effortless and accurate.*