/**
 * Asaas API Integration Library
 * Documentation: https://docs.asaas.com/docs/introducao
 */

const ASAAS_API_URL = process.env.NODE_ENV === 'production'
    ? 'https://www.asaas.com/api/v3'
    : 'https://sandbox.asaas.com/api/v3';

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

async function asaasFetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${ASAAS_API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.description || 'Asaas API Error');
    }

    return response.json();
}

/**
 * Find or create a client in Asaas
 */
export async function getOrCreateAsaasCustomer(userData: { email: string, name: string, phone?: string }) {
    // 1. Search by email
    const customers = await asaasFetch(`/customers?email=${encodeURIComponent(userData.email)}`);

    if (customers.data && customers.data.length > 0) {
        return customers.data[0];
    }

    // 2. Create if not found
    return asaasFetch('/customers', {
        method: 'POST',
        body: JSON.stringify({
            name: userData.name,
            email: userData.email,
            mobilePhone: userData.phone,
        }),
    });
}

/**
 * Create a single payment/checkout link
 */
export async function createAsaasPayment(data: {
    customer: string,
    billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED',
    value: number,
    dueDate: string, // YYYY-MM-DD
    externalReference: string,
    description: string
}) {
    return asaasFetch('/payments', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Create a subscription (Recurring)
 */
export async function createAsaasSubscription(data: {
    customer: string,
    billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED',
    value: number,
    nextDueDate: string, // YYYY-MM-DD
    cycle: 'MONTHLY' | 'YEARLY',
    externalReference: string,
    description: string
}) {
    return asaasFetch('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
