#!/usr/bin/env python3
"""
EC2 Database Setup Script
Creates all tables and initial admin user
"""

import sys
from sqlalchemy.orm import Session
from database import engine, get_db
import models
from auth import get_password_hash

def setup_database():
    """Set up database tables and admin user"""
    
    print("🚀 Setting up database for EC2...")
    
    try:
        # Create all tables
        print("📊 Creating database tables...")
        models.Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully!")
        
        # Get database session
        db = next(get_db())
        
        try:
            # Create user roles
            print("👥 Creating user roles...")
            roles = [
                {"id": 1, "name": "Admin"},
                {"id": 2, "name": "Manager"}, 
                {"id": 3, "name": "Staff"}
            ]
            
            for role_data in roles:
                existing_role = db.query(models.UserRole).filter(models.UserRole.id == role_data["id"]).first()
                if not existing_role:
                    role = models.UserRole(**role_data)
                    db.add(role)
            
            # Create admin user
            print("🔑 Creating admin user...")
            existing_admin = db.query(models.User).filter(models.User.username == "admin").first()
            if not existing_admin:
                hashed_password = get_password_hash("admin123")
                admin_user = models.User(
                    username="admin",
                    password_hash=hashed_password,
                    role_id=1,  # Admin role
                    is_active=True
                )
                db.add(admin_user)
                print("✅ Admin user created: username='admin', password='admin123'")
            else:
                print("ℹ️  Admin user already exists")
            
            # Commit changes
            db.commit()
            print("✅ Database setup completed successfully!")
            print("🌐 Ready to start the server!")
            
        except Exception as e:
            db.rollback()
            print(f"❌ Database setup failed: {e}")
            raise
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("💡 Make sure:")
        print("   - MySQL is running")
        print("   - Database 'bakery_react' exists") 
        print("   - .env file has correct DB_PASSWORD")
        sys.exit(1)

if __name__ == "__main__":
    setup_database() 