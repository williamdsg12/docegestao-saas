-- DOCESGESTÃO - USER MENU & INFRASTRUCTURE SETUP
-- Final implementation for Profile, Settings, Notifications and Security

-- 1. Create User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    language text DEFAULT 'pt-BR',
    currency text DEFAULT 'BRL',
    timezone text DEFAULT 'America/Sao_Paulo',
    whatsapp_default text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- RLS for User Settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 2. Ensure Notifications Table is Robust
-- (Already exists in saas_pro_master_architecture.sql, but let's ensure it has all fields)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notifications') THEN
        CREATE TABLE public.notifications (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
            title text NOT NULL,
            message text NOT NULL,
            type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
            read boolean DEFAULT false,
            created_at timestamp with time zone DEFAULT now()
        );
    END IF;
END $$;

-- RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications"
    ON public.notifications FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)));

-- 3. Storage Setup (Avatars Bucket)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Avatars
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Initial trigger for user_settings
-- Automatically create user_settings when a user is created
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_settings') THEN
        CREATE TRIGGER on_auth_user_created_settings
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_settings();
    END IF;
END $$;
