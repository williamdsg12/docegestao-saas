import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, amount, user_id } = body;

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Buscar conta Tuna do usuário (Lojista)
    const { data: tuna, error: tunaError } = await supabase
      .from("tuna_accounts")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (tunaError || !tuna || !tuna.access_token) {
      return NextResponse.json({ error: "Conta Tuna não conectada ou inválida" }, { status: 400 });
    }

    // 2. Criar cobrança na Tuna
    const res = await fetch("https://api.tuna.com.br/v1/charges", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tuna.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Tuna usa centavos
        payment_method: "pix",
        description: `Pedido #${order_id.slice(0, 8)} - Doce Gestão`
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[TUNA_CREATE_PIX_ERROR]", data);
      return NextResponse.json({ error: "Erro ao gerar PIX na Tuna" }, { status: 500 });
    }

    // 3. Salvar ID do pagamento e método no Pedido
    await supabase.from("orders").update({
      tuna_payment_id: data.id,
      payment_method: "pix",
      payment_status: "pending"
    }).eq("id", order_id);

    return NextResponse.json({
      success: true,
      qr_code: data.payment_method_details?.qr_code_url || data.qr_code, // Ajustar conforme retorno real
      qr_code_text: data.payment_method_details?.qr_code_text || data.qr_code_text
    });

  } catch (error: any) {
    console.error("[CREATE_PIX_INTERNAL_ERROR]", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
