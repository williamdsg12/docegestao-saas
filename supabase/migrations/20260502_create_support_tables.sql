-- Migration: Create Support Messaging Tables
-- Date: 2026-05-02

BEGIN;

-- 1. Support Conversations Table
CREATE TABLE IF NOT EXISTS public.support_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    type text NOT NULL DEFAULT 'suporte' CHECK (type IN ('suporte', 'cliente', 'interno')),
    status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_atendimento', 'finalizado')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Support Messages Table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES public.support_conversations(id) ON DELETE CASCADE,
    sender text NOT NULL CHECK (sender IN ('empresa', 'suporte')),
    sender_id uuid REFERENCES auth.users(id),
    content text NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Conversations
-- Users can see their own conversations
DROP POLICY IF EXISTS "Users can view their own support conversations" ON public.support_conversations;
CREATE POLICY "Users can view their own support conversations" ON public.support_conversations
FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all support conversations
DROP POLICY IF EXISTS "Admins can view all support conversations" ON public.support_conversations;
CREATE POLICY "Admins can view all support conversations" ON public.support_conversations
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
);

-- Users can create their own conversations
DROP POLICY IF EXISTS "Users can create their own support conversations" ON public.support_conversations;
CREATE POLICY "Users can create their own support conversations" ON public.support_conversations
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. RLS Policies for Messages
-- Users can see messages in their conversations
DROP POLICY IF EXISTS "Users can view messages in their support conversations" ON public.support_messages;
CREATE POLICY "Users can view messages in their support conversations" ON public.support_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.support_conversations
        WHERE support_conversations.id = support_messages.conversation_id
        AND support_conversations.user_id = auth.uid()
    )
);

-- Admins can see all support messages
DROP POLICY IF EXISTS "Admins can view all support messages" ON public.support_messages;
CREATE POLICY "Admins can view all support messages" ON public.support_messages
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
);

-- Users can send messages to their conversations
DROP POLICY IF EXISTS "Users can send messages to their support conversations" ON public.support_messages;
CREATE POLICY "Users can send messages to their support conversations" ON public.support_messages
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.support_conversations
        WHERE support_conversations.id = support_messages.conversation_id
        AND support_conversations.user_id = auth.uid()
    )
    AND sender = 'empresa'
);

-- 6. Enable Realtime
-- Add to publication for realtime updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

COMMIT;
