create extension if not exists "pgcrypto";

-- TABELA PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text,
  owner_name text,
  phone text,
  plan text default 'basico',
  trial_ends_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  is_admin boolean default false
);

alter table public.profiles enable row level security;

-- POLICIES
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Admins can view all profiles"
on public.profiles
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
    and p.is_admin = true
  )
);

--------------------------------------------------

-- FUNÇÃO CRIAR PERFIL AUTOMÁTICO
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.profiles (
    id,
    owner_name,
    plan,
    trial_ends_at,
    is_admin
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name','Usuário'),
    'basico',
    now() + interval '7 days',
    case
      when new.email in (
        'williamosadia94@gmail.com',
        'williamdev36@gmail.com'
      ) then true
      else false
    end
  );

  return new;

end;
$$;

--------------------------------------------------

-- TRIGGER
drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();