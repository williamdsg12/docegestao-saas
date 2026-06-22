-- IFOOD-LEVEL ARCHITECTURE ALIGNMENT (ROBUST VERSION)
-- This version ensures columns exist even if tables were already created.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CUSTOMERS
do $$ 
begin
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'customers') then
    create table public.customers (
      id uuid primary key default uuid_generate_v4(),
      company_id uuid references public.empresas(id) on delete cascade,
      nome text not null,
      telefone text,
      email text,
      created_at timestamp with time zone default now()
    );
  else
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'customers' and column_name = 'company_id') then
      alter table public.customers add column company_id uuid references public.empresas(id) on delete cascade;
    end if;
  end if;
end $$;

-- 2. ADDRESSES
do $$ 
begin
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'addresses') then
    create table public.addresses (
      id uuid primary key default uuid_generate_v4(),
      company_id uuid references public.empresas(id) on delete cascade,
      customer_id uuid references public.customers(id) on delete cascade,
      rua text,
      numero text,
      bairro text,
      cidade text,
      estado text,
      cep text,
      lat numeric,
      lng numeric,
      created_at timestamp with time zone default now()
    );
  else
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'addresses' and column_name = 'company_id') then
      alter table public.addresses add column company_id uuid references public.empresas(id) on delete cascade;
    end if;
  end if;
end $$;

-- 3. PRODUCTS (Professional Standard)
do $$ 
begin
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'products') then
    create table public.products (
      id uuid primary key default uuid_generate_v4(),
      company_id uuid references public.empresas(id) on delete cascade,
      nome text not null,
      descricao text,
      preco numeric default 0,
      imagem_url text,
      ativo boolean default true,
      created_at timestamp with time zone default now()
    );
  else
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'company_id') then
      alter table public.products add column company_id uuid references public.empresas(id) on delete cascade;
    end if;
  end if;
end $$;

-- 4. ORDERS (iFood Flow)
do $$ 
begin
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'orders') then
    create table public.orders (
      id uuid primary key default uuid_generate_v4(),
      company_id uuid references public.empresas(id) on delete cascade,
      customer_id uuid references public.customers(id) on delete set null,
      address_id uuid references public.addresses(id) on delete set null,
      total numeric default 0,
      delivery_fee numeric default 0,
      status text default 'pending',
      payment_status text default 'waiting_payment',
      payment_method text,
      payment_intent_id text,
      notes text,
      created_at timestamp with time zone default now()
    );
  else
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'address_id') then
      alter table public.orders add column address_id uuid references public.addresses(id) on delete set null;
    end if;
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'company_id') then
      alter table public.orders add column company_id uuid references public.empresas(id) on delete cascade;
    end if;
  end if;
end $$;

-- 5. ORDER ITEMS
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text,
  quantidade integer default 1,
  preco numeric default 0,
  created_at timestamp with time zone default now()
);

-- RLS CONFIGURATION
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- PUBLIC ACCESS
drop policy if exists "Public insert customers" on public.customers;
create policy "Public insert customers" on public.customers for insert with check (true);

drop policy if exists "Public insert addresses" on public.addresses;
create policy "Public insert addresses" on public.addresses for insert with check (true);

drop policy if exists "Public insert orders" on public.orders;
create policy "Public insert orders" on public.orders for insert with check (true);

drop policy if exists "Public insert order_items" on public.order_items;
create policy "Public insert order_items" on public.order_items for insert with check (true);

-- TENANT ISOLATION
drop policy if exists "Tenant isolation customers" on public.customers;
create policy "Tenant isolation customers" on public.customers for all using (company_id in (select company_id from profiles where id = auth.uid()));

drop policy if exists "Tenant isolation addresses" on public.addresses;
create policy "Tenant isolation addresses" on public.addresses for all using (company_id in (select company_id from profiles where id = auth.uid()));

drop policy if exists "Tenant isolation products" on public.products;
create policy "Tenant isolation products" on public.products for all using (company_id in (select company_id from profiles where id = auth.uid()));

drop policy if exists "Tenant isolation orders" on public.orders;
create policy "Tenant isolation orders" on public.orders for all using (company_id in (select company_id from profiles where id = auth.uid()));

-- REALTIME
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table orders, products, order_items;
commit;

-- RELOAD SCHEMA CACHE
notify pgrst, 'reload schema';
