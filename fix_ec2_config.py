#!/usr/bin/env python3
"""
Script to fix EC2 configuration issues
This creates the necessary .env file content that should be copied to EC2
"""

env_content = """SECRET_KEY=production-secret-key-minimum-32-characters-long-for-jwt-tokens-ec2
ACCESS_TOKEN_EXPIRE_MINUTES=30
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Kbs@2024$
DB_NAME=bakery_react
ADMIN_PASSWORD=admin123
DEBUG=false
ENVIRONMENT=production
LOG_LEVEL=INFO
MAX_UPLOAD_SIZE_MB=10
ALLOWED_FILE_EXTENSIONS=pdf,jpg,jpeg,png,doc,docx,xls,xlsx
ALLOWED_ORIGINS=http://100.29.4.72:3000,http://100.29.4.72:8000,http://localhost:3000,http://localhost:5173
"""

print("=== EC2 Configuration Fix ===")
print("\n1. Copy the following content to /home/ec2-user/React_v1/.env on your EC2 server:")
print("-" * 50)
print(env_content)
print("-" * 50)

print("\n2. Then restart the FastAPI service:")
print("sudo systemctl restart fastapi.service")
print("sudo systemctl status fastapi.service")

print("\n3. Check the logs:")
print("sudo journalctl -u fastapi.service -f")

print("\n=== Alternative: Use the updated config.py ===")
print("The config.py has been updated with fallback values.")
print("You can also copy the updated config.py to EC2:")
print("scp config.py ec2-user@100.29.4.72:/home/ec2-user/React_v1/")

if __name__ == "__main__":
    # Write the .env content to a local file for easy copying
    with open(".env.ec2", "w") as f:
        f.write(env_content)
    print(f"\n✅ Created .env.ec2 file locally for easy copying to EC2") 