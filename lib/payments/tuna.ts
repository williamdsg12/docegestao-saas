import { createClient } from "@supabase/supabase-js"

const TUNA_API_URL = "https://api.tuna.com.br"

export async function getTunaConfig(tenantId: string) {
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
        .from("tuna_accounts")
        .select("*")
        .eq("tenant_id", tenantId)
        .single()

    if (error || !data) return null
    return data
}

export async function createTunaPixPayment(tenantId: string, orderData: any) {
    const config = await getTunaConfig(tenantId)
    if (!config || !config.connected || !config.pix_enabled) {
        throw new Error("Tuna PIX not configured for this tenant")
    }

    const response = await fetch(`${TUNA_API_URL}/v1/payments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.access_token}`
        },
        body: JSON.stringify({
            amount: orderData.amount,
            currency: "BRL",
            paymentMethod: "pix",
            orderId: orderData.orderId,
            customer: orderData.customer,
            accountId: config.tuna_account_id
        })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || "Tuna PIX error")

    return {
        id: data.id,
        qr_code: data.payment_method_details?.qr_code,
        qr_code_base64: data.payment_method_details?.qr_code_base64,
        external_id: data.id
    }
}

export async function getTunaSession(tenantId: string) {
    const config = await getTunaConfig(tenantId)
    if (!config || !config.connected) throw new Error("Tuna not connected")

    const response = await fetch(`${TUNA_API_URL}/v1/sessions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.access_token}`
        },
        body: JSON.stringify({
            accountId: config.tuna_account_id
        })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || "Tuna session error")

    return data.session_id
}

export async function getTunaPaymentStatus(paymentId: string, tenantId: string) {
    const config = await getTunaConfig(tenantId);
    if (!config || !config.connected) throw new Error("Tuna not connected");

    const response = await fetch(`${TUNA_API_URL}/v1/payments/${paymentId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.access_token}`
        }
    });

    const data = await response.json();
    if (!response.ok) return 'error';

    // Map Tuna status to our standard status
    // status 2 = Authorized, 3 = Captured
    if (data.status === 2 || data.status === 3) return 'approved';
    if (data.status === 6) return 'rejected';
    return 'pending';
}

export async function createTunaCardPayment(tenantId: string, orderData: any) {
    const config = await getTunaConfig(tenantId)
    if (!config || !config.connected || !config.card_enabled) {
        throw new Error("Tuna Card not configured for this tenant")
    }

    const response = await fetch(`${TUNA_API_URL}/v1/payments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.access_token}`
        },
        body: JSON.stringify({
            amount: orderData.amount,
            currency: "BRL",
            paymentMethod: "credit_card",
            orderId: orderData.orderId,
            token: orderData.token,
            installments: orderData.installments || 1,
            customer: orderData.customer,
            accountId: config.tuna_account_id
        })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || "Tuna Card error")

    return {
        id: data.id,
        status: data.status,
        external_id: data.id
    }
}
