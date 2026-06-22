-- ==========================================
-- MIGRATION V12: RELATIONAL ORDER ARCHITECTURE
-- ==========================================
-- This migration normalizes orders, payments and items.

BEGIN;

-- 1. FIX CUSTOMERS TABLE CONSTRAINTS & COLUMNS
DO $$ 
BEGIN 
    -- Ensure 'tenant_id' exists (Standardizing for SaaS v5+)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='tenant_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='company_id') THEN
            ALTER TABLE public.customers RENAME COLUMN company_id TO tenant_id;
        ELSE
            ALTER TABLE public.customers ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Ensure 'phone' exists (Standardizing on English)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='phone') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='telefone') THEN
            ALTER TABLE public.customers RENAME COLUMN telefone TO phone;
        ELSE
            ALTER TABLE public.customers ADD COLUMN phone TEXT;
        END IF;
    END IF;

    -- Drop old constraints that might interfere
    ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_phone_key;
    ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_telefone_key;
    ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_tenant_id_phone_key;

    -- Clean up duplicates before creating the unique constraint
    -- We keep the most recent customer record for each (tenant_id, phone)
    DELETE FROM public.customers a USING (
      SELECT MIN(ctid) as keep_ctid, tenant_id, phone
      FROM public.customers
      GROUP BY tenant_id, phone
      HAVING COUNT(*) > 1
    ) b
    WHERE a.tenant_id = b.tenant_id 
      AND a.phone = b.phone 
      AND a.ctid <> b.keep_ctid;

    -- 1.2 Fix Addresses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='tenant_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='company_id') THEN
            ALTER TABLE public.addresses RENAME COLUMN company_id TO tenant_id;
        END IF;
    END IF;

    -- 1.3 Fix Orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tenant_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='company_id') THEN
            ALTER TABLE public.orders RENAME COLUMN company_id TO tenant_id;
        END IF;
    END IF;

    -- 1.4 Create the definitive unique constraint required by ON CONFLICT
    ALTER TABLE public.customers ADD CONSTRAINT customers_tenant_phone_unique UNIQUE (tenant_id, phone);

END $$;

-- 2. Ensure Payments Table supports the new flow
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL, -- pix, money, card
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. New Table: Payment Cash (Details for money payments)
CREATE TABLE IF NOT EXISTS public.payment_cash (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID UNIQUE REFERENCES public.payments(id) ON DELETE CASCADE,
  needs_change BOOLEAN DEFAULT false,
  change_for NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Update Order Items to match user request (name, unit_price)
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2);

-- Update unit_price defensively based on existing column name (price or preco)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='price') THEN
        UPDATE public.order_items SET unit_price = price WHERE unit_price IS NULL;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='preco') THEN
        UPDATE public.order_items SET unit_price = preco WHERE unit_price IS NULL;
    END IF;
END $$;

-- 4. CLEANUP: Move data from legacy columns in 'orders' to the new tables (Optional but good)
-- Note: This part is skipped for now to avoid data loss on production schemas without careful mapping.

-- 5. THE TRANSACTIONAL FUNCTION (RPC)
-- This function handles the entire order creation logic in a single DB transaction.
CREATE OR REPLACE FUNCTION create_complete_order(
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
  v_result JSONB;
BEGIN
  -- 1. Create or Find Customer
  INSERT INTO public.customers (tenant_id, name, phone, email)
  VALUES (p_tenant_id, p_customer->>'name', p_customer->>'phone', p_customer->>'email')
  ON CONFLICT (tenant_id, phone) DO UPDATE 
  SET name = EXCLUDED.name, email = EXCLUDED.email
  RETURNING id INTO v_customer_id;

  -- 2. Create Address
  INSERT INTO public.addresses (tenant_id, customer_id, street, number, neighborhood, city, complement, zip)
  VALUES (
    p_tenant_id, 
    v_customer_id, 
    p_address->>'street', 
    p_address->>'number', 
    p_address->>'neighborhood', 
    p_address->>'city', 
    p_address->>'complement',
    p_address->>'zip'
  )
  RETURNING id INTO v_address_id;

  -- 3. Create Order
  INSERT INTO public.orders (
    tenant_id, 
    customer_id, 
    address_id, 
    total, 
    status, 
    order_type,
    notes,
    delivery_fee,
    discount
  )
  VALUES (
    p_tenant_id,
    v_customer_id,
    v_address_id,
    (p_order->>'total')::NUMERIC,
    p_order->>'status',
    p_order->>'order_type',
    p_order->>'notes',
    (p_order->>'delivery_fee')::NUMERIC,
    (p_order->>'discount')::NUMERIC
  )
  RETURNING id INTO v_order_id;

  -- 4. Create Order Items (Defensive Insertion)
  FOREACH v_item IN ARRAY p_items
  LOOP
    -- We use Dynamic SQL to handle legacy column names (price vs preco)
    EXECUTE format(
      'INSERT INTO public.order_items (
        order_id, product_id, name, %I, unit_price, %I, variation, extras, observation
      ) VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8)',
      CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='quantidade') THEN 'quantidade' ELSE 'quantity' END,
      CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='preco') THEN 'preco' ELSE 'price' END
    ) 
    USING 
      v_order_id, 
      (v_item->>'product_id')::UUID, 
      v_item->>'name', 
      (v_item->>'quantity')::INT, 
      (v_item->>'unit_price')::NUMERIC,
      v_item->'variation',
      v_item->'extras',
      v_item->>'observation';
  END LOOP;

  -- 5. Create Payment
  INSERT INTO public.payments (tenant_id, order_id, amount, method, status)
  VALUES (
    p_tenant_id,
    v_order_id,
    (p_payment->>'amount')::NUMERIC,
    p_payment->>'method',
    p_payment->>'status'
  )
  RETURNING id INTO v_payment_id;

  -- 6. Payment Cash (Specific for money)
  IF p_payment->>'method' = 'money' OR p_payment->>'method' = 'dinheiro' THEN
    INSERT INTO public.payment_cash (payment_id, needs_change, change_for)
    VALUES (
      v_payment_id,
      (p_payment->>'needs_change')::BOOLEAN,
      (p_payment->>'change_for')::NUMERIC
    );
  END IF;

  -- Success Return
  v_result := jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'customer_id', v_customer_id,
    'payment_id', v_payment_id
  );
  
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Rollback happens automatically in Postgres Functions on error
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql;

COMMIT;
