"""
Image processing utilities for receipt parsing
"""

import cv2
import numpy as np
from typing import Tuple

class ImageProcessor:
    """Utility class for image preprocessing to improve OCR accuracy"""
    
    def enhance_for_ocr(self, image: np.ndarray) -> np.ndarray:
        """Enhance image for better OCR results"""
        
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Apply denoising
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Enhance contrast
        enhanced = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(denoised)
        
        return enhanced
    
    def correct_skew(self, image: np.ndarray) -> np.ndarray:
        """Correct skewed/rotated images"""
        
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Apply edge detection
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        
        # Find lines using Hough transform
        lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=100)
        
        if lines is not None:
            # Calculate average angle
            angles = []
            for rho, theta in lines[:10]:  # Use first 10 lines
                angle = theta * 180 / np.pi
                if angle > 90:
                    angle = angle - 180
                angles.append(angle)
            
            if angles:
                avg_angle = np.mean(angles)
                
                # Rotate image to correct skew
                if abs(avg_angle) > 0.5:  # Only rotate if significant skew
                    height, width = gray.shape
                    center = (width // 2, height // 2)
                    rotation_matrix = cv2.getRotationMatrix2D(center, avg_angle, 1.0)
                    
                    if len(image.shape) == 3:
                        corrected = cv2.warpAffine(image, rotation_matrix, (width, height), 
                                                 flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                    else:
                        corrected = cv2.warpAffine(gray, rotation_matrix, (width, height), 
                                                 flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                    
                    return corrected
        
        return image
    
    def resize_for_ocr(self, image: np.ndarray, target_height: int = 1000) -> np.ndarray:
        """Resize image to optimal size for OCR"""
        
        height, width = image.shape[:2]
        
        # Calculate scale factor
        if height > target_height:
            scale_factor = target_height / height
            new_width = int(width * scale_factor)
            new_height = target_height
            
            # Resize image
            resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
            return resized
        
        return image