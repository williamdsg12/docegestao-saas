import { NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase-admin"
import { criarEntregaSeNaoExistir } from "@/lib/services/delivery"

// Haversine formula to calculate distance in km between two sets of coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Background worker that runs matchmaking asynchronously without blocking HTTP response
async function runDispatchMatchmaking(orderId: string, tenantId: string, storeLat: number, storeLng: number) {
  try {
    console.log(`⚡ [Dispatch Engine] Starting matchmaking for Order: ${orderId}, Tenant: ${tenantId}`);

    // Log start event
    await supabase.from("delivery_events").insert({
      order_id: orderId,
      event_type: "dispatch_started",
      details: "Iniciando busca automática de entregadores online"
    });

    // Loop matchmaking process up to 3 times in case new drivers get online
    for (let attempt = 1; attempt <= 2; attempt++) {
      // 1. Fetch online and available drivers
      const { data: drivers, error: driversErr } = await supabase
        .from("delivery_drivers")
        .select("*")
        .eq("company_id", tenantId)
        .eq("status", "online")

      if (driversErr) {
        console.error("❌ [Dispatch Engine] Error fetching drivers:", driversErr.message);
        break;
      }

      if (!drivers || drivers.length === 0) {
        console.log(`⚠️ [Dispatch Engine] Attempt ${attempt}: No online drivers found.`);
        if (attempt === 2) break;
        // Wait 10 seconds before second attempt
        await new Promise((resolve) => setTimeout(resolve, 10000));
        continue;
      }

      // 2. Sort drivers by distance to store
      const rankedDrivers = drivers
        .map((driver: any) => {
          const lat = driver.latitude ? Number(driver.latitude) : 0
          const lng = driver.longitude ? Number(driver.longitude) : 0
          const distance = calculateDistance(storeLat, storeLng, lat, lng)
          return { ...driver, distance }
        })
        .sort((a: any, b: any) => a.distance - b.distance)

      console.log(`🎯 [Dispatch Engine] Ranked drivers:`, rankedDrivers.map(d => `${d.name} (${d.distance.toFixed(2)}km)`));

      // 3. Offer order to each driver one by one
      for (const driver of rankedDrivers) {
        // Check if order is already assigned or cancelled in database
        const { data: currentOrder } = await supabase
          .from("orders")
          .select("driver_id, order_status")
          .eq("id", orderId)
          .single()

        if (!currentOrder || currentOrder.driver_id || currentOrder.order_status === "cancelado" || currentOrder.order_status === "finalizado") {
          console.log(`⏹️ [Dispatch Engine] Order ${orderId} already assigned or closed. Exiting dispatch loop.`);
          return;
        }

        console.log(`🛵 [Dispatch Engine] Offering order ${orderId} to driver ${driver.name} (${driver.id})`);

        // Create dispatch record
        const expiresAt = new Date(Date.now() + 20000).toISOString() // 20 seconds timeout
        const { data: dispatch, error: dispatchErr } = await supabase
          .from("delivery_dispatches")
          .insert({
            tenant_id: tenantId,
            order_id: orderId,
            driver_id: driver.id,
            status: "pending",
            expires_at: expiresAt
          })
          .select()
          .single()

        if (dispatchErr || !dispatch) {
          console.error("❌ [Dispatch Engine] Error creating dispatch record:", dispatchErr?.message);
          continue;
        }

        await supabase.from("delivery_events").insert({
          order_id: orderId,
          event_type: "dispatch_offered",
          details: `Oferta enviada para o entregador ${driver.name}`
        });

        // Poll for response (20 seconds max)
        let accepted = false
        const startTime = Date.now()

        while (Date.now() - startTime < 20000) {
          // Wait 1.5 seconds between checks
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Fetch current status of this dispatch call
          const { data: checkDispatch } = await supabase
            .from("delivery_dispatches")
            .select("status")
            .eq("id", dispatch.id)
            .single()

          if (!checkDispatch) continue;

          if (checkDispatch.status === "accepted") {
            accepted = true
            break
          }

          if (checkDispatch.status === "rejected") {
            console.log(`❌ [Dispatch Engine] Driver ${driver.name} rejected the order.`);
            break
          }
        }

        if (accepted) {
          console.log(`✅ [Dispatch Engine] Driver ${driver.name} accepted the order ${orderId}!`);

          // 1. Assign driver in orders table
          await supabase
            .from("orders")
            .update({ driver_id: driver.id })
            .eq("id", orderId)

          // 2. Assign driver in pedidos table
          await supabase
            .from("pedidos")
            .update({ driver_id: driver.id })
            .eq("id", orderId)

          // 3. Upsert row in entregas and update status to 'accepted_driver'
          await criarEntregaSeNaoExistir(supabase, {
            id: orderId,
            tenant_id: tenantId
          })
          await supabase
            .from("entregas")
            .update({ 
              status: "accepted_driver",
              entregador_id: driver.id
            })
            .eq("pedido_id", orderId)

          // 4. Log success event
          await supabase.from("delivery_events").insert({
            order_id: orderId,
            event_type: "accepted",
            details: `Corrida aceita pelo entregador ${driver.name}`
          });

          return; // Matchmaking finished successfully!
        } else {
          // Timeout or rejection: update dispatch state to timeout if still pending
          const { data: finalDispatch } = await supabase
            .from("delivery_dispatches")
            .select("status")
            .eq("id", dispatch.id)
            .single()

          if (finalDispatch && finalDispatch.status === "pending") {
            await supabase
              .from("delivery_dispatches")
              .update({ status: "timeout" })
              .eq("id", dispatch.id)
          }

          await supabase.from("delivery_events").insert({
            order_id: orderId,
            event_type: "dispatch_failed_driver",
            details: `Entregador ${driver.name} não respondeu ou recusou`
          });
        }
      }
    }

    // If we reached here, no driver accepted
    console.log(`❌ [Dispatch Engine] Matchmaking failed: No driver accepted the order ${orderId}.`);
    await supabase.from("delivery_events").insert({
      order_id: orderId,
      event_type: "dispatch_failed",
      details: "Nenhum entregador aceitou a chamada. O pedido pode ser designado manualmente."
    });

  } catch (err: any) {
    console.error("❌ [Dispatch Engine] Critical error in matchmaking loop:", err.message);
  }
}

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: "Missing required parameter: orderId" }, { status: 400 })
    }

    // 1. Fetch order details
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, tenants!company_id(*)")
      .eq("id", orderId)
      .single()

    if (orderErr || !order) {
      console.error("Error fetching order:", orderErr)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const tenantId = order.tenant_id || order.company_id
    const storeLat = order.tenants?.address_lat ? Number(order.tenants.address_lat) : null
    const storeLng = order.tenants?.address_lng ? Number(order.tenants.address_lng) : null

    if (!storeLat || !storeLng) {
      return NextResponse.json({ 
        error: "Coordenadas da loja não configuradas. Por favor, defina a latitude e longitude da loja nas configurações." 
      }, { status: 400 })
    }

    // 2. Start background worker matchmaking process
    runDispatchMatchmaking(orderId, tenantId, storeLat, storeLng)

    return NextResponse.json({ success: true, message: "Matchmaking iniciado no segundo plano" })

  } catch (err: any) {
    console.error("Dispatch API Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
