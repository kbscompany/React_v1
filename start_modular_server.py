#!/usr/bin/env python3
"""
Start script for the modular FastAPI server
"""

import uvicorn
import sys
import os

def start_server():
    """Start the FastAPI server with proper configuration"""
    
    print("🚀 Starting FastAPI Server (Modular Structure)")
    print("=" * 50)
    
    # Add current directory to Python path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)
    
    try:
        # Test imports first
        print("Testing imports...")
        import main
        print("✅ Main module imported successfully")
        
        # Start the server
        print("\n🌐 Starting server on http://localhost:8001")
        print("📁 Using modular router structure")
        print("🔧 Database: MySQL (bakery_react)")
        print("\nAvailable endpoints:")
        print("  • GET  /           - Root endpoint")
        print("  • GET  /test       - Test endpoint")  
        print("  • POST /token      - Login")
        print("  • GET  /users/me   - Current user")
        print("  • GET  /safes-simple - Simple safes")
        print("  • GET  /expense-categories-simple - Categories")
        print("  • GET  /expenses/summary - Expense summary")
        print("  • GET  /items-manage - Item management")
        print("  • And many more...")
        print("\nPress CTRL+C to stop the server")
        print("=" * 50)
        
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8001,
            reload=True,
            reload_dirs=[current_dir],
            log_level="info"
        )
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("\n🔧 Please check:")
        print("  1. Virtual environment is activated")
        print("  2. All required packages are installed")
        print("  3. Database connection is working")
        return False
        
    except Exception as e:
        print(f"❌ Server Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    start_server() 