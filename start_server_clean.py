#!/usr/bin/env python3
"""
Clean FastAPI Server Startup Script
Starts the server without the problematic file watching in venv
"""

import uvicorn
import os
import sys

def start_server():
    """Start the FastAPI server with optimized settings"""
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Add the script directory to Python path
    if script_dir not in sys.path:
        sys.path.insert(0, script_dir)
    
    # Configuration for clean startup
    config = {
        "app": "main:app",
        "host": "0.0.0.0", 
        "port": 8000,
        "reload": True,
        "reload_dirs": [script_dir],  # Only watch current directory
        "reload_excludes": [
            "venv/*",
            "venv/**/*",
            "env/*", 
            "env/**/*",
            "node_modules/*",
            "node_modules/**/*",
            "__pycache__/*",
            "*.pyc",
            ".git/*",
            ".git/**/*"
        ],
        "log_level": "info"
    }
    
    print("🚀 Starting FastAPI Server...")
    print("📂 Watching for changes in current directory only")
    print("🔧 Excluding virtual environment from file watching")
    print("🌐 Server will be available at: http://localhost:8000")
    print("⚡ Press CTRL+C to stop the server")
    print("-" * 50)
    
    try:
        uvicorn.run(**config)
    except KeyboardInterrupt:
        print("\n✅ Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == "__main__":
    start_server() 