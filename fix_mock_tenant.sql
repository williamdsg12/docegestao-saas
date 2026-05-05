DO $$ 
DECLARE
    v_new_id UUID := '72448386-8806-444a-9351-4045f8e56238'; 
BEGIN
    -- 1. Update company
    UPDATE public.companies SET id = v_new_id WHERE id = '00000000-0000-0000-0000-000000000000';
    
    -- 2. Update references
    UPDATE public.products SET tenant_id = v_new_id WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
    UPDATE public.orders SET tenant_id = v_new_id WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
    UPDATE public.customers SET tenant_id = v_new_id WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
    UPDATE public.order_items SET tenant_id = v_new_id WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
    UPDATE public.product_categories SET tenant_id = v_new_id WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
END $$;
