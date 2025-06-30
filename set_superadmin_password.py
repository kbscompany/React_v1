#!/usr/bin/env python3
"""
Set superadmin password to KbHdp878$
"""

import os
import sys
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from database import engine, get_db
from auth import get_password_hash, verify_password
import models

def set_superadmin_password():
    """Set the admin user password to KbHdp878$"""
    
    target_password = "KbHdp878$"
    
    print("🔧 Setting superadmin password...")
    print("=" * 50)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Ensure user roles exist
        print("1. Checking user roles...")
        
        # Check if roles exist, create if missing
        roles_needed = [
            (1, "Admin"),
            (2, "Warehouse Manager"), 
            (3, "Staff")
        ]
        
        for role_id, role_name in roles_needed:
            existing_role = db.query(models.UserRole).filter(models.UserRole.id == role_id).first()
            if not existing_role:
                print(f"   Creating role: {role_name}")
                new_role = models.UserRole(id=role_id, name=role_name)
                db.add(new_role)
            else:
                print(f"   ✅ Role exists: {role_name}")
        
        db.commit()
        
        # Check if admin user exists
        print("\n2. Checking admin user...")
        admin_user = db.query(models.User).filter(models.User.username == "admin").first()
        
        if admin_user:
            print(f"   ✅ Admin user found (ID: {admin_user.id})")
            
            # Verify current password
            if verify_password(target_password, admin_user.password_hash):
                print(f"   ✅ Password is already set to target value")
                return True
            
            # Update password
            print(f"   🔄 Updating admin password...")
            hashed_password = get_password_hash(target_password)
            admin_user.password_hash = hashed_password
            admin_user.role_id = 1  # Ensure admin role
            admin_user.is_active = True  # Ensure active
            
        else:
            print("   ❌ Admin user not found - creating new admin user")
            hashed_password = get_password_hash(target_password)
            admin_user = models.User(
                username="admin",
                password_hash=hashed_password,
                role_id=1,  # Admin role
                is_active=True
            )
            db.add(admin_user)
        
        db.commit()
        
        # Verify the password was set correctly
        print("\n3. Verifying password...")
        admin_user_check = db.query(models.User).filter(models.User.username == "admin").first()
        
        if admin_user_check and verify_password(target_password, admin_user_check.password_hash):
            print("   ✅ Password verification successful!")
            print(f"   👑 Superadmin credentials: admin / {target_password}")
        else:
            print("   ❌ Password verification failed!")
            return False
            
        # Display user info
        print(f"\n4. User details:")
        print(f"   Username: {admin_user_check.username}")
        print(f"   Role ID: {admin_user_check.role_id}")
        print(f"   Active: {admin_user_check.is_active}")
        print(f"   Created: {admin_user_check.created_at}")
        
        print(f"\n✅ SUCCESS: Superadmin password set to: {target_password}")
        return True
        
    except Exception as e:
        print(f"❌ Error setting superadmin password: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def test_api_connection():
    """Test basic API functionality"""
    print("\n" + "=" * 50)
    print("🔍 Testing API Connection...")
    print("=" * 50)
    
    try:
        import requests
        
        # Test root endpoint
        print("1. Testing root endpoint...")
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            print("   ✅ API is running")
            data = response.json()
            print(f"   📝 Message: {data.get('message', 'No message')}")
        else:
            print(f"   ❌ API returned status {response.status_code}")
            
        # Test login with new password
        print("\n2. Testing login...")
        login_data = {
            'username': 'admin',
            'password': 'KbHdp878$'
        }
        
        login_response = requests.post(
            "http://localhost:8000/token", 
            data=login_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=5
        )
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            token = token_data.get('access_token')
            print("   ✅ Login successful!")
            print(f"   🔑 Token received (length: {len(token)})")
            
            # Test protected endpoint
            print("\n3. Testing protected endpoint...")
            headers = {'Authorization': f'Bearer {token}'}
            user_response = requests.get("http://localhost:8000/users/me", headers=headers, timeout=5)
            
            if user_response.status_code == 200:
                user_data = user_response.json()
                print("   ✅ Protected endpoint accessible")
                print(f"   👤 User: {user_data.get('username')}")
                print(f"   👑 Role: {user_data.get('role', {}).get('name', 'Unknown')}")
            else:
                print(f"   ❌ Protected endpoint failed: {user_response.status_code}")
                
        else:
            print(f"   ❌ Login failed: {login_response.status_code}")
            if login_response.text:
                print(f"   📝 Error: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Could not connect to API (is the server running?)")
        print("   💡 Start the server with: python main.py")
    except Exception as e:
        print(f"   ❌ API test error: {e}")

def main():
    print("🛡️  SUPERADMIN PASSWORD SETUP")
    print("=" * 50)
    print("Target password: KbHdp878$")
    print("")
    
    # Set the password
    success = set_superadmin_password()
    
    if success:
        # Test API
        test_api_connection()
        
        print("\n" + "=" * 50)
        print("🎉 SETUP COMPLETE!")
        print("=" * 50)
        print("✅ Superadmin password set successfully")
        print("✅ API connection tested")
        print("")
        print("🔐 Login credentials:")
        print("   Username: admin")
        print("   Password: KbHdp878$")
        print("")
        print("🚀 Next steps:")
        print("   1. Start the API server: python main.py")
        print("   2. Start the frontend: npm run dev")
        print("   3. Login with the credentials above")
        print("   4. Access SuperAdmin Panel for full system control")
        
    else:
        print("\n❌ Setup failed - please check the errors above")

if __name__ == "__main__":
    main() 