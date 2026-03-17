import { MercadoPagoConfig, Payment } from 'mercadopago';

if (!process.env.MP_ACCESS_TOKEN) {
    // console.warn("MP_ACCESS_TOKEN is not defined in environment variables");
}

export const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || '',
    options: { timeout: 5000 }
});

export const payment = new Payment(client);
