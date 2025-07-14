-- SQL script to add new user roles to the bakery_react database
-- Run this in MySQL Workbench or command line

USE bakery_react;

-- Insert new user roles if they don't exist
INSERT IGNORE INTO user_roles (id, name) VALUES 
(1, 'Admin'),
(2, 'Warehouse Manager'),
(3, 'Kitchen Manager'),
(4, 'Production Staff'),
(5, 'Inventory Staff'),
(6, 'Finance Staff'),
(7, 'Staff');

-- Update any existing roles table if it exists (for compatibility)
INSERT IGNORE INTO roles (id, name) VALUES 
(1, 'Admin'),
(2, 'Warehouse Manager'),
(3, 'Kitchen Manager'),
(4, 'Production Staff'),
(5, 'Inventory Staff'),
(6, 'Finance Staff'),
(7, 'Staff');

-- Verify the roles were added correctly
SELECT * FROM user_roles ORDER BY id;

-- Optional: Check if roles table exists and show its contents too
SELECT * FROM roles ORDER BY id; 