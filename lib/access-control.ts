import { PLANS, PlanType } from '../config/plans';

/**
 * Interface simplificada do usuário para verificação de acesso
 */
export interface AccessUser {
  id: string;
  email?: string;
  plan?: string;
  trial_ends_at?: string | Date;
  subscription_status?: string;
  role?: string;
  is_admin?: boolean;
}

/**
 * Regra de Negócio (CORE): Verifica se o usuário tem ACESSO GERAL ao sistema.
 * 
 * SE: trial_ends_at > NOW() (trial ativo)
 * OU SE: plan != 'free' (plano pago ativo)
 * CASO CONTRÁRIO: bloqueado
 */
export function checkUserAccess(user: AccessUser | null | any): { hasAccess: boolean; isTrial: boolean; daysLeft: number } {
  if (!user) return { hasAccess: false, isTrial: false, daysLeft: 0 };

  // Super Admins sempre tem acesso total
  if (user.email === 'williamdev36@gmail.com' || user.role === 'admin') {
    return { hasAccess: true, isTrial: false, daysLeft: 999 };
  }

  const now = new Date();
  const trialEnd = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
  
  const isTrialActive = trialEnd ? trialEnd > now : false;
  const hasPaidPlan = user.plan && !['free', 'inactive'].includes(user.plan.toLowerCase());
  
  const daysLeft = trialEnd 
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    hasAccess: isTrialActive || hasPaidPlan,
    isTrial: isTrialActive,
    daysLeft
  };
}

/**
 * Função Global de Permissão: Verifica se o plano do usuário permite uma funcionalidade.
 */
export function hasFeature(user: AccessUser | null | any, feature: string): boolean {
  if (!user) return false;

  // Super Admin ou Plano Business tem acesso a TUDO
  if (user.email === 'williamdev36@gmail.com' || user.plan === 'business') {
    return true;
  }

  const userPlan = (user.plan || 'free').toLowerCase() as PlanType;
  const allowedFeatures = PLANS[userPlan] || PLANS['free'];

  // Verifica se a feature está explicitamente permitida ou se o plano tem '*'
  return allowedFeatures.includes('*') || allowedFeatures.includes(feature);
}
