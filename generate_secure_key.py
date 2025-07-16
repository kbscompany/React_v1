#!/usr/bin/env python3
"""
Generate a cryptographically secure secret key for production use
"""
import secrets
import string

def generate_production_secret_key(length=64):
    """Generate a cryptographically secure secret key"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

if __name__ == "__main__":
    key = generate_production_secret_key()
    print("=== SECURE SECRET KEY FOR PRODUCTION ===")
    print(f"SECRET_KEY={key}")
    print("\n⚠️  IMPORTANT:")
    print("1. Copy this key to your EC2 .env file")
    print("2. Keep this key secret and secure")
    print("3. Don't commit this key to version control")
    print("4. Use different keys for different environments") 