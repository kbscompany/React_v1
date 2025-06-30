#!/usr/bin/env python3
"""
Database connection utility for MySQL
"""

import mysql.connector
import os
from typing import Optional

def get_connection():
    """
    Get MySQL connection using the same configuration as FastAPI app
    Returns a mysql.connector connection object
    """
    # Validate that DB_PASSWORD is set
    db_password = os.getenv("DB_PASSWORD")
    if not db_password:
        raise ValueError("❌ DB_PASSWORD environment variable must be set. Never use hardcoded passwords!")
    
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "root"),
            password=db_password,  # No fallback - must be provided via environment
            database=os.getenv("DB_NAME", "bakery_react"),
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci',
            autocommit=False
        )
        return connection
    except mysql.connector.Error as e:
        print(f"Error connecting to MySQL: {e}")
        print("💡 Make sure your .env file contains the correct DB_PASSWORD")
        raise

def get_ingredient_packages(item_id: int, supplier_id: Optional[int] = None):
    """
    Get available packages for an ingredient/item
    Replicates existing Streamlit logic
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        if supplier_id:
            # Get supplier-specific packages
            query = """
                SELECT sp.*, i.name as item_name, i.unit as base_unit
                FROM supplier_packages sp
                JOIN items i ON sp.item_id = i.id
                WHERE sp.item_id = %s AND sp.supplier_id = %s
                ORDER BY sp.package_size_kg ASC
            """
            cursor.execute(query, (item_id, supplier_id))
        else:
            # Get all packages for the item
            query = """
                SELECT sp.*, i.name as item_name, i.unit as base_unit, s.name as supplier_name
                FROM supplier_packages sp
                JOIN items i ON sp.item_id = i.id
                JOIN suppliers s ON sp.supplier_id = s.id
                WHERE sp.item_id = %s
                ORDER BY sp.supplier_id, sp.package_size_kg ASC
            """
            cursor.execute(query, (item_id,))
        
        packages = cursor.fetchall()
        return packages
        
    finally:
        cursor.close()
        conn.close()

def get_supplier_default_price(item_id: int, supplier_id: int):
    """
    Get the default price for an item from a specific supplier
    Replicates existing Streamlit logic
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check supplier_items table first
        query = """
            SELECT supplier_price
            FROM supplier_items
            WHERE item_id = %s AND supplier_id = %s
        """
        cursor.execute(query, (item_id, supplier_id))
        result = cursor.fetchone()
        
        if result:
            return float(result['supplier_price'])
        
        # Fallback to cheapest package from supplier_packages
        query = """
            SELECT MIN(price_per_kg) as min_price
            FROM supplier_packages
            WHERE item_id = %s AND supplier_id = %s
        """
        cursor.execute(query, (item_id, supplier_id))
        result = cursor.fetchone()
        
        if result and result['min_price']:
            return float(result['min_price'])
        
        return 0.0
        
    finally:
        cursor.close()
        conn.close()

def calculate_package_totals(packages_data: list):
    """
    Calculate totals for a list of packages
    Replicates existing Streamlit logic
    """
    total_cost = 0.0
    total_weight = 0.0
    
    for package in packages_data:
        quantity = package.get('quantity', 0)
        package_size = package.get('package_size_kg', 0)
        price_per_package = package.get('price_per_package', 0)
        
        package_total_weight = quantity * package_size
        package_total_cost = quantity * price_per_package
        
        total_weight += package_total_weight
        total_cost += package_total_cost
    
    return {
        'total_cost': total_cost,
        'total_weight': total_weight,
        'average_price_per_kg': total_cost / total_weight if total_weight > 0 else 0
    } 