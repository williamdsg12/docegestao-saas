import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export default async function proxy(req: NextRequest) {
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
  
  // Log de depuração detalhado
  console.log(`[Proxy] Request para: ${pathname}`)
  console.log(`[Proxy] Cookies recebidos (${allCookies.length}): ${allCookies.map(c => c.name).join(', ')}`)

  // Ordem de preferência: 1. Cookie oficial do Supabase, 2. Nosso cookie de fallback
  let authCookie = allCookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
  if (!authCookie) {
    authCookie = allCookies.find(c => c.name === 'supabase-session')
  }

  if (!authCookie) {
    console.log('[Proxy] Redirecionando para /login: Cookie ausente ou não encontrado na lista')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 4. Extrair e Processar Token
  let token = ''
  let refreshToken = ''
  try {
    const rawValue = authCookie.value
    const decodedValue = rawValue.includes('%') ? decodeURIComponent(rawValue) : rawValue
    
    try {
      const parsed = JSON.parse(decodedValue)
      // Suporta tanto o formato JSON completo (session) quanto o token puro
      token = parsed.access_token || parsed.token || (typeof parsed === 'string' ? parsed : '')
      refreshToken = parsed.refresh_token || ''
    } catch {
      // Se não for JSON, o valor em si deve ser o token
      token = decodedValue
    }
  } catch (err) {
    console.error('[Proxy] Erro ao processar cookie:', err)
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (!token || token.length < 32) {
    console.log('[Proxy] Redirecionando para /login: Token inválido ou muito curto')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 5. Validar no Supabase (Trust but Verify approach)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Proxy] Chaves do Supabase ausentes no ambiente do Middleware. Usando validação básica.')
    return res 
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    let { data: { user }, error: authError } = await supabase.auth.getUser(token)

    // Se o token estiver expirado e tivermos um refresh token, tentamos renovar
    if (authError && (authError.message.includes('expired') || authError.status === 401) && refreshToken) {
      console.log('[Proxy] Token expirado, tentando refresh...')
      const { data: refreshData, error: refreshError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken
      })

      if (!refreshError && refreshData.user) {
        console.log('[Proxy] Refresh bem sucedido para:', refreshData.user.email)
        user = refreshData.user
        authError = null
        
        // Atualizar o cookie no browser com o novo par de tokens
        const expiration = new Date()
        expiration.setTime(expiration.getTime() + (30 * 24 * 60 * 60 * 1000))
        const newSessionData = JSON.stringify({
          access_token: refreshData.session?.access_token,
          refresh_token: refreshData.session?.refresh_token
        })

        // Adicionamos o cookie na RESPOSTA para que o browser o salve
        res.cookies.set('supabase-session', encodeURIComponent(newSessionData), {
          path: '/',
          expires: expiration,
          sameSite: 'lax'
        })
      } else {
        console.log('[Proxy] Falha no refresh:', refreshError?.message)
      }
    }

    if (authError || !user) {
      console.log('[Proxy] Sessão inválida no Supabase:', authError?.message || 'Usuário não encontrado')
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // 6. Verificar Acesso Admin se necessário
    if (isAdminRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin && user.email !== 'williamdev36@gmail.com' && user.email !== 'williamdsg@hotmail.com') {
        console.log('[Proxy] Acesso Admin negado para:', user.email)
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
  } catch (err) {
    console.error('[Proxy] Erro crítico na validação do Supabase:', err)
    // Em caso de erro de rede ou API, permitimos a passagem e deixamos o cliente lidar com isso
    // para evitar loops de redirecionamento infinitos se o Supabase estiver fora do ar.
    return res 
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
  ],
}
