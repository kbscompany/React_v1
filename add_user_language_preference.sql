-- Add preferred_language column to users table
-- This allows users to set their default language (English or Arabic)

USE bakery_react;

-- Add the preferred_language column
ALTER TABLE users 
ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en' AFTER is_active;

-- Update existing users to have English as default
UPDATE users SET preferred_language = 'en' WHERE preferred_language IS NULL;

-- Check the updated table structure
DESCRIBE users; 