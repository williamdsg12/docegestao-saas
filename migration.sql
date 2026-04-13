-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text,
    message text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policy
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- 4. Function to notify new order
CREATE OR REPLACE FUNCTION public.fn_notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify all users associated with this company_id
    -- Using COALESCE to handle both tenant_id and company_id naming conventions
    INSERT INTO public.notifications (user_id, company_id, type, title, message)
    SELECT p.id, COALESCE(NEW.tenant_id, NEW.company_id), 'pedido', 'Novo Pedido!', 
           'Você recebeu um novo pedido de R$ ' || NEW.total::text
    FROM public.profiles p
    WHERE p.company_id = COALESCE(NEW.tenant_id, NEW.company_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create Trigger
DROP TRIGGER IF EXISTS trg_notify_new_order ON public.orders;
CREATE TRIGGER trg_notify_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_notify_new_order();
