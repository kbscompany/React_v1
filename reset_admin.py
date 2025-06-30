#!/usr/bin/env python3
"""
Delete and recreate admin user
"""

import mysql.connector
from auth import get_password_hash
import os
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_admin_user():
    """Delete and recreate the admin user"""
    
    try:
        print("=== RESETTING ADMIN USER ===")
        
        # Get direct MySQL connection
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Kbs@2024$',
            database='bakery_react'
        )
        cursor = connection.cursor()
        
        # Handle foreign key constraints and delete existing admin user
        print("1. Deleting existing admin user...")
        
        # First get the admin user ID
        cursor.execute("SELECT id FROM users WHERE username = 'admin'")
        admin_user = cursor.fetchone()
        
        if admin_user:
            admin_user_id = admin_user[0]
            print(f"   Found admin user with ID: {admin_user_id}")
            
            # Delete or update foreign key references
            print("   Cleaning up foreign key references...")
            
            # Update bank_account_access records to NULL
            cursor.execute("UPDATE bank_account_access SET granted_by = NULL WHERE granted_by = %s", (admin_user_id,))
            print(f"   Updated {cursor.rowcount} bank_account_access records")
            
            # Update any other tables that might reference the user
            cursor.execute("UPDATE stock_movements SET user_id = NULL WHERE user_id = %s", (admin_user_id,))
            print(f"   Updated {cursor.rowcount} stock_movements records")
            
            cursor.execute("UPDATE waste_logs SET user_id = NULL WHERE user_id = %s", (admin_user_id,))
            print(f"   Updated {cursor.rowcount} waste_logs records")
            
            cursor.execute("UPDATE waste_logs SET approved_by = NULL WHERE approved_by = %s", (admin_user_id,))
            print(f"   Updated {cursor.rowcount} waste_logs approval records")
            
            # Now delete the admin user
            cursor.execute("DELETE FROM users WHERE username = 'admin'")
            deleted_count = cursor.rowcount
            print(f"   ✅ Deleted {deleted_count} admin user(s)")
        else:
            print("   No existing admin user found")
        
        # Get admin role ID
        print("2. Finding admin role...")
        cursor.execute("SELECT id FROM user_roles WHERE name = 'Admin'")
        admin_role = cursor.fetchone()
        
        if not admin_role:
            print("   ❌ Admin role not found - creating it...")
            cursor.execute("INSERT INTO user_roles (name) VALUES ('Admin')")
            admin_role_id = cursor.lastrowid
            print(f"   ✅ Created admin role with ID: {admin_role_id}")
        else:
            admin_role_id = admin_role[0]
            print(f"   ✅ Admin role ID: {admin_role_id}")
        
        # Create new admin user with proper password hash
        print("3. Creating new admin user...")
        new_password = "admin123"
        password_hash = get_password_hash(new_password)
        
        # Insert admin user with only required columns
        cursor.execute("""
            INSERT INTO users (username, password_hash, role_id)
            VALUES (%s, %s, %s)
        """, ('admin', password_hash, admin_role_id))
        
        user_id = cursor.lastrowid
        connection.commit()
        print(f"   ✅ Created admin user with ID: {user_id}")
        print(f"   Username: admin")
        print(f"   Password: {new_password}")
        
        # Verify the user was created
        cursor.execute("SELECT id, username, role_id FROM users WHERE username = 'admin'")
        user = cursor.fetchone()
        
        if user:
            print(f"\n4. Verification successful:")
            print(f"   User ID: {user[0]}")
            print(f"   Username: {user[1]}")
            print(f"   Role ID: {user[2]}")
        else:
            print("   ❌ Failed to verify user creation")
            
        cursor.close()
        connection.close()
        
        print("\n✅ Admin user reset completed successfully!")
        print(f"   Login with: admin / {new_password}")
        
    except Exception as e:
        print(f"❌ Error resetting admin user: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Reset admin password safely"""
    # Get database password from environment
    db_password = os.getenv("DB_PASSWORD")
    if not db_password:
        print("❌ DB_PASSWORD environment variable not set!")
        print("💡 Create a .env file with your database password")
        return False
    
    # Get new admin password from environment or prompt user
    new_admin_password = os.getenv("ADMIN_PASSWORD")
    if not new_admin_password:
        print("⚠️  ADMIN_PASSWORD not set in environment")
        new_admin_password = input("Enter new admin password (or press Enter for 'admin123'): ").strip()
        if not new_admin_password:
            new_admin_password = "admin123"
            print("⚠️  Using default password 'admin123' - change this immediately!")
    
    try:
        # Connect to database
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=db_password,  # Use environment variable
            database=os.getenv("DB_NAME", "bakery_react")
        )
        
        cursor = connection.cursor()
        
        # Hash the new password
        hashed_password = pwd_context.hash(new_admin_password)
        
        # Update admin password
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE username = 'admin'",
            (hashed_password,)
        )
        
        if cursor.rowcount > 0:
            connection.commit()
            print(f"✅ Admin password updated successfully")
            print("🔐 Make sure to update ADMIN_PASSWORD in your .env file")
        else:
            print("❌ Admin user not found")
            
        cursor.close()
        connection.close()
        
        print("\n✅ Admin user reset completed successfully!")
        print(f"   Login with: admin / {new_admin_password}")
        
    except Exception as e:
        print(f"❌ Error resetting admin user: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    reset_admin_user() 