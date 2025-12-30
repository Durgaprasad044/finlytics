"""
Receipt Parsing Agent - Multi-OCR approach for maximum accuracy
Uses Google Vision API, Donut, AWS Textract, and EasyOCR
"""

import asyncio
import json
import logging
import re
import cv2
import numpy as np
from typing import Dict, Any, Optional, List
from datetime import datetime
import base64
from io import BytesIO
from PIL import Image

# OCR Libraries
import easyocr
import pytesseract
try:
    from google.cloud import vision
except ImportError:
    vision = None

try:
    import boto3
except ImportError:
    boto3 = None

# Local imports
from config.settings import settings, MODEL_CONFIGS
from utils.image_processing import ImageProcessor
from utils.text_processing import TextProcessor

logger = logging.getLogger(__name__)

class ReceiptParsingAgent:
    """
    AI agent for parsing receipts from images using multiple OCR approaches
    """
    
    def __init__(self):
        self.vision_client = None
        self.textract_client = None
        self.easyocr_reader = None
        self.image_processor = ImageProcessor()
        self.text_processor = TextProcessor()
        
        # Receipt parsing patterns
        self.patterns = {
            'total': [
                r'total[:\s]*\$?(\d+\.?\d*)',
                r'amount[:\s]*\$?(\d+\.?\d*)',
                r'grand total[:\s]*\$?(\d+\.?\d*)',
                r'balance[:\s]*\$?(\d+\.?\d*)'
            ],
            'vendor': [
                r'^([A-Z\s&]+)(?:\n|\r)',
                r'([A-Z][A-Z\s&]{3,})',
                r'store[:\s]*([A-Z\s&]+)',
                r'merchant[:\s]*([A-Z\s&]+)'
            ],
            'date': [
                r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
                r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',
                r'date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
                r'(\w+\s+\d{1,2},?\s+\d{4})'
            ],
            'items': [
                r'([A-Za-z\s]+)\s+\$?(\d+\.?\d*)',
                r'(\d+)\s+([A-Za-z\s]+)\s+\$?(\d+\.?\d*)',
                r'([A-Za-z\s]+)\s+@\s+\$?(\d+\.?\d*)'
            ],
            'tax': [
                r'tax[:\s]*\$?(\d+\.?\d*)',
                r'sales tax[:\s]*\$?(\d+\.?\d*)',
                r'hst[:\s]*\$?(\d+\.?\d*)',
                r'gst[:\s]*\$?(\d+\.?\d*)'
            ]
        }
        
        # Vendor categories mapping
        self.vendor_categories = {
            'walmart': 'Groceries',
            'target': 'Shopping',
            'starbucks': 'Coffee Shops',
            'mcdonalds': 'Fast Food',
            'shell': 'Gas & Fuel',
            'exxon': 'Gas & Fuel',
            'cvs': 'Pharmacy',
            'walgreens': 'Pharmacy',
            'home depot': 'Home Improvement',
            'lowes': 'Home Improvement',
            'amazon': 'Shopping',
            'costco': 'Groceries',
            'kroger': 'Groceries',
            'safeway': 'Groceries'
        }
    
    async def initialize(self):
        """Initialize the receipt parsing agent"""
        try:
            logger.info("🚀 Initializing Receipt Parsing Agent...")
            
            # Initialize Google Vision API
            if settings.GOOGLE_API_KEY and vision:
                try:
                    self.vision_client = vision.ImageAnnotatorClient()
                    logger.info("✅ Google Vision API initialized")
                except Exception as e:
                    logger.warning(f"⚠️ Google Vision API initialization failed: {str(e)}")
            
            # Initialize AWS Textract
            if settings.AWS_ACCESS_KEY_ID and boto3:
                try:
                    self.textract_client = boto3.client(
                        'textract',
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                        region_name=settings.AWS_REGION
                    )
                    logger.info("✅ AWS Textract initialized")
                except Exception as e:
                    logger.warning(f"⚠️ AWS Textract initialization failed: {str(e)}")
            
            # Initialize EasyOCR
            try:
                self.easyocr_reader = easyocr.Reader(['en'])
                logger.info("✅ EasyOCR initialized")
            except Exception as e:
                logger.warning(f"⚠️ EasyOCR initialization failed: {str(e)}")
            
            logger.info("✅ Receipt Parsing Agent initialized successfully!")
            
        except Exception as e:
            logger.error(f"❌ Error initializing Receipt Parsing Agent: {str(e)}")
            raise
    
    async def parse_receipt(
        self,
        file_content: bytes,
        filename: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Parse receipt from file content using multiple OCR methods
        """
        try:
            logger.info(f"Parsing receipt: {filename}")
            
            # Step 1: Preprocess image
            processed_image = await self._preprocess_image(file_content)
            
            # Step 2: Extract text using multiple OCR methods
            ocr_results = await self._extract_text_multi_ocr(processed_image, file_content)
            
            # Step 3: Parse receipt data from OCR results
            parsed_data = await self._parse_receipt_data(ocr_results)
            
            # Step 4: Validate and enhance parsed data
            validated_data = await self._validate_and_enhance(parsed_data)
            
            # Step 5: Create response
            response = {
                "success": True,
                "filename": filename,
                "user_id": user_id,
                "parsed_data": validated_data,
                "ocr_methods_used": list(ocr_results.keys()),
                "confidence_score": await self._calculate_confidence(ocr_results, validated_data),
                "timestamp": datetime.now().isoformat()
            }
            
            return response
            
        except Exception as e:
            logger.error(f"Error parsing receipt: {str(e)}")
            return {
                "success": False,
                "filename": filename,
                "user_id": user_id,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def _preprocess_image(self, file_content: bytes) -> np.ndarray:
        """Preprocess image for better OCR results"""
        
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(file_content, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Could not decode image")
            
            # Apply image processing techniques
            processed = self.image_processor.enhance_for_ocr(image)
            processed = self.image_processor.correct_skew(processed)
            processed = self.image_processor.resize_for_ocr(processed)
            
            return processed
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {str(e)}")
            # Return original image as fallback
            nparr = np.frombuffer(file_content, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    async def _extract_text_multi_ocr(
        self,
        processed_image: np.ndarray,
        original_content: bytes
    ) -> Dict[str, Dict[str, Any]]:
        """Extract text using multiple OCR methods"""
        
        ocr_results = {}
        
        # Method 1: EasyOCR
        if self.easyocr_reader:
            try:
                easyocr_result = await self._extract_with_easyocr(processed_image)
                ocr_results['easyocr'] = easyocr_result
            except Exception as e:
                logger.warning(f"EasyOCR failed: {str(e)}")
        
        # Method 2: Tesseract
        try:
            tesseract_result = await self._extract_with_tesseract(processed_image)
            ocr_results['tesseract'] = tesseract_result
        except Exception as e:
            logger.warning(f"Tesseract failed: {str(e)}")
        
        # Method 3: Google Vision API
        if self.vision_client:
            try:
                vision_result = await self._extract_with_vision_api(original_content)
                ocr_results['google_vision'] = vision_result
            except Exception as e:
                logger.warning(f"Google Vision API failed: {str(e)}")
        
        # Method 4: AWS Textract
        if self.textract_client:
            try:
                textract_result = await self._extract_with_textract(original_content)
                ocr_results['aws_textract'] = textract_result
            except Exception as e:
                logger.warning(f"AWS Textract failed: {str(e)}")
        
        return ocr_results
    
    async def _extract_with_easyocr(self, image: np.ndarray) -> Dict[str, Any]:
        """Extract text using EasyOCR"""
        
        results = await asyncio.to_thread(
            self.easyocr_reader.readtext, image
        )
        
        # Combine all text
        text_lines = []
        confidence_scores = []
        
        for (bbox, text, confidence) in results:
            if confidence > 0.5:  # Filter low confidence results
                text_lines.append(text)
                confidence_scores.append(confidence)
        
        combined_text = '\n'.join(text_lines)
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        
        return {
            "text": combined_text,
            "confidence": avg_confidence,
            "method": "easyocr",
            "lines": text_lines
        }
    
    async def _extract_with_tesseract(self, image: np.ndarray) -> Dict[str, Any]:
        """Extract text using Tesseract"""
        
        # Convert to PIL Image for Tesseract
        pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        
        # Extract text
        text = await asyncio.to_thread(
            pytesseract.image_to_string, pil_image, config='--psm 6'
        )
        
        # Get confidence data
        data = await asyncio.to_thread(
            pytesseract.image_to_data, pil_image, output_type=pytesseract.Output.DICT
        )
        
        # Calculate average confidence
        confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
        avg_confidence = sum(confidences) / len(confidences) / 100 if confidences else 0
        
        return {
            "text": text,
            "confidence": avg_confidence,
            "method": "tesseract",
            "lines": text.split('\n')
        }
    
    async def _extract_with_vision_api(self, image_content: bytes) -> Dict[str, Any]:
        """Extract text using Google Vision API"""
        
        image = vision.Image(content=image_content)
        
        response = await asyncio.to_thread(
            self.vision_client.text_detection, image=image
        )
        
        texts = response.text_annotations
        
        if texts:
            full_text = texts[0].description
            lines = full_text.split('\n')
            
            return {
                "text": full_text,
                "confidence": 0.9,  # Google Vision typically has high confidence
                "method": "google_vision",
                "lines": lines
            }
        
        return {
            "text": "",
            "confidence": 0,
            "method": "google_vision",
            "lines": []
        }
    
    async def _extract_with_textract(self, image_content: bytes) -> Dict[str, Any]:
        """Extract text using AWS Textract"""
        
        response = await asyncio.to_thread(
            self.textract_client.detect_document_text,
            Document={'Bytes': image_content}
        )
        
        # Extract text from blocks
        text_lines = []
        for block in response['Blocks']:
            if block['BlockType'] == 'LINE':
                text_lines.append(block['Text'])
        
        combined_text = '\n'.join(text_lines)
        
        # Calculate average confidence
        confidences = [
            block['Confidence'] for block in response['Blocks']
            if block['BlockType'] == 'LINE'
        ]
        avg_confidence = sum(confidences) / len(confidences) / 100 if confidences else 0
        
        return {
            "text": combined_text,
            "confidence": avg_confidence,
            "method": "aws_textract",
            "lines": text_lines
        }
    
    async def _parse_receipt_data(self, ocr_results: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Parse receipt data from OCR results"""
        
        # Combine all OCR text for parsing
        all_text = ""
        best_confidence = 0
        best_method = None
        
        for method, result in ocr_results.items():
            confidence = result.get('confidence', 0)
            if confidence > best_confidence:
                best_confidence = confidence
                best_method = method
            all_text += result.get('text', '') + '\n'
        
        # Use the best OCR result for primary parsing
        primary_text = ocr_results.get(best_method, {}).get('text', all_text) if best_method else all_text
        
        parsed_data = {
            "vendor": self._extract_vendor(primary_text),
            "total": self._extract_total(primary_text),
            "date": self._extract_date(primary_text),
            "items": self._extract_items(primary_text),
            "tax": self._extract_tax(primary_text),
            "category": None,  # Will be determined later
            "raw_text": primary_text,
            "parsing_method": best_method or "combined"
        }
        
        return parsed_data
    
    def _extract_vendor(self, text: str) -> Optional[str]:
        """Extract vendor name from receipt text"""
        
        lines = text.split('\n')
        
        # Try pattern matching first
        for pattern in self.patterns['vendor']:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                vendor = match.group(1).strip()
                if len(vendor) > 2:
                    return vendor
        
        # Fallback: use first non-empty line that looks like a business name
        for line in lines[:5]:  # Check first 5 lines
            line = line.strip()
            if len(line) > 3 and not re.match(r'^\d', line):
                # Check if it contains mostly letters and spaces
                if re.match(r'^[A-Za-z\s&\-\.]+$', line):
                    return line
        
        return None
    
    def _extract_total(self, text: str) -> Optional[float]:
        """Extract total amount from receipt text"""
        
        amounts = []
        
        # Try pattern matching
        for pattern in self.patterns['total']:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    amount = float(match.replace(',', ''))
                    amounts.append(amount)
                except ValueError:
                    continue
        
        # Also extract all dollar amounts and take the largest reasonable one
        dollar_amounts = self.text_processor.extract_amounts(text)
        amounts.extend(dollar_amounts)
        
        if amounts:
            # Filter out unreasonable amounts (too small or too large)
            reasonable_amounts = [a for a in amounts if 0.01 <= a <= 10000]
            if reasonable_amounts:
                # Return the largest reasonable amount (likely the total)
                return max(reasonable_amounts)
        
        return None
    
    def _extract_date(self, text: str) -> Optional[str]:
        """Extract date from receipt text"""
        
        for pattern in self.patterns['date']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                try:
                    # Try to parse and reformat the date
                    from dateutil import parser
                    parsed_date = parser.parse(date_str)
                    return parsed_date.date().isoformat()
                except:
                    return date_str
        
        return None
    
    def _extract_items(self, text: str) -> List[Dict[str, Any]]:
        """Extract line items from receipt text"""
        
        items = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Try to match item patterns
            for pattern in self.patterns['items']:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    if len(match.groups()) == 2:
                        item_name, price = match.groups()
                        try:
                            items.append({
                                "name": item_name.strip(),
                                "price": float(price.replace(',', ''))
                            })
                        except ValueError:
                            continue
                    elif len(match.groups()) == 3:
                        qty, item_name, price = match.groups()
                        try:
                            items.append({
                                "name": item_name.strip(),
                                "price": float(price.replace(',', '')),
                                "quantity": int(qty)
                            })
                        except ValueError:
                            continue
        
        return items
    
    def _extract_tax(self, text: str) -> Optional[float]:
        """Extract tax amount from receipt text"""
        
        for pattern in self.patterns['tax']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1).replace(',', ''))
                except ValueError:
                    continue
        
        return None
    
    async def _validate_and_enhance(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and enhance parsed data"""
        
        # Determine category based on vendor
        vendor = parsed_data.get('vendor', '').lower()
        category = 'Unknown'
        
        for vendor_key, vendor_category in self.vendor_categories.items():
            if vendor_key in vendor:
                category = vendor_category
                break
        
        parsed_data['category'] = category
        
        # Validate total amount
        total = parsed_data.get('total')
        items = parsed_data.get('items', [])
        
        if total and items:
            items_total = sum(item.get('price', 0) for item in items)
            tax = parsed_data.get('tax', 0) or 0
            
            # Check if total makes sense
            expected_total = items_total + tax
            if abs(total - expected_total) > 1.0:  # Allow $1 difference
                parsed_data['validation_warning'] = f"Total ({total}) doesn't match items + tax ({expected_total})"
        
        # Set default date if not found
        if not parsed_data.get('date'):
            parsed_data['date'] = datetime.now().date().isoformat()
        
        return parsed_data
    
    async def _calculate_confidence(
        self,
        ocr_results: Dict[str, Dict[str, Any]],
        parsed_data: Dict[str, Any]
    ) -> float:
        """Calculate overall confidence score"""
        
        # Base confidence from OCR methods
        ocr_confidences = [
            result.get('confidence', 0) 
            for result in ocr_results.values()
        ]
        avg_ocr_confidence = sum(ocr_confidences) / len(ocr_confidences) if ocr_confidences else 0
        
        # Parsing confidence based on extracted data
        parsing_confidence = 0
        
        if parsed_data.get('vendor'):
            parsing_confidence += 0.2
        if parsed_data.get('total'):
            parsing_confidence += 0.3
        if parsed_data.get('date'):
            parsing_confidence += 0.2
        if parsed_data.get('items'):
            parsing_confidence += 0.2
        if parsed_data.get('category') != 'Unknown':
            parsing_confidence += 0.1
        
        # Combined confidence
        overall_confidence = (avg_ocr_confidence * 0.6) + (parsing_confidence * 0.4)
        
        return min(overall_confidence, 1.0)
    
    def parse_receipt_text(self, text: str) -> Dict[str, Any]:
        """Parse receipt from plain text (for testing)"""
        
        parsed_data = {
            "vendor": self._extract_vendor(text),
            "total": self._extract_total(text),
            "date": self._extract_date(text),
            "items": self._extract_items(text),
            "tax": self._extract_tax(text),
            "raw_text": text
        }
        
        # Determine category
        vendor = parsed_data.get('vendor', '').lower()
        category = 'Unknown'
        
        for vendor_key, vendor_category in self.vendor_categories.items():
            if vendor_key in vendor:
                category = vendor_category
                break
        
        parsed_data['category'] = category
        
        return parsed_data