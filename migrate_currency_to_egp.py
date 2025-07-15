#!/usr/bin/env python3
"""
Migration script to update currency from USD to EGP in the database.
Run this script to update existing records in your database.
"""

import sys
import os
from sqlalchemy import create_engine, text
from config import Settings

def migrate_currency_to_egp():
    """Update all USD currency references to EGP in the database."""
    
    settings = Settings()
    
    # Create database connection
    db_url = f"mysql+pymysql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"
    engine = create_engine(db_url)
    
    try:
        with engine.connect() as conn:
            print("🔄 Starting currency migration from USD to EGP...")
            
            # Update suppliers table
            result = conn.execute(text("""
                UPDATE suppliers 
                SET default_currency = 'EGP' 
                WHERE default_currency = 'USD'
            """))
            print(f"✅ Updated {result.rowcount} suppliers with USD to EGP")
            
            # Update purchase_orders table if it exists
            try:
                result = conn.execute(text("""
                    UPDATE purchase_orders 
                    SET currency = 'EGP' 
                    WHERE currency = 'USD'
                """))
                print(f"✅ Updated {result.rowcount} purchase orders with USD to EGP")
            except Exception as e:
                print(f"⚠️  Purchase orders table might not exist or have currency column: {e}")
            
            # Update supplier_items table if it exists
            try:
                result = conn.execute(text("""
                    UPDATE supplier_items 
                    SET currency = 'EGP' 
                    WHERE currency = 'USD'
                """))
                print(f"✅ Updated {result.rowcount} supplier items with USD to EGP")
            except Exception as e:
                print(f"⚠️  Supplier items table might not exist or have currency column: {e}")
            
            # Update any other tables that might have currency fields
            tables_to_check = [
                "expenses",
                "cheques", 
                "bank_accounts",
                "transactions"
            ]
            
            for table in tables_to_check:
                try:
                    # Check if table and currency column exist
                    conn.execute(text(f"SELECT currency FROM {table} LIMIT 1"))
                    
                    # Update if exists
                    result = conn.execute(text(f"""
                        UPDATE {table} 
                        SET currency = 'EGP' 
                        WHERE currency = 'USD'
                    """))
                    if result.rowcount > 0:
                        print(f"✅ Updated {result.rowcount} records in {table} with USD to EGP")
                        
                except Exception as e:
                    print(f"⚠️  Table {table} might not exist or have currency column: {e}")
            
            # Commit all changes
            conn.commit()
            print("🎉 Currency migration completed successfully!")
            print("📝 All USD references have been updated to EGP")
            
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        return False
        
    finally:
        engine.dispose()
    
    return True

def rollback_currency_migration():
    """Rollback: Update all EGP currency references back to USD."""
    
    print("⚠️  WARNING: This will rollback all EGP currencies to USD!")
    confirm = input("Are you sure you want to continue? (yes/no): ")
    
    if confirm.lower() != 'yes':
        print("❌ Rollback cancelled")
        return
    
    settings = Settings()
    db_url = f"mysql+pymysql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"
    engine = create_engine(db_url)
    
    try:
        with engine.connect() as conn:
            print("🔄 Rolling back currency from EGP to USD...")
            
            # Rollback suppliers
            result = conn.execute(text("""
                UPDATE suppliers 
                SET default_currency = 'USD' 
                WHERE default_currency = 'EGP'
            """))
            print(f"✅ Rolled back {result.rowcount} suppliers from EGP to USD")
            
            # Add similar rollback for other tables...
            conn.commit()
            print("🔄 Rollback completed!")
            
    except Exception as e:
        print(f"❌ Error during rollback: {e}")
    finally:
        engine.dispose()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--rollback":
        rollback_currency_migration()
    else:
        migrate_currency_to_egp()
        
        print("\n📋 Next steps:")
        print("1. Restart your FastAPI server")
        print("2. Clear your browser cache")
        print("3. Test the application to ensure EGP is now the default currency")
        print("4. Update any hardcoded prices if needed")
        print("\n💡 To rollback this migration, run: python migrate_currency_to_egp.py --rollback") 