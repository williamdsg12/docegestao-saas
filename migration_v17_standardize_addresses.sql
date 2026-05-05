-- ==========================================
-- MIGRATION V17: STANDARDIZE ADDRESSES SCHEMA
-- ==========================================
-- This script renames address columns to English names and simplifies the 
-- create_complete_order RPC to ensure consistency.

BEGIN;

-- 1. Standardize Addresses Table
DO $$ 
BEGIN 
    -- RENAME rua -> street
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='rua') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='street') THEN
        ALTER TABLE public.addresses RENAME COLUMN rua TO street;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='street') THEN
        ALTER TABLE public.addresses ADD COLUMN street TEXT;
    END IF;

    -- RENAME numero -> number
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='numero') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='number') THEN
        ALTER TABLE public.addresses RENAME COLUMN numero TO number;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='number') THEN
        ALTER TABLE public.addresses ADD COLUMN number TEXT;
    END IF;

    -- RENAME bairro -> neighborhood
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='bairro') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='neighborhood') THEN
        ALTER TABLE public.addresses RENAME COLUMN bairro TO neighborhood;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='neighborhood') THEN
        ALTER TABLE public.addresses ADD COLUMN neighborhood TEXT;
    END IF;

    -- RENAME cidade -> city
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='cidade') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='city') THEN
        ALTER TABLE public.addresses RENAME COLUMN cidade TO city;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='city') THEN
        ALTER TABLE public.addresses ADD COLUMN city TEXT;
    END IF;

    -- RENAME cep -> zip
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='cep') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='zip') THEN
        ALTER TABLE public.addresses RENAME COLUMN cep TO zip;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='addresses' AND column_name='zip') THEN
        ALTER TABLE public.addresses ADD COLUMN zip TEXT;
    END IF;

    -- Standardize Order Items
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='quantidade') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='quantity') THEN
        ALTER TABLE public.order_items RENAME COLUMN quantidade TO quantity;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='preco') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='unit_price') THEN
        ALTER TABLE public.order_items RENAME COLUMN preco TO unit_price;
    END IF;

    -- Standardize Orders Status
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='status') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_status') THEN
        ALTER TABLE public.orders RENAME COLUMN status TO order_status;
    END IF;

END $$;

-- 2. Simplified and Robust RPC (Fixed: Includes tenant_id in order_items)
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
BEGIN
  -- 1. Create or Find Customer
  INSERT INTO public.customers (tenant_id, name, phone, email)
  VALUES (p_tenant_id, p_customer->>'name', p_customer->>'phone', p_customer->>'email')
  ON CONFLICT (tenant_id, phone) DO UPDATE 
  SET name = EXCLUDED.name, email = EXCLUDED.email
  RETURNING id INTO v_customer_id;

  -- 2. Create Address
  INSERT INTO public.addresses (tenant_id, customer_id, street, number, neighborhood, city, complement, zip)
  VALUES (p_tenant_id, v_customer_id, p_address->>'street', p_address->>'number', 
          p_address->>'neighborhood', p_address->>'city', p_address->>'complement', p_address->>'zip')
  RETURNING id INTO v_address_id;

  -- 3. Create Order
  INSERT INTO public.orders (tenant_id, customer_id, address_id, total, order_status, order_type, notes, delivery_fee, discount)
  VALUES (p_tenant_id, v_customer_id, v_address_id, (p_order->>'total')::NUMERIC,
          COALESCE(p_order->>'order_status', p_order->>'status', 'pending'), 
          p_order->>'order_type', p_order->>'notes', 
          (p_order->>'delivery_fee')::NUMERIC, (p_order->>'discount')::NUMERIC)
  RETURNING id INTO v_order_id;

  -- 4. Create Order Items (Fixed: Now includes tenant_id)
  FOREACH v_item IN ARRAY p_items
  LOOP
    INSERT INTO public.order_items (
        tenant_id, order_id, product_id, name, quantity, unit_price, total_price, variation, extras, observation
    ) VALUES (
        p_tenant_id, v_order_id, (v_item->>'product_id')::UUID, v_item->>'name', 
        (v_item->>'quantity')::INT, (v_item->>'unit_price')::NUMERIC, 
        ((v_item->>'quantity')::INT * (v_item->>'unit_price')::NUMERIC),
        v_item->'variation', v_item->'extras', v_item->>'observation'
    );
  END LOOP;

  -- 5. Create Payment
  INSERT INTO public.payments (tenant_id, order_id, amount, method, status)
  VALUES (p_tenant_id, v_order_id, (p_payment->>'amount')::NUMERIC, p_payment->>'method', p_payment->>'status')
  RETURNING id INTO v_payment_id;

  -- 6. Payment Cash
  IF p_payment->>'method' = 'money' OR p_payment->>'method' = 'dinheiro' OR p_payment->>'method' = 'cash' THEN
    INSERT INTO public.payment_cash (payment_id, needs_change, change_for)
    VALUES (v_payment_id, (p_payment->>'needs_change')::BOOLEAN, (p_payment->>'change_for')::NUMERIC);
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

COMMIT;

NOTIFY pgrst, 'reload schema';
