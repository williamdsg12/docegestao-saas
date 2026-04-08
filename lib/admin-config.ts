import { User } from '@supabase/supabase-js'

/**
 * Configuração de Segurança Máxima
 * Somente este email tem permissão de Super Admin (SaaS Admin).
 */
export const SUPER_ADMIN_EMAIL = "williamdev36@gmail.com"

/**
 * Verifica se um usuário é o Super Admin do sistema.
 * Esta função é segura para uso em Client e Server Components.
 */
export function isSuperAdmin(user: User | null | any): boolean {
    if (!user) return false
    const email = user.email || (user.user?.email)
    return email === SUPER_ADMIN_EMAIL
}
