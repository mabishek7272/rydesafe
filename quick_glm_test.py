#!/usr/bin/env python3
"""
Quick GLM-OCR Test - Optimized for GPU
"""
import torch
from PIL import Image, ImageDraw, ImageFont
import warnings
warnings.filterwarnings("ignore")

def create_simple_test_image():
    """Create a simple test image"""
    img = Image.new('RGB', (400, 100), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    draw.text((10, 10), "Hello World!", fill=(0, 0, 0), font=font)
    draw.text((10, 40), "GLM-OCR Test 123", fill=(0, 0, 0), font=font)
    
    return img

def test_glm_ocr_quick():
    """Quick GLM-OCR test"""
    print("GLM-OCR Quick Test")
    print("=" * 50)
    
    # Check CUDA
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name()}")
        print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    print()
    
    try:
        # Import and load model
        print("Loading GLM-OCR model...")
        from transformers import AutoProcessor, AutoModelForImageTextToText
        
        processor = AutoProcessor.from_pretrained("zai-org/GLM-OCR", trust_remote_code=True)
        model = AutoModelForImageTextToText.from_pretrained(
            "zai-org/GLM-OCR",
            trust_remote_code=True,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if torch.cuda.is_available() else "cpu"
        )
        
        print(f"Model loaded on: {model.device}")
        print()
        
        # Create test image
        print("Creating test image...")
        test_image = create_simple_test_image()
        test_image.save("quick_test.png")
        
        # Simple OCR test
        print("Running OCR...")
        messages = [{
            "role": "user", 
            "content": [
                {"type": "image", "image": test_image},
                {"type": "text", "text": "Text Recognition:"}
            ]
        }]
        
        inputs = processor.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_dict=True,
            return_tensors="pt"
        )
        
        if torch.cuda.is_available():
            inputs = {k: v.to(model.device) for k, v in inputs.items()}
        
        inputs.pop("token_type_ids", None)
        
        with torch.no_grad():
            generated_ids = model.generate(
                **inputs, 
                max_new_tokens=512,
                do_sample=False,
                temperature=None,
                top_p=None
            )
        
        output_text = processor.decode(
            generated_ids[0][inputs["input_ids"].shape[1]:], 
            skip_special_tokens=True
        )
        
        print("OCR Results:")
        print("-" * 20)
        print(output_text)
        print("-" * 20)
        
        print()
        print("SUCCESS: GLM-OCR is working!")
        return True
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_glm_ocr_quick()
    
    if success:
        print()
        print("SUCCESS: GLM-OCR installation successful!")
        print("READY: For state-of-the-art document OCR!")
    else:
        print()
        print("ERROR: GLM-OCR test failed")
        print("  Check the error messages above")