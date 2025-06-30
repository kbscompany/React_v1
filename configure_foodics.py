#!/usr/bin/env python3
"""
Foodics API Configuration Helper
This script helps you configure your Foodics API credentials safely.
"""

import requests
import json
from getpass import getpass

def configure_foodics_api():
    """Interactive configuration for Foodics API"""
    
    print("🔗 Foodics API Configuration")
    print("=" * 50)
    
    # Get API token from user
    print("\n📝 Please enter your Foodics API credentials:")
    print("   (You can find this in your Foodics dashboard under Settings > API)")
    
    api_token = input("Foodics API Token: ").strip()
    
    if not api_token:
        print("❌ API token is required!")
        return False
    
    # Prepare the configuration data
    config_data = {
        "api_token": api_token
    }
    
    try:
        print("\n🔄 Configuring Foodics API...")
        
        # Make the API call to configure credentials
        response = requests.post(
            "http://127.0.0.1:8000/api/foodics/configure",
            data=config_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Foodics API configured successfully!")
            print(f"   Status: {result.get('message', 'Configuration complete')}")
            
            # Test the connection
            print("\n🧪 Testing Foodics connection...")
            test_response = requests.post(
                "http://127.0.0.1:8000/api/foodics/test-connection",
                timeout=30
            )
            
            if test_response.status_code == 200:
                test_result = test_response.json()
                print("✅ Connection test successful!")
                print(f"   Message: {test_result.get('message', 'Connected to Foodics')}")
                
                # Get available branches
                print("\n📍 Fetching available branches...")
                branches_response = requests.get(
                    "http://127.0.0.1:8000/api/foodics/branches",
                    timeout=30
                )
                
                if branches_response.status_code == 200:
                    branches = branches_response.json()
                    print(f"✅ Found {len(branches.get('branches', []))} branches:")
                    
                    for i, branch in enumerate(branches.get('branches', []), 1):
                        print(f"   {i}. {branch.get('name', 'Unknown')} (ID: {branch.get('id', 'N/A')})")
                    
                    # Ask if user wants to set a default branch
                    if branches.get('branches'):
                        setup_default = input("\n🎯 Would you like to set a default branch? (y/n): ").lower()
                        
                        if setup_default == 'y':
                            try:
                                branch_num = int(input("Enter branch number: ")) - 1
                                selected_branch = branches['branches'][branch_num]
                                
                                branch_config = {
                                    "branch_id": selected_branch['id'],
                                    "branch_name": selected_branch['name']
                                }
                                
                                default_response = requests.post(
                                    "http://127.0.0.1:8000/api/foodics/configure-branch",
                                    data=branch_config,
                                    timeout=30
                                )
                                
                                if default_response.status_code == 200:
                                    print(f"✅ Default branch set to: {selected_branch['name']}")
                                else:
                                    print("⚠️ Could not set default branch")
                                
                            except (ValueError, IndexError):
                                print("⚠️ Invalid selection")
                    
                    return True
                else:
                    print("⚠️ Could not fetch branches, but connection is working")
                    return True
            else:
                print("❌ Connection test failed")
                print(f"   Error: {test_response.text}")
                return False
        else:
            print("❌ Configuration failed!")
            print(f"   Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print("❌ Connection error!")
        print(f"   Make sure the FastAPI server is running on http://127.0.0.1:8000")
        print(f"   Error: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def check_server_status():
    """Check if the FastAPI server is running"""
    try:
        response = requests.get("http://127.0.0.1:8000/", timeout=5)
        if response.status_code == 200:
            return True
    except:
        pass
    return False

def main():
    """Main configuration function"""
    print("🚀 Foodics API Integration Setup")
    print("=" * 50)
    
    # Check if server is running
    if not check_server_status():
        print("❌ FastAPI server is not running!")
        print("   Please start the server first:")
        print("   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000")
        return
    
    print("✅ FastAPI server is running")
    
    # Configure Foodics API
    success = configure_foodics_api()
    
    if success:
        print("\n🎉 Configuration Complete!")
        print("=" * 50)
        print("✅ Foodics API is now configured and ready to use")
        print("\n📚 Available endpoints:")
        print("   GET  /api/foodics/status - Check integration status")
        print("   GET  /api/foodics/branches - List all branches")
        print("   GET  /api/foodics/default-branch/sales - Get sales data")
        print("   GET  /api/reports/inventory-summary - Inventory reports")
        print("   GET  /api/search/global - Global search")
        print("\n🌐 View all endpoints: http://127.0.0.1:8000/docs")
    else:
        print("\n❌ Configuration failed. Please check your credentials and try again.")

if __name__ == "__main__":
    main() 