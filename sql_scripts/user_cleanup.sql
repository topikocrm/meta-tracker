-- SQL Script to Clean Up Users and Reassign Leads
-- Date: 2025-09-09
-- Purpose: Reassign leads from specific users to Unassigned and remove unwanted users

-- Step 1: Reassign all leads from 'Murali' and 'Murali Raju' to Unassigned
UPDATE leads 
SET assigned_to = NULL,
    updated_at = NOW()
WHERE assigned_to IN (
    SELECT id FROM users 
    WHERE name IN ('Murali', 'Murali Raju')
);

-- Step 2: Reassign all leads from 'Razesh' and 'razesh' to Unassigned
UPDATE leads 
SET assigned_to = NULL,
    updated_at = NOW()
WHERE assigned_to IN (
    SELECT id FROM users 
    WHERE LOWER(name) = 'razesh'
);

-- Step 3: Delete users 'Razesh' and 'razesh'
DELETE FROM users 
WHERE LOWER(name) = 'razesh';

-- Step 4: Verify the changes
-- Check remaining users
SELECT id, name, email FROM users ORDER BY name;

-- Check lead distribution after cleanup
SELECT 
    COALESCE(u.name, 'Unassigned') as agent_name,
    COUNT(l.id) as lead_count
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
GROUP BY u.name
ORDER BY lead_count DESC;