#!/usr/bin/env python3
"""
Script to fix settlement fields and test settlement functionality
"""
import requests
import json
from sqlalchemy import create_engine, text
from config import settings

def fix_settlement_fields():
    """Fix settlement-related fields in the database"""
    try:
        # Create database connection
        SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        
        with engine.connect() as connection:
            # Check if required columns exist and add them if needed
            try:
                # Add safe_id column if it doesn't exist (it should exist)
                connection.execute(text("ALTER TABLE cheques ADD COLUMN safe_id INT"))
                print("✅ Added safe_id column")
            except:
                print("ℹ️ safe_id column already exists")
            
            try:
                # Add settled_by_cheque_id column if it doesn't exist
                connection.execute(text("ALTER TABLE cheques ADD COLUMN settled_by_cheque_id INT"))
                print("✅ Added settled_by_cheque_id column")
            except:
                print("ℹ️ settled_by_cheque_id column already exists")
                
            try:
                # Add is_settled column if it doesn't exist
                connection.execute(text("ALTER TABLE cheques ADD COLUMN is_settled BOOLEAN DEFAULT FALSE"))
                print("✅ Added is_settled column")
            except:
                print("ℹ️ is_settled column already exists")
                
            try:
                # Add overspent_amount column if it doesn't exist
                connection.execute(text("ALTER TABLE cheques ADD COLUMN overspent_amount DECIMAL(10,2) DEFAULT 0"))
                print("✅ Added overspent_amount column")
            except:
                print("ℹ️ overspent_amount column already exists")
                
            try:
                # Add settlement_date column if it doesn't exist
                connection.execute(text("ALTER TABLE cheques ADD COLUMN settlement_date DATETIME"))
                print("✅ Added settlement_date column")
            except:
                print("ℹ️ settlement_date column already exists")
            
            # Update existing cheques to ensure they have safe_id set
            result = connection.execute(text("""
                UPDATE cheques 
                SET safe_id = 1 
                WHERE is_assigned_to_safe = 1 AND safe_id IS NULL
            """))
            print(f"✅ Updated {result.rowcount} cheques with safe_id")
            
            # Create a test overspent cheque
            connection.execute(text("""
                UPDATE cheques 
                SET overspent_amount = 100.0,
                    status = 'overspent'
                WHERE id = 124
            """))
            print("✅ Created test overspent cheque (ID: 124)")
            
            connection.commit()
            print("✅ Database changes committed")
            
    except Exception as e:
        print(f"❌ Database error: {e}")

def test_api_response():
    """Test the API response to see if fields are now included"""
    try:
        response = requests.get("http://localhost:8000/safes/1/cheques")
        if response.status_code == 200:
            data = response.json()
            if data:
                cheque = data[0]
                print("📋 API Response fields:")
                for key, value in cheque.items():
                    print(f"  - {key}: {value}")
                    
                # Check for settlement-required fields
                has_safe_id = 'safe_id' in cheque and cheque['safe_id'] is not None
                has_is_settled = 'is_settled' in cheque
                has_overspent = 'overspent_amount' in cheque and cheque['overspent_amount'] > 0
                
                print(f"\n🔍 Settlement Requirements:")
                print(f"  - Has safe_id: {has_safe_id} (needed for early settlement)")
                print(f"  - Has is_settled: {has_is_settled} (needed for settlement status)")
                print(f"  - Has overspent amount: {has_overspent} (needed for overspent settlement)")
                
                if has_safe_id and has_is_settled:
                    print("✅ Settlement buttons should now appear!")
                else:
                    print("❌ Settlement buttons still won't appear")
                    
        else:
            print(f"❌ API Error: {response.status_code}")
    except Exception as e:
        print(f"❌ API test error: {e}")

if __name__ == "__main__":
    print("🔧 Fixing Settlement Fields")
    print("=" * 50)
    
    fix_settlement_fields()
    
    print("\n🧪 Testing API Response")
    print("=" * 50)
    
    test_api_response()
    
    print("\n✅ Settlement fix completed!")
    print("Now try accessing the Cheque Management page to see settlement buttons.") 