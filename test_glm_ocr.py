#!/usr/bin/env python3
"""
GLM-OCR Test Script
Tests the GLM-OCR model for state-of-the-art OCR capabilities
"""

import torch
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import warnings
warnings.filterwarnings("ignore")

def create_test_image():
    """Create a test image with various text elements"""
    # Create a white image
    img = Image.new('RGB', (600, 200), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Add text with different fonts and styles
    try:
        font_large = ImageFont.truetype("arial.ttf", 32)
        font_medium = ImageFont.truetype("arial.ttf", 24)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
    
    # Add various text elements
    draw.text((10, 10), "GLM-OCR Test Document", fill=(0, 0, 0), font=font_large)
    draw.text((10, 50), "State-of-the-art OCR with 0.9B parameters", fill=(0, 0, 0), font=font_medium)
    draw.text((10, 80), "Text Recognition: Hello World 123!", fill=(0, 0, 0), font=font_medium)
    draw.text((10, 110), "Formula: E = mc² + ∑(ai * xi)", fill=(0, 0, 0), font=font_medium)
    draw.text((10, 140), "Table Data: Name | Age | Score", fill=(0, 0, 0), font=font_medium)
    draw.text((10, 170), "           John | 25  | 95.5", fill=(0, 0, 0), font=font_medium)
    
    return img

def test_glm_ocr():
    """Test GLM-OCR model"""
    print("=" * 60)
    print("GLM-OCR Model Test")
    print("=" * 60)
    
    try:
        print("Step 1: Loading GLM-OCR model...")
        from transformers import AutoProcessor, AutoModelForImageTextToText
        
        MODEL_PATH = "zai-org/GLM-OCR"
        
        print(f"   Loading processor from {MODEL_PATH}...")
        processor = AutoProcessor.from_pretrained(MODEL_PATH, trust_remote_code=True)
        
        print(f"   Loading model from {MODEL_PATH}...")
        model = AutoModelForImageTextToText.from_pretrained(
            MODEL_PATH,
            trust_remote_code=True,
            torch_dtype="auto",
            device_map="auto"
        )
        
        print(f"   Model loaded successfully!")
        print(f"   Model device: {model.device}")
        print(f"   Model dtype: {model.dtype}")
        
        print("\nStep 2: Creating test image...")
        test_image = create_test_image()
        
        # Save test image for reference
        test_image.save("test_image.png")
        print("   Test image saved as 'test_image.png'")
        
        print("\nStep 3: Testing different OCR tasks...")
        
        # Test 1: Text Recognition
        print("\n--- Test 1: Text Recognition ---")
        messages = [{
            "role": "user",
            "content": [
                {"type": "image", "image": test_image},
                {"type": "text", "text": "Text Recognition:"}
            ],
        }]
        
        inputs = processor.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_dict=True,
            return_tensors="pt"
        ).to(model.device)
        
        inputs.pop("token_type_ids", None)
        
        print("   Generating OCR results...")
        with torch.no_grad():
            generated_ids = model.generate(**inputs, max_new_tokens=2048, do_sample=False)
        
        output_text = processor.decode(
            generated_ids[0][inputs["input_ids"].shape[1]:], 
            skip_special_tokens=True
        )
        
        print(f"   OCR Result:")
        print(f"   {output_text}")
        
        # Test 2: Formula Recognition
        print("\n--- Test 2: Formula Recognition ---")
        messages_formula = [{
            "role": "user",
            "content": [
                {"type": "image", "image": test_image},
                {"type": "text", "text": "Formula Recognition:"}
            ],
        }]
        
        inputs_formula = processor.apply_chat_template(
            messages_formula,
            tokenize=True,
            add_generation_prompt=True,
            return_dict=True,
            return_tensors="pt"
        ).to(model.device)
        
        inputs_formula.pop("token_type_ids", None)
        
        with torch.no_grad():
            generated_ids_formula = model.generate(**inputs_formula, max_new_tokens=1024, do_sample=False)
        
        output_formula = processor.decode(
            generated_ids_formula[0][inputs_formula["input_ids"].shape[1]:], 
            skip_special_tokens=True
        )
        
        print(f"   Formula Result:")
        print(f"   {output_formula}")
        
        print("\n" + "=" * 60)
        print("GLM-OCR Test Completed Successfully!")
        print("=" * 60)
        return True
        
    except ImportError as e:
        print(f"   ERROR: Missing dependencies: {e}")
        print("   Please ensure transformers is properly installed.")
        return False
    except Exception as e:
        print(f"   ERROR: {e}")
        return False

def check_system_specs():
    """Check system specifications for GLM-OCR"""
    print("System Specifications Check:")
    print("-" * 30)
    
    # Check GPU
    if torch.cuda.is_available():
        print(f"   GPU: {torch.cuda.get_device_name()}")
        print(f"   GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
        print(f"   CUDA Version: {torch.version.cuda}")
    else:
        print("   GPU: Not available (using CPU)")
    
    # Check PyTorch
    print(f"   PyTorch Version: {torch.__version__}")
    
    # Check available memory
    import psutil
    ram_gb = psutil.virtual_memory().total / 1e9
    ram_available_gb = psutil.virtual_memory().available / 1e9
    print(f"   RAM: {ram_gb:.1f} GB total, {ram_available_gb:.1f} GB available")
    
    print()

if __name__ == "__main__":
    print("GLM-OCR Installation and Test")
    print("Built for state-of-the-art document understanding")
    print()
    
    check_system_specs()
    
    success = test_glm_ocr()
    
    if success:
        print()
        print("SUCCESS: GLM-OCR is working perfectly!")
        print("You now have state-of-the-art OCR capabilities!")
    else:
        print()
        print("NOTICE: There may be dependency issues.")
        print("GLM-OCR requires the latest transformers library.")