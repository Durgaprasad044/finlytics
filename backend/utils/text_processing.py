"""
Text processing utilities for the AI Finance Assistant
"""

import re
import string
from typing import List, Dict, Any

class TextProcessor:
    """Utility class for text processing tasks"""
    
    def __init__(self):
        # Common financial categories and keywords
        self.category_keywords = {
            'groceries': ['grocery', 'food', 'supermarket', 'walmart', 'kroger', 'safeway'],
            'restaurants': ['restaurant', 'dining', 'food', 'pizza', 'burger', 'cafe'],
            'gas_fuel': ['gas', 'fuel', 'shell', 'bp', 'exxon', 'chevron'],
            'shopping': ['shopping', 'store', 'retail', 'amazon', 'target'],
            'entertainment': ['movie', 'theater', 'entertainment', 'netflix', 'spotify'],
            'utilities': ['electric', 'water', 'gas', 'utility', 'power'],
            'transportation': ['uber', 'lyft', 'taxi', 'bus', 'train', 'metro'],
            'healthcare': ['doctor', 'hospital', 'pharmacy', 'medical', 'health'],
            'coffee': ['coffee', 'starbucks', 'cafe', 'espresso', 'latte']
        }
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep spaces and basic punctuation
        text = re.sub(r'[^\w\s\-\.]', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def extract_categories(self, text: str) -> List[str]:
        """Extract potential spending categories from text"""
        if not text:
            return []
        
        text_clean = self.clean_text(text)
        categories = []
        
        for category, keywords in self.category_keywords.items():
            for keyword in keywords:
                if keyword in text_clean:
                    categories.append(category.replace('_', ' ').title())
                    break
        
        return list(set(categories))
    
    def extract_amounts(self, text: str) -> List[float]:
        """Extract monetary amounts from text"""
        if not text:
            return []
        
        # Pattern to match currency amounts
        patterns = [
            r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)',  # $1,234.56
            r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|usd|\$)',  # 1234.56 dollars
            r'(\d+(?:\.\d{2})?)\s*(?:dollar|buck)',  # 123.45 dollar
        ]
        
        amounts = []
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    # Remove commas and convert to float
                    amount = float(match.replace(',', ''))
                    amounts.append(amount)
                except ValueError:
                    continue
        
        return amounts