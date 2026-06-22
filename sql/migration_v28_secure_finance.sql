-- Migration V28: Secure Finance and Receivables Setup

-- 1. Helper function for updated_at if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. CREATE TABLE: financial_passwords
CREATE TABLE IF NOT EXISTS public.financial_passwords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    recovery_code VARCHAR(10),
    recovery_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_access_at TIMESTAMP WITH TIME ZONE
);

-- 3. CREATE TABLE: pix_accounts
CREATE TABLE IF NOT EXISTS public.pix_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    receiver_name VARCHAR(255) NOT NULL,
    document VARCHAR(20) NOT NULL,
    pix_type VARCHAR(50) NOT NULL, -- 'cpf', 'cnpj', 'email', 'phone', 'random'
    pix_key VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CREATE TABLE: bank_accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    agency VARCHAR(50) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- 'corrente', 'poupanca'
    holder_name VARCHAR(255) NOT NULL,
    holder_document VARCHAR(20) NOT NULL,
    ispb VARCHAR(20),
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CREATE TABLE: gateway_accounts
CREATE TABLE IF NOT EXISTS public.gateway_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    gateway_name VARCHAR(50) NOT NULL, -- 'mercadopago', 'asaas', 'stripe', etc.
    public_key VARCHAR(255),
    secret_key TEXT,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT false NOT NULL,
    environment VARCHAR(50) DEFAULT 'sandbox' NOT NULL, -- 'sandbox', 'production'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (tenant_id, gateway_name)
);

-- 6. CREATE TABLE: card_payment_settings
CREATE TABLE IF NOT EXISTS public.card_payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID UNIQUE NOT NULL,
    accept_credit BOOLEAN DEFAULT true NOT NULL,
    accept_debit BOOLEAN DEFAULT true NOT NULL,
    max_installments INTEGER DEFAULT 12 NOT NULL,
    installment_interest NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    min_installment_value NUMERIC(10,2) DEFAULT 5.00 NOT NULL,
    accepted_brands TEXT[] DEFAULT ARRAY['visa', 'mastercard', 'elo', 'hipercard', 'amex']::TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. CREATE TABLE: financial_audit_logs
CREATE TABLE IF NOT EXISTS public.financial_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    action TEXT NOT NULL,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TRIGGERS for updated_at
DROP TRIGGER IF EXISTS trg_financial_passwords_updated_at ON public.financial_passwords;
CREATE TRIGGER trg_financial_passwords_updated_at BEFORE UPDATE ON public.financial_passwords
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_pix_accounts_updated_at ON public.pix_accounts;
CREATE TRIGGER trg_pix_accounts_updated_at BEFORE UPDATE ON public.pix_accounts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_bank_accounts_updated_at ON public.bank_accounts;
CREATE TRIGGER trg_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_gateway_accounts_updated_at ON public.gateway_accounts;
CREATE TRIGGER trg_gateway_accounts_updated_at BEFORE UPDATE ON public.gateway_accounts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_card_payment_settings_updated_at ON public.card_payment_settings;
CREATE TRIGGER trg_card_payment_settings_updated_at BEFORE UPDATE ON public.card_payment_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.financial_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. MULTI-TENANT ISOLATION POLICIES (RLS)
-- Policies based on matching the profile's tenant_id

-- 10a. financial_passwords
DROP POLICY IF EXISTS "financial_passwords: tenant isolation" ON public.financial_passwords;
CREATE POLICY "financial_passwords: tenant isolation" ON public.financial_passwords
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 10b. pix_accounts
DROP POLICY IF EXISTS "pix_accounts: tenant isolation" ON public.pix_accounts;
CREATE POLICY "pix_accounts: tenant isolation" ON public.pix_accounts
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 10c. bank_accounts
DROP POLICY IF EXISTS "bank_accounts: tenant isolation" ON public.bank_accounts;
CREATE POLICY "bank_accounts: tenant isolation" ON public.bank_accounts
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 10d. gateway_accounts
DROP POLICY IF EXISTS "gateway_accounts: tenant isolation" ON public.gateway_accounts;
CREATE POLICY "gateway_accounts: tenant isolation" ON public.gateway_accounts
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 10e. card_payment_settings
DROP POLICY IF EXISTS "card_payment_settings: tenant isolation" ON public.card_payment_settings;
CREATE POLICY "card_payment_settings: tenant isolation" ON public.card_payment_settings
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 10f. financial_audit_logs
DROP POLICY IF EXISTS "financial_audit_logs: tenant isolation" ON public.financial_audit_logs;
CREATE POLICY "financial_audit_logs: tenant isolation" ON public.financial_audit_logs
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
