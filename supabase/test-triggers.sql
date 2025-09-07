-- Test if triggers are working properly
-- Run this in Supabase SQL Editor to test

-- Test 1: Check if triggers exist
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    proname AS function_name
FROM pg_trigger 
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid::regclass::text = 'leads'
ORDER BY tgname;

-- Test 2: Manually test lead quality update
-- This should automatically set lead_quality based on interest_level
UPDATE leads 
SET interest_level = 'high'
WHERE id = (SELECT id FROM leads LIMIT 1)
RETURNING id, interest_level, lead_quality, lead_stage;

-- Test 3: Test stage change trigger
UPDATE leads 
SET lead_stage = 'qualified'
WHERE id = (SELECT id FROM leads LIMIT 1)
RETURNING id, lead_stage, pipeline_progress, stage_entered_date;

-- Test 4: Check current lead quality values
SELECT 
    lead_stage,
    interest_level,
    lead_quality,
    COUNT(*) as count
FROM leads
GROUP BY lead_stage, interest_level, lead_quality
ORDER BY lead_stage, interest_level;