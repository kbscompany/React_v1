-- Migrate USD to EGP Currency Migration Script
-- This script changes all USD references to EGP without changing monetary values
-- Run this on your bakery_react database

USE bakery_react;

-- Start transaction for safety
START TRANSACTION;

-- Show current USD records before migration
SELECT 'Current USD records in bank_accounts:' as info;
SELECT id, account_name, currency, current_balance FROM bank_accounts WHERE currency = 'USD';

SELECT 'Current USD records in cheques:' as info;
SELECT id, cheque_number, currency, amount FROM cheques WHERE currency = 'USD';

SELECT 'Current USD records in expenses:' as info;
SELECT id, description, currency, amount FROM expenses WHERE currency = 'USD';

SELECT 'Current USD records in safes (if any):' as info;
SELECT id, name, current_balance FROM safes; -- safes might not have currency field

-- 1. Update bank_accounts table
UPDATE bank_accounts 
SET currency = 'EGP' 
WHERE currency = 'USD';

-- 2. Update cheques table
UPDATE cheques 
SET currency = 'EGP' 
WHERE currency = 'USD';

-- 3. Update expenses table
UPDATE expenses 
SET currency = 'EGP' 
WHERE currency = 'USD';

-- 4. Update purchase_orders table (if it has currency field)
UPDATE purchase_orders 
SET currency = 'EGP' 
WHERE currency = 'USD';

-- 5. Update any supplier_payments table (if exists)
UPDATE supplier_payments 
SET currency = 'EGP' 
WHERE currency = 'USD';

-- 6. Update early_settlements table (if exists)
UPDATE early_settlements 
SET currency = 'EGP' 
WHERE currency = 'USD';

-- 7. Check for any other tables that might have currency fields
-- You can uncomment these if they exist in your database:

-- UPDATE invoice_items SET currency = 'EGP' WHERE currency = 'USD';
-- UPDATE payments SET currency = 'EGP' WHERE currency = 'USD';
-- UPDATE transactions SET currency = 'EGP' WHERE currency = 'USD';

-- Show results after migration
SELECT '=== MIGRATION RESULTS ===' as info;

SELECT 'Updated bank_accounts (now EGP):' as info;
SELECT id, account_name, currency, current_balance FROM bank_accounts WHERE currency = 'EGP';

SELECT 'Updated cheques (now EGP):' as info;
SELECT id, cheque_number, currency, amount FROM cheques WHERE currency = 'EGP';

SELECT 'Updated expenses (now EGP):' as info;
SELECT id, description, currency, amount FROM expenses WHERE currency = 'EGP';

-- Check for any remaining USD references
SELECT 'Remaining USD references in bank_accounts:' as info;
SELECT COUNT(*) as usd_count FROM bank_accounts WHERE currency = 'USD';

SELECT 'Remaining USD references in cheques:' as info;
SELECT COUNT(*) as usd_count FROM cheques WHERE currency = 'USD';

SELECT 'Remaining USD references in expenses:' as info;
SELECT COUNT(*) as usd_count FROM expenses WHERE currency = 'USD';

-- If everything looks good, commit the transaction
-- COMMIT;

-- If you want to rollback, uncomment this instead:
-- ROLLBACK;

COMMIT; 