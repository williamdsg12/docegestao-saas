-- Migration V31: Chat Sessions for welcome message control and anti-duplication

CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    welcome_sent BOOLEAN DEFAULT false NOT NULL,
    welcome_sent_at TIMESTAMP WITH TIME ZONE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_chat_session UNIQUE (tenant_id, phone)
);

-- Habilita RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "chat_sessions: tenant isolation" ON public.chat_sessions;
CREATE POLICY "chat_sessions: tenant isolation" ON public.chat_sessions
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Habilita replicação Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_class c ON c.oid = pr.prrelid
        JOIN pg_publication p ON p.oid = pr.prpubid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'chat_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
    END IF;
END $$;
