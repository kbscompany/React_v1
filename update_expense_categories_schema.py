#!/usr/bin/env python3
"""
Database migration script to update expense_categories table with hierarchical structure
Adds parent_id, path, level, sort_order, icon, color columns and updates existing data
"""

import os
import sys
from sqlalchemy import create_engine, text, Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql import func
from datetime import datetime
from urllib.parse import quote_plus

# Get database configuration from environment variables
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "bakery_react")

# Validate critical environment variables
if not DB_PASSWORD:
    raise ValueError("❌ DB_PASSWORD environment variable must be set!")

DB_PASSWORD_ENCODED = quote_plus(DB_PASSWORD)
DATABASE_URL = f"mysql+mysqlconnector://root:{DB_PASSWORD_ENCODED}@localhost:3306/bakery_react"

def create_connection():
    """Create database connection"""
    try:
        engine = create_engine(DATABASE_URL)
        return engine
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return None

def update_expense_categories_table():
    """Update expense_categories table with hierarchical structure"""
    engine = create_connection()
    if not engine:
        return False
    
    try:
        with engine.connect() as connection:
            # Start transaction
            trans = connection.begin()
            
            print("🔧 Updating expense_categories table structure...")
            
            # Check if new columns already exist
            result = connection.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'bakery_react' 
                AND TABLE_NAME = 'expense_categories'
                AND COLUMN_NAME IN ('parent_id', 'path', 'level', 'sort_order', 'icon', 'color', 'updated_at')
            """))
            
            existing_columns = [row[0] for row in result.fetchall()]
            
            # Add missing columns
            if 'parent_id' not in existing_columns:
                connection.execute(text("""
                    ALTER TABLE expense_categories 
                    ADD COLUMN parent_id INT NULL,
                    ADD FOREIGN KEY (parent_id) REFERENCES expense_categories(id) ON DELETE CASCADE
                """))
                print("✅ Added parent_id column with foreign key constraint")
            
            if 'path' not in existing_columns:
                connection.execute(text("""
                    ALTER TABLE expense_categories 
                    ADD COLUMN path VARCHAR(1000) NULL
                """))
                print("✅ Added path column")
            
            if 'level' not in existing_columns:
                connection.execute(text("""
                    ALTER TABLE expense_categories 
                    ADD COLUMN level INT DEFAULT 0 NOT NULL
                """))
                print("✅ Added level column")
            
            if 'sort_order' not in existing_columns:
                connection.execute(text("""
                    ALTER TABLE expense_categories 
                    ADD COLUMN sort_order INT DEFAULT 0 NOT NULL
                """))
                print("✅ Added sort_order column")
            
            if 'icon' not in existing_columns:
                connection.execute(text("""
                    ALTER TABLE expense_categories 
                    ADD COLUMN icon VARCHAR(50) NULL
                """))
                print("✅ Added icon column")
            
            if 'color' not in existing_columns:
                connection.execute(text("""
                    ALTER TABLE expense_categories 
                    ADD COLUMN color VARCHAR(7) NULL
                """))
                print("✅ Added color column")
            
            if 'updated_at' not in existing_columns:
                connection.execute(text("""
                    ALTER TABLE expense_categories 
                    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                """))
                print("✅ Added updated_at column")
            
            # Remove unique constraint from name if it exists
            try:
                connection.execute(text("""
                    ALTER TABLE expense_categories 
                    DROP INDEX name
                """))
                print("✅ Removed unique constraint from name column")
            except:
                print("ℹ️ No unique constraint found on name column")
            
            # Update existing categories to set their paths and levels
            categories = connection.execute(text("""
                SELECT id, name, parent_id FROM expense_categories ORDER BY id
            """)).fetchall()
            
            for category in categories:
                category_id, name, parent_id = category
                if parent_id is None:
                    # Root category
                    path = name
                    level = 0
                else:
                    # Get parent path
                    parent_result = connection.execute(text("""
                        SELECT path, level FROM expense_categories WHERE id = :parent_id
                    """), {"parent_id": parent_id}).fetchone()
                    
                    if parent_result:
                        parent_path, parent_level = parent_result
                        path = f"{parent_path}/{name}" if parent_path else name
                        level = parent_level + 1
                    else:
                        path = name
                        level = 0
                
                # Update the category
                connection.execute(text("""
                    UPDATE expense_categories 
                    SET path = :path, level = :level 
                    WHERE id = :category_id
                """), {"path": path, "level": level, "category_id": category_id})
            
            print("✅ Updated paths and levels for existing categories")
            
            # Create some default categories if table is empty or has very few entries
            existing_count = connection.execute(text("""
                SELECT COUNT(*) FROM expense_categories
            """)).fetchone()[0]
            
            if existing_count < 3:
                print("📂 Creating default expense categories...")
                
                default_categories = [
                    # Root categories
                    {"name": "Office Expenses", "icon": "fas fa-building", "color": "#007bff", "description": "General office and administrative expenses"},
                    {"name": "Equipment", "icon": "fas fa-laptop", "color": "#28a745", "description": "Hardware and equipment purchases"},
                    {"name": "Operations", "icon": "fas fa-cogs", "color": "#fd7e14", "description": "Day-to-day operational expenses"},
                    {"name": "Marketing", "icon": "fas fa-bullhorn", "color": "#e83e8c", "description": "Marketing and advertising expenses"},
                    {"name": "Travel", "icon": "fas fa-plane", "color": "#6610f2", "description": "Travel and transportation expenses"},
                ]
                
                # Insert root categories
                for cat in default_categories:
                    connection.execute(text("""
                        INSERT INTO expense_categories (name, description, icon, color, path, level, sort_order)
                        VALUES (:name, :description, :icon, :color, :name, 0, 0)
                    """), cat)
                
                # Get inserted IDs for subcategories
                office_id = connection.execute(text("""
                    SELECT id FROM expense_categories WHERE name = 'Office Expenses'
                """)).fetchone()[0]
                
                equipment_id = connection.execute(text("""
                    SELECT id FROM expense_categories WHERE name = 'Equipment'
                """)).fetchone()[0]
                
                # Add subcategories
                subcategories = [
                    # Office subcategories
                    {"name": "Supplies", "parent_id": office_id, "icon": "fas fa-paperclip", "color": "#007bff"},
                    {"name": "Utilities", "parent_id": office_id, "icon": "fas fa-plug", "color": "#007bff"},
                    {"name": "Rent", "parent_id": office_id, "icon": "fas fa-home", "color": "#007bff"},
                    
                    # Equipment subcategories
                    {"name": "Computers", "parent_id": equipment_id, "icon": "fas fa-desktop", "color": "#28a745"},
                    {"name": "Furniture", "parent_id": equipment_id, "icon": "fas fa-chair", "color": "#28a745"},
                    {"name": "Software", "parent_id": equipment_id, "icon": "fas fa-code", "color": "#28a745"},
                ]
                
                for subcat in subcategories:
                    path = f"{connection.execute(text('SELECT name FROM expense_categories WHERE id = :parent_id'), {'parent_id': subcat['parent_id']}).fetchone()[0]}/{subcat['name']}"
                    connection.execute(text("""
                        INSERT INTO expense_categories (name, parent_id, icon, color, path, level, sort_order)
                        VALUES (:name, :parent_id, :icon, :color, :path, 1, 0)
                    """), {**subcat, "path": path})
                
                print("✅ Created default expense categories hierarchy")
            
            # Commit transaction
            trans.commit()
            print("🎉 Expense categories table updated successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error updating expense_categories table: {e}")
        try:
            trans.rollback()
        except:
            pass
        return False

def verify_update():
    """Verify the table update was successful"""
    engine = create_connection()
    if not engine:
        return False
    
    try:
        with engine.connect() as connection:
            # Check table structure
            result = connection.execute(text("""
                DESCRIBE expense_categories
            """))
            
            columns = [row[0] for row in result.fetchall()]
            required_columns = ['id', 'name', 'description', 'parent_id', 'path', 'level', 'sort_order', 'icon', 'color', 'is_active', 'created_at', 'updated_at']
            
            print("\n📋 Current table structure:")
            for col in columns:
                status = "✅" if col in required_columns else "❓"
                print(f"{status} {col}")
            
            # Check categories count
            count = connection.execute(text("""
                SELECT COUNT(*) FROM expense_categories
            """)).fetchone()[0]
            
            print(f"\n📊 Total categories: {count}")
            
            # Show sample hierarchy
            hierarchy = connection.execute(text("""
                SELECT id, name, parent_id, path, level, icon, color 
                FROM expense_categories 
                ORDER BY level, sort_order, name 
                LIMIT 10
            """)).fetchall()
            
            print("\n🌳 Sample category hierarchy:")
            for cat in hierarchy:
                indent = "  " * cat[4]  # level
                icon = cat[5] or ""
                color = cat[6] or ""
                print(f"{indent}📁 {cat[1]} (ID: {cat[0]}, Level: {cat[4]}, Path: {cat[3]}) {icon} {color}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error verifying update: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting expense categories schema update...")
    print("=" * 60)
    
    # Update the table
    if update_expense_categories_table():
        print("\n" + "=" * 60)
        verify_update()
        print("\n🎉 Migration completed successfully!")
        print("\nNext steps:")
        print("1. Restart your FastAPI server")
        print("2. Test the new category management endpoints")
        print("3. Check the frontend for tree view functionality")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1) 