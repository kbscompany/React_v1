-- Check if due_date column exists in cheques table and show its structure
-- Run this to verify the current state of the due_date column

-- Check table structure to see if due_date column exists
DESCRIBE cheques;

-- Alternative way to check if the column exists
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'cheques' 
  AND COLUMN_NAME = 'due_date';

-- Check if there are any existing due_date values
SELECT COUNT(*) as total_cheques, 
       COUNT(due_date) as cheques_with_due_date,
       COUNT(*) - COUNT(due_date) as cheques_without_due_date
FROM cheques;

-- Show sample of existing due_date values (if any)
SELECT id, cheque_number, issue_date, due_date, status
FROM cheques 
WHERE due_date IS NOT NULL 
LIMIT 10; 