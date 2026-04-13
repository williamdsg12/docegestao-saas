import { cookies } from 'next/headers'
import { createClient, User } from '@supabase/supabase-js'

/**
 * Helper para obter o usuário autenticado no lado do servidor (Next.js App Router)
 * sem precisar do pacote @supabase/ssr ou @supabase/auth-helpers-nextjs.
 * Suporta cookies padrão do Supabase e o fallback manual 'supabase-session'.
 */
export async function getServerUser(): Promise<User | null> {
    try {
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll()
        
        // 1. Tenta o cookie padrão do Supabase (sb-X-auth-token)
        let authCookie = allCookies.find((c: any) => 
            c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
        )

        // 2. Tenta o fallback manual (supabase-session) sincronizado pelo useAuth.tsx
        if (!authCookie) {
            authCookie = allCookies.find((c: any) => c.name === 'supabase-session')
        }

        if (!authCookie) {
            return null
        }

        let accessToken: string | null = null
        let refreshToken: string | null = null

        try {
            const rawValue = decodeURIComponent(authCookie.value)
            try {
                const sessionData = JSON.parse(rawValue)
                accessToken = sessionData.access_token || sessionData.token || null
                refreshToken = sessionData.refresh_token || null
                
                // Se não encontrou no JSON, pode ser o valor puro (legado)
                if (!accessToken) accessToken = rawValue
            } catch {
                // Se não for JSON, o valor em si é o token
                accessToken = rawValue
            }
        } catch (e) {
            accessToken = authCookie.value
        }

        if (!accessToken) return null

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        const { data: { user }, error } = await supabase.auth.getUser(accessToken)

        if (error || !user) {
            console.error('[Auth] Erro ao validar token:', error?.message)
            return null
        }

        return user
    } catch (error) {
        console.error('[Auth] Erro interno no getServerUser:', error)
        return null
    }
}
export { SUPER_ADMIN_EMAIL, isSuperAdmin } from './admin-config'
