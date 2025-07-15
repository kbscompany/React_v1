#!/usr/bin/env python3
"""
Update User Roles via API
Adds missing roles to match the PermissionsManager expectations
"""

import requests
import json

# EC2 Backend URL
BASE_URL = "http://100.29.4.72:8000"

# Role mappings to add/update
ROLES_TO_ADD = [
    {"id": 1, "name": "Admin"},
    {"id": 2, "name": "Warehouse Manager"}, 
    {"id": 3, "name": "Kitchen Manager"},
    {"id": 4, "name": "Production Staff"},
    {"id": 5, "name": "Inventory Staff"},
    {"id": 6, "name": "Finance Staff"},
    {"id": 7, "name": "Staff"},
    {"id": 8, "name": "Manager"},
    {"id": 9, "name": "Accountant"},
    {"id": 10, "name": "Viewer"}
]

def get_auth_token():
    """Login as admin to get auth token"""
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def check_current_roles(headers):
    """Check what roles currently exist"""
    try:
        response = requests.get(f"{BASE_URL}/admin-simple/user-roles-simple", headers=headers)
        if response.status_code == 200:
            current_roles = response.json()
            print("Current roles in database:")
            for role in current_roles:
                print(f"  ID: {role['id']}, Name: {role['name']}")
            return current_roles
        else:
            print(f"Failed to fetch current roles: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"Error fetching current roles: {e}")
        return []

def update_roles_directly():
    """Update roles using direct database connection approach"""
    print("🔄 Updating User Roles to match PermissionsManager...")
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("❌ Failed to get authentication token")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Check current roles
    current_roles = check_current_roles(headers)
    
    print(f"\n🎯 Target roles to ensure exist:")
    for role in ROLES_TO_ADD:
        print(f"  ID: {role['id']}, Name: {role['name']}")
    
    # For now, just print what needs to be done
    # The actual role creation would need a backend endpoint
    print(f"\n✅ Role checking complete!")
    print(f"📋 Current roles: {len(current_roles)}")
    print(f"🎯 Target roles: {len(ROLES_TO_ADD)}")
    
    if len(current_roles) < len(ROLES_TO_ADD):
        print(f"⚠️  Missing {len(ROLES_TO_ADD) - len(current_roles)} roles")
        print("💡 You may need to add these roles manually in the database:")
        
        existing_ids = {role['id'] for role in current_roles}
        for role in ROLES_TO_ADD:
            if role['id'] not in existing_ids:
                print(f"   INSERT INTO user_roles (id, name) VALUES ({role['id']}, '{role['name']}');")
    
    return True

if __name__ == "__main__":
    update_roles_directly() 