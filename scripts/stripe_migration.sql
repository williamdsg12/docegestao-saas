-- Adicionar colunas para IDs de preço do Stripe
alter table public.plans 
add column if not exists stripe_price_id_monthly text,
add column if not exists stripe_price_id_annual text;

-- Atualizar planos existentes com placeholders (O usuário deve substituir pelos IDs reais do Stripe Dashboard)
update public.plans set stripe_price_id_monthly = 'price_placeholder_iniciante_mensal', stripe_price_id_annual = 'price_placeholder_iniciante_anual' where slug = 'iniciante';
update public.plans set stripe_price_id_monthly = 'price_placeholder_profissional_mensal', stripe_price_id_annual = 'price_placeholder_profissional_anual' where slug = 'profissional';
update public.plans set stripe_price_id_monthly = 'price_placeholder_premium_mensal', stripe_price_id_annual = 'price_placeholder_premium_anual' where slug = 'premium';
