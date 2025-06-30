#!/usr/bin/env python3
"""
Security Audit and Fix Script for FastAPI Application
This script helps identify and fix common security vulnerabilities.
"""

import os
import re
import secrets
import hashlib
from pathlib import Path

def generate_secure_secret():
    """Generate a cryptographically secure secret key"""
    return secrets.token_urlsafe(64)

def check_hardcoded_passwords():
    """Find files with hardcoded passwords"""
    dangerous_patterns = [
        r'password\s*=\s*["\'][^"\']+["\']',
        r'PASSWORD\s*=\s*["\'][^"\']+["\']',
        r'Kbs@2024\$',
        r'admin123',
        r'password.*["\']admin["\']',
        r'mysql\.connector\.connect.*password\s*=\s*["\'][^"\']+["\']'
    ]
    
    vulnerable_files = []
    
    # Common file extensions to check
    extensions = ['*.py', '*.html', '*.js', '*.ts', '*.jsx', '*.tsx']
    
    for ext in extensions:
        for file_path in Path('.').rglob(ext):
            # Skip virtual environment and node_modules
            if 'venv' in str(file_path) or 'node_modules' in str(file_path):
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                for pattern in dangerous_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    if matches:
                        vulnerable_files.append({
                            'file': str(file_path),
                            'pattern': pattern,
                            'matches': matches
                        })
            except Exception as e:
                print(f"Could not read {file_path}: {e}")
    
    return vulnerable_files

def create_secure_env_file():
    """Create a secure .env file for production"""
    env_content = f"""# FastAPI Production Environment Configuration
# IMPORTANT: This file contains sensitive information - never commit to version control

# === CRITICAL SECURITY SETTINGS ===
SECRET_KEY={generate_secure_secret()}

# === DATABASE CONFIGURATION ===
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-secure-database-password-here-replace-this
DB_NAME=bakery_react

# === APPLICATION SETTINGS ===
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO

# === JWT CONFIGURATION ===
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256

# === CORS CONFIGURATION ===
# Replace with your actual frontend domain(s)
ALLOWED_ORIGINS=https://your-frontend-domain.com

# === FOODICS API CONFIGURATION ===
FOODICS_TOKEN_EXPIRY_HOURS=24
MAX_FAILED_SYNC_ATTEMPTS=3
SYNC_RATE_LIMIT_PER_HOUR=10

# === UPLOAD CONFIGURATION ===
MAX_UPLOAD_SIZE_MB=10
ALLOWED_FILE_EXTENSIONS=pdf,jpg,jpeg,png,doc,docx,xls,xlsx
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ Created secure .env file")
    print("⚠️  IMPORTANT: Update DB_PASSWORD and ALLOWED_ORIGINS before deployment!")

def create_gitignore_security():
    """Ensure sensitive files are in .gitignore"""
    sensitive_patterns = [
        '.env',
        '.env.local',
        '.env.production',
        '*.log',
        'uploads/',
        'storage/',
        '*.db',
        '__pycache__/',
        'venv/',
        'node_modules/',
        '.DS_Store',
        'Thumbs.db'
    ]
    
    gitignore_path = Path('.gitignore')
    existing_content = ""
    
    if gitignore_path.exists():
        with open(gitignore_path, 'r') as f:
            existing_content = f.read()
    
    new_patterns = []
    for pattern in sensitive_patterns:
        if pattern not in existing_content:
            new_patterns.append(pattern)
    
    if new_patterns:
        with open(gitignore_path, 'a') as f:
            f.write("\n# Security - Sensitive files\n")
            for pattern in new_patterns:
                f.write(f"{pattern}\n")
        
        print(f"✅ Added {len(new_patterns)} security patterns to .gitignore")

def security_recommendations():
    """Print security recommendations"""
    print("\n" + "="*60)
    print("🛡️  SECURITY RECOMMENDATIONS FOR EC2 DEPLOYMENT")
    print("="*60)
    
    print("\n1. 🔑 SECRET MANAGEMENT:")
    print("   - Use AWS Secrets Manager or Parameter Store")
    print("   - Never store secrets in code or config files")
    print("   - Rotate secrets regularly")
    
    print("\n2. 🔐 DATABASE SECURITY:")
    print("   - Use strong passwords (min 16 chars, mixed case, numbers, symbols)")
    print("   - Enable SSL/TLS for database connections")
    print("   - Restrict database access to application subnet only")
    print("   - Regular security updates for MySQL")
    
    print("\n3. 🌐 NETWORK SECURITY:")
    print("   - Use HTTPS only (Let's Encrypt or AWS Certificate Manager)")
    print("   - Configure security groups properly")
    print("   - Enable VPC Flow Logs")
    print("   - Use a reverse proxy (nginx/CloudFlare)")
    
    print("\n4. 🛡️  APPLICATION SECURITY:")
    print("   - Update all dependencies regularly")
    print("   - Implement rate limiting")
    print("   - Enable logging and monitoring")
    print("   - Use fail2ban for intrusion prevention")
    
    print("\n5. 💾 BACKUP & RECOVERY:")
    print("   - Automated database backups")
    print("   - Test restore procedures")
    print("   - Backup encryption")
    
    print("\n6. 📊 MONITORING:")
    print("   - CloudWatch for metrics and logs")
    print("   - Security scanning tools")
    print("   - Uptime monitoring")

def main():
    print("🔍 Starting Security Audit...")
    
    # Check for hardcoded passwords
    print("\n1. Checking for hardcoded passwords...")
    vulnerable_files = check_hardcoded_passwords()
    
    if vulnerable_files:
        print(f"⚠️  Found {len(vulnerable_files)} files with potential security issues:")
        for vuln in vulnerable_files:
            print(f"   📁 {vuln['file']}")
            for match in vuln['matches']:
                print(f"      🔍 {match}")
    else:
        print("✅ No hardcoded passwords found in checked files")
    
    # Create secure environment file
    print("\n2. Creating secure environment configuration...")
    if not os.path.exists('.env'):
        create_secure_env_file()
    else:
        print("⚠️  .env file already exists - review it manually")
    
    # Update .gitignore
    print("\n3. Updating .gitignore for security...")
    create_gitignore_security()
    
    # Print recommendations
    security_recommendations()
    
    print(f"\n🎯 IMMEDIATE ACTIONS REQUIRED:")
    print("1. Update all files with hardcoded passwords to use environment variables")
    print("2. Generate a strong database password")
    print("3. Update the SECRET_KEY in .env file")
    print("4. Configure ALLOWED_ORIGINS for your production domain")
    print("5. Remove or secure any test files with hardcoded credentials")
    print("6. Review and remove any debug/test endpoints before production")

if __name__ == "__main__":
    main() 