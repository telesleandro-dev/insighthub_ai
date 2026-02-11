-- Decommissioning Products Infrastructure
-- This migration removes the separate products table and moves product information directly into sales_events.

-- 1. Add product information columns to sales_events if they don't exist
ALTER TABLE public.sales_events ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.sales_events ADD COLUMN IF NOT EXISTS external_product_id TEXT;

-- 2. Migrate existing data from products table to sales_events
UPDATE public.sales_events se
SET 
    product_name = p.name,
    external_product_id = p.external_id
FROM public.products p
WHERE se.product_id = p.id;

-- 3. Update knowledge_files to be global per user (remove FK to products)
ALTER TABLE public.knowledge_files DROP CONSTRAINT IF EXISTS knowledge_files_product_id_fkey;
-- Keep the column but make it text if we want to filter by name later, 
-- or just keep it as is (null) if it's now global.
-- For now, let's just make it a text field to store the product name it refers to if any.
ALTER TABLE public.knowledge_files ALTER COLUMN product_id TYPE TEXT USING product_id::text;
ALTER TABLE public.knowledge_files RENAME COLUMN product_id TO product_reference;

-- 4. Remove the foreign key and column from sales_events
ALTER TABLE public.sales_events DROP COLUMN IF EXISTS product_id;

-- 5. Drop the products table
DROP TABLE IF EXISTS public.products CASCADE;
