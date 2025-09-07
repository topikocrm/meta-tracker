-- Fix and recreate triggers for automatic lead quality calculation
-- Run this in Supabase SQL Editor

-- Drop existing triggers first
DROP TRIGGER IF EXISTS trigger_update_lead_quality ON leads;
DROP TRIGGER IF EXISTS trigger_track_stage_change ON leads;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_lead_quality();
DROP FUNCTION IF EXISTS track_stage_change();

-- Recreate the function to automatically update lead quality
CREATE OR REPLACE FUNCTION update_lead_quality()
RETURNS TRIGGER AS $$
BEGIN
    -- Log for debugging
    RAISE NOTICE 'Updating lead quality for lead %, stage: %, interest: %', NEW.id, NEW.lead_stage, NEW.interest_level;
    
    -- Hot leads: High interest or advanced stages
    IF NEW.interest_level = 'high' OR 
       NEW.lead_stage IN ('demo_completed', 'trial_started', 'proposal_sent', 'negotiation', 'contract_sent', 'won') THEN
        NEW.lead_quality := 'hot';
    
    -- Warm leads: Medium interest or mid-stage
    ELSIF NEW.interest_level = 'medium' OR 
          NEW.lead_stage IN ('qualified', 'demo_scheduled') THEN
        NEW.lead_quality := 'warm';
    
    -- Cool leads: Low interest or early contact
    ELSIF NEW.interest_level = 'low' OR 
          NEW.lead_stage = 'contacted' THEN
        NEW.lead_quality := 'cool';
    
    -- Cold leads: No interest, new, or lost
    ELSE
        NEW.lead_quality := 'cold';
    END IF;
    
    RAISE NOTICE 'Lead quality set to: %', NEW.lead_quality;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the function to track stage changes
CREATE OR REPLACE FUNCTION track_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if stage actually changed
    IF OLD.lead_stage IS DISTINCT FROM NEW.lead_stage THEN
        NEW.stage_entered_date := NOW();
        
        RAISE NOTICE 'Stage changed from % to % for lead %', OLD.lead_stage, NEW.lead_stage, NEW.id;
        
        -- Update pipeline progress based on stage
        CASE NEW.lead_stage
            WHEN 'new' THEN NEW.pipeline_progress := 0;
            WHEN 'contacted' THEN NEW.pipeline_progress := 15;
            WHEN 'qualified' THEN NEW.pipeline_progress := 30;
            WHEN 'demo_scheduled' THEN NEW.pipeline_progress := 40;
            WHEN 'demo_completed' THEN NEW.pipeline_progress := 50;
            WHEN 'trial_started' THEN NEW.pipeline_progress := 60;
            WHEN 'proposal_sent' THEN NEW.pipeline_progress := 75;
            WHEN 'negotiation' THEN NEW.pipeline_progress := 85;
            WHEN 'contract_sent' THEN NEW.pipeline_progress := 90;
            WHEN 'won' THEN NEW.pipeline_progress := 100;
            WHEN 'lost' THEN NEW.pipeline_progress := 0;
            WHEN 'on_hold' THEN NEW.pipeline_progress := COALESCE(OLD.pipeline_progress, 0);
            WHEN 'nurturing' THEN NEW.pipeline_progress := COALESCE(OLD.pipeline_progress, 0);
            ELSE NEW.pipeline_progress := COALESCE(NEW.pipeline_progress, 0);
        END CASE;
        
        RAISE NOTICE 'Pipeline progress set to: %', NEW.pipeline_progress;
    END IF;
    
    -- Always update lead quality when stage changes
    -- Hot leads: High interest or advanced stages
    IF NEW.interest_level = 'high' OR 
       NEW.lead_stage IN ('demo_completed', 'trial_started', 'proposal_sent', 'negotiation', 'contract_sent', 'won') THEN
        NEW.lead_quality := 'hot';
    
    -- Warm leads: Medium interest or mid-stage
    ELSIF NEW.interest_level = 'medium' OR 
          NEW.lead_stage IN ('qualified', 'demo_scheduled') THEN
        NEW.lead_quality := 'warm';
    
    -- Cool leads: Low interest or early contact
    ELSIF NEW.interest_level = 'low' OR 
          NEW.lead_stage = 'contacted' THEN
        NEW.lead_quality := 'cool';
    
    -- Cold leads: No interest, new, or lost
    ELSE
        NEW.lead_quality := 'cold';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers with proper timing
CREATE TRIGGER trigger_update_lead_quality
    BEFORE INSERT OR UPDATE OF interest_level, contact_status ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_quality();

CREATE TRIGGER trigger_track_stage_change
    BEFORE UPDATE OF lead_stage ON leads
    FOR EACH ROW
    EXECUTE FUNCTION track_stage_change();

-- Test the triggers
UPDATE leads 
SET lead_stage = 'new', 
    interest_level = NULL,
    lead_quality = 'cold'
WHERE id = (SELECT id FROM leads LIMIT 1);

-- Verify triggers are working
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    proname AS function_name,
    tgenabled AS enabled
FROM pg_trigger 
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid::regclass::text = 'leads'
ORDER BY tgname;