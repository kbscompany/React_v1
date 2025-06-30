#!/usr/bin/env python3
"""
Helper script to reset passwords for users still using SHA-256 hashes
Run this after migrate_to_bcrypt_only.py
"""
import mysql.connector
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Users that still need password reset
SHA256_USERS = ['cost', 'finn']

def reset_user_password(username, new_password):
    """Reset a user's password to bcrypt hash"""
    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME", "bakery_react")
    )
    
    cursor = connection.cursor()
    new_hash = pwd_context.hash(new_password)
    
    cursor.execute(
        "UPDATE users SET password_hash = %s WHERE username = %s",
        (new_hash, username)
    )
    
    connection.commit()
    cursor.close()
    connection.close()
    
    print(f"✅ Reset password for {username}")

if __name__ == "__main__":
    print("SHA-256 users that need password reset:")
    for i, username in enumerate(SHA256_USERS, 1):
        print(f"{i}. {username}")
    
    print("\nExample usage:")
    print("reset_user_password('username', 'new_password')")
