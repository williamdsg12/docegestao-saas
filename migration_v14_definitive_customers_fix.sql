-- ==========================================
-- MIGRATION V14: DEFINITIVE CUSTOMERS SCHEMA FIX
-- ==========================================
-- This script fixes the "no unique constraint matching" error by 
-- force-standardizing the customers table.

BEGIN;

-- 1. CLEAN UP COLUMNS
DO $$ 
BEGIN 
    -- 1.1 Standardize tenant_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='company_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='tenant_id') THEN
            ALTER TABLE public.customers RENAME COLUMN company_id TO tenant_id;
        ELSE
            -- Both exist? Move data and drop company_id
            UPDATE public.customers SET tenant_id = company_id WHERE tenant_id IS NULL;
            ALTER TABLE public.customers DROP COLUMN company_id;
        END IF;
    END IF;

    -- 1.2 Standardize phone
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='telefone') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='phone') THEN
            ALTER TABLE public.customers RENAME COLUMN telefone TO phone;
        ELSE
            -- Both exist? Move data and drop telefone
            UPDATE public.customers SET phone = telefone WHERE phone IS NULL;
            ALTER TABLE public.customers DROP COLUMN telefone;
        END IF;
    END IF;
    
    -- Ensure columns have correct types with explicit casting
    BEGIN
        ALTER TABLE public.customers ALTER COLUMN tenant_id SET DATA TYPE UUID USING tenant_id::UUID;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'Could not cast tenant_id to UUID, it might already be UUID or have invalid data';
    END;
    
    ALTER TABLE public.customers ALTER COLUMN phone SET DATA TYPE TEXT;

    -- 1.3 Standardize addresses columns (FORCE zip/cep alignment)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addresses') THEN
        -- ZIP / CEP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='cep') AND 
           NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='zip') THEN
            ALTER TABLE public.addresses RENAME COLUMN cep TO zip;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='zip') THEN
            ALTER TABLE public.addresses ADD COLUMN zip TEXT;
        END IF;

        -- RUA / STREET
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='rua') AND 
           NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='street') THEN
            ALTER TABLE public.addresses RENAME COLUMN rua TO street;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='street') THEN
            ALTER TABLE public.addresses ADD COLUMN street TEXT;
        END IF;

        -- NUMERO / NUMBER
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='numero') AND 
           NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='number') THEN
            ALTER TABLE public.addresses RENAME COLUMN numero TO number;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='number') THEN
            ALTER TABLE public.addresses ADD COLUMN number TEXT;
        END IF;

        -- BAIRRO / NEIGHBORHOOD
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='bairro') AND 
           NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='neighborhood') THEN
            ALTER TABLE public.addresses RENAME COLUMN bairro TO neighborhood;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='neighborhood') THEN
            ALTER TABLE public.addresses ADD COLUMN neighborhood TEXT;
        END IF;

        -- CIDADE / CITY
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='cidade') AND 
           NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='city') THEN
            ALTER TABLE public.addresses RENAME COLUMN cidade TO city;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='city') THEN
            ALTER TABLE public.addresses ADD COLUMN city TEXT;
        END IF;
    END IF;

END $$;

-- 2. DROP ALL EXISTING UNIQUE CONSTRAINTS (TO AVOID CONFLICTS)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.customers'::regclass 
        AND contype = 'u'
    ) LOOP
        EXECUTE 'ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 3. AGGRESSIVE DEDUPLICATION
-- Keep only the newest record (by created_at or highest ID/ctid)
DELETE FROM public.customers a
WHERE EXISTS (
  SELECT 1 FROM public.customers b
  WHERE a.tenant_id = b.tenant_id 
    AND a.phone = b.phone 
    AND a.created_at < b.created_at
);

-- If created_at is equal, use ctid as tie-breaker
DELETE FROM public.customers a USING (
  SELECT MIN(ctid) as keep_ctid, tenant_id, phone
  FROM public.customers
  GROUP BY tenant_id, phone
  HAVING COUNT(*) > 1
) b
WHERE a.tenant_id = b.tenant_id 
  AND a.phone = b.phone 
  AND a.ctid <> b.keep_ctid;

-- 4. CREATE THE DEFINITIVE UNIQUE INDEX
-- PostgREST / ON CONFLICT works best with unique indexes
DROP INDEX IF EXISTS idx_customers_tenant_phone;
CREATE UNIQUE INDEX idx_customers_tenant_phone ON public.customers (tenant_id, phone);

-- 5. RE-REGISTER THE RPC FUNCTION (Ensuring it uses the right columns)
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
  -- 1. Create or Find Customer (Using the newly indexed columns)
  INSERT INTO public.customers (tenant_id, name, phone, email)
  VALUES (p_tenant_id, p_customer->>'name', p_customer->>'phone', p_customer->>'email')
  ON CONFLICT (tenant_id, phone) DO UPDATE 
  SET name = EXCLUDED.name, email = EXCLUDED.email
  RETURNING id INTO v_customer_id;

  -- 2. Create Address (Dynamic Columns)
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
      'INSERT INTO public.addresses (tenant_id, customer_id, %I, %I, %I, %I, complement, %I)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      v_street_col, v_number_col, v_neighborhood_col, v_city_col, v_zip_col
    )
    INTO v_address_id
    USING 
      p_tenant_id, v_customer_id, p_address->>'street', p_address->>'number', 
      p_address->>'neighborhood', p_address->>'city', p_address->>'complement', p_address->>'zip';
  END;

  -- 3. Create Order (Dynamic Columns)
  DECLARE
    v_fee_col TEXT;
  BEGIN
    v_fee_col := CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_fee') THEN 'delivery_fee' ELSE 'taxa_entrega' END;

    EXECUTE format(
      'INSERT INTO public.orders (tenant_id, customer_id, address_id, total, status, order_type, notes, %I, discount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      v_fee_col
    )
    INTO v_order_id
    USING 
      p_tenant_id, v_customer_id, v_address_id, (p_order->>'total')::NUMERIC,
      p_order->>'status', p_order->>'order_type', p_order->>'notes', 
      (p_order->>'delivery_fee')::NUMERIC, (p_order->>'discount')::NUMERIC;
  END;

  -- 4. Create Order Items (Dynamic Columns - already dynamic in previous step, but re-asserting)
  FOREACH v_item IN ARRAY p_items
  LOOP
    EXECUTE format(
      'INSERT INTO public.order_items (
        order_id, product_id, name, %I, unit_price, %I, variation, extras, observation
      ) VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8)',
      CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='quantidade') THEN 'quantidade' ELSE 'quantity' END,
      CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='preco') THEN 'preco' ELSE 'price' END
    ) 
    USING 
      v_order_id, (v_item->>'product_id')::UUID, v_item->>'name', (v_item->>'quantity')::INT, (v_item->>'unit_price')::NUMERIC,
      v_item->'variation', v_item->'extras', v_item->>'observation';
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

  -- 6. Payment Cash
  IF p_payment->>'method' = 'money' OR p_payment->>'method' = 'dinheiro' THEN
    INSERT INTO public.payment_cash (payment_id, needs_change, change_for)
    VALUES (
      v_payment_id,
      (p_payment->>'needs_change')::BOOLEAN,
      (p_payment->>'change_for')::NUMERIC
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

COMMIT;

NOTIFY pgrst, 'reload schema';
