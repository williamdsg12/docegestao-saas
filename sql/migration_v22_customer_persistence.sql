-- ===================================================
-- MIGRATION V22: PERMANENT CUSTOMER PERSISTENCE SYSTEM
-- ===================================================

BEGIN;

-- 1. ADD COLUMNS TO public.customers TABLE
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(20),
  ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
  ADD COLUMN IF NOT EXISTS address VARCHAR(255),
  ADD COLUMN IF NOT EXISTS number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(150),
  ADD COLUMN IF NOT EXISTS city VARCHAR(150),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS complement TEXT,
  ADD COLUMN IF NOT EXISTS reference_point TEXT,
  ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. SYNC EXISTENT VALUES FOR NAME TO full_name
UPDATE public.customers SET full_name = name WHERE full_name IS NULL;

-- 3. DEDUPLICATE CUSTOMERS TABLE BY tenant_id AND phone
DELETE FROM public.customers a
WHERE EXISTS (
  SELECT 1 FROM public.customers b
  WHERE a.tenant_id = b.tenant_id 
    AND a.phone = b.phone 
    AND a.created_at < b.created_at
);

DELETE FROM public.customers a USING (
  SELECT MIN(ctid) as keep_ctid, tenant_id, phone
  FROM public.customers
  GROUP BY tenant_id, phone
  HAVING COUNT(*) > 1
) b
WHERE a.tenant_id = b.tenant_id 
  AND a.phone = b.phone 
  AND a.ctid <> b.keep_ctid;

-- 4. FORCE UNIQUE CONSTRAINT INDEX
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'customers'
          AND column_name = 'tenant_id'
    ) THEN
        DROP INDEX IF EXISTS idx_customers_tenant_phone;
        CREATE UNIQUE INDEX idx_customers_tenant_phone ON public.customers (tenant_id, phone);
    END IF;
END $$;

-- 5. RELATE ORDERS TO CUSTOMERS Table Link
-- Clean up duplicate constraint fk_orders_customer if it exists to avoid PostgREST embedding ambiguity
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS fk_orders_customer;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_id') THEN
        ALTER TABLE public.orders ADD COLUMN customer_id UUID;
    END IF;

    -- Only create orders_customer_id_fkey if it does not exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
          AND constraint_name = 'orders_customer_id_fkey'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_customer_id_fkey 
        FOREIGN KEY (customer_id) 
        REFERENCES public.customers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 6. REPAIR menu_products TABLE SCHEMA (Fixes "column menu_products.company_id does not exist")
ALTER TABLE public.menu_products 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS setor_impressao TEXT DEFAULT 'cozinha';

-- 7. REWRITE create_complete_order TRANSACTION RPC
CREATE OR REPLACE FUNCTION public.create_complete_order(
  p_tenant_id UUID,
  p_customer JSONB,
  p_address JSONB,
  p_order JSONB,
  p_items JSONB[],
  p_payment JSONB
) RETURNS JSONB AS $$
DECLARE
  v_customer_id UUID;
  v_address_id UUID;
  v_order_id UUID;
  v_payment_id UUID;
  v_item JSONB;
  v_phone TEXT;
BEGIN
  -- Strip non-digits from phone number
  v_phone := regexp_replace(p_customer->>'phone', '\D', '', 'g');

  -- 1. Create or Update Customer record inside public.customers directly
  INSERT INTO public.customers (
    tenant_id, 
    name, 
    full_name, 
    phone, 
    email, 
    cpf_cnpj,
    cep,
    address,
    number,
    neighborhood,
    city,
    state,
    complement,
    reference_point,
    total_orders,
    total_spent,
    last_order_at,
    updated_at
  )
  VALUES (
    p_tenant_id, 
    COALESCE(p_customer->>'name', 'Cliente'), 
    COALESCE(p_customer->>'name', 'Cliente'), 
    v_phone, 
    p_customer->>'email', 
    p_customer->>'cpf_cnpj',
    p_address->>'zip',
    p_address->>'street',
    p_address->>'number',
    p_address->>'neighborhood',
    p_address->>'city',
    p_address->>'state',
    p_address->>'complement',
    p_address->>'reference_point',
    1,
    COALESCE((p_order->>'total')::NUMERIC, 0),
    NOW(),
    NOW()
  )
  ON CONFLICT (tenant_id, phone) DO UPDATE 
  SET 
    name = COALESCE(EXCLUDED.name, public.customers.name),
    full_name = COALESCE(EXCLUDED.full_name, public.customers.full_name),
    email = COALESCE(EXCLUDED.email, public.customers.email),
    cpf_cnpj = COALESCE(EXCLUDED.cpf_cnpj, public.customers.cpf_cnpj),
    cep = COALESCE(EXCLUDED.cep, public.customers.cep),
    address = COALESCE(EXCLUDED.address, public.customers.address),
    number = COALESCE(EXCLUDED.number, public.customers.number),
    neighborhood = COALESCE(EXCLUDED.neighborhood, public.customers.neighborhood),
    city = COALESCE(EXCLUDED.city, public.customers.city),
    state = COALESCE(EXCLUDED.state, public.customers.state),
    complement = COALESCE(EXCLUDED.complement, public.customers.complement),
    reference_point = COALESCE(EXCLUDED.reference_point, public.customers.reference_point),
    total_orders = public.customers.total_orders + 1,
    total_spent = public.customers.total_spent + COALESCE(EXCLUDED.total_spent, 0),
    last_order_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_customer_id;

  -- 2. Create Address record in legacy addresses table (backward compatibility)
  DECLARE
    v_street_col TEXT;
    v_number_col TEXT;
    v_neighborhood_col TEXT;
    v_city_col TEXT;
    v_zip_col TEXT;
  BEGIN
    v_street_col := CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='street') THEN 'street' ELSE 'rua' END;
    v_number_col := CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='number') THEN 'number' ELSE 'numero' END;
    v_neighborhood_col := CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='neighborhood') THEN 'neighborhood' ELSE 'bairro' END;
    v_city_col := CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='city') THEN 'city' ELSE 'cidade' END;
    v_zip_col := CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='zip') THEN 'zip' ELSE 'cep' END;

    EXECUTE format(
      'INSERT INTO public.addresses (tenant_id, customer_id, %I, %I, %I, %I, complement, %I, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      v_street_col, v_number_col, v_neighborhood_col, v_city_col, v_zip_col
    )
    INTO v_address_id
    USING 
      p_tenant_id, v_customer_id, p_address->>'street', p_address->>'number', 
      p_address->>'neighborhood', p_address->>'city', p_address->>'complement', p_address->>'zip', p_address->>'reference_point';
  EXCEPTION WHEN OTHERS THEN
    v_address_id := NULL;
  END;

  -- 3. Create Order
  DECLARE
    v_fee_col TEXT;
    v_status_col TEXT;
  BEGIN
    v_fee_col := CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_fee') THEN 'delivery_fee' ELSE 'taxa_entrega' END;
    v_status_col := CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_status') THEN 'order_status' ELSE 'status' END;

    EXECUTE format(
      'INSERT INTO public.orders (tenant_id, customer_id, address_id, total, %I, order_type, notes, %I, discount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      v_status_col, v_fee_col
    )
    INTO v_order_id
    USING 
      p_tenant_id, v_customer_id, v_address_id, COALESCE((p_order->>'total')::NUMERIC, 0),
      COALESCE(p_order->>'order_status', p_order->>'status', 'novo'), p_order->>'order_type', p_order->>'notes', 
      COALESCE((p_order->>'delivery_fee')::NUMERIC, 0), COALESCE((p_order->>'discount')::NUMERIC, 0);
      
    RAISE NOTICE 'Pedido criado: %', v_order_id;
  END;

  -- 4. Create Order Items
  DECLARE
    v_qty_col TEXT;
    v_total_price_col TEXT;
  BEGIN
    v_qty_col := CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='quantity') THEN 'quantity' ELSE 'quantidade' END;
    v_total_price_col := CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='total_price') THEN 'total_price' WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='preco') THEN 'preco' ELSE 'price' END;

    FOREACH v_item IN ARRAY p_items
    LOOP
      EXECUTE format(
        'INSERT INTO public.order_items (
          tenant_id, order_id, product_id, name, %I, unit_price, %I, variation, extras, observation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        v_qty_col, v_total_price_col
      ) 
      USING 
        p_tenant_id,
        v_order_id, 
        (v_item->>'product_id')::UUID, 
        v_item->>'name', 
        (v_item->>'quantity')::INT, 
        (v_item->>'unit_price')::NUMERIC,
        COALESCE((v_item->>'quantity')::INT * (v_item->>'unit_price')::NUMERIC, 0),
        v_item->'variation', 
        v_item->'extras', 
        v_item->>'observation';
    END LOOP;
  END;

  -- 5. Create Payment
  INSERT INTO public.payments (tenant_id, order_id, amount, method, status)
  VALUES (
    p_tenant_id,
    v_order_id,
    COALESCE((p_payment->>'amount')::NUMERIC, 0),
    p_payment->>'method',
    p_payment->>'status'
  )
  RETURNING id INTO v_payment_id;

  -- 6. Payment Cash
  IF p_payment->>'method' = 'money' OR p_payment->>'method' = 'dinheiro' THEN
    INSERT INTO public.payment_cash (payment_id, needs_change, change_for)
    VALUES (
      v_payment_id,
      COALESCE((p_payment->>'needs_change')::BOOLEAN, false),
      COALESCE((p_payment->>'change_for')::NUMERIC, 0)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- 8. ENABLE REALTIME FOR ORDERS TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
