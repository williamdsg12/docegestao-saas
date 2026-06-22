-- Update global_settings table with enhanced SaaS fields
ALTER TABLE public.global_settings 
ADD COLUMN IF NOT EXISTS site_logo_url TEXT,
ADD COLUMN IF NOT EXISTS site_language TEXT DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS site_timezone TEXT DEFAULT 'America/Sao_Paulo',
ADD COLUMN IF NOT EXISTS affiliate_system_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_sms_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_templates JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS security_reset_password_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS finance_tax_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS finance_invoice_rules TEXT;

-- Ensure RLS is still correct
-- (Assuming admin_full_access already exists from previous migration)

-- Update initial row with defaults if necessary
UPDATE public.global_settings 
SET 
    site_language = COALESCE(site_language, 'pt-BR'),
    site_timezone = COALESCE(site_timezone, 'America/Sao_Paulo'),
    notification_templates = COALESCE(notification_templates, '{}'::jsonb)
WHERE id = 1;
