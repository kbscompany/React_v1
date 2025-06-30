"""
Add warehouse_id column to purchase_orders table
"""

import mysql.connector
from mysql.connector import Error
import os

def add_warehouse_id_column():
    """Main function to fix warehouse column"""
    # Get database password from environment
    db_password = os.getenv("DB_PASSWORD")
    if not db_password:
        print("❌ DB_PASSWORD environment variable not set!")
        print("💡 Create a .env file with your database password")
        return False
    
    connection = None
    try:
        # Establish database connection
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=db_password,  # Use environment variable
            database=os.getenv("DB_NAME", "bakery_react")
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Check if warehouse_id column already exists
            cursor.execute("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'bakery_react' 
                AND TABLE_NAME = 'purchase_orders'
                AND COLUMN_NAME = 'warehouse_id'
            """)
            
            existing_columns = cursor.fetchall()
            
            if not existing_columns:
                print("Adding warehouse_id column to purchase_orders table...")
                
                # Add warehouse_id column
                cursor.execute("""
                    ALTER TABLE purchase_orders 
                    ADD COLUMN warehouse_id INT NULL,
                    ADD CONSTRAINT fk_purchase_orders_warehouse 
                    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) 
                    ON DELETE SET NULL
                """)
                
                connection.commit()
                print("✅ Successfully added warehouse_id column to purchase_orders table")
            else:
                print("✅ warehouse_id column already exists in purchase_orders table")
                
            # Also add the received tracking columns if they don't exist
            cursor.execute("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'bakery_react' 
                AND TABLE_NAME = 'purchase_orders'
                AND COLUMN_NAME IN ('received_date', 'received_by')
            """)
            
            received_columns = [col[0] for col in cursor.fetchall()]
            
            if 'received_date' not in received_columns:
                cursor.execute("""
                    ALTER TABLE purchase_orders 
                    ADD COLUMN received_date DATETIME NULL
                """)
                print("✅ Added received_date column")
                
            if 'received_by' not in received_columns:
                cursor.execute("""
                    ALTER TABLE purchase_orders 
                    ADD COLUMN received_by INT NULL,
                    ADD CONSTRAINT fk_purchase_orders_received_by 
                    FOREIGN KEY (received_by) REFERENCES users(id) 
                    ON DELETE SET NULL
                """)
                print("✅ Added received_by column")
                
            connection.commit()
            
    except Error as e:
        print(f"❌ Error: {e}")
        if connection:
            connection.rollback()
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    add_warehouse_id_column() 