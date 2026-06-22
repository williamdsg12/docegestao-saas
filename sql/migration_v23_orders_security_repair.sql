-- =================================================================
-- MIGRATION V23: ORDERS SECURITY, RLS AND RPC REPAIR
-- =================================================================

BEGIN;

-- 1. SYNC PAST ORDERS FIELD NAMES FOR MULTI-TENANCY
UPDATE public.orders SET company_id = tenant_id::uuid WHERE company_id IS NULL AND tenant_id IS NOT NULL AND tenant_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
UPDATE public.orders SET tenant_id = company_id::text WHERE tenant_id IS NULL AND company_id IS NOT NULL;

-- 1.1. CLEAN UP DUPLICATE CONSTRAINTS TO PREVENT EMBEDDING AMBIGUITY
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS fk_orders_customer;

-- 2. RE-ENABLE ROW LEVEL SECURITY ON RELATED TABLES
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_cash ENABLE ROW LEVEL SECURITY;

-- 3. DROP CONFLICTING RLS POLICIES FOR ORDERS
DROP POLICY IF EXISTS "Tenants full access to own orders" ON public.orders;
DROP POLICY IF EXISTS "multi_tenant_isolation_policy" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public select to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public select on orders" ON public.orders;
DROP POLICY IF EXISTS "Merchant full access to orders" ON public.orders;

-- 4. CREATE ROBUST RLS POLICIES FOR ORDERS
-- Merchant access: Check if merchant profile tenant_id/company_id matches order tenant_id/company_id
CREATE POLICY "Merchant full access to orders"
ON public.orders
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT company_id::text FROM public.profiles WHERE id = auth.uid()
  )
  OR
  company_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Public checkout insertion
CREATE POLICY "Allow public insert to orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Anonymous customer order details viewing for tracking/payments
CREATE POLICY "Allow public select to orders"
ON public.orders
FOR SELECT
TO anon, authenticated
USING (true);


-- 5. RECREATE RLS POLICIES FOR ORDER_ITEMS (Inherit from orders)
DROP POLICY IF EXISTS "Allow public insert on order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public insert to order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public select to order_items" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;

CREATE POLICY "Allow public insert to order_items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public select to order_items"
ON public.order_items
FOR SELECT
TO anon, authenticated
USING (order_id IN (SELECT id FROM public.orders));


-- 6. RECREATE RLS POLICIES FOR PAYMENTS (Inherit from orders)
DROP POLICY IF EXISTS "Allow public insert on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow public insert to payments" ON public.payments;
DROP POLICY IF EXISTS "Allow public select to payments" ON public.payments;
DROP POLICY IF EXISTS "payments_select_policy" ON public.payments;

CREATE POLICY "Allow public insert to payments"
ON public.payments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public select to payments"
ON public.payments
FOR SELECT
TO anon, authenticated
USING (order_id IN (SELECT id FROM public.orders));


-- 7. RECREATE RLS POLICIES FOR PAYMENT_CASH (Inherit from payments)
DROP POLICY IF EXISTS "Allow public insert on payment_cash" ON public.payment_cash;
DROP POLICY IF EXISTS "Allow public insert to payment_cash" ON public.payment_cash;
DROP POLICY IF EXISTS "Allow public select to payment_cash" ON public.payment_cash;
DROP POLICY IF EXISTS "payment_cash_select_policy" ON public.payment_cash;

CREATE POLICY "Allow public insert to payment_cash"
ON public.payment_cash
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public select to payment_cash"
ON public.payment_cash
FOR SELECT
TO anon, authenticated
USING (payment_id IN (SELECT id FROM public.payments));


-- 8. REWRITE create_complete_order TRANSACTIONAL RPC WITH SECURITY DEFINER
-- This bypasses RLS rules internally during checkout execution and handles all constraints safely.
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

  -- 1. Create or Update Customer record inside public.customers
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

  -- 3. Create Order (Populates BOTH tenant_id AND company_id to align with RLS policies)
  DECLARE
    v_fee_col TEXT;
    v_status_col TEXT;
  BEGIN
    v_fee_col := CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_fee') THEN 'delivery_fee' ELSE 'taxa_entrega' END;
    v_status_col := CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_status') THEN 'order_status' ELSE 'status' END;

    EXECUTE format(
      'INSERT INTO public.orders (tenant_id, company_id, customer_id, address_id, total, %I, order_type, notes, %I, discount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      v_status_col, v_fee_col
    )
    INTO v_order_id
    USING 
      p_tenant_id, p_tenant_id, v_customer_id, v_address_id, COALESCE((p_order->>'total')::NUMERIC, 0),
      COALESCE(p_order->>'order_status', p_order->>'status', 'novo'), p_order->>'order_type', p_order->>'notes', 
      COALESCE((p_order->>'delivery_fee')::NUMERIC, 0), COALESCE((p_order->>'discount')::NUMERIC, 0);
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
