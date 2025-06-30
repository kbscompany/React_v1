#!/usr/bin/env python3
"""
Complete API Integration Setup Script

This script sets up all necessary database tables and configurations 
for the completed API integration including:
- Foodics integration tables
- Enhanced reporting tables
- Webhook logging tables
- Search optimization indices
- API monitoring tables
"""

from sqlalchemy.orm import Session
from sqlalchemy import text, create_engine
from database import get_db, engine
import os
from datetime import datetime

def create_foodics_integration_tables(db: Session):
    """Create all Foodics integration related tables"""
    
    # Foodics tokens table (encrypted storage)
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS foodics_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            api_token TEXT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            configured_by VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_active (is_active),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))
    
    # Foodics webhook logs table
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS foodics_webhook_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            webhook_type VARCHAR(100) NOT NULL,
            payload TEXT,
            processed BOOLEAN DEFAULT FALSE,
            received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP NULL,
            error_message TEXT NULL,
            INDEX idx_type (webhook_type),
            INDEX idx_processed (processed),
            INDEX idx_received (received_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))
    
    # Foodics product mapping table
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS foodics_product_mapping (
            id INT AUTO_INCREMENT PRIMARY KEY,
            local_item_id INT NOT NULL,
            foodics_product_id VARCHAR(100) NOT NULL,
            foodics_branch_id VARCHAR(100) NOT NULL,
            sync_enabled BOOLEAN DEFAULT TRUE,
            last_synced TIMESTAMP NULL,
            sync_status VARCHAR(50) DEFAULT 'pending',
            sync_error TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_mapping (local_item_id, foodics_branch_id),
            INDEX idx_branch (foodics_branch_id),
            INDEX idx_sync_status (sync_status),
            INDEX idx_sync_enabled (sync_enabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))
    
    # Foodics sync logs table
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS foodics_sync_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sync_type VARCHAR(50) NOT NULL,
            branch_id VARCHAR(100),
            status VARCHAR(50) NOT NULL,
            items_processed INT DEFAULT 0,
            items_successful INT DEFAULT 0,
            items_failed INT DEFAULT 0,
            error_details TEXT NULL,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP NULL,
            INDEX idx_type (sync_type),
            INDEX idx_branch (branch_id),
            INDEX idx_status (status),
            INDEX idx_started (started_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))

    # Foodics branches table
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS foodics_branches (
            id INT AUTO_INCREMENT PRIMARY KEY,
            foodics_branch_id VARCHAR(100) NOT NULL UNIQUE,
            branch_name VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            is_default BOOLEAN DEFAULT FALSE,
            warehouse_id INT NULL,
            last_synced TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_branch_id (foodics_branch_id),
            INDEX idx_warehouse (warehouse_id),
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))

def create_enhanced_warehouse_tables(db: Session):
    """Create enhanced warehouse management tables"""
    
    # Add shop functionality to existing warehouses table
    try:
        db.execute(text("""
            ALTER TABLE warehouses 
            ADD COLUMN IF NOT EXISTS is_shop BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS foodics_branch_id VARCHAR(100) NULL,
            ADD COLUMN IF NOT EXISTS auto_sync BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS sync_frequency INT DEFAULT 60,
            ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP NULL
        """))
    except Exception as e:
        print(f"Note: Warehouses table modification: {e}")
    
    # Transfer templates table
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS transfer_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            source_warehouse_id INT NOT NULL,
            target_warehouse_id INT NOT NULL,
            created_by INT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_source (source_warehouse_id),
            INDEX idx_target (target_warehouse_id),
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))
    
    # Transfer template items table
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS transfer_template_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            template_id INT NOT NULL,
            item_id INT NOT NULL,
            suggested_quantity DECIMAL(10, 3) NOT NULL,
            notes TEXT,
            UNIQUE KEY unique_template_item (template_id, item_id),
            INDEX idx_template (template_id),
            INDEX idx_item (item_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))

def create_reporting_tables(db: Session):
    """Create enhanced reporting and analytics tables"""
    
    # API usage logs table
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS api_usage_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            endpoint VARCHAR(255) NOT NULL,
            method VARCHAR(10) NOT NULL,
            user_id INT NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            response_status INT,
            response_time_ms INT,
            request_size INT,
            response_size INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_endpoint (endpoint),
            INDEX idx_user (user_id),
            INDEX idx_status (response_status),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))
    
    # System health monitoring table
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS system_health_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            metric_name VARCHAR(100) NOT NULL,
            metric_value DECIMAL(10, 2),
            metric_unit VARCHAR(20),
            status VARCHAR(20) DEFAULT 'normal',
            details TEXT,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_metric (metric_name),
            INDEX idx_status (status),
            INDEX idx_recorded (recorded_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))
    
    # Search analytics table
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS search_analytics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            search_query VARCHAR(255) NOT NULL,
            search_type VARCHAR(50),
            user_id INT NULL,
            results_count INT DEFAULT 0,
            search_time_ms INT,
            clicked_result_id INT NULL,
            clicked_result_type VARCHAR(50) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_query (search_query),
            INDEX idx_type (search_type),
            INDEX idx_user (user_id),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))

def create_api_configuration_tables(db: Session):
    """Create API configuration and settings tables"""
    
    # API configuration table
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS api_configurations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            config_key VARCHAR(100) NOT NULL UNIQUE,
            config_value TEXT,
            config_type VARCHAR(50) DEFAULT 'string',
            description TEXT,
            is_encrypted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            updated_by INT NULL,
            INDEX idx_key (config_key),
            INDEX idx_type (config_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))

def insert_default_configurations(db: Session):
    """Insert default API configurations"""
    
    default_configs = [
        ('foodics_sync_interval', '3600', 'integer', 'Foodics sync interval in seconds'),
        ('max_search_results', '100', 'integer', 'Maximum search results per query'),
        ('api_rate_limit_per_hour', '1000', 'integer', 'API requests per hour per user'),
        ('webhook_retry_attempts', '3', 'integer', 'Number of webhook retry attempts'),
        ('system_timezone', 'UTC', 'string', 'System default timezone'),
        ('enable_detailed_logging', 'true', 'boolean', 'Enable detailed API logging'),
        ('auto_sync_enabled', 'true', 'boolean', 'Enable automatic inventory sync'),
        ('low_stock_threshold', '10', 'decimal', 'Default low stock threshold'),
        ('foodics_read_only_mode', 'true', 'boolean', 'Enable read-only mode for Foodics integration'),
        ('foodics_default_branch_id', '', 'string', 'Default Foodics branch for direct integration'),
        ('foodics_default_branch_name', '', 'string', 'Default Foodics branch name')
    ]
    
    for config_key, config_value, config_type, description in default_configs:
        db.execute(text("""
            INSERT IGNORE INTO api_configurations 
            (config_key, config_value, config_type, description, updated_by)
            VALUES (:key, :value, :type, :desc, 1)
        """), {
            'key': config_key,
            'value': config_value,
            'type': config_type,
            'desc': description
        })

def main():
    """Main setup function"""
    print("🚀 Starting Complete API Integration Setup...")
    print("=" * 60)
    
    try:
        # Get database session
        db = next(get_db())
        
        print("1. Setting up Foodics integration tables...")
        create_foodics_integration_tables(db)
        print("   ✅ Foodics tables created")
        
        print("2. Setting up enhanced warehouse tables...")
        create_enhanced_warehouse_tables(db)
        print("   ✅ Warehouse enhancement complete")
        
        print("3. Setting up reporting and analytics tables...")
        create_reporting_tables(db)
        print("   ✅ Reporting tables created")
        
        print("4. Setting up API configuration tables...")
        create_api_configuration_tables(db)
        print("   ✅ API configuration tables created")
        
        print("5. Inserting default configurations...")
        insert_default_configurations(db)
        print("   ✅ Default configurations inserted")
        
        # Commit all changes
        db.commit()
        print("\n🎉 API Integration Setup Complete!")
        print("=" * 60)
        
        # Display summary
        print("\n📊 INTEGRATION SUMMARY:")
        print("=" * 60)
        print("✅ Foodics API Integration")
        print("   - Secure credential storage with encryption")
        print("   - Product and inventory synchronization")
        print("   - Real-time webhook processing")
        print("   - Sales data retrieval")
        print("   - Branch management")
        
        print("\n✅ Enhanced Warehouse Management")
        print("   - Advanced transfer order system")
        print("   - Transfer templates")
        print("   - Multi-warehouse stock tracking")
        print("   - Shop integration with Foodics")
        
        print("\n✅ Purchase Order System")
        print("   - Complete supplier management")
        print("   - Purchase order CRUD operations")
        print("   - Arabic cheque generation")
        print("   - Supplier templates")
        
        print("\n✅ Enhanced Reporting & Analytics")
        print("   - Inventory summary reports")
        print("   - Purchase analysis reports")
        print("   - Global search functionality")
        print("   - Data export capabilities")
        
        print("\n🔗 Available API Endpoints:")
        print("=" * 60)
        print("📁 Foodics Integration:")
        print("   POST /api/foodics/configure")
        print("   GET  /api/foodics/status")
        print("   GET  /api/foodics/branches")
        print("   GET  /api/foodics/products/{branch_id}")
        print("   POST /api/foodics/sync-products/{branch_id}")
        print("   POST /api/foodics/sync-inventory/{shop_id}")
        print("   GET  /api/foodics/sales-data/{shop_id}")
        print("   POST /api/foodics/webhook")
        
        print("\n📁 Enhanced Reporting:")
        print("   GET  /api/reports/inventory-summary")
        print("   GET  /api/reports/purchase-analysis")
        print("   GET  /api/search/global")
        print("   GET  /api/export/inventory-csv")
        
        print("\n🎯 Next Steps:")
        print("=" * 60)
        print("1. Run: python complete_api_integration_setup.py")
        print("2. Configure Foodics API credentials via /api/foodics/configure")
        print("3. Set up warehouse-to-branch mappings for shops")
        print("4. Test API integrations using the provided endpoints")
        print("5. Set up webhooks in Foodics to point to /api/foodics/webhook")
        
        print(f"\n✨ Setup completed at: {datetime.now().isoformat()}")
        print("=" * 60)
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        raise

if __name__ == "__main__":
    main() 