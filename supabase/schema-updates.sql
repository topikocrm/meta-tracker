-- CRM Lead Tracking System Updates
-- Run this in Supabase SQL editor after the initial schema

-- Add new enum types for the comprehensive tracking system
CREATE TYPE contact_status AS ENUM (
    'not_attempted',
    'answered', 
    'not_answered',
    'busy_call_later',
    'invalid_number',
    'not_reachable',
    'do_not_call'
);

CREATE TYPE interest_level AS ENUM (
    'high',
    'medium', 
    'low',
    'no_interest',
    'not_qualified'
);

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

CREATE TYPE lead_quality AS ENUM (
    'cold',
    'cool',
    'warm',
    'hot'
);

CREATE TYPE follow_up_priority AS ENUM (
    'urgent',
    'high',
    'medium',
    'low',
    'none'
);

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

-- Add new columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_status contact_status DEFAULT 'not_attempted';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_level interest_level;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_stage lead_stage DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_quality lead_quality DEFAULT 'cold';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS not_qualified_reason VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action next_action;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_priority follow_up_priority DEFAULT 'medium';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_attempts INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_entered_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- Note: days_in_stage removed as generated columns must be immutable
-- We'll calculate this in the application instead
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_progress INTEGER DEFAULT 0;

-- Lost reasons reference table
CREATE TABLE IF NOT EXISTS lost_reason_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reason_code VARCHAR(50) UNIQUE NOT NULL,
    reason_text VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common lost reasons
INSERT INTO lost_reason_options (reason_code, reason_text, category) VALUES
    ('budget', 'Budget Constraints', 'financial'),
    ('competitor', 'Went with Competitor', 'competition'),
    ('not_ready', 'Not Ready to Buy', 'timing'),
    ('no_fit', 'Product Not Suitable', 'product'),
    ('location', 'Location/Delivery Issue', 'logistics'),
    ('size_small', 'Business Too Small', 'qualification'),
    ('size_large', 'Business Too Large', 'qualification'),
    ('wrong_type', 'Different Business Type', 'qualification'),
    ('browsing', 'Just Browsing/Research', 'interest'),
    ('no_decision_maker', 'Decision Maker Not Available', 'process'),
    ('no_response', 'No Response After Multiple Attempts', 'engagement'),
    ('other', 'Other Reason', 'other')
ON CONFLICT (reason_code) DO NOTHING;

-- Stage history tracking
CREATE TABLE IF NOT EXISTS lead_stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    from_stage lead_stage,
    to_stage lead_stage,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_contact_status ON leads(contact_status);
CREATE INDEX IF NOT EXISTS idx_leads_interest_level ON leads(interest_level);
CREATE INDEX IF NOT EXISTS idx_leads_lead_stage ON leads(lead_stage);
CREATE INDEX IF NOT EXISTS idx_leads_lead_quality ON leads(lead_quality);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON leads(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_quality ON leads(assigned_to, lead_quality);

-- Function to auto-update lead quality based on conditions
CREATE OR REPLACE FUNCTION update_lead_quality()
RETURNS TRIGGER AS $$
BEGIN
    -- HOT: High interest or in advanced stages
    IF NEW.interest_level = 'high' 
       OR NEW.lead_stage IN ('demo_completed', 'trial_started', 'proposal_sent', 'negotiation', 'contract_sent') THEN
        NEW.lead_quality := 'hot';
    
    -- WARM: Medium interest or qualified/demo scheduled
    ELSIF NEW.interest_level = 'medium' 
          OR NEW.lead_stage IN ('qualified', 'demo_scheduled') THEN
        NEW.lead_quality := 'warm';
    
    -- COOL: Low interest or just contacted
    ELSIF NEW.interest_level = 'low' 
          OR (NEW.contact_status = 'answered' AND NEW.lead_stage = 'contacted') THEN
        NEW.lead_quality := 'cool';
    
    -- COLD: No interest, not qualified, or no contact
    ELSE
        NEW.lead_quality := 'cold';
    END IF;
    
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
        ELSE NEW.pipeline_progress := NEW.pipeline_progress;
    END CASE;
    
    -- Update stage entered date if stage changed
    IF OLD.lead_stage IS DISTINCT FROM NEW.lead_stage THEN
        NEW.stage_entered_date := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto quality update
DROP TRIGGER IF EXISTS trigger_update_lead_quality ON leads;
CREATE TRIGGER trigger_update_lead_quality
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_quality();

-- Function to log stage changes
CREATE OR REPLACE FUNCTION log_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.lead_stage IS DISTINCT FROM NEW.lead_stage THEN
        INSERT INTO lead_stage_history (lead_id, from_stage, to_stage)
        VALUES (NEW.id, OLD.lead_stage, NEW.lead_stage);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stage history
DROP TRIGGER IF EXISTS trigger_log_stage_change ON leads;
CREATE TRIGGER trigger_log_stage_change
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_stage_change();