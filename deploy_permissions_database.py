#!/usr/bin/env python3
"""
Database Permissions System Deployment Script
This script migrates the permissions system from localStorage/JSON to database storage
"""

import mysql.connector
import os
import sys
from config import settings

def main():
    print("🚀 Deploying Modern Permissions Database System")
    print("=" * 50)
    
    try:
        # Connect to database
        connection = mysql.connector.connect(
            host=settings.db_host,
            port=int(settings.db_port),
            user=settings.db_user,
            password=settings.db_password,
            database=settings.db_name,
            charset='utf8mb4'
        )
        
        cursor = connection.cursor()
        print("✅ Connected to database")
        
        # Read and execute the SQL migration
        with open('create_modern_permissions_system.sql', 'r', encoding='utf-8') as file:
            sql_commands = file.read()
        
        # Split by semicolon and execute each command
        commands = [cmd.strip() for cmd in sql_commands.split(';') if cmd.strip()]
        
        for i, command in enumerate(commands):
            if command:
                try:
                    cursor.execute(command)
                    print(f"✅ Executed command {i+1}/{len(commands)}")
                except mysql.connector.Error as e:
                    if "Duplicate column name" in str(e) or "already exists" in str(e):
                        print(f"⚠️  Command {i+1} skipped (already exists): {str(e)[:60]}...")
                    else:
                        print(f"❌ Error in command {i+1}: {e}")
                        raise
        
        connection.commit()
        print("✅ All SQL commands executed successfully")
        
        # Verify the deployment
        cursor.execute("""
            SELECT 
                ur.name as role_name,
                COUNT(p.id) as permission_count
            FROM user_roles ur
            LEFT JOIN permissions p ON ur.id = p.role_id
            GROUP BY ur.id, ur.name
            ORDER BY ur.name
        """)
        
        results = cursor.fetchall()
        print("\n📊 Deployment Summary:")
        print("-" * 30)
        total_permissions = 0
        for role_name, permission_count in results:
            print(f"  {role_name}: {permission_count} permissions")
            total_permissions += permission_count
        
        print(f"\n🎯 Total: {len(results)} roles, {total_permissions} permissions")
        
        # Check if defaults table was populated
        cursor.execute("SELECT COUNT(*) FROM role_permissions_defaults")
        defaults_count = cursor.fetchone()[0]
        print(f"📋 Default permissions templates: {defaults_count}")
        
        print("\n🎉 Permissions Database System Deployed Successfully!")
        print("\nNext Steps:")
        print("1. Restart your FastAPI server")
        print("2. Open the Permissions Manager in your frontend")
        print("3. Your permissions are now stored in the database!")
        print("4. Use the 'Reset to Defaults' button to populate all roles")
        
    except FileNotFoundError:
        print("❌ Error: create_modern_permissions_system.sql file not found")
        print("   Make sure the SQL migration file exists in the current directory")
        sys.exit(1)
        
    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
        
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()
            print("🔒 Database connection closed")

if __name__ == "__main__":
    main() 