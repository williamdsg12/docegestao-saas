-- TABELA DE ORÇAMENTOS
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  confeitaria_id uuid references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'Aguardando', -- Aguardando, Aprovado, Recusado
  total numeric not null default 0,
  valid_until timestamp,
  notes text,
  created_at timestamp with time zone default now()
);

-- ITENS DO ORÇAMENTO
create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric not null,
  created_at timestamp with time zone default now()
);

-- TABELA DE ENTREGAS
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  confeitaria_id uuid references public.companies(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  address text not null,
  scheduled_at timestamp with time zone not null,
  status text not null default 'Pendente', -- Pendente, Em Rota, Entregue
  photo_url text,
  created_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.deliveries enable row level security;

-- Políticas de RLS
create policy "Users can only see their company's quotes"
  on public.quotes for all
  using (confeitaria_id in (select id from public.companies where owner_id = auth.uid()));

create policy "Users can only see their company's quote items"
  on public.quote_items for all
  using (quote_id in (select id from public.quotes where confeitaria_id in (select id from public.companies where owner_id = auth.uid())));

create policy "Users can only see their company's deliveries"
  on public.deliveries for all
  using (confeitaria_id in (select id from public.companies where owner_id = auth.uid()));
