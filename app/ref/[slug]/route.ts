import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const url = new URL(request.url)
  const originUrl = request.headers.get('referer') || ''
  
  // 1. Encontrar o afiliado via slug
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id, code')
    .eq('slug', slug)
    .single()

  let affiliateId = affiliate?.id
  let affiliateCode = affiliate?.code

  // Falha silenciosa se não achar pelo slug tentamos pelo CODE também (Legacy Support)
  if (!affiliateId) {
    const { data: affByCode } = await supabase
      .from('affiliates')
      .select('id, code')
      .eq('code', slug)
      .single()
      
    if (affByCode) {
        affiliateId = affByCode.id
        affiliateCode = affByCode.code
    }
  }

  // Se definitivamente não existir, redireciona pra home normal
  if (!affiliateId) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 2. Extração de Tracking Data
  // In Next.js App Router we don't always have explicit IP out of the box in GET, but we can try cf-connecting-ip or x-forwarded-for
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Attempt to save click to Supabase if valid
  if (affiliateId) {
    // Fire and forget (don't block the redirect, just execute)
    const logClick = async () => {
        try {
            await supabase.from('affiliate_clicks').insert({
                affiliate_id: affiliateId,
                ip_address: ip,
                browser: userAgent,
                origin_url: originUrl
            });
        } catch (e) {
            console.error(e);
        }
    };
    logClick();
  }

  // 3. Prepara a Resposta com Cookie
  // Direcionamos para a Home (ou Landing Page customizada no futuro) mas agora com os Cookies
  const response = NextResponse.redirect(new URL(`/cadastro?ref=${affiliateCode}`, request.url))
  
  // Set Cookie - 90 Days validity
  const maxAge = 60 * 60 * 24 * 90 
  
  response.cookies.set('affiliate_ref', JSON.stringify({
    code: affiliateCode,
    id: affiliateId,
    timestamp: new Date().getTime(),
    expiry: new Date().getTime() + (maxAge * 1000) // in MS
  }), {
    httpOnly: false, // Must be readable by client to send in Supabase auth.signUp
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAge,
    sameSite: 'lax'
  })

  return response
}
