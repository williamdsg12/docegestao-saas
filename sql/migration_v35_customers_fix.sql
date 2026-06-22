-- =================================================================
-- MIGRATION V35: CLIENTS NORMALIZATION, UNIQUE INDEX, VIEW AND RPC
-- =================================================================

BEGIN;

-- 1. Create or Update normalize_phone function
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone TEXT)
RETURNS TEXT AS $$
DECLARE
  v_normalized TEXT;
BEGIN
  IF p_phone IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove all non-digits
  v_normalized := regexp_replace(p_phone, '\D', '', 'g');
  
  -- If starts with 55 and length is 12 or 13 digits, strip the 55 prefix
  IF length(v_normalized) IN (12, 13) AND left(v_normalized, 2) = '55' THEN
    v_normalized := right(v_normalized, -2);
  END IF;
  
  RETURN v_normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Add deleted_at and telefone_normalizado columns
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS telefone_normalizado TEXT;

-- 3. Populate telefone_normalizado
UPDATE public.customers 
SET telefone_normalizado = public.normalize_phone(phone) 
WHERE telefone_normalizado IS NULL;

-- 4. Recreate View public.clientes to support deleted_at filtering and new columns
DROP VIEW IF EXISTS public.clientes CASCADE;
CREATE OR REPLACE VIEW public.clientes AS
SELECT
    id,
    tenant_id AS company_id,
    tenant_id,
    name,
    name AS nome,
    phone,
    phone AS telefone,
    telefone_normalizado,
    email,
    is_vip,
    is_vip AS cliente_vip,
    full_name,
    full_name AS nome_completo,
    cpf_cnpj,
    cpf_cnpj AS cpf,
    cep,
    address,
    address AS endereco,
    number,
    number AS numero,
    neighborhood,
    neighborhood AS bairro,
    city,
    city AS cidade,
    state,
    state AS estado,
    complement,
    complement AS complemento,
    reference_point,
    reference_point AS ponto_referencia,
    total_orders,
    total_orders AS total_pedidos,
    total_spent,
    total_spent AS total_gasto,
    last_order_at,
    last_order_at AS ultimo_pedido,
    birthday,
    birthday AS data_nascimento,
    created_at,
    updated_at,
    deleted_at
FROM public.customers
WHERE deleted_at IS NULL;

-- 5. Drop legacy unique indexes if they exist
DROP INDEX IF EXISTS public.idx_customers_tenant_phone;
DROP INDEX IF EXISTS public.idx_customers_telefone;

-- 6. Create partial unique index on (tenant_id, telefone_normalizado) where deleted_at IS NULL
-- This prevents active duplicate clients, but allows soft-deleted duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_tenant_phone_normalized 
ON public.customers (tenant_id, telefone_normalizado) 
WHERE (deleted_at IS NULL);

-- 7. REWRITE create_complete_order RPC TO USE telefone_normalizado AND SUPPORT RESTORE ON RE-PURCHASE
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
  v_phone_norm TEXT;
BEGIN
  -- Normalize phone
  v_phone := p_customer->>'phone';
  v_phone_norm := public.normalize_phone(v_phone);

  -- 1. Create or Update Customer record inside public.customers
  INSERT INTO public.customers (
    tenant_id, 
    name, 
    full_name, 
    phone, 
    telefone_normalizado,
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
    updated_at,
    deleted_at
  )
  VALUES (
    p_tenant_id, 
    COALESCE(NULLIF(p_customer->>'name', ''), 'Cliente'), 
    COALESCE(NULLIF(p_customer->>'name', ''), 'Cliente'), 
    v_phone, 
    v_phone_norm,
    NULLIF(p_customer->>'email', ''), 
    NULLIF(p_customer->>'cpf_cnpj', ''),
    NULLIF(p_address->>'zip', ''),
    NULLIF(p_address->>'street', ''),
    NULLIF(p_address->>'number', ''),
    NULLIF(p_address->>'neighborhood', ''),
    NULLIF(p_address->>'city', ''),
    NULLIF(p_address->>'state', ''),
    NULLIF(p_address->>'complement', ''),
    NULLIF(p_address->>'reference_point', ''),
    1,
    COALESCE((p_order->>'total')::NUMERIC, 0),
    NOW(),
    NOW(),
    NULL
  )
  ON CONFLICT (tenant_id, telefone_normalizado) WHERE deleted_at IS NULL DO UPDATE 
  SET 
    name = CASE 
      WHEN EXCLUDED.name IS NOT NULL AND EXCLUDED.name <> '' AND EXCLUDED.name <> 'Cliente' 
      THEN EXCLUDED.name 
      ELSE public.customers.name 
    END,
    full_name = CASE 
      WHEN EXCLUDED.full_name IS NOT NULL AND EXCLUDED.full_name <> '' AND EXCLUDED.full_name <> 'Cliente' 
      THEN EXCLUDED.full_name 
      ELSE public.customers.full_name 
    END,
    email = CASE 
      WHEN EXCLUDED.email IS NOT NULL AND EXCLUDED.email <> '' 
      THEN EXCLUDED.email 
      ELSE public.customers.email 
    END,
    cpf_cnpj = CASE 
      WHEN EXCLUDED.cpf_cnpj IS NOT NULL AND EXCLUDED.cpf_cnpj <> '' 
      THEN EXCLUDED.cpf_cnpj 
      ELSE public.customers.cpf_cnpj 
    END,
    cep = CASE 
      WHEN EXCLUDED.cep IS NOT NULL AND EXCLUDED.cep <> '' 
      THEN EXCLUDED.cep 
      ELSE public.customers.cep 
    END,
    address = CASE 
      WHEN EXCLUDED.address IS NOT NULL AND EXCLUDED.address <> '' 
      THEN EXCLUDED.address 
      ELSE public.customers.address 
    END,
    number = CASE 
      WHEN EXCLUDED.number IS NOT NULL AND EXCLUDED.number <> '' 
      THEN EXCLUDED.number 
      ELSE public.customers.number 
    END,
    neighborhood = CASE 
      WHEN EXCLUDED.neighborhood IS NOT NULL AND EXCLUDED.neighborhood <> '' 
      THEN EXCLUDED.neighborhood 
      ELSE public.customers.neighborhood 
    END,
    city = CASE 
      WHEN EXCLUDED.city IS NOT NULL AND EXCLUDED.city <> '' 
      THEN EXCLUDED.city 
      ELSE public.customers.city 
    END,
    state = CASE 
      WHEN EXCLUDED.state IS NOT NULL AND EXCLUDED.state <> '' 
      THEN EXCLUDED.state 
      ELSE public.customers.state 
    END,
    complement = CASE 
      WHEN EXCLUDED.complement IS NOT NULL AND EXCLUDED.complement <> '' 
      THEN EXCLUDED.complement 
      ELSE public.customers.complement 
    END,
    reference_point = CASE 
      WHEN EXCLUDED.reference_point IS NOT NULL AND EXCLUDED.reference_point <> '' 
      THEN EXCLUDED.reference_point 
      ELSE public.customers.reference_point 
    END,
    total_orders = public.customers.total_orders + 1,
    total_spent = public.customers.total_spent + COALESCE((p_order->>'total')::NUMERIC, 0),
    last_order_at = NOW(),
    updated_at = NOW(),
    deleted_at = NULL -- Restore customer if previously soft-deleted
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

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'customer_id', v_customer_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
