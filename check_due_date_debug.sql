-- Debug script to check due_date handling in cheques table
-- Run this script to see what's happening with due dates

-- 1. Check if due_date column exists and its properties
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'bakery_react' 
    AND TABLE_NAME = 'cheques'
    AND COLUMN_NAME = 'due_date';

-- 2. Check some recent cheques to see their due_date values
SELECT 
    id,
    cheque_number,
    issue_date,
    due_date,
    status,
    description,
    created_at,
    updated_at
FROM cheques
ORDER BY id DESC
LIMIT 10;

-- 3. Count cheques with and without due dates
SELECT 
    COUNT(*) as total_cheques,
    COUNT(due_date) as cheques_with_due_date,
    COUNT(*) - COUNT(due_date) as cheques_without_due_date
FROM cheques;

-- 4. Check recently updated cheques (last 24 hours)
SELECT 
    id,
    cheque_number,
    due_date,
    status,
    updated_at
FROM cheques
WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY updated_at DESC;

-- 5. Test update query directly (replace with actual cheque_id)
-- UPDATE cheques SET due_date = '2025-01-15' WHERE id = 123; 