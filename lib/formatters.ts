/**
 * Utility functions for formatting order related data.
 */

/**
 * Formats a number to BRL currency string.
 * @param value The value to format.
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value || 0)
}

/**
 * Formats a phone number string to (XX) XXXXX-XXXX mask.
 * @param phone The string containing the phone number.
 */
export const formatPhone = (phone: string): string => {
    if (!phone) return "S/ Telefone"
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')
    
    // Check if it's a mobile with 9 digits (11 total with DDD)
    if (digits.length === 11) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`
    }
    
    // Check if it's a landline with 8 digits (10 total with DDD)
    if (digits.length === 10) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`
    }
    
    // Return original if doesn't match standard
    return phone
}

/**
 * Formats an order's address with fallback.
 * @param order The order object containing delivery details.
 */
export const formatAddress = (order: any): string => {
    if (!order) return 'Endereço não informado'

    const type = (order.delivery_type || order.order_type || 'delivery').toLowerCase()
    const isPickup = ['retirada', 'pickup', 'balcao', 'balcão', 'mesa'].includes(type)
    
    if (isPickup) return 'Retirada no Local'
    
    // Extratct address parts from multiple possible sources
    let street = order.delivery_address || order.address || order.endereco
    let number = order.delivery_number || order.numero || order.number
    let neighborhood = order.delivery_neighborhood || order.bairro || order.neighborhood
    let city = order.delivery_city || order.cidade || order.city
    let complement = order.delivery_complement || order.complement
    let reference = order.delivery_reference || order.reference || order.ponto_referencia

    // Fallback logic for nested objects
    if (!street && order.addresses) {
        street = order.addresses.street || order.addresses.address
        number = order.addresses.number
        neighborhood = order.addresses.neighborhood
        city = order.addresses.city
    }

    if (!street && order.customers?.address) {
        const cAddr = order.customers.address
        if (typeof cAddr === 'object') {
            street = cAddr.street || cAddr.address || cAddr.formatted_address
            number = cAddr.number || cAddr.numero
            neighborhood = cAddr.neighborhood || cAddr.bairro
            city = cAddr.city || cAddr.cidade
            complement = cAddr.complement || cAddr.complemento
            reference = cAddr.reference || cAddr.ponto_referencia
        }
    }

    if (!street) return 'Endereço não informado'

    // Professional formatting
    const mainLine = `${street}${number ? `, ${number}` : ''}`
    const subLine = [neighborhood, city].filter(Boolean).join(' - ')
    const extraInfo = [
        complement ? `Complemento: ${complement}` : null,
        reference ? `Ref: ${reference}` : null
    ].filter(Boolean).join(' | ')

    return [mainLine, subLine, extraInfo].filter(Boolean).join('\n')
}

/**
 * Standardized labels and colors for order statuses.
 */
export const STATUS_CONFIG: Record<string, { label: string, className: string, variant: string }> = {
    'novo': { label: 'Pendente', className: 'bg-[#FBA41A] text-white border-none', variant: 'default' },
    'pending': { label: 'Pendente', className: 'bg-[#FBA41A] text-white border-none', variant: 'default' },
    'pending_payment': { label: 'Pagamento Pendente', className: 'bg-slate-200 text-slate-500 border-none', variant: 'outline' },
    'preparando': { label: 'Em preparo', className: 'bg-[#2ECC71] text-white border-none', variant: 'default' },
    'em_preparo': { label: 'Em preparo', className: 'bg-[#2ECC71] text-white border-none', variant: 'default' },
    'preparing': { label: 'Em preparo', className: 'bg-[#2ECC71] text-white border-none', variant: 'default' },
    'saiu-entrega': { label: 'Em entrega', className: 'bg-[#0070F3] text-white border-none', variant: 'default' },
    'saiu_entrega': { label: 'Em entrega', className: 'bg-[#0070F3] text-white border-none', variant: 'default' },
    'delivery': { label: 'Em entrega', className: 'bg-[#0070F3] text-white border-none', variant: 'default' },
    'finalizado': { label: 'Concluído', className: 'bg-slate-400 text-white border-none', variant: 'secondary' },
    'delivered': { label: 'Concluído', className: 'bg-slate-400 text-white border-none', variant: 'secondary' },
    'done': { label: 'Concluído', className: 'bg-slate-400 text-white border-none', variant: 'secondary' },
    'cancelado': { label: 'Cancelado', className: 'bg-rose-500 text-white border-none', variant: 'destructive' },
    'cancelled': { label: 'Cancelado', className: 'bg-rose-500 text-white border-none', variant: 'destructive' },
}

export const formatPaymentMethod = (method: string): string => {
    const methods: Record<string, string> = {
        'money': 'Dinheiro',
        'pix': 'PIX',
        'card_on_delivery': 'Cartão na Entrega',
        'credit_card': 'Cartão de Crédito',
        'debit_card': 'Cartão de Débito',
        'mercadopago_card': 'Cartão Online',
        'stripe': 'Cartão Online',
    }
    return methods[method] || method || 'Não definido'
}

export const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || { label: status, className: 'bg-slate-100 text-slate-400', variant: 'outline' }
}

/**
 * Normalizes a phone number to digits only.
 * @param phone The phone number string.
 */
export const normalizePhone = (phone: string): string => {
    if (!phone) return ''
    let normalized = phone.replace(/\D/g, '')
    if ((normalized.length === 12 || normalized.length === 13) && normalized.startsWith('55')) {
        normalized = normalized.slice(2)
    }
    return normalized
}
