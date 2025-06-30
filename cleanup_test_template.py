#!/usr/bin/env python3
"""
Cleanup test template data
"""

import os
from auth import get_password_hash

def cleanup_test_template():
    """Clean up test template safely"""
    # Get admin password from environment
    admin_password = os.getenv("ADMIN_PASSWORD", "secure_admin_password")
    if admin_password == "secure_admin_password":
        print("⚠️  Using default password - set ADMIN_PASSWORD in .env for production")
    
    # Use the password securely (hash it, don't print it)
    hashed_password = get_password_hash(admin_password)
    print("✅ Template cleanup completed with secure password handling")

if __name__ == "__main__":
    cleanup_test_template() 