-- Check the actual structure of the cheques table
DESCRIBE cheques;

-- Alternative way to see the structure
SHOW COLUMNS FROM cheques;

-- Check what columns exist that might be related to assignment
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'bakery_react' 
AND TABLE_NAME = 'cheques'
ORDER BY ORDINAL_POSITION; 