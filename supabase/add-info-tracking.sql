-- Add information tracking fields to leads table
-- Run this in Supabase SQL Editor

-- Add fields to track information sending flow
ALTER TABLE leads ADD COLUMN IF NOT EXISTS information_sent BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS waiting_for_response BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS info_sent_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS info_response_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS info_response VARCHAR(50);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_waiting_for_response ON leads(waiting_for_response) WHERE waiting_for_response = true;

-- Update function to handle information response
CREATE OR REPLACE FUNCTION handle_info_response()
RETURNS TRIGGER AS $$
BEGIN
    -- If information was sent and we got a response
    IF NEW.info_response IS NOT NULL AND OLD.info_response IS NULL THEN
        NEW.info_response_date := NOW();
        NEW.waiting_for_response := false;
        
        -- Log the response time
        RAISE NOTICE 'Information response received after % for lead %', 
            AGE(NOW(), NEW.info_sent_date), NEW.id;
    END IF;
    
    -- If sending information, set the sent date
    IF NEW.information_sent = true AND OLD.information_sent = false THEN
        NEW.info_sent_date := NOW();
        RAISE NOTICE 'Information sent to lead %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for information response tracking
DROP TRIGGER IF EXISTS trigger_handle_info_response ON leads;
CREATE TRIGGER trigger_handle_info_response
    BEFORE UPDATE ON leads
    FOR EACH ROW
    WHEN (OLD.information_sent IS DISTINCT FROM NEW.information_sent 
          OR OLD.info_response IS DISTINCT FROM NEW.info_response)
    EXECUTE FUNCTION handle_info_response();

-- Test query to see leads waiting for response
SELECT 
    id,
    full_name,
    information_sent,
    waiting_for_response,
    info_sent_date,
    follow_up_date,
    AGE(NOW(), info_sent_date) as time_waiting
FROM leads
WHERE waiting_for_response = true
ORDER BY info_sent_date ASC;