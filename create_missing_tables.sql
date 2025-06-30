-- SQL script to create missing tables in bakery_react database
-- Run this in MySQL Workbench or command line

USE bakery_react;

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Insert default roles
INSERT IGNORE INTO user_roles (id, name) VALUES 
(1, 'Admin'),
(2, 'Warehouse Manager'),
(3, 'Staff');

-- 2. Create user_safe_assignments table
CREATE TABLE IF NOT EXISTS user_safe_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    safe_id INT NOT NULL,
    can_view BOOLEAN DEFAULT TRUE,
    can_create_expense BOOLEAN DEFAULT TRUE,
    can_approve_expense BOOLEAN DEFAULT FALSE,
    assigned_by INT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (safe_id) REFERENCES safes(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Create early_settlements table
CREATE TABLE IF NOT EXISTS early_settlements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cheque_id INT NOT NULL,
    deposit_number VARCHAR(100) NOT NULL,
    deposit_amount DECIMAL(12,2) NOT NULL,
    deposit_date DATETIME NOT NULL,
    bank_deposit_reference VARCHAR(200) NULL,
    notes TEXT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    settlement_date DATETIME NULL,
    created_by INT NULL,
    approved_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cheque_id) REFERENCES cheques(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Create early_settlement_files table
CREATE TABLE IF NOT EXISTS early_settlement_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    early_settlement_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'deposit_screenshot',
    uploaded_by INT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (early_settlement_id) REFERENCES early_settlements(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Create expense_files table
CREATE TABLE IF NOT EXISTS expense_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    expense_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by INT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Display confirmation
SELECT 'Missing tables created successfully!' as status;

-- Show table counts
SELECT 
    'user_roles' as table_name, 
    COUNT(*) as record_count 
FROM user_roles
UNION ALL
SELECT 
    'user_safe_assignments' as table_name, 
    COUNT(*) as record_count 
FROM user_safe_assignments
UNION ALL
SELECT 
    'early_settlements' as table_name, 
    COUNT(*) as record_count 
FROM early_settlements
UNION ALL
SELECT 
    'early_settlement_files' as table_name, 
    COUNT(*) as record_count 
FROM early_settlement_files
UNION ALL
SELECT 
    'expense_files' as table_name, 
    COUNT(*) as record_count 
FROM expense_files; 