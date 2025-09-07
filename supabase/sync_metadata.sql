-- Create sync_metadata table to track last processed row for each sheet
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id VARCHAR(255) UNIQUE NOT NULL,
  sheet_name VARCHAR(255),
  last_row_number INTEGER DEFAULT 0,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  total_rows_processed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add row_number column to leads table if not exists
ALTER TABLE leads ADD COLUMN IF NOT EXISTS row_number INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_managed BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sync_metadata_sheet_id ON sync_metadata(sheet_id);
CREATE INDEX IF NOT EXISTS idx_leads_row_number ON leads(row_number);
CREATE INDEX IF NOT EXISTS idx_leads_is_managed ON leads(is_managed);

-- Insert initial metadata for your sheets
INSERT INTO sync_metadata (sheet_id, sheet_name, last_row_number)
VALUES 
  ('1bDJXrjE70v3kalKPnW2HrLqNTflSssZp0OSRB_Q4PJo', 'Food Leads', 0),
  ('1VtAPMBX0f6YhVYNbWOIvTWPmudu1qiQAP6vHgcJNtU0', 'Boutique Leads', 0)
ON CONFLICT (sheet_id) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sync_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_sync_metadata_updated_at ON sync_metadata;
CREATE TRIGGER update_sync_metadata_updated_at 
  BEFORE UPDATE ON sync_metadata
  FOR EACH ROW 
  EXECUTE FUNCTION update_sync_metadata_updated_at();