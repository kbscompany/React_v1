-- Fix User Roles Consistency - Bakery Management System
-- This script ensures both user_roles and roles tables have the same consistent role data

USE bakery_react;

-- First, let's see what we currently have
SELECT 'Current user_roles table:' AS status;
SELECT * FROM user_roles ORDER BY id;

SELECT 'Current roles table (if exists):' AS status;
SELECT * FROM roles ORDER BY id;

-- Insert all required roles into user_roles table
INSERT IGNORE INTO user_roles (id, name) VALUES 
(1, 'Admin'),
(2, 'Warehouse Manager'),
(3, 'Kitchen Manager'),
(4, 'Production Staff'),
(5, 'Inventory Staff'),
(6, 'Finance Staff'),
(7, 'Staff');

-- Sync the roles table to match user_roles (for backward compatibility)
INSERT IGNORE INTO roles (id, name) VALUES 
(1, 'Admin'),
(2, 'Warehouse Manager'),
(3, 'Kitchen Manager'),
(4, 'Production Staff'),
(5, 'Inventory Staff'),
(6, 'Finance Staff'),
(7, 'Staff');

-- Remove any inconsistent roles from roles table that aren't in our standard set
-- (Keep Finance for legacy compatibility, but map it to Finance Staff)
UPDATE roles SET name = 'Finance Staff' WHERE name = 'Finance';
UPDATE roles SET name = 'Admin' WHERE name = 'Cost Control';
DELETE FROM roles WHERE name NOT IN ('Admin', 'Warehouse Manager', 'Kitchen Manager', 'Production Staff', 'Inventory Staff', 'Finance Staff', 'Staff');

-- Verify the final state
SELECT 'Final user_roles table:' AS status;
SELECT * FROM user_roles ORDER BY id;

SELECT 'Final roles table:' AS status;
SELECT * FROM roles ORDER BY id;

-- Update any users with invalid role_ids to default to Staff (role_id = 7)
UPDATE users SET role_id = 7 WHERE role_id NOT IN (SELECT id FROM user_roles);

-- Show user distribution by role
SELECT 'User distribution by role:' AS status;
SELECT ur.name AS role_name, COUNT(u.id) AS user_count
FROM user_roles ur
LEFT JOIN users u ON ur.id = u.role_id
GROUP BY ur.id, ur.name
ORDER BY ur.id; 