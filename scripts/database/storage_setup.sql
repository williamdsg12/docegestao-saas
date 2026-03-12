-- MASTER FIX: Configuração de Storage (Avatars e Logos)
-- Este script resolve definitivamente os erros de "Bucket not found" e "RLS Policy".

-- 1. CRIAR OS BUCKETS (FORÇAR CONFIGURAÇÃO CORRETA)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true), ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 2. LIMPAR TODAS AS POLÍTICAS EXISTENTES PARA ESTES BUCKETS (RESET)
DELETE FROM pg_policy 
WHERE polrelid = 'storage.objects'::regclass 
AND (polname LIKE '%avatars%' OR polname LIKE '%logos%');

-- 3. POLÍTICAS PARA O BUCKET 'AVATARS'
-- Permitir que qualquer pessoa veja os avatars
CREATE POLICY "avatars_public_select" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Permitir tudo para usuários autenticados no bucket avatars
CREATE POLICY "avatars_auth_all" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 4. POLÍTICAS PARA O BUCKET 'LOGOS'
-- Permitir que qualquer pessoa veja os logos
CREATE POLICY "logos_public_select" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

-- Permitir tudo para usuários autenticados no bucket logos
CREATE POLICY "logos_auth_all" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'logos')
WITH CHECK (bucket_id = 'logos');
