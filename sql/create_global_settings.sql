-- Create global_settings table
CREATE TABLE IF NOT EXISTS public.global_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_name TEXT DEFAULT 'Doce Gestão',
    site_url TEXT DEFAULT 'app.docegestao.com',
    environment TEXT DEFAULT 'production',
    maintenance_mode BOOLEAN DEFAULT false,
    
    -- Affiliate Settings
    affiliate_commission_percent NUMERIC DEFAULT 10,
    affiliate_commission_type TEXT DEFAULT 'first_sale',
    affiliate_cookie_duration_days INTEGER DEFAULT 30,
    affiliate_min_payout NUMERIC DEFAULT 100,
    
    -- User Settings
    allow_public_registration BOOLEAN DEFAULT true,
    require_manual_approval BOOLEAN DEFAULT false,
    auto_block_inadimplencia BOOLEAN DEFAULT true,
    
    -- Payment Settings
    stripe_public_key TEXT,
    stripe_secret_key TEXT,
    mercado_pago_token TEXT,
    pix_key TEXT,
    payment_sandbox_mode BOOLEAN DEFAULT true,
    payment_webhook_url TEXT,
    
    -- Notification Settings
    notification_email_enabled BOOLEAN DEFAULT true,
    notification_internal_enabled BOOLEAN DEFAULT true,
    notification_events JSONB DEFAULT '{"new_user": true, "new_payment": true, "cancellation": true}'::jsonb,
    
    -- Security Settings
    security_2fa_required BOOLEAN DEFAULT false,
    session_timeout_minutes INTEGER DEFAULT 60,
    max_login_attempts INTEGER DEFAULT 5,
    allowed_ips TEXT[] DEFAULT '{}',
    
    -- White Label Settings
    white_label_logo_url TEXT,
    white_label_platform_name TEXT DEFAULT 'Doce Gestão',
    white_label_primary_color TEXT DEFAULT '#ec4899',
    white_label_favicon_url TEXT,
    
    -- Finance Settings
    currency_default TEXT DEFAULT 'BRL',
    platform_fee_percent NUMERIC DEFAULT 0,
    
    -- System Limits
    system_limits JSONB DEFAULT '{"max_companies": 1000, "max_users": 5000, "max_orders": 10000, "max_storage_gb": 100}'::jsonb,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert initial row if not exists
INSERT INTO public.global_settings (id)
SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM public.global_settings WHERE id = 1);

-- Enable RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can do everything
CREATE POLICY admin_full_access ON public.global_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Public/Users can read site_name and basic white label info (optional, but good for UI)
-- We might keep it strict for now and fetch via a privileged API.
