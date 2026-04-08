-- Add customization columns to order items tables (Professional and Legacy)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS variation JSONB,
ADD COLUMN IF NOT EXISTS extras JSONB,
ADD COLUMN IF NOT EXISTS observation TEXT;

ALTER TABLE menu_order_items
ADD COLUMN IF NOT EXISTS variation JSONB,
ADD COLUMN IF NOT EXISTS extras JSONB,
ADD COLUMN IF NOT EXISTS observation TEXT;
