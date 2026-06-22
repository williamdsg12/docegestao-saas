import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Fetch order with items and store info
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        tenants!company_id(slug, name, logo_url, whatsapp, endereco, address_lat, address_lng),
        customers!customer_id(name, phone),
        order_items(*)
      `)
      .eq('id', id)
      .single()

    if (orderError || !order) {
      console.error("Tracking API Error:", orderError)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    // 2. Fetch driver/delivery details (support new delivery_drivers first, fall back to legacy)
    let entregador = null
    let trackingCoordinates = null

    if (order.driver_id) {
      const { data: driverData, error: driverErr } = await supabaseAdmin
        .from('delivery_drivers')
        .select('*')
        .eq('id', order.driver_id)
        .maybeSingle()

      if (!driverErr && driverData) {
        entregador = {
          nome: driverData.name,
          telefone: driverData.phone,
          foto: driverData.photo || null,
          status: driverData.status
        }
        if (driverData.latitude && driverData.longitude) {
          trackingCoordinates = {
            latitude: Number(driverData.latitude),
            longitude: Number(driverData.longitude),
            speed: null,
            heading: null,
            updated_at: driverData.last_update || new Date().toISOString()
          }
        }
      }
    }

    if (!entregador) {
      const { data: entrega } = await supabaseAdmin
        .from('entregas')
        .select('id, status, entregador_id')
        .eq('pedido_id', id)
        .maybeSingle()

      if (entrega && entrega.entregador_id) {
        const { data: entregadorData, error: entregadorError } = await supabaseAdmin
          .from('entregadores')
          .select('id, nome, telefone')
          .eq('id', entrega.entregador_id)
          .maybeSingle()
        
        if (!entregadorError && entregadorData) {
          entregador = {
            nome: entregadorData.nome,
            telefone: entregadorData.telefone
          }
        }
      }
    }

    // 3. Fetch live delivery tracking coordinates (as fallback or standard tracking table)
    if (!trackingCoordinates) {
      const { data: tracking } = await supabaseAdmin
        .from('delivery_tracking')
        .select('*')
        .eq('order_id', id)
        .maybeSingle()

      if (tracking) {
        trackingCoordinates = {
          latitude: Number(tracking.latitude),
          longitude: Number(tracking.longitude),
          speed: (tracking as any).speed !== undefined && (tracking as any).speed !== null ? Number((tracking as any).speed) : null,
          heading: (tracking as any).heading !== undefined && (tracking as any).heading !== null ? Number((tracking as any).heading) : null,
          updated_at: tracking.updated_at
        }
      }
    }

    // 4. Data Masking Logic
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
      const cleaned = phone.replace(/\D/g, "")
      if (cleaned.length < 5) return phone
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-***`
    }

    // 5. Format Response
    const response = {
      status: order.order_status, // recebido | em_preparacao | pronto | no_caminho | chegou | entregue
      numero_pedido: order.code || order.id.slice(0, 8).toUpperCase(),
      cliente: {
        nome_mascarado: maskName(order.customers?.name),
        telefone_mascarado: maskPhone(order.customers?.phone)
      },
      endereco: order.address || "Retirada no balcão",
      codigo_br: `BR-${order.id.split("-")[0].toUpperCase()}${order.id.split("-")[1].toUpperCase()}`,
      pontos: 2, 
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
        id: order.company_id || order.tenant_id,
        slug: order.tenants?.slug || null,
        nome: order.tenants?.name || "Doce Gestão",
        logo: order.tenants?.logo_url,
        whatsapp: order.tenants?.whatsapp,
        address: order.tenants?.endereco || "",
        latitude: order.tenants?.address_lat ? Number(order.tenants.address_lat) : null,
        longitude: order.tenants?.address_lng ? Number(order.tenants.address_lng) : null
      },
      latitude: order.latitude ? Number(order.latitude) : null,
      longitude: order.longitude ? Number(order.longitude) : null,
      entregador,
      tracking: trackingCoordinates
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("Tracking API Error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
