import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 1. Fetch order with items and store info
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        tenants!tenant_id(name, logo_url, whatsapp_number),
        customers!customer_id(name, phone),
        order_items(*)
      `)
      .eq('id', id)
      .single()

    if (orderError || !order) {
      console.error("Tracking API Error:", orderError)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    // 2. Data Masking Logic
    const maskName = (name: string) => {
      if (!name) return "Cliente"
      const parts = name.trim().split(" ")
      const first = parts[0]
      const last = parts.length > 1 ? parts[parts.length - 1] : ""
      
      const maskedFirst = first.slice(0, 4) + "***"
      const maskedLast = last ? last.slice(0, 3) + "**" : ""
      
      return `${maskedFirst} ${maskedLast}`.trim()
    }

    const maskPhone = (phone: string) => {
      if (!phone) return ""
      // Format: +55 44 99767-6331 -> +55 44 99767-***
      const cleaned = phone.replace(/\D/g, "")
      if (cleaned.length < 5) return phone
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-***`
    }

    // 3. Format Response
    const response = {
      status: order.order_status, // recebido | em_preparacao | pronto | no_caminho | chegou | entregue
      numero_pedido: order.code || order.id.slice(0, 8).toUpperCase(),
      cliente: {
        nome_mascarado: maskName(order.customers?.name),
        telefone_mascarado: maskPhone(order.customers?.phone)
      },
      endereco: order.address || "Retirada no balcão",
      codigo_br: `BR-${order.id.split("-")[0].toUpperCase()}${order.id.split("-")[1].toUpperCase()}`,
      pontos: 2, // Hardcoded for now as per prompt, but could be dynamic
      pagamento: {
        status: order.payment_status === "paid" ? "pago" : "nao_pago",
        forma: order.payment_method || "Não informado",
        valor: order.total,
        troco: order.change_amount || 0
      },
      produtos: (order.order_items || []).map((item: any) => ({
        nome: item.name || "Produto",
        qtd: item.quantity || 0,
        valor: item.unit_price || 0
      })),
      loja: {
        nome: order.tenants?.name || "Doce Gestão",
        logo: order.tenants?.logo_url,
        whatsapp: order.tenants?.whatsapp_number
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("Tracking API Error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
