"""
Date parsing utilities for the AI Finance Assistant
"""

import re
from datetime import datetime, timedelta
from typing import List, Optional

class DateParser:
    """Utility class for parsing dates from text"""
    
    def __init__(self):
        self.relative_terms = {
            'today': 0,
            'yesterday': -1,
            'tomorrow': 1,
            'last week': -7,
            'next week': 7,
            'last month': -30,
            'next month': 30
        }
    
    def extract_dates(self, text: str) -> List[datetime]:
        """Extract dates from text"""
        if not text:
            return []
        
        dates = []
        text_lower = text.lower()
        
        # Try relative date parsing first
        for term, days_offset in self.relative_terms.items():
            if term in text_lower:
                date = datetime.now() + timedelta(days=days_offset)
                dates.append(date)
        
        # Extract explicit dates using regex patterns
        date_patterns = [
            r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b',  # MM/DD/YYYY or MM-DD-YYYY
            r'\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b',    # YYYY/MM/DD or YYYY-MM-DD
        ]
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                try:
                    # Simple date parsing
                    if '/' in match:
                        parts = match.split('/')
                    else:
                        parts = match.split('-')
                    
                    if len(parts) == 3:
                        if len(parts[0]) == 4:  # YYYY format
                            year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
                        else:  # MM/DD/YYYY format
                            month, day, year = int(parts[0]), int(parts[1]), int(parts[2])
                            if year < 100:
                                year += 2000
                        
                        parsed_date = datetime(year, month, day)
                        dates.append(parsed_date)
                except:
                    continue
        
        # Remove duplicates and sort
        unique_dates = list(set(dates))
        unique_dates.sort()
        
        return unique_dates