-- STEP 1: Show current duplicates
SELECT 
  phone_number,
  sheet_source,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at DESC) as lead_ids,
  array_agg(assigned_to ORDER BY created_at DESC) as assigned_users,
  array_agg(full_name) as names
FROM leads
WHERE phone_number IS NOT NULL
GROUP BY phone_number, sheet_source
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- STEP 2: Delete duplicates keeping the most recent one
-- This will keep the newest entry and delete older duplicates
WITH duplicates_to_delete AS (
  SELECT id
  FROM (
    SELECT 
      id,
      phone_number,
      created_at,
      ROW_NUMBER() OVER (
        PARTITION BY phone_number, sheet_source 
        ORDER BY created_at DESC, id DESC
      ) as row_num
    FROM leads
    WHERE phone_number IS NOT NULL
  ) ranked
  WHERE row_num > 1
)
DELETE FROM leads
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- STEP 3: Verify no more duplicates exist
SELECT 
  'After cleanup - Total leads: ' || COUNT(*) as status,
  'Unique phone numbers: ' || COUNT(DISTINCT phone_number) as unique_phones
FROM leads;

-- STEP 4: Update the google_sheet_id to prevent future duplicates
UPDATE leads
SET google_sheet_id = sheet_source || '_' || REGEXP_REPLACE(phone_number, '\D', '', 'g'),
    updated_at = NOW()
WHERE phone_number IS NOT NULL
  AND (google_sheet_id LIKE '%_row_%' OR google_sheet_id IS NULL);