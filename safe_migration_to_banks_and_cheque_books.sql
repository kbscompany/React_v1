-- ===================================
-- SAFE MIGRATION TO BANKS AND CHEQUE BOOKS
-- ===================================
-- This migration adds banks, updates bank accounts, and creates cheque books
-- It's designed to be safe and reversible

-- ===================================
-- PHASE 1: Add nullable columns first
-- ===================================

-- Add bank_id to bank_accounts (nullable initially)
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS bank_id INTEGER NULL;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS iban VARCHAR(50) NULL;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS branch_code VARCHAR(20) NULL;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EGP';
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS current_balance DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS overdraft_limit DECIMAL(12,2) DEFAULT 0.00;

-- Add cheque_book_id to cheques (nullable initially)
ALTER TABLE cheques ADD COLUMN IF NOT EXISTS cheque_book_id INTEGER NULL;

-- ===================================
-- PHASE 2: Create new tables
-- ===================================

-- Create banks table
CREATE TABLE IF NOT EXISTS banks (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    short_name VARCHAR(20) UNIQUE NOT NULL,
    swift_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Egypt',
    address TEXT,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    website VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create cheque_books table
CREATE TABLE IF NOT EXISTS cheque_books (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    book_number VARCHAR(50) UNIQUE NOT NULL,
    bank_account_id INTEGER NOT NULL,
    series VARCHAR(10),
    book_type VARCHAR(20) DEFAULT 'standard',
    start_cheque_number VARCHAR(50) NOT NULL,
    end_cheque_number VARCHAR(50) NOT NULL,
    total_cheques INTEGER NOT NULL,
    prefix VARCHAR(10),
    status VARCHAR(20) DEFAULT 'active',
    issued_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    activated_date DATETIME NULL,
    closed_date DATETIME NULL,
    closed_reason TEXT,
    closed_by INTEGER NULL,
    created_by INTEGER NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_bank_account_status (bank_account_id, status)
);

-- ===================================
-- PHASE 3: Populate banks
-- ===================================

-- Insert common Egyptian banks
INSERT IGNORE INTO banks (name, short_name, swift_code) VALUES
('National Bank of Egypt', 'NBE', 'NBEGEGCX'),
('Commercial International Bank', 'CIB', 'CIBEEGCX'),
('Banque Misr', 'BM', 'BMISEGCX'),
('Banque du Caire', 'BDC', 'BCAIEGCX'),
('QNB Alahli', 'QNB', 'QNBAEGCX'),
('Arab African International Bank', 'AAIB', 'ARAIEGCX'),
('HSBC Egypt', 'HSBC', 'EBBKEGCX'),
('Credit Agricole Egypt', 'CAE', 'AGRIEGCX'),
('Bank of Alexandria', 'ALEX', 'ALEXEGCX'),
('Faisal Islamic Bank', 'FIB', 'FIEGEGCX');

-- Create banks from existing unique bank_name values
INSERT IGNORE INTO banks (name, short_name)
SELECT DISTINCT 
    bank_name as name,
    CONCAT(UPPER(LEFT(REPLACE(bank_name, ' ', ''), 3)), 
           LPAD(CAST((SELECT COUNT(*) FROM bank_accounts ba2 WHERE ba2.bank_name = ba1.bank_name) AS CHAR), 2, '0')
    ) as short_name
FROM bank_accounts ba1
WHERE bank_name NOT IN (SELECT name FROM banks)
  AND bank_name IS NOT NULL
  AND bank_name != '';

-- Create a migration bank for any orphaned accounts
INSERT IGNORE INTO banks (name, short_name, swift_code) 
VALUES ('Migration Bank (Temporary)', 'MIGRATE', 'MIGRATED');

-- ===================================
-- PHASE 4: Link bank accounts to banks
-- ===================================

-- Update bank_accounts with matching bank_id
UPDATE bank_accounts ba
LEFT JOIN banks b ON ba.bank_name = b.name
SET ba.bank_id = COALESCE(b.id, (SELECT id FROM banks WHERE short_name = 'MIGRATE'))
WHERE ba.bank_id IS NULL;

-- ===================================
-- PHASE 5: Create migration cheque books
-- ===================================

-- Create migration cheque books for existing cheques
INSERT IGNORE INTO cheque_books (
    book_number, 
    bank_account_id, 
    start_cheque_number, 
    end_cheque_number, 
    total_cheques, 
    status, 
    created_by,
    closed_reason
)
SELECT 
    CONCAT('MIGRATION-', ba.id, '-', DATE_FORMAT(NOW(), '%Y%m%d')) as book_number,
    ba.id as bank_account_id,
    COALESCE(MIN(c.cheque_number), 'NONE') as start_cheque_number,
    COALESCE(MAX(c.cheque_number), 'NONE') as end_cheque_number,
    COUNT(c.id) as total_cheques,
    'closed' as status,
    1 as created_by,
    'Automatically created during system migration' as closed_reason
FROM bank_accounts ba
LEFT JOIN cheques c ON c.bank_account_id = ba.id
GROUP BY ba.id;

-- ===================================
-- PHASE 6: Link cheques to cheque books
-- ===================================

-- Update cheques with cheque_book_id from migration books
UPDATE cheques c
JOIN cheque_books cb ON c.bank_account_id = cb.bank_account_id
SET c.cheque_book_id = cb.id
WHERE c.cheque_book_id IS NULL 
  AND cb.book_number LIKE 'MIGRATION-%';

-- ===================================
-- PHASE 7: Create active books for accounts with no cheques
-- ===================================

-- For accounts that never had cheques, create an active book ready for use
INSERT IGNORE INTO cheque_books (
    book_number, 
    bank_account_id, 
    start_cheque_number, 
    end_cheque_number, 
    total_cheques, 
    status, 
    created_by
)
SELECT 
    CONCAT('AUTO-', ba.account_number, '-001') as book_number,
    ba.id as bank_account_id,
    '000001' as start_cheque_number,
    '000100' as end_cheque_number,
    100 as total_cheques,
    'active' as status,
    1 as created_by
FROM bank_accounts ba
WHERE NOT EXISTS (
    SELECT 1 FROM cheque_books cb WHERE cb.bank_account_id = ba.id
)
AND ba.is_active = 1;

-- ===================================
-- PHASE 8: Data integrity checks
-- ===================================

-- Check for any orphaned records
SELECT 'Orphaned bank accounts without bank_id:' as check_type, COUNT(*) as count
FROM bank_accounts WHERE bank_id IS NULL
UNION ALL
SELECT 'Orphaned cheques without cheque_book_id:', COUNT(*)
FROM cheques WHERE cheque_book_id IS NULL
UNION ALL
SELECT 'Active cheque books per account (should be <= 1):', MAX(active_count)
FROM (
    SELECT bank_account_id, COUNT(*) as active_count
    FROM cheque_books
    WHERE status = 'active'
    GROUP BY bank_account_id
) as active_counts;

-- ===================================
-- PHASE 9: Add constraints (only if checks pass)
-- ===================================

-- Make columns NOT NULL only after ensuring no nulls exist
-- ALTER TABLE bank_accounts MODIFY COLUMN bank_id INTEGER NOT NULL;
-- ALTER TABLE cheques MODIFY COLUMN cheque_book_id INTEGER NOT NULL;

-- Add foreign keys
-- ALTER TABLE bank_accounts ADD CONSTRAINT fk_bank_accounts_bank 
--     FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE;
    
-- ALTER TABLE cheques ADD CONSTRAINT fk_cheques_book 
--     FOREIGN KEY (cheque_book_id) REFERENCES cheque_books(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cheques_book_status ON cheques(cheque_book_id, status);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_bank_active ON bank_accounts(bank_id, is_active);

-- ===================================
-- PHASE 10: Add unique constraint for active books
-- ===================================

-- Create a trigger to enforce one active book per account (MySQL version)
DELIMITER $$

DROP TRIGGER IF EXISTS check_single_active_book_before_insert$$
CREATE TRIGGER check_single_active_book_before_insert
BEFORE INSERT ON cheque_books
FOR EACH ROW
BEGIN
    IF NEW.status = 'active' THEN
        IF EXISTS (
            SELECT 1 FROM cheque_books 
            WHERE bank_account_id = NEW.bank_account_id 
            AND status = 'active'
        ) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Only one active cheque book allowed per account';
        END IF;
    END IF;
END$$

DROP TRIGGER IF EXISTS check_single_active_book_before_update$$
CREATE TRIGGER check_single_active_book_before_update
BEFORE UPDATE ON cheque_books
FOR EACH ROW
BEGIN
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        IF EXISTS (
            SELECT 1 FROM cheque_books 
            WHERE bank_account_id = NEW.bank_account_id 
            AND status = 'active'
            AND id != NEW.id
        ) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Only one active cheque book allowed per account';
        END IF;
    END IF;
END$$

DELIMITER ;

-- ===================================
-- PHASE 11: Final summary
-- ===================================

SELECT 
    'Migration Complete!' as status,
    (SELECT COUNT(*) FROM banks) as total_banks,
    (SELECT COUNT(*) FROM bank_accounts) as total_accounts,
    (SELECT COUNT(*) FROM cheque_books) as total_cheque_books,
    (SELECT COUNT(*) FROM cheque_books WHERE status = 'active') as active_cheque_books,
    (SELECT COUNT(*) FROM cheques) as total_cheques; 