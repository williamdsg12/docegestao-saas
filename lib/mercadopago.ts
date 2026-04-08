import { MercadoPagoConfig, Payment } from 'mercadopago';

let client: MercadoPagoConfig | null = null;
let payment: Payment | null = null;

export function getMercadoPagoClient() {
    if (!client) {
        const token = process.env.MP_ACCESS_TOKEN;
        if (!token) {
            console.error("❌ CRITICAL: MP_ACCESS_TOKEN is missing in getMercadoPagoClient!");
        } else {
            console.log("✅ Initializing MP Client");
            console.log("   - Token length:", token.length);
            console.log("   - Token prefix:", token.substring(0, 10));
        }
        
        client = new MercadoPagoConfig({ 
            accessToken: token || '',
            options: { timeout: 10000 }
        });
    }
    return client;
}

export function getPaymentClient() {
    if (!payment) {
        payment = new Payment(getMercadoPagoClient());
    }
    return payment;
}
