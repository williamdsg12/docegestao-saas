-- MIGRATION: V47 - PAYMENT DETAILS, DELIVERY TYPE AND ROUTE METRICS STABILIZATION
BEGIN;

-- 1. Alter public.orders table to support detailed payment, delivery type, and route calculations
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_origin VARCHAR(50);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS change_for NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS change_needed BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50) DEFAULT 'DELIVERY';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS remaining_distance_km NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS remaining_duration_min NUMERIC;

-- 2. Alter public.delivery_tracking table to store route distance and ETA calculations
ALTER TABLE public.delivery_tracking ADD COLUMN IF NOT EXISTS remaining_distance_km NUMERIC;
ALTER TABLE public.delivery_tracking ADD COLUMN IF NOT EXISTS remaining_duration_min NUMERIC;

-- 3. Create Audit logs table for telemetry tracking
CREATE TABLE IF NOT EXISTS public.delivery_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    delivery_type VARCHAR(50),
    driver_id UUID,
    distance NUMERIC,
    eta NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS on delivery_audit_logs
ALTER TABLE public.delivery_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read delivery_audit_logs for authenticated" ON public.delivery_audit_logs;
CREATE POLICY "Allow read delivery_audit_logs for authenticated" ON public.delivery_audit_logs
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow write delivery_audit_logs for authenticated" ON public.delivery_audit_logs;
CREATE POLICY "Allow write delivery_audit_logs for authenticated" ON public.delivery_audit_logs
    FOR INSERT TO authenticated, anon WITH CHECK (true);

-- 5. Recreate View public.pedidos to expose the geocoded, payment, delivery type and route columns
DROP VIEW IF EXISTS public.pedidos CASCADE;
CREATE OR REPLACE VIEW public.pedidos AS
SELECT
    id,
    tenant_id AS company_id,
    tenant_id,
    customer_id,
    customer_id AS cliente_id,
    address_id,
    total,
    total AS valor_total,
    order_status AS status,
    order_status,
    order_type,
    order_type AS tipo_pedido,
    notes,
    notes AS observacoes,
    delivery_fee,
    delivery_fee AS taxa_entrega,
    discount,
    discount AS desconto,
    latitude,
    longitude,
    formatted_address,
    location_accuracy,
    geocoded_at,
    payment_method,
    payment_status,
    payment_origin,
    change_for,
    change_needed,
    delivery_type,
    remaining_distance_km,
    remaining_duration_min,
    created_at,
    updated_at,
    driver_id,
    driver_id AS entregador_id
FROM public.orders;

-- 6. REWRITE create_complete_order RPC TO INSERT GEOLOCATION, PAYMENT DETAILS, AND DELIVERY TYPE
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
  v_lat DECIMAL;
  v_lng DECIMAL;
  v_formatted_address TEXT;
  v_payment_method VARCHAR;
  v_payment_status VARCHAR;
  v_payment_origin VARCHAR;
  v_change_for NUMERIC;
  v_change_needed BOOLEAN;
  v_delivery_type VARCHAR;
BEGIN
  -- Normalize phone
  v_phone := p_customer->>'phone';
  v_phone_norm := public.normalize_phone(v_phone);

  -- Extract parameters safely
  v_lat := (p_order->>'latitude')::DECIMAL;
  v_lng := (p_order->>'longitude')::DECIMAL;
  v_formatted_address := p_order->>'formatted_address';
  
  v_payment_method := COALESCE(p_payment->>'method', p_payment->>'payment_method', p_order->>'payment_method', 'DINHEIRO');
  v_payment_status := COALESCE(p_payment->>'status', p_payment->>'payment_status', p_order->>'payment_status', 'PENDENTE');
  v_payment_origin := COALESCE(p_payment->>'origin', p_payment->>'payment_origin', p_order->>'payment_origin', 'NA ENTREGA');
  v_change_for := (p_payment->>'change_for')::NUMERIC;
  v_change_needed := COALESCE((p_payment->>'change_needed')::BOOLEAN, false);
  v_delivery_type := COALESCE(p_order->>'delivery_type', 'DELIVERY');

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
    deleted_at = NULL
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
      'INSERT INTO public.orders (
         tenant_id, company_id, customer_id, address_id, total, %I, order_type, notes, %I, discount,
         latitude, longitude, formatted_address, location_accuracy, geocoded_at,
         payment_method, payment_status, payment_origin, change_for, change_needed, delivery_type
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), $15, $16, $17, $18, $19, $20) RETURNING id',
      v_status_col, v_fee_col
    )
    INTO v_order_id
    USING 
      p_tenant_id, p_tenant_id, v_customer_id, v_address_id, COALESCE((p_order->>'total')::NUMERIC, 0),
      COALESCE(p_order->>'order_status', p_order->>'status', 'novo'), p_order->>'order_type', p_order->>'notes', 
      COALESCE((p_order->>'delivery_fee')::NUMERIC, 0), COALESCE((p_order->>'discount')::NUMERIC, 0),
      v_lat, v_lng, v_formatted_address, p_order->>'location_accuracy',
      v_payment_method, v_payment_status, v_payment_origin, v_change_for, v_change_needed, v_delivery_type;
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

  -- 5. Create Payment record for backward compatibility
  INSERT INTO public.payments (tenant_id, order_id, amount, method, status)
  VALUES (
    p_tenant_id,
    v_order_id,
    COALESCE((p_payment->>'amount')::NUMERIC, 0),
    v_payment_method,
    v_payment_status
  )
  RETURNING id INTO v_payment_id;

  -- 6. Payment Cash backward compatibility
  IF v_payment_method = 'money' OR v_payment_method = 'dinheiro' OR v_payment_method = 'DINHEIRO' THEN
    INSERT INTO public.payment_cash (payment_id, needs_change, change_for)
    VALUES (
      v_payment_id,
      v_change_needed,
      COALESCE(v_change_for, 0)
    );
  END IF;

  -- 7. Audit Telemetry log
  INSERT INTO public.delivery_audit_logs (
    pedido_id, timezone, latitude, longitude, payment_method, payment_status, delivery_type
  ) VALUES (
    v_order_id, 'America/Sao_Paulo', v_lat, v_lng, v_payment_method, v_payment_status, v_delivery_type
  );

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'customer_id', v_customer_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
