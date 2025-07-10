-- Migration: Add due_date column to cheques table
-- Run this on your database to add the new due_date field

-- Add the due_date column to cheques table
ALTER TABLE cheques ADD COLUMN due_date DATE NULL COMMENT 'User-selectable due date (today or future only)';

-- Optional: Add index for due_date queries (if needed for reporting)
-- CREATE INDEX idx_cheques_due_date ON cheques(due_date);

-- Migration completed successfully
-- The due_date column has been added to the cheques table
-- Existing cheques will have NULL due_date (which is acceptable)
-- New cheques will require due_date to be set when issuing to safe/supplier 