import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    // In dev, we might not have it yet, but we define the export
    // console.warn("STRIPE_SECRET_KEY is not defined in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
    appInfo: {
        name: 'DoceGestão',
        version: '1.0.0',
    },
});

/**
 * Create a Stripe Checkout Session
 */
export async function createCheckoutSession(data: {
    customerId?: string,
    userEmail: string,
    planName: string,
    priceId: string, // Stripe Price ID (e.g., price_123...)
    successUrl: string,
    cancelUrl: string,
    metadata: Record<string, any>
}) {
    return stripe.checkout.sessions.create({
        customer_email: data.customerId ? undefined : data.userEmail,
        customer: data.customerId || undefined,
        line_items: [
            {
                price: data.priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: data.metadata,
        subscription_data: {
            metadata: data.metadata,
        },
    });
}
