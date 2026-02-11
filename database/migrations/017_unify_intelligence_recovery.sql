-- Add columns for Unified Intelligence & Recovery logic

-- 1. Create Enum for Service Status (Manual Action)
CREATE TYPE service_status_type AS ENUM ('pending', 'contacted');

-- 2. Add new columns to leads_profiles
ALTER TABLE leads_profiles
ADD COLUMN service_status service_status_type DEFAULT 'pending',
ADD COLUMN potential_value NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN converted_value NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN last_platform TEXT;

-- 3. Update existing rows (Migration logic)
-- If score > 0, assume pending. 
UPDATE leads_profiles SET service_status = 'pending' WHERE lead_score > 0;

-- 4. Create Index on service_status for faster filtering
CREATE INDEX idx_leads_service_status ON leads_profiles(service_status);
