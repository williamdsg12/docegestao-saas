-- Migration: 20260408_fix_payment_rls.sql
-- Descrição: Refina as políticas de RLS para company_payment_methods baseando-se no tenant_id do perfil do usuário

BEGIN;

-- 1. Remover políca antiga se existir
DROP POLICY IF EXISTS "Tenants can manage their own payment methods" ON public.company_payment_methods;
DROP POLICY IF EXISTS "Tenants can view their own payment methods" ON public.company_payment_methods;
DROP POLICY IF EXISTS "Tenants can insert their own payment methods" ON public.company_payment_methods;
DROP POLICY IF EXISTS "Tenants can update their own payment methods" ON public.company_payment_methods;
DROP POLICY IF EXISTS "Tenants can delete their own payment methods" ON public.company_payment_methods;

-- 2. Criar políticas baseadas na tabela profiles (mais performático e evita problemas de ownership direto)

-- SELECT
CREATE POLICY "Users can view their tenant payment methods" 
ON public.company_payment_methods 
FOR SELECT 
USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

-- INSERT
CREATE POLICY "Users can insert their tenant payment methods" 
ON public.company_payment_methods 
FOR INSERT 
WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

-- UPDATE
CREATE POLICY "Users can update their tenant payment methods" 
ON public.company_payment_methods 
FOR UPDATE 
USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

-- DELETE
CREATE POLICY "Users can delete their tenant payment methods" 
ON public.company_payment_methods 
FOR DELETE 
USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

COMMIT;
