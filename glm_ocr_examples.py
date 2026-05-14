#!/usr/bin/env python3
"""
GLM-OCR Usage Examples
Complete guide to using GLM-OCR for different document types
"""

import torch
from PIL import Image, ImageDraw, ImageFont
import warnings
warnings.filterwarnings("ignore")

class GLMOCRProcessor:
    """GLM-OCR Processing Class"""
    
    def __init__(self):
        self.processor = None
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.load_model()
    
    def load_model(self):
        """Load GLM-OCR model"""
        print(f"Loading GLM-OCR model on {self.device}...")
        
        from transformers import AutoProcessor, AutoModelForImageTextToText
        
        self.processor = AutoProcessor.from_pretrained("zai-org/GLM-OCR", trust_remote_code=True)
        self.model = AutoModelForImageTextToText.from_pretrained(
            "zai-org/GLM-OCR",
            trust_remote_code=True,
            dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if torch.cuda.is_available() else "cpu"
        )
        
        print(f"Model loaded successfully on {self.model.device}")
    
    def recognize_text(self, image, task="Text Recognition:"):
        """
        Perform OCR on image
        
        Args:
            image: PIL Image or path to image
            task: OCR task type
                - "Text Recognition:" - General text OCR
                - "Formula Recognition:" - Mathematical formulas
                - "Table Recognition:" - Table structures
        
        Returns:
            str: Extracted text
        """
        if isinstance(image, str):
            image = Image.open(image)
        
        messages = [{
            "role": "user", 
            "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": task}
            ]
        }]
        
        inputs = self.processor.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_dict=True,
            return_tensors="pt"
        )
        
        if torch.cuda.is_available():
            inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
        
        inputs.pop("token_type_ids", None)
        
        with torch.no_grad():
            generated_ids = self.model.generate(
                **inputs, 
                max_new_tokens=2048,
                do_sample=False
            )
        
        output_text = self.processor.decode(
            generated_ids[0][inputs["input_ids"].shape[1]:], 
            skip_special_tokens=True
        )
        
        return output_text.strip()
    
    def extract_information(self, image, json_schema):
        """
        Extract structured information from documents
        
        Args:
            image: PIL Image or path to image  
            json_schema: JSON schema for extraction
            
        Returns:
            str: Extracted information in JSON format
        """
        prompt = f"请按下列JSON格式输出图中信息:\n{json_schema}"
        return self.recognize_text(image, prompt)

def create_demo_images():
    """Create demonstration images"""
    images = {}
    
    # Text document
    img = Image.new('RGB', (500, 200), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    try:
        font_large = ImageFont.truetype("arial.ttf", 24)
        font_small = ImageFont.truetype("arial.ttf", 16)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    draw.text((10, 10), "Business Report 2026", fill=(0, 0, 0), font=font_large)
    draw.text((10, 50), "Revenue increased by 25% compared to 2025", fill=(0, 0, 0), font=font_small)
    draw.text((10, 80), "Total sales: $1,250,000", fill=(0, 0, 0), font=font_small)
    draw.text((10, 110), "Customer satisfaction: 94%", fill=(0, 0, 0), font=font_small)
    draw.text((10, 140), "Market share expanded to 15 countries", fill=(0, 0, 0), font=font_small)
    
    images['business_report'] = img
    img.save("demo_business_report.png")
    
    # Formula document
    img2 = Image.new('RGB', (400, 150), color=(255, 255, 255))
    draw2 = ImageDraw.Draw(img2)
    draw2.text((10, 10), "Mathematical Formulas", fill=(0, 0, 0), font=font_large)
    draw2.text((10, 50), "Einstein: E = mc²", fill=(0, 0, 0), font=font_small)
    draw2.text((10, 80), "Quadratic: ax² + bx + c = 0", fill=(0, 0, 0), font=font_small)
    draw2.text((10, 110), "Integral: ∫ f(x)dx = F(x) + C", fill=(0, 0, 0), font=font_small)
    
    images['formulas'] = img2
    img2.save("demo_formulas.png")
    
    # Table document
    img3 = Image.new('RGB', (500, 200), color=(255, 255, 255))
    draw3 = ImageDraw.Draw(img3)
    draw3.text((10, 10), "Employee Table", fill=(0, 0, 0), font=font_large)
    draw3.text((10, 50), "Name        | Department  | Salary", fill=(0, 0, 0), font=font_small)
    draw3.text((10, 80), "John Smith  | Engineering | $75,000", fill=(0, 0, 0), font=font_small)
    draw3.text((10, 110), "Jane Doe    | Marketing   | $65,000", fill=(0, 0, 0), font=font_small)
    draw3.text((10, 140), "Bob Wilson  | Sales       | $70,000", fill=(0, 0, 0), font=font_small)
    
    images['employee_table'] = img3
    img3.save("demo_employee_table.png")
    
    return images

def main():
    """Demonstration of GLM-OCR capabilities"""
    print("GLM-OCR Complete Usage Examples")
    print("=" * 50)
    
    # Initialize processor
    ocr = GLMOCRProcessor()
    print()
    
    # Create demo images
    print("Creating demonstration images...")
    images = create_demo_images()
    print("Demo images saved as PNG files")
    print()
    
    # Test 1: General Text Recognition
    print("Test 1: General Text Recognition")
    print("-" * 30)
    result1 = ocr.recognize_text(images['business_report'], "Text Recognition:")
    print("Input: Business report image")
    print("Output:")
    print(result1)
    print()
    
    # Test 2: Formula Recognition
    print("Test 2: Formula Recognition")
    print("-" * 30)
    result2 = ocr.recognize_text(images['formulas'], "Formula Recognition:")
    print("Input: Mathematical formulas image")
    print("Output:")
    print(result2)
    print()
    
    # Test 3: Table Recognition
    print("Test 3: Table Recognition")
    print("-" * 30)
    result3 = ocr.recognize_text(images['employee_table'], "Table Recognition:")
    print("Input: Employee table image")
    print("Output:")
    print(result3)
    print()
    
    # Test 4: Information Extraction
    print("Test 4: Structured Information Extraction")
    print("-" * 40)
    json_schema = """{
    "title": "",
    "revenue_change": "",
    "total_sales": "",
    "satisfaction": "",
    "market_presence": ""
}"""
    
    result4 = ocr.extract_information(images['business_report'], json_schema)
    print("Input: Business report with JSON schema")
    print("Schema:", json_schema)
    print("Output:")
    print(result4)
    print()
    
    print("=" * 50)
    print("GLM-OCR Demo Complete!")
    print()
    print("Key Features Demonstrated:")
    print("- Text Recognition: Extract all text from documents")
    print("- Formula Recognition: Handle mathematical formulas")  
    print("- Table Recognition: Parse tabular data")
    print("- Information Extraction: Structure data using JSON schemas")
    print()
    print("Your GLM-OCR installation is ready for production use!")

if __name__ == "__main__":
    main()