-- Decommissioning Product Intelligence
-- This migration removes or marks for removal columns and tables that were purely for product feedback analysis.

-- 1. Drop the inbox_messages table as it was primarily for email-based product feedback
DROP TABLE IF EXISTS inbox_messages CASCADE;

-- 2. Drop user_email_configs if it exists
DROP TABLE IF EXISTS user_email_configs CASCADE;

-- Note: The 'insighthub_email' column in 'profiles' is kept as it might be used as a unique identifier 
-- or for future lead attribution, but its primary current use was for forwarding.
