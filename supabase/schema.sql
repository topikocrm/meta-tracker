-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'interested', 'demo', 'negotiation', 'won', 'lost');
CREATE TYPE interaction_type AS ENUM ('call', 'email', 'whatsapp', 'meeting', 'other');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role DEFAULT 'user',
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lost reasons table
CREATE TABLE lost_reasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reason VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_sheet_id VARCHAR(255) UNIQUE,
    created_time TIMESTAMP WITH TIME ZONE,
    full_name VARCHAR(255),
    phone_number VARCHAR(20),
    whatsapp_number VARCHAR(20),
    email VARCHAR(255),
    state VARCHAR(100),
    city VARCHAR(100),
    campaign_id VARCHAR(255),
    campaign_name VARCHAR(255),
    adset_id VARCHAR(255),
    adset_name VARCHAR(255),
    ad_id VARCHAR(255),
    ad_name VARCHAR(255),
    form_id VARCHAR(255),
    form_name VARCHAR(255),
    platform VARCHAR(50),
    is_organic BOOLEAN DEFAULT false,
    tool_requirement TEXT,
    assigned_to UUID REFERENCES users(id),
    current_status lead_status DEFAULT 'new',
    lost_reason_id UUID REFERENCES lost_reasons(id),
    conversion_value DECIMAL(10, 2),
    sheet_source VARCHAR(255), -- Track which Google Sheet this came from
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead status history table
CREATE TABLE lead_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    previous_status lead_status,
    new_status lead_status NOT NULL,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_in_status INTERVAL
);

-- Lead interactions table
CREATE TABLE lead_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    interaction_type interaction_type NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead notes table
CREATE TABLE lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync logs table (track Google Sheets sync)
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sheet_id VARCHAR(255),
    sheet_name VARCHAR(255),
    sync_type VARCHAR(50),
    records_processed INTEGER,
    records_added INTEGER,
    records_updated INTEGER,
    status VARCHAR(50),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_leads_status ON leads(current_status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_time ON leads(created_time);
CREATE INDEX idx_leads_google_sheet_id ON leads(google_sheet_id);
CREATE INDEX idx_status_history_lead_id ON lead_status_history(lead_id);
CREATE INDEX idx_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX idx_notes_lead_id ON lead_notes(lead_id);

-- Create views for analytics
CREATE VIEW lead_conversion_metrics AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    COUNT(l.id) as total_leads,
    COUNT(CASE WHEN l.current_status = 'won' THEN 1 END) as won_leads,
    COUNT(CASE WHEN l.current_status = 'lost' THEN 1 END) as lost_leads,
    COUNT(CASE WHEN l.current_status NOT IN ('won', 'lost') THEN 1 END) as active_leads,
    ROUND(COUNT(CASE WHEN l.current_status = 'won' THEN 1 END)::numeric / NULLIF(COUNT(l.id), 0) * 100, 2) as conversion_rate,
    SUM(l.conversion_value) as total_revenue
FROM users u
LEFT JOIN leads l ON u.id = l.assigned_to
GROUP BY u.id, u.name;

CREATE VIEW campaign_performance AS
SELECT 
    campaign_name,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN current_status = 'won' THEN 1 END) as conversions,
    ROUND(COUNT(CASE WHEN current_status = 'won' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as conversion_rate,
    SUM(conversion_value) as total_value
FROM leads
WHERE campaign_name IS NOT NULL
GROUP BY campaign_name;

-- Insert default lost reasons
INSERT INTO lost_reasons (reason, category) VALUES
    ('Budget constraints', 'Financial'),
    ('Not interested anymore', 'Interest'),
    ('Went with competitor', 'Competition'),
    ('No response', 'Communication'),
    ('Not ready to purchase', 'Timing'),
    ('Product not suitable', 'Product Fit'),
    ('Location/delivery issues', 'Logistics'),
    ('Price too high', 'Financial'),
    ('Other', 'Other');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads (users can see all leads, but only managers can assign)
CREATE POLICY "Users can view all leads" ON leads
    FOR SELECT USING (true);

CREATE POLICY "Users can update their assigned leads" ON leads
    FOR UPDATE USING (assigned_to = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin')
    ));

CREATE POLICY "Managers can insert leads" ON leads
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin')
    ));

-- RLS Policies for interactions and notes
CREATE POLICY "Users can view all interactions" ON lead_interactions
    FOR SELECT USING (true);

CREATE POLICY "Users can create interactions" ON lead_interactions
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view all notes" ON lead_notes
    FOR SELECT USING (true);

CREATE POLICY "Users can create notes" ON lead_notes
    FOR INSERT WITH CHECK (created_by = auth.uid());