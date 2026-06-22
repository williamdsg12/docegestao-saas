-- Migration: Robust Payment and Financial Onboarding
-- This script ensures all tables and columns exist with defensive checks.

DO $$ 
BEGIN
    -- 0. Dependencies
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- 1. Table for financial profile data (titular info)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_accounts') THEN
        CREATE TABLE public.payment_accounts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
            document_type TEXT CHECK (document_type IN ('CPF', 'CNPJ')),
            document_number TEXT NOT NULL,
            full_name TEXT NOT NULL,
            mother_name TEXT,
            birth_date DATE,
            occupation TEXT,
            website TEXT,
            email TEXT,
            phone TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(tenant_id)
        );
    END IF;

    -- 2. Table for billing address data
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_billing_addresses') THEN
        CREATE TABLE public.payment_billing_addresses (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
            cep TEXT NOT NULL,
            state TEXT NOT NULL,
            city TEXT NOT NULL,
            neighborhood TEXT NOT NULL,
            address TEXT NOT NULL,
            number TEXT NOT NULL,
            complement TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(tenant_id)
        );
    END IF;

    -- 3. Table for bank account details
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bank_accounts') THEN
        CREATE TABLE public.bank_accounts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
            bank_code TEXT NOT NULL,
            bank_name TEXT NOT NULL,
            account_type TEXT CHECK (account_type IN ('corrente', 'poupança')),
            branch TEXT NOT NULL,
            account_number TEXT NOT NULL,
            pix_type TEXT CHECK (pix_type IN ('CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATÓRIA')),
            pix_key TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(tenant_id)
        );
    END IF;

    -- 4. Table for onboarding progress and status
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_onboarding') THEN
        CREATE TABLE public.payment_onboarding (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'approved', 'rejected')),
            current_step INTEGER DEFAULT 0,
            agreed_at TIMESTAMPTZ,
            last_completed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(tenant_id)
        );
    END IF;

    -- 5. Table for status change logs
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_status_logs') THEN
        CREATE TABLE public.payment_status_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
            previous_status TEXT,
            new_status TEXT NOT NULL,
            reason TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;

    -- 6. Tuna Accounts
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tuna_accounts') THEN
        CREATE TABLE public.tuna_accounts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
            tuna_account_id TEXT,
            access_token TEXT,
            refresh_token TEXT,
            status TEXT DEFAULT 'pending',
            connected BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(tenant_id)
        );
    END IF;

    -- 7. Add columns to company_payment_methods
    -- Note: We check columns individually for robustness
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_payment_methods') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='company_payment_methods' AND column_name='is_active_delivery') THEN
            ALTER TABLE public.company_payment_methods ADD COLUMN is_active_delivery BOOLEAN DEFAULT TRUE;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='company_payment_methods' AND column_name='is_active_pickup') THEN
            ALTER TABLE public.company_payment_methods ADD COLUMN is_active_pickup BOOLEAN DEFAULT TRUE;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='company_payment_methods' AND column_name='is_active_local') THEN
            ALTER TABLE public.company_payment_methods ADD COLUMN is_active_local BOOLEAN DEFAULT TRUE;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='company_payment_methods' AND column_name='is_active_pos') THEN
            ALTER TABLE public.company_payment_methods ADD COLUMN is_active_pos BOOLEAN DEFAULT TRUE;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='company_payment_methods' AND column_name='instructions') THEN
            ALTER TABLE public.company_payment_methods ADD COLUMN instructions TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='company_payment_methods' AND column_name='payment_code') THEN
            ALTER TABLE public.company_payment_methods ADD COLUMN payment_code TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='company_payment_methods' AND column_name='fee_percentage') THEN
            ALTER TABLE public.company_payment_methods ADD COLUMN fee_percentage DECIMAL DEFAULT 0;
        END IF;
    END IF;

END $$;

-- 8. Enable RLS
ALTER TABLE IF EXISTS public.payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_billing_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tuna_accounts ENABLE ROW LEVEL SECURITY;

-- 9. Robust RLS Policies
-- We drop first to ensure clean state
DO $$ 
BEGIN
    -- Helper to clear policies
    DROP POLICY IF EXISTS "payment_acc_policy" ON public.payment_accounts;
    DROP POLICY IF EXISTS "payment_bill_policy" ON public.payment_billing_addresses;
    DROP POLICY IF EXISTS "bank_acc_policy" ON public.bank_accounts;
    DROP POLICY IF EXISTS "onboarding_policy" ON public.payment_onboarding;
    DROP POLICY IF EXISTS "logs_policy" ON public.payment_status_logs;
    DROP POLICY IF EXISTS "tuna_acc_policy" ON public.tuna_accounts;
END $$;

-- Create unified robust policies
CREATE POLICY "payment_acc_policy" ON public.payment_accounts FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() UNION SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "payment_bill_policy" ON public.payment_billing_addresses FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() UNION SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "bank_acc_policy" ON public.bank_accounts FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() UNION SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "onboarding_policy" ON public.payment_onboarding FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() UNION SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "logs_policy" ON public.payment_status_logs FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() UNION SELECT company_id FROM public.profiles WHERE id = auth.uid()));

