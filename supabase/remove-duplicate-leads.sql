-- Script to remove duplicate leads keeping only the most recent one for each phone number
-- This will identify duplicates based on phone_number and sheet_source combination

-- First, let's see what duplicates exist
WITH duplicates AS (
  SELECT 
    phone_number,
    sheet_source,
    COUNT(*) as duplicate_count
  FROM leads
  WHERE phone_number IS NOT NULL
  GROUP BY phone_number, sheet_source
  HAVING COUNT(*) > 1
)
SELECT 
  'Found ' || COUNT(*) || ' phone numbers with duplicates' as message,
  SUM(duplicate_count - 1) as total_duplicates_to_remove
FROM duplicates;

-- Create a backup table first (optional - uncomment if you want backup)
-- CREATE TABLE leads_backup_before_dedup AS SELECT * FROM leads;

-- Remove duplicates, keeping the most recently created one
DELETE FROM leads
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY phone_number, sheet_source 
        ORDER BY created_at DESC, id DESC
      ) as rn
    FROM leads
    WHERE phone_number IS NOT NULL
  ) t
  WHERE rn > 1
);

-- Show remaining leads count
SELECT 
  'Deduplication complete. Remaining leads: ' || COUNT(*) as message,
  COUNT(DISTINCT phone_number) as unique_phone_numbers
FROM leads;

-- Update google_sheet_id to use phone number to prevent future duplicates
UPDATE leads
SET google_sheet_id = sheet_source || '_' || REGEXP_REPLACE(phone_number, '\D', '', 'g')
WHERE phone_number IS NOT NULL
  AND google_sheet_id LIKE '%_row_%';

-- Add a unique constraint to prevent future duplicates (optional)
-- This will prevent the same phone number from being added twice for the same source
-- ALTER TABLE leads ADD CONSTRAINT unique_phone_per_source UNIQUE (phone_number, sheet_source);