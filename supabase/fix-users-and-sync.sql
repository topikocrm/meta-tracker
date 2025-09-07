-- Fix Users and Sync Issues
-- This script will create sample users and reset sync metadata

-- ============================================
-- STEP 1: Create sample users for lead assignment
-- ============================================

-- First, check if users table exists and has data
DO $$
BEGIN
    -- Insert sample users if table is empty
    IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        INSERT INTO users (email, name, phone, role, location, is_active) VALUES
            ('john.doe@example.com', 'John Doe', '+1234567890', 'user', 'New York', true),
            ('jane.smith@example.com', 'Jane Smith', '+1234567891', 'user', 'Los Angeles', true),
            ('mike.johnson@example.com', 'Mike Johnson', '+1234567892', 'manager', 'Chicago', true),
            ('sarah.williams@example.com', 'Sarah Williams', '+1234567893', 'user', 'Houston', true),
            ('david.brown@example.com', 'David Brown', '+1234567894', 'admin', 'Phoenix', true),
            ('emily.davis@example.com', 'Emily Davis', '+1234567895', 'user', 'Philadelphia', true),
            ('robert.miller@example.com', 'Robert Miller', '+1234567896', 'user', 'San Antonio', true),
            ('lisa.wilson@example.com', 'Lisa Wilson', '+1234567897', 'manager', 'San Diego', true);
        
        RAISE NOTICE 'Created 8 sample users';
    ELSE
        RAISE NOTICE 'Users already exist in database';
    END IF;
END $$;

-- ============================================
-- STEP 2: Assign leads to users randomly (for unassigned leads)
-- ============================================

-- Get user IDs for assignment
WITH available_users AS (
    SELECT id FROM users WHERE is_active = true
),
unassigned_leads AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_time) as rn
    FROM leads 
    WHERE assigned_to IS NULL
),
user_array AS (
    SELECT array_agg(id) as user_ids FROM available_users
)
UPDATE leads 
SET assigned_to = (
    SELECT user_ids[1 + (rn % array_length(user_ids, 1))]
    FROM unassigned_leads ul, user_array
    WHERE leads.id = ul.id
)
WHERE assigned_to IS NULL
AND EXISTS (SELECT 1 FROM available_users);

-- ============================================
-- STEP 3: Reset sync metadata to allow re-import of new leads
-- ============================================

-- Option 1: Reset to re-check all rows from the beginning
-- Uncomment this if you want to re-import ALL leads
/*
UPDATE sync_metadata 
SET 
    last_row_number = 0,
    last_sync_at = NULL,
    total_rows_processed = 0,
    updated_at = NOW()
WHERE sheet_id IN (
    '1bDJXrjE70v3kalKPnW2HrLqNTflSssZp0OSRB_Q4PJo',  -- Food Leads
    '1VtAPMBX0f6YhVYNbWOIvTWPmudu1qiQAP6vHgcJNtU0'   -- Boutique Leads
);
*/

-- Option 2: Get actual lead counts and update sync metadata accordingly
-- This will keep existing leads but allow new ones to be imported
WITH lead_counts AS (
    SELECT 
        sheet_source,
        COUNT(*) as current_count,
        MAX(row_number) as max_row
    FROM leads
    WHERE sheet_source IN ('sheet_1_food', 'sheet_2_boutique')
    GROUP BY sheet_source
)
UPDATE sync_metadata sm
SET 
    last_row_number = COALESCE(lc.max_row, 0),
    total_rows_processed = COALESCE(lc.current_count, 0),
    updated_at = NOW()
FROM lead_counts lc
WHERE 
    (sm.sheet_id = '1bDJXrjE70v3kalKPnW2HrLqNTflSssZp0OSRB_Q4PJo' AND lc.sheet_source = 'sheet_1_food')
    OR 
    (sm.sheet_id = '1VtAPMBX0f6YhVYNbWOIvTWPmudu1qiQAP6vHgcJNtU0' AND lc.sheet_source = 'sheet_2_boutique');

-- ============================================
-- STEP 4: Fix any data inconsistencies
-- ============================================

-- Ensure all leads have is_managed flag set properly
UPDATE leads 
SET is_managed = true 
WHERE is_managed IS NULL;

-- Set default lead_stage for leads without one
UPDATE leads 
SET lead_stage = 'new'
WHERE lead_stage IS NULL;

-- Set default lead_quality for leads without one
UPDATE leads
SET lead_quality = 'cold'
WHERE lead_quality IS NULL;

-- ============================================
-- STEP 5: Display current status
-- ============================================

-- Show user counts
SELECT 'Users' as entity, COUNT(*) as count FROM users WHERE is_active = true
UNION ALL
-- Show total leads
SELECT 'Total Leads', COUNT(*) FROM leads
UNION ALL
-- Show managed leads
SELECT 'Managed Leads', COUNT(*) FROM leads WHERE is_managed = true
UNION ALL
-- Show unmanaged leads
SELECT 'Unmanaged Leads', COUNT(*) FROM leads WHERE is_managed = false
UNION ALL
-- Show assigned leads
SELECT 'Assigned Leads', COUNT(*) FROM leads WHERE assigned_to IS NOT NULL
UNION ALL
-- Show unassigned leads
SELECT 'Unassigned Leads', COUNT(*) FROM leads WHERE assigned_to IS NULL
UNION ALL
-- Show Food leads
SELECT 'Food Leads', COUNT(*) FROM leads WHERE sheet_source = 'sheet_1_food'
UNION ALL
-- Show Boutique leads
SELECT 'Boutique Leads', COUNT(*) FROM leads WHERE sheet_source = 'sheet_2_boutique';

-- Show sync metadata status
SELECT 
    sheet_name,
    last_row_number,
    total_rows_processed,
    last_sync_at
FROM sync_metadata
WHERE sheet_id IN (
    '1bDJXrjE70v3kalKPnW2HrLqNTflSssZp0OSRB_Q4PJo',
    '1VtAPMBX0f6YhVYNbWOIvTWPmudu1qiQAP6vHgcJNtU0'
);

-- Show sample of users with lead counts
SELECT 
    u.name,
    u.email,
    u.role,
    COUNT(l.id) as assigned_leads
FROM users u
LEFT JOIN leads l ON u.id = l.assigned_to
WHERE u.is_active = true
GROUP BY u.id, u.name, u.email, u.role
ORDER BY COUNT(l.id) DESC;