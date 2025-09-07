-- Complete CRM Feature Schema Update for Lead Tracker
-- Run this entire file in Supabase SQL Editor
-- This adds all advanced CRM tracking features

-- ============================================
-- STEP 1: Create enum types (with existence checks)
-- ============================================

DO $$ 
BEGIN
    -- Contact Status Enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_status') THEN
        CREATE TYPE contact_status AS ENUM (
            'not_attempted',
            'answered', 
            'not_answered',
            'busy_call_later',
            'invalid_number',
            'not_reachable',
            'do_not_call'
        );
    END IF;
    
    -- Interest Level Enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interest_level') THEN
        CREATE TYPE interest_level AS ENUM (
            'high',
            'medium', 
            'low',
            'no_interest',
            'not_qualified'
        );
    END IF;
    
    -- Lead Stage Enum (Pipeline Stages)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_stage') THEN
        CREATE TYPE lead_stage AS ENUM (
            'new',
            'contacted',
            'qualified',
            'demo_scheduled',
            'demo_completed',
            'trial_started',
            'proposal_sent',
            'negotiation',
            'contract_sent',
            'won',
            'lost',
            'on_hold',
            'nurturing'
        );
    END IF;
    
    -- Lead Quality Enum (Hot/Warm/Cool/Cold)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_quality') THEN
        CREATE TYPE lead_quality AS ENUM (
            'cold',
            'cool',
            'warm',
            'hot'
        );
    END IF;
    
    -- Follow-up Priority Enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'follow_up_priority') THEN
        CREATE TYPE follow_up_priority AS ENUM (
            'urgent',
            'high',
            'medium',
            'low',
            'none'
        );
    END IF;
    
    -- Next Action Enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'next_action') THEN
        CREATE TYPE next_action AS ENUM (
            'call_back',
            'send_information',
            'schedule_demo',
            'create_trial',
            'send_proposal',
            'follow_up_later',
            'close_deal',
            'no_action',
            'archive'
        );
    END IF;
END $$;

-- ============================================
-- STEP 2: Add CRM columns to leads table
-- ============================================

-- Contact and interaction fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_status contact_status DEFAULT 'not_attempted';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_level interest_level;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_stage lead_stage DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_quality lead_quality DEFAULT 'cold';

-- Lost reason fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS not_qualified_reason VARCHAR(255);

-- Action and follow-up fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action next_action;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_priority follow_up_priority DEFAULT 'medium';

-- Contact tracking fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_attempts INTEGER DEFAULT 0;

-- Pipeline tracking fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_entered_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_progress INTEGER DEFAULT 0;

-- Business fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_revenue DECIMAL(12, 2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS probability_percentage INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_close_date DATE;

-- Additional tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_managed BOOLEAN DEFAULT true;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS row_number INTEGER;

-- ============================================
-- STEP 3: Create lost reasons reference table
-- ============================================

CREATE TABLE IF NOT EXISTS lost_reason_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reason_code VARCHAR(50) UNIQUE NOT NULL,
    reason_text VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common lost reasons (only if table is empty)
INSERT INTO lost_reason_options (reason_code, reason_text, category) 
SELECT * FROM (VALUES
    ('budget', 'Budget Constraints', 'financial'),
    ('competitor', 'Went with Competitor', 'competition'),
    ('not_ready', 'Not Ready to Buy', 'timing'),
    ('no_fit', 'Product Not Suitable', 'product'),
    ('location', 'Location/Delivery Issue', 'logistics'),
    ('no_response', 'No Response from Lead', 'communication'),
    ('changed_mind', 'Changed Mind', 'decision'),
    ('too_expensive', 'Too Expensive', 'financial'),
    ('no_budget', 'No Budget Available', 'financial'),
    ('bad_timing', 'Bad Timing', 'timing'),
    ('lost_contact', 'Lost Contact', 'communication'),
    ('not_decision_maker', 'Not Decision Maker', 'qualification'),
    ('other', 'Other Reason', 'other')
) AS v(reason_code, reason_text, category)
WHERE NOT EXISTS (SELECT 1 FROM lost_reason_options LIMIT 1);

-- ============================================
-- STEP 4: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_leads_sheet_source ON leads(sheet_source);
CREATE INDEX IF NOT EXISTS idx_leads_current_status ON leads(current_status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_stage ON leads(lead_stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_lead_quality ON leads(lead_quality);
CREATE INDEX IF NOT EXISTS idx_leads_is_managed ON leads(is_managed);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON leads(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_created_time ON leads(created_time);

-- ============================================
-- STEP 5: Create functions for automatic updates
-- ============================================

-- Function to automatically update lead quality based on stage and interest
CREATE OR REPLACE FUNCTION update_lead_quality()
RETURNS TRIGGER AS $$
BEGIN
    -- Hot leads: High interest or advanced stages
    IF NEW.interest_level = 'high' OR 
       NEW.lead_stage IN ('demo_completed', 'trial_started', 'proposal_sent', 'negotiation', 'contract_sent') THEN
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

-- Create trigger for automatic lead quality updates
DROP TRIGGER IF EXISTS trigger_update_lead_quality ON leads;
CREATE TRIGGER trigger_update_lead_quality
    BEFORE INSERT OR UPDATE OF interest_level, lead_stage ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_quality();

-- Function to track stage changes
CREATE OR REPLACE FUNCTION track_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.lead_stage IS DISTINCT FROM NEW.lead_stage THEN
        NEW.stage_entered_date := NOW();
        
        -- Update pipeline progress based on stage
        CASE NEW.lead_stage
            WHEN 'new' THEN NEW.pipeline_progress := 0;
            WHEN 'contacted' THEN NEW.pipeline_progress := 15;
            WHEN 'qualified' THEN NEW.pipeline_progress := 25;
            WHEN 'demo_scheduled' THEN NEW.pipeline_progress := 35;
            WHEN 'demo_completed' THEN NEW.pipeline_progress := 50;
            WHEN 'trial_started' THEN NEW.pipeline_progress := 60;
            WHEN 'proposal_sent' THEN NEW.pipeline_progress := 70;
            WHEN 'negotiation' THEN NEW.pipeline_progress := 85;
            WHEN 'contract_sent' THEN NEW.pipeline_progress := 95;
            WHEN 'won' THEN NEW.pipeline_progress := 100;
            WHEN 'lost' THEN NEW.pipeline_progress := 0;
            ELSE NEW.pipeline_progress := NEW.pipeline_progress;
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stage tracking
DROP TRIGGER IF EXISTS trigger_track_stage_change ON leads;
CREATE TRIGGER trigger_track_stage_change
    BEFORE UPDATE OF lead_stage ON leads
    FOR EACH ROW
    EXECUTE FUNCTION track_stage_change();

-- ============================================
-- STEP 6: Update existing leads with default values
-- ============================================

-- Set default values for existing leads that don't have CRM fields
UPDATE leads 
SET 
    lead_stage = COALESCE(lead_stage, 'new'),
    lead_quality = COALESCE(lead_quality, 'cold'),
    contact_status = COALESCE(contact_status, 'not_attempted'),
    follow_up_priority = COALESCE(follow_up_priority, 'medium'),
    is_managed = COALESCE(is_managed, true),
    pipeline_progress = COALESCE(pipeline_progress, 0)
WHERE lead_stage IS NULL OR lead_quality IS NULL;

-- ============================================
-- STEP 7: Grant permissions (adjust as needed)
-- ============================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON leads TO authenticated;
GRANT SELECT ON lost_reason_options TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- Verification Query - Run this to check if everything worked
-- ============================================
/*
SELECT 
    COUNT(*) as total_leads,
    COUNT(lead_stage) as leads_with_stage,
    COUNT(lead_quality) as leads_with_quality,
    COUNT(contact_status) as leads_with_contact_status
FROM leads;
*/

-- Success! Your CRM features are now fully installed.
-- The leads table now has all advanced CRM tracking capabilities.