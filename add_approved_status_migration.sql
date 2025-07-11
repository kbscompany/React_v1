-- Migration: Add 'Approved' status to purchase_orders table
-- Run this on your database to add the new Approved status to the workflow

-- Add 'Approved' to the status enum for purchase_orders table
ALTER TABLE purchase_orders MODIFY COLUMN status 
ENUM('Pending', 'Approved', 'Received', 'Cancelled') 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci 
DEFAULT 'Pending';

-- Add approval tracking columns
ALTER TABLE purchase_orders 
ADD COLUMN approved_by INT DEFAULT NULL,
ADD COLUMN approved_at DATETIME DEFAULT NULL,
ADD CONSTRAINT fk_purchase_orders_approved_by 
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Optional: Update existing orders logic can be added here if needed
-- For now, existing 'Pending' orders will remain 'Pending' until manually approved 