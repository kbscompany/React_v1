#!/usr/bin/env python3
"""
Fix Foodics tokens table structure
"""

import mysql.connector
import os

def fix_foodics_tokens_table():
    """Check and fix the foodics_tokens table structure"""
    
    try:
        # Validate environment variables
        db_password = os.getenv("DB_PASSWORD")
        if not db_password:
            print("❌ DB_PASSWORD environment variable not set!")
            print("💡 Create a .env file with your database password")
            return False
        
        # Connect to MySQL database
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "root"),
            password=db_password,
            database=os.getenv("DB_NAME", "bakery_react"),
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci'
        )
        
        cursor = connection.cursor()
        
        print("🔧 Checking foodics_tokens table structure...")
        
        # Check if table exists and get its structure
        cursor.execute("SHOW TABLES LIKE 'foodics_tokens'")
        table_exists = cursor.fetchone() is not None
        
        if table_exists:
            print("✅ Table exists, checking structure...")
            cursor.execute("DESCRIBE foodics_tokens")
            columns = cursor.fetchall()
            
            print("Current columns:")
            for col in columns:
                print(f"  - {col[0]} ({col[1]})")
            
            # Check if api_token column exists
            column_names = [col[0] for col in columns]
            
            if 'api_token' not in column_names:
                print("❌ api_token column is missing!")
                print("🔄 Recreating table with correct structure...")
                
                # Drop and recreate the table
                cursor.execute("DROP TABLE foodics_tokens")
                
                # Create with correct structure
                cursor.execute("""
                    CREATE TABLE foodics_tokens (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        api_token TEXT NOT NULL,
                        is_active BOOLEAN DEFAULT TRUE,
                        configured_by VARCHAR(100),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_active (is_active),
                        INDEX idx_created (created_at)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)
                
                print("✅ Table recreated with correct structure")
            else:
                print("✅ api_token column exists")
        else:
            print("❌ Table doesn't exist, creating it...")
            
            # Create the table
            cursor.execute("""
                CREATE TABLE foodics_tokens (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    api_token TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    configured_by VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_active (is_active),
                    INDEX idx_created (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            print("✅ Table created successfully")
        
        # Verify the final structure
        print("\n🔍 Final table structure:")
        cursor.execute("DESCRIBE foodics_tokens")
        columns = cursor.fetchall()
        
        for col in columns:
            print(f"  - {col[0]} ({col[1]})")
        
        connection.commit()
        cursor.close()
        connection.close()
        
        print("\n🎉 foodics_tokens table is now ready!")
        return True
        
    except mysql.connector.Error as e:
        print(f"❌ MySQL Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Fixing Foodics Tokens Table Structure")
    print("=" * 50)
    
    success = fix_foodics_tokens_table()
    
    if success:
        print("\n✨ Table fix complete!")
        print("🔗 Try configuring Foodics API again at:")
        print("   http://127.0.0.1:8000/docs")
        print("   → POST /api/foodics/configure")
    else:
        print("\n❌ Table fix failed!")
        print("Please check your MySQL connection and try again.") 