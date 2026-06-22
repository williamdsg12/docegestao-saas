-- PRODUCTION & PRICING ALIGNMENT (Part 2)
-- This script ensures production tables are aligned with multi-tenancy.

-- 1. INGREDIENTES
do $$ 
begin
  -- Add categoria if missing
  if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'ingredientes' and column_name = 'categoria') then
    alter table public.ingredientes add column categoria text;
  end if;

  -- Add quantidade_embalagem if missing
  if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'ingredientes' and column_name = 'quantidade_embalagem') then
    alter table public.ingredientes add column quantidade_embalagem numeric default 1;
  end if;

  -- Add company_id if missing
  if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'ingredientes' and column_name = 'company_id') then
    alter table public.ingredientes add column company_id uuid references public.empresas(id) on delete cascade;
  end if;
  
  -- Ensure other columns exist (just in case)
  if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'ingredientes' and column_name = 'quantidade_atual') then
    alter table public.ingredientes add column quantidade_atual numeric default 0;
  end if;
  
  if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'ingredientes' and column_name = 'estoque_minimo') then
    alter table public.ingredientes add column estoque_minimo numeric default 0;
  end if;
  
  if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'ingredientes' and column_name = 'preco_compra') then
    alter table public.ingredientes add column preco_compra numeric default 0;
  end if;
  
  if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'ingredientes' and column_name = 'unidade_padrao') then
    alter table public.ingredientes add column unidade_padrao text default 'g';
  end if;
end $$;

-- 2. RECEITAS
do $$ 
begin
  -- Add company_id if missing
  if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'receitas' and column_name = 'company_id') then
    alter table public.receitas add column company_id uuid references public.empresas(id) on delete cascade;
  end if;
end $$;

-- 3. RLS POLICIES FOR PRODUCTION
alter table public.ingredientes enable row level security;
alter table public.receitas enable row level security;

-- Insumos/Ingredientes isolation
drop policy if exists "Tenant isolation ingredientes" on public.ingredientes;
create policy "Tenant isolation ingredientes" on public.ingredientes 
    for all using (company_id in (select company_id from profiles where id = auth.uid()));

-- Receitas isolation
drop policy if exists "Tenant isolation receitas" on public.receitas;
create policy "Tenant isolation receitas" on public.receitas 
    for all using (company_id in (select company_id from profiles where id = auth.uid()));

-- 4. RELOAD SCHEMA CACHE
notify pgrst, 'reload schema';
