-- Modern Role-Based Permissions System Migration
-- This replaces the old permissions table with a comprehensive system

USE bakery_react;

-- First, backup existing permissions if needed
CREATE TABLE IF NOT EXISTS permissions_backup AS SELECT * FROM permissions;

-- Clear old permissions data 
DELETE FROM permissions;

-- Update permissions table structure (add metadata columns)
ALTER TABLE permissions 
ADD COLUMN IF NOT EXISTS permission_name VARCHAR(100) AFTER feature_key,
ADD COLUMN IF NOT EXISTS description TEXT AFTER permission_name,
ADD COLUMN IF NOT EXISTS category VARCHAR(50) AFTER description,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Update foreign key to reference user_roles table
ALTER TABLE permissions DROP FOREIGN KEY IF EXISTS permissions_ibfk_1;
ALTER TABLE permissions 
ADD CONSTRAINT permissions_role_fk 
FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE CASCADE;

-- Create missing user roles if they don't exist
INSERT IGNORE INTO user_roles (name) VALUES 
('Admin'),
('Manager'), 
('Accountant'),
('Warehouse Manager'),
('Kitchen Manager'),
('Production Staff'),
('Inventory Staff'),
('Finance Staff'),
('Viewer');

-- Create role_permissions_defaults table for default permissions
CREATE TABLE IF NOT EXISTS role_permissions_defaults (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role_permission (role_name, permission_key)
);

-- Insert default permissions for Super Admin (all permissions)
INSERT IGNORE INTO role_permissions_defaults (role_name, permission_key, permission_name, category, description) VALUES

-- Page Access Permissions
('Admin', 'access_dashboard', 'Dashboard Access', 'Page Access', 'Can access main dashboard'),
('Admin', 'access_finance_center', 'Finance Center', 'Page Access', 'Can access finance center'),
('Admin', 'access_warehouse', 'Warehouse Management', 'Page Access', 'Can access warehouse section'),
('Admin', 'access_inventory', 'Inventory Management', 'Page Access', 'Can access inventory section'),
('Admin', 'access_super_admin', 'Super Admin Panel', 'Page Access', 'Can access super admin features'),
('Admin', 'access_cheque_management', 'Cheque Management', 'Page Access', 'Can access cheque management'),
('Admin', 'access_expense_management', 'Expense Management', 'Page Access', 'Can access expense management'),
('Admin', 'access_item_management', 'Item Management', 'Page Access', 'Can access item management'),
('Admin', 'access_kitchen_production', 'Kitchen Production', 'Page Access', 'Can access kitchen production'),
('Admin', 'access_purchase_orders', 'Purchase Orders', 'Page Access', 'Can access purchase orders'),
('Admin', 'access_bank_hierarchy', 'Bank Hierarchy', 'Page Access', 'Can access bank hierarchy management'),

-- Financial Management Permissions
('Admin', 'create_expense', 'Create Expenses', 'Financial Management', 'Can create new expenses'),
('Admin', 'edit_expense', 'Edit Expenses', 'Financial Management', 'Can edit existing expenses'),
('Admin', 'delete_expense', 'Delete Expenses', 'Financial Management', 'Can delete expenses'),
('Admin', 'view_expenses', 'View Expenses', 'Financial Management', 'Can view expense records'),
('Admin', 'approve_expense', 'Approve Expenses', 'Financial Management', 'Can approve expense requests'),
('Admin', 'create_cheque', 'Create Cheques', 'Financial Management', 'Can create new cheques'),
('Admin', 'edit_cheque', 'Edit Cheques', 'Financial Management', 'Can edit existing cheques'),
('Admin', 'delete_cheque', 'Delete Cheques', 'Financial Management', 'Can delete cheques'),
('Admin', 'cancel_cheque', 'Cancel Cheques', 'Financial Management', 'Can cancel issued cheques'),
('Admin', 'settle_cheque', 'Settle Cheques', 'Financial Management', 'Can settle cheques'),
('Admin', 'early_settlement', 'Early Settlement', 'Financial Management', 'Can process early settlements'),
('Admin', 'print_cheque', 'Print Cheques', 'Financial Management', 'Can print cheques'),
('Admin', 'arabic_cheque_generation', 'Arabic Cheque Generation', 'Financial Management', 'Can generate Arabic cheques'),

-- Banking & Safes
('Admin', 'create_bank_account', 'Create Bank Accounts', 'Banking & Safes', 'Can create new bank accounts'),
('Admin', 'edit_bank_account', 'Edit Bank Accounts', 'Banking & Safes', 'Can edit bank account details'),
('Admin', 'delete_bank_account', 'Delete Bank Accounts', 'Banking & Safes', 'Can delete bank accounts'),
('Admin', 'manage_bank_hierarchy', 'Manage Bank Hierarchy', 'Banking & Safes', 'Can manage bank hierarchy structure'),
('Admin', 'manage_cheque_books', 'Manage Cheque Books', 'Banking & Safes', 'Can manage cheque books'),
('Admin', 'create_safe', 'Create Safes', 'Banking & Safes', 'Can create new safes'),
('Admin', 'edit_safe', 'Edit Safes', 'Banking & Safes', 'Can edit safe details'),
('Admin', 'delete_safe', 'Delete Safes', 'Banking & Safes', 'Can delete safes'),
('Admin', 'reset_safe', 'Reset Safes', 'Banking & Safes', 'Can reset safe balances'),

-- System Administration
('Admin', 'manage_users', 'Manage Users', 'System Administration', 'Can create, edit, and delete users'),
('Admin', 'system_reset', 'System Reset', 'System Administration', 'Can perform system resets'),
('Admin', 'view_audit_logs', 'View Audit Logs', 'System Administration', 'Can view system audit logs'),
('Admin', 'system_backup', 'System Backup', 'System Administration', 'Can perform system backups'),
('Admin', 'system_settings', 'System Settings', 'System Administration', 'Can modify system settings');

-- Insert Accountant permissions (comprehensive financial access)
INSERT IGNORE INTO role_permissions_defaults (role_name, permission_key, permission_name, category, description) VALUES
('Accountant', 'access_dashboard', 'Dashboard Access', 'Page Access', 'Can access main dashboard'),
('Accountant', 'access_finance_center', 'Finance Center', 'Page Access', 'Can access finance center'),
('Accountant', 'access_cheque_management', 'Cheque Management', 'Page Access', 'Can access cheque management'),
('Accountant', 'access_expense_management', 'Expense Management', 'Page Access', 'Can access expense management'),
('Accountant', 'access_bank_hierarchy', 'Bank Hierarchy', 'Page Access', 'Can access bank hierarchy management'),
('Accountant', 'access_inventory', 'Inventory Management', 'Page Access', 'Can access inventory section'),
('Accountant', 'access_item_management', 'Item Management', 'Page Access', 'Can access item management'),
('Accountant', 'access_purchase_orders', 'Purchase Orders', 'Page Access', 'Can access purchase orders'),

-- Financial Management (Full Access)
('Accountant', 'create_expense', 'Create Expenses', 'Financial Management', 'Can create new expenses'),
('Accountant', 'edit_expense', 'Edit Expenses', 'Financial Management', 'Can edit existing expenses'),
('Accountant', 'delete_expense', 'Delete Expenses', 'Financial Management', 'Can delete expenses'),
('Accountant', 'view_expenses', 'View Expenses', 'Financial Management', 'Can view expense records'),
('Accountant', 'approve_expense', 'Approve Expenses', 'Financial Management', 'Can approve expense requests'),
('Accountant', 'create_cheque', 'Create Cheques', 'Financial Management', 'Can create new cheques'),
('Accountant', 'edit_cheque', 'Edit Cheques', 'Financial Management', 'Can edit existing cheques'),
('Accountant', 'delete_cheque', 'Delete Cheques', 'Financial Management', 'Can delete cheques'),
('Accountant', 'cancel_cheque', 'Cancel Cheques', 'Financial Management', 'Can cancel issued cheques'),
('Accountant', 'settle_cheque', 'Settle Cheques', 'Financial Management', 'Can settle cheques'),
('Accountant', 'early_settlement', 'Early Settlement', 'Financial Management', 'Can process early settlements'),
('Accountant', 'print_cheque', 'Print Cheques', 'Financial Management', 'Can print cheques'),
('Accountant', 'arabic_cheque_generation', 'Arabic Cheque Generation', 'Financial Management', 'Can generate Arabic cheques'),

-- Banking & Safes (Full Access)
('Accountant', 'create_bank_account', 'Create Bank Accounts', 'Banking & Safes', 'Can create new bank accounts'),
('Accountant', 'edit_bank_account', 'Edit Bank Accounts', 'Banking & Safes', 'Can edit bank account details'),
('Accountant', 'delete_bank_account', 'Delete Bank Accounts', 'Banking & Safes', 'Can delete bank accounts'),
('Accountant', 'manage_bank_hierarchy', 'Manage Bank Hierarchy', 'Banking & Safes', 'Can manage bank hierarchy structure'),
('Accountant', 'manage_cheque_books', 'Manage Cheque Books', 'Banking & Safes', 'Can manage cheque books'),
('Accountant', 'create_safe', 'Create Safes', 'Banking & Safes', 'Can create new safes'),
('Accountant', 'edit_safe', 'Edit Safes', 'Banking & Safes', 'Can edit safe details'),
('Accountant', 'delete_safe', 'Delete Safes', 'Banking & Safes', 'Can delete safes');

-- Copy default permissions to active permissions table
INSERT IGNORE INTO permissions (role_id, feature_key, permission_name, description, category)
SELECT ur.id, rpd.permission_key, rpd.permission_name, rpd.description, rpd.category
FROM role_permissions_defaults rpd
JOIN user_roles ur ON ur.name = rpd.role_name;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_role_id ON permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_feature_key ON permissions(feature_key);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- Create view for easy permissions lookup
CREATE OR REPLACE VIEW user_role_permissions AS
SELECT 
    ur.name as role_name,
    ur.id as role_id,
    p.feature_key as permission_key,
    p.permission_name,
    p.description,
    p.category
FROM user_roles ur
LEFT JOIN permissions p ON ur.id = p.role_id
ORDER BY ur.name, p.category, p.permission_name;

-- Show summary
SELECT 
    ur.name as role_name,
    COUNT(p.id) as permission_count
FROM user_roles ur
LEFT JOIN permissions p ON ur.id = p.role_id
GROUP BY ur.id, ur.name
ORDER BY ur.name; 