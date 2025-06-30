#!/usr/bin/env python3
"""
Setup script for Arabic Cheque Printing System
Creates necessary directories and downloads fonts if possible
"""

import os
import sys
import subprocess
from pathlib import Path

def create_directories():
    """Create necessary directories"""
    directories = [
        "uploads",
        "uploads/early_settlement_files", 
        "fonts"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def install_packages():
    """Install required Python packages"""
    packages = [
        "reportlab>=4.0.0",
        "PyPDF2>=3.0.0", 
        "num2words>=0.5.12",
        "arabic-reshaper>=3.0.0",
        "python-bidi>=0.4.2"
    ]
    
    print("📦 Installing required packages...")
    for package in packages:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✅ Installed: {package}")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {package}: {e}")

def download_arabic_fonts():
    """Try to download Arabic fonts"""
    print("🔤 Setting up Arabic fonts...")
    
    # Font download URLs (you may need to update these)
    fonts = {
        "Amiri-Regular.ttf": "https://github.com/aliftype/amiri/releases/download/0.113/Amiri-0.113.zip",
        "Cairo-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf"
    }
    
    print("ℹ️  Note: You may need to manually download Arabic fonts:")
    print("   - Amiri: https://github.com/aliftype/amiri/releases")
    print("   - Cairo: https://fonts.google.com/specimen/Cairo")
    print("   - Place TTF files in the 'fonts' directory")

def create_sample_template():
    """Create a sample cheque template guide"""
    template_guide = """
# Arabic Cheque Template Guide

## PDF Template Requirements

Your cheque template PDF should have:

### Lower Half (Official Cheque Details)
- Field positions for:
  - اسم المستفيد (Issued To) - around position (150, 420)
  - التاريخ (Date) - around position (400, 420)  
  - المبلغ بالأرقام (Amount in Numbers) - around position (150, 380)
  - المبلغ بالحروف (Amount in Words) - around position (150, 340)

### Upper Half (Additional Details)
- Space for expense description - around position (150, 500)

## Adjusting Positions

Edit the `field_positions` dictionary in `arabic_cheque_generator.py`:

```python
self.field_positions = {
    "issued_to": (x, y),      # اسم المستفيد
    "date": (x, y),           # التاريخ
    "amount_numbers": (x, y), # المبلغ بالأرقام
    "amount_words": (x, y),   # المبلغ بالحروف
    "expense_description": (x, y), # سبب الصرف
}
```

## Testing

1. Upload your template via the web interface
2. Test with sample data
3. Adjust positions as needed
4. Print a test cheque to verify alignment
"""
    
    with open("cheque_template_guide.md", "w", encoding="utf-8") as f:
        f.write(template_guide)
    print("✅ Created cheque template guide")

def main():
    """Main setup function"""
    print("🚀 Setting up Arabic Cheque Printing System...")
    
    create_directories()
    install_packages()
    download_arabic_fonts()
    create_sample_template()
    
    print("\n✅ Setup complete!")
    print("\n📋 Next steps:")
    print("1. Place your cheque template PDF in uploads/cheque_template.pdf")
    print("2. Download Arabic fonts to the fonts/ directory")
    print("3. Start your FastAPI server: python main.py")
    print("4. Access the Arabic cheque generator in your frontend")
    print("5. Test with sample data and adjust positions if needed")

if __name__ == "__main__":
    main() 