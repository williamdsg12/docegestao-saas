export type PlanType = 'starter' | 'pro' | 'business' | 'free';

export const PLANS: Record<PlanType, string[]> = {
  free: [
    'dashboard',
    'assinatura',
    'perfil'
  ],
  starter: [
    'dashboard',
    'assinatura',
    'ingredientes',
    'receitas',
    'produtos',
    'clientes',
    'financeiro',
    'perfil'
  ],
  pro: [
    'dashboard',
    'assinatura',
    'ingredientes',
    'receitas',
    'produtos',
    'clientes',
    'financeiro',
    'perfil',
    'pedidos',
    'orcamentos',
    'menu',
    'relatorios',
    'integracoes',
    'delivery-painel',
    'cozinha',
    'entregas',
    'marketing',
    'equipe',
    'afiliados',
    'precificacao',
    'pro_features'
  ],
  business: [
    '*' // Representa acesso total
  ]
};

/**
 * Mapeamento de rotas para features para facilitar o bloqueio automático
 */
export const ROUTE_TO_FEATURE: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/dashboard/assinatura': 'assinatura',
  '/dashboard/estoque': 'ingredientes',
  '/dashboard/receitas': 'receitas',
  '/dashboard/produtos': 'produtos',
  '/dashboard/pedidos': 'pedidos',
  '/dashboard/orcamentos': 'orcamentos',
  '/dashboard/clientes': 'clientes',
  '/dashboard/menu': 'menu',
  '/dashboard/delivery-painel': 'delivery-painel',
  '/dashboard/cozinha': 'cozinha',
  '/dashboard/entregas': 'entregas',
  '/dashboard/equipe': 'equipe',
  '/dashboard/marketing': 'marketing',
  '/dashboard/precificacao-inteligente': 'precificacao',
  '/dashboard/financeiro': 'financeiro',
  '/dashboard/relatorios': 'relatorios',
  '/dashboard/settings/profile': 'perfil',
  '/dashboard/afiliados': 'afiliados',
  '/dashboard/settings/impressoras': 'pro_features'
};
