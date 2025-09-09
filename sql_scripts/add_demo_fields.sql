-- Add demo-related fields to leads table if they don't exist
-- Date: 2025-09-09

-- Add demo_date column if it doesn't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS demo_date DATE;

-- Add demo_time column if it doesn't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS demo_time TIME;

-- Add demo_type column if it doesn't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS demo_type VARCHAR(20) CHECK (demo_type IN ('online', 'in_person', 'phone'));

-- Add demo_location column if it doesn't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS demo_location TEXT;

-- Add demo_notes column if it doesn't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS demo_notes TEXT;

-- Add demo_presenter column if it doesn't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS demo_presenter VARCHAR(255);

-- Add demo_scheduled_at column if it doesn't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS demo_scheduled_at TIMESTAMP;

-- Add index for faster queries on demo_scheduled leads
CREATE INDEX IF NOT EXISTS idx_leads_demo_date ON leads(demo_date) WHERE demo_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_lead_stage_demo ON leads(lead_stage) WHERE lead_stage IN ('demo_scheduled', 'demo_completed');

-- Update any existing demo_scheduled leads to populate demo fields from additional_data if available
UPDATE leads 
SET 
  demo_date = CASE 
    WHEN additional_data->>'demo_date' IS NOT NULL 
    THEN (additional_data->>'demo_date')::DATE 
    ELSE demo_date 
  END,
  demo_time = CASE 
    WHEN additional_data->>'demo_time' IS NOT NULL 
    THEN (additional_data->>'demo_time')::TIME 
    ELSE demo_time 
  END,
  demo_type = CASE 
    WHEN additional_data->>'demo_type' IS NOT NULL 
    THEN (additional_data->>'demo_type')::VARCHAR 
    ELSE demo_type 
  END,
  demo_location = CASE 
    WHEN additional_data->>'demo_location' IS NOT NULL 
    THEN additional_data->>'demo_location' 
    ELSE demo_location 
  END,
  demo_notes = CASE 
    WHEN additional_data->>'demo_notes' IS NOT NULL 
    THEN additional_data->>'demo_notes' 
    ELSE demo_notes 
  END,
  demo_presenter = CASE 
    WHEN additional_data->>'demo_presenter' IS NOT NULL 
    THEN additional_data->>'demo_presenter' 
    ELSE demo_presenter 
  END
WHERE 
  lead_stage IN ('demo_scheduled', 'demo_completed') 
  AND additional_data IS NOT NULL;