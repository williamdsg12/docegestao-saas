-- Migration to add fields for detailed order view
DO $$ 
BEGIN
    -- Add id_entregador (references entregadores)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'id_entregador') THEN
        ALTER TABLE public.pedidos ADD COLUMN id_entregador UUID REFERENCES public.entregadores(id);
    END IF;

    -- Add status_pagamento (default 'pendente')
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'status_pagamento') THEN
        ALTER TABLE public.pedidos ADD COLUMN status_pagamento TEXT DEFAULT 'pendente';
    END IF;

    -- Add complemento_endereco
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'complemento_endereco') THEN
        ALTER TABLE public.pedidos ADD COLUMN complemento_endereco TEXT;
    END IF;
END $$;
