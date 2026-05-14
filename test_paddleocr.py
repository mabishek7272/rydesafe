#!/usr/bin/env python3
"""
Quick test script for PaddleOCR functionality
"""
import paddleocr
import os
from PIL import Image
import numpy as np

def test_paddleocr():
    """Test PaddleOCR with a simple text image"""
    print("Testing PaddleOCR...")
    
    try:
        # Initialize PaddleOCR
        print("Initializing PaddleOCR...")
        ocr = paddleocr.PaddleOCR(use_textline_orientation=True, lang='en')
        
        # Create a simple test image with text
        print("Creating test image...")
        test_image = create_test_image()
        
        # Perform OCR
        print("Performing OCR...")
        result = ocr.ocr(test_image)
        
        # Display results
        print("\nPaddleOCR Results:")
        for idx in range(len(result)):
            if result[idx]:
                for line in result[idx]:
                    text = line[1][0]
                    confidence = line[1][1]
                    print(f"   Text: '{text}' (Confidence: {confidence:.3f})")
        
        return True, result
        
    except Exception as e:
        print(f"PaddleOCR test failed: {e}")
        return False, None

def create_test_image():
    """Create a simple test image with text"""
    from PIL import Image, ImageDraw, ImageFont
    
    # Create a white image
    img = Image.new('RGB', (400, 100), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Add some text
    try:
        # Try to use a system font
        font = ImageFont.truetype("arial.ttf", 24)
    except:
        # Fall back to default font
        font = ImageFont.load_default()
    
    draw.text((10, 10), "Hello World!", fill=(0, 0, 0), font=font)
    draw.text((10, 40), "OCR Testing 123", fill=(0, 0, 0), font=font)
    
    return np.array(img)

if __name__ == "__main__":
    print("Starting PaddleOCR Test...")
    success, results = test_paddleocr()
    
    if success:
        print("SUCCESS: PaddleOCR is working correctly!")
    else:
        print("ERROR: PaddleOCR test failed. Check the installation.")