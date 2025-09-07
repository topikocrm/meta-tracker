-- Simplified Pipeline with fewer stages
-- Run this in Supabase SQL Editor

-- Drop and recreate the track_stage_change function with simplified stages
DROP FUNCTION IF EXISTS track_stage_change() CASCADE;

CREATE OR REPLACE FUNCTION track_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if stage actually changed
    IF OLD.lead_stage IS DISTINCT FROM NEW.lead_stage THEN
        NEW.stage_entered_date := NOW();
        
        -- Update pipeline progress based on simplified stages
        CASE NEW.lead_stage
            WHEN 'new' THEN NEW.pipeline_progress := 0;
            WHEN 'contacted' THEN NEW.pipeline_progress := 20;
            WHEN 'qualified' THEN NEW.pipeline_progress := 40;
            WHEN 'demo_scheduled' THEN NEW.pipeline_progress := 55;
            WHEN 'demo_completed' THEN NEW.pipeline_progress := 70;
            WHEN 'trial_started' THEN NEW.pipeline_progress := 85;
            WHEN 'won' THEN NEW.pipeline_progress := 100;
            WHEN 'lost' THEN NEW.pipeline_progress := 0;
            WHEN 'on_hold' THEN NEW.pipeline_progress := COALESCE(OLD.pipeline_progress, 0);
            WHEN 'nurturing' THEN NEW.pipeline_progress := COALESCE(OLD.pipeline_progress, 0);
            -- Keep proposal_sent, negotiation, contract_sent for backward compatibility but don't show in UI
            WHEN 'proposal_sent' THEN NEW.pipeline_progress := 75;
            WHEN 'negotiation' THEN NEW.pipeline_progress := 85;
            WHEN 'contract_sent' THEN NEW.pipeline_progress := 90;
            ELSE NEW.pipeline_progress := COALESCE(NEW.pipeline_progress, 0);
        END CASE;
    END IF;
    
    -- Always update lead quality when stage changes
    IF NEW.interest_level = 'high' OR 
       NEW.lead_stage IN ('demo_completed', 'trial_started', 'won') THEN
        NEW.lead_quality := 'hot';
    ELSIF NEW.interest_level = 'medium' OR 
          NEW.lead_stage IN ('qualified', 'demo_scheduled') THEN
        NEW.lead_quality := 'warm';
    ELSIF NEW.interest_level = 'low' OR 
          NEW.lead_stage = 'contacted' THEN
        NEW.lead_quality := 'cool';
    ELSE
        NEW.lead_quality := 'cold';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trigger_track_stage_change
    BEFORE UPDATE OF lead_stage ON leads
    FOR EACH ROW
    EXECUTE FUNCTION track_stage_change();

-- Verify the changes
SELECT 
    lead_stage,
    COUNT(*) as count,
    AVG(pipeline_progress) as avg_progress
FROM leads
GROUP BY lead_stage
ORDER BY 
    CASE lead_stage
        WHEN 'new' THEN 1
        WHEN 'contacted' THEN 2
        WHEN 'qualified' THEN 3
        WHEN 'demo_scheduled' THEN 4
        WHEN 'demo_completed' THEN 5
        WHEN 'trial_started' THEN 6
        WHEN 'won' THEN 7
        WHEN 'lost' THEN 8
        ELSE 9
    END;