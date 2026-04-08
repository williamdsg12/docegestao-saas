-- Add customization columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS extras JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN products.variations IS 'Array of variants: {id, name, price_adjustment, is_default}';
COMMENT ON COLUMN products.extras IS 'Array of add-ons: {id, name, price, max_quantity}';
