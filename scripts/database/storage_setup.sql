-- MASTER FIX: Configuração de Storage (Avatars e Logos) - Versão Robusta
-- Este script resolve os erros de "Bucket not found" e "RLS Policy" sem acessar tabelas restritas.

-- 1. CRIAR OS BUCKETS (FORÇAR CONFIGURAÇÃO CORRETA)
-- Nota: Supabase permite INSERT em storage.buckets se você tiver permissões apropriadas, 
-- mas geralmente é melhor fazer isso pelo painel UI. Este bloco tenta fazer via SQL.
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
    
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('logos', 'logos', true)
    ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar buckets. Certifique-se de que os buckets "avatars" e "logos" existem no painel Storage.';
END $$;

-- 2. CONFIGURAR POLÍTICAS PARA 'AVATARS'
-- Removemos o DELETE FROM pg_policy e usamos DROP POLICY direto.
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
CREATE POLICY "avatars_public_select" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_auth_all" ON storage.objects;
CREATE POLICY "avatars_auth_all" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 3. CONFIGURAR POLÍTICAS PARA 'LOGOS'
DROP POLICY IF EXISTS "logos_public_select" ON storage.objects;
CREATE POLICY "logos_public_select" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "logos_auth_all" ON storage.objects;
CREATE POLICY "logos_auth_all" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'logos')
WITH CHECK (bucket_id = 'logos');
