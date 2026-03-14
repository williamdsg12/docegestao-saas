import { cookies } from 'next/headers'
import { createClient, User } from '@supabase/supabase-js'

/**
 * Helper para obter o usuário autenticado no lado do servidor (Next.js App Router)
 * sem precisar do pacote @supabase/ssr ou @supabase/auth-helpers-nextjs.
 */
export async function getServerUser(): Promise<User | null> {
    try {
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll()
        
        // O padrão da Supabase para o nome do cookie é sb-[project-id]-auth-token
        const authCookie = allCookies.find((c: any) => 
            c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
        )

        if (!authCookie) return null

        const sessionData = JSON.parse(authCookie.value)
        const accessToken = sessionData.access_token

        if (!accessToken) return null

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        const { data: { user }, error } = await supabase.auth.getUser(accessToken)

        if (error || !user) return null

        return user
    } catch (error) {
        console.error('Error in getServerUser:', error)
        return null
    }
}
