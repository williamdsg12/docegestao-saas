import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await context.params;

  try {
    // Busca no Supabase (tabela de afiliados do seu projeto)
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, code')
      .eq('slug', slug)
      .maybeSingle();

    if (!affiliate) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Redireciona para cadastro com o código de afiliado como fallback na URL
    const response = NextResponse.redirect(new URL(`/cadastro?ref=${affiliate.code}`, req.url));

    // Cookie simplificado conforme solicitado
    response.cookies.set("ref", slug, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });

    return response;
  } catch (error) {
    console.error("Erro na rota de referência:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
