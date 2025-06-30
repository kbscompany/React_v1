#!/usr/bin/env python3
"""
Comprehensive database check to find all items/data
"""

from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, inspect
import models
from database import engine

def comprehensive_db_check():
    """Check all tables and data in the database"""
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    
    try:
        print("=== COMPREHENSIVE DATABASE CHECK ===")
        
        # Get all table names
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        print(f"\nAll tables in database: {len(table_names)}")
        for table in table_names:
            print(f"- {table}")
        
        # Check each table for row counts
        print("\n=== TABLE ROW COUNTS ===")
        for table in table_names:
            try:
                result = session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"{table}: {count} rows")
            except Exception as e:
                print(f"{table}: Error - {e}")
        
        # Specifically check items table with raw SQL
        print("\n=== RAW SQL CHECK: ITEMS TABLE ===")
        try:
            result = session.execute(text("SELECT COUNT(*) FROM items"))
            count = result.scalar()
            print(f"Items table (raw SQL): {count} rows")
            
            # Get sample items with raw SQL
            result = session.execute(text("SELECT id, name, unit, category_id FROM items LIMIT 20"))
            items = result.fetchall()
            print(f"Sample items (raw SQL):")
            for item in items:
                print(f"  ID: {item.id}, Name: {item.name}, Unit: {item.unit}, Category: {item.category_id}")
        except Exception as e:
            print(f"Error with raw SQL items query: {e}")
        
        # Check if there are other item-like tables
        print("\n=== CHECKING FOR OTHER ITEM-LIKE TABLES ===")
        item_related_tables = [t for t in table_names if 'item' in t.lower() or 'ingredient' in t.lower() or 'product' in t.lower()]
        for table in item_related_tables:
            try:
                result = session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"{table}: {count} rows")
                
                if count > 0 and count < 50:  # Show content if reasonable size
                    result = session.execute(text(f"SELECT * FROM {table} LIMIT 5"))
                    rows = result.fetchall()
                    print(f"  Sample data:")
                    for row in rows:
                        print(f"    {dict(row._mapping)}")
            except Exception as e:
                print(f"Error checking {table}: {e}")
        
        # Check ORM models
        print("\n=== ORM MODEL CHECKS ===")
        
        # Items via ORM
        items_orm = session.query(models.Item).all()
        print(f"Items via ORM: {len(items_orm)}")
        
        # Check if there are any filters applied
        print(f"Sample ORM items:")
        for item in items_orm[:5]:
            print(f"  {item.id}: {item.name} (category: {item.category_id})")
        
        # Categories
        categories = session.query(models.InventoryCategory).all()
        print(f"Categories: {len(categories)}")
        for cat in categories:
            print(f"  {cat.id}: {cat.name}")
        
        # Check maximum ID to see if items were deleted
        try:
            max_id_result = session.execute(text("SELECT MAX(id) FROM items"))
            max_id = max_id_result.scalar()
            print(f"Maximum item ID: {max_id}")
            
            # Check for gaps in IDs
            if max_id:
                all_ids_result = session.execute(text("SELECT id FROM items ORDER BY id"))
                all_ids = [row.id for row in all_ids_result.fetchall()]
                print(f"Item IDs present: {all_ids[:10]}{'...' if len(all_ids) > 10 else ''}")
                
                if max_id > len(all_ids):
                    print(f"⚠️  Gap detected: Max ID is {max_id} but only {len(all_ids)} items exist")
        except Exception as e:
            print(f"Error checking max ID: {e}")
        
    except Exception as e:
        print(f"❌ Error during comprehensive check: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    comprehensive_db_check() 