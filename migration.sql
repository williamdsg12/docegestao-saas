-- Migration script for Doce Gestão Delivery System Update

-- 1. Create delivery_pedidos table (named with prefix to avoid conflicts)
CREATE TABLE IF NOT EXISTS public.delivery_pedidos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_address text,
    customer_neighborhood text,
    customer_city text,
    customer_cep text,
    type text NOT NULL CHECK (type IN ('delivery', 'pickup', 'mesa')),
    status text NOT NULL DEFAULT 'recebido' CHECK (status IN ('recebido', 'preparo', 'pronto', 'entrega', 'entregue', 'cancelado')),
    total_value numeric(10,2) DEFAULT 0,
    delivery_fee numeric(10,2) DEFAULT 0,
    payment_method text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Create delivery_pedido_items table
CREATE TABLE IF NOT EXISTS public.delivery_pedido_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id uuid REFERENCES public.delivery_pedidos(id) ON DELETE CASCADE,
    product_id uuid, -- Reference to menu_products if applicable
    product_name text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    price numeric(10,2) NOT NULL
);

-- 3. Create company_team table
CREATE TABLE IF NOT EXISTS public.company_team (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id uuid REFERENCES public.profiles(id),
    name text NOT NULL,
    email text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'manager', 'attendant', 'kitchen', 'delivery')),
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Create delivery_settings table
CREATE TABLE IF NOT EXISTS public.delivery_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    accept_orders boolean DEFAULT true,
    whatsapp_orders text,
    auto_msg text,
    opening_hours jsonb,
    address_zip text,
    address_street text,
    address_number text,
    address_neighborhood text,
    address_city text,
    address_state text,
    delivery_config jsonb DEFAULT '{"radius": 5, "type": "fixa", "fee": 5}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_pedido_items;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_settings;
