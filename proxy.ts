import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  // 1. Ignorar assets estáticos e rotas de auth
  if (
    pathname.includes('.') || 
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth')
  ) {
    return res
  }

  // 2. Definir rotas protegidas
  const isAdminRoute = pathname.startsWith('/admin')
  const isDashboardRoute = pathname.startsWith('/dashboard')

  if (!isAdminRoute && !isDashboardRoute) {
    return res
  }

  // 3. Obter Sessão do Supabase via cookies
  const allCookies = req.cookies.getAll()
  let authCookie = allCookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
  if (!authCookie) {
    authCookie = allCookies.find(c => c.name === 'supabase-session')
  }

  if (!authCookie) {
    console.log('[Proxy] Sem sessão ativa. Redirecionando para /login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 4. Extrair Token
  let token = ''
  try {
    const val = decodeURIComponent(authCookie.value)
    const parsed = JSON.parse(val)
    token = parsed.access_token || parsed.token || authCookie.value
  } catch {
    token = authCookie.value
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 5. Validar no Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    console.log('[Proxy] Auth inválida ou expirada')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 6. Verificar Perfil e Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single()

  // Se for qualquer rota do /admin, exige is_admin = true
  if (isAdminRoute) {
    if (!profile?.is_admin && user.email !== 'williamdev36@gmail.com') {
      console.log('[Proxy] Acesso negado ao /admin para usuário comum')
      // Redireciona silenciosamente para o dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Se for /dashboard, apenas garante que está logado (já garantido acima)
  return res
}

// Configuração do Matcher para as rotas protegidas
export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
  ],
}
