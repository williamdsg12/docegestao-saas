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

    const type = order.delivery_type || order.order_type || 'delivery'
    const isPickup = ['retirada', 'pickup', 'balcao', 'balcão'].includes(type.toLowerCase())
    
    if (isPickup) return 'Retirada no Local'
    
    // 1. Try flat columns (delivery_address, etc)
    let addr = order.delivery_address || order.address || order.endereco
    let num = order.delivery_number || order.numero || order.number
    let neigh = order.delivery_neighborhood || order.bairro || order.neighborhood
    let city = order.delivery_city || order.cidade || order.city

    // 2. Fallback to joined 'addresses' table (legacy or different structure)
    if (!addr && order.addresses) {
        addr = order.addresses.street || order.addresses.address
        num = order.addresses.number
        neigh = order.addresses.neighborhood
        city = order.addresses.city
    }

    // 3. Fallback to order.customers.address (if customer has address in profile)
    if (!addr && order.customers) {
        const cAddr = order.customers.address
        if (typeof cAddr === 'object' && cAddr !== null) {
            addr = cAddr.street || cAddr.address || cAddr.endereco || cAddr.formatted_address
            num = cAddr.number || cAddr.numero
            neigh = cAddr.neighborhood || cAddr.bairro
            city = cAddr.city || cAddr.cidade
        } else if (typeof cAddr === 'string') {
            addr = cAddr
        }
    }

    // 4. Handle Case where addr is an object (JSONB column)
    if (typeof addr === 'object' && addr !== null) {
        num = addr.number || addr.numero || num
        neigh = addr.neighborhood || addr.bairro || neigh
        city = addr.city || addr.cidade || city
        addr = addr.street || addr.address || addr.endereco || addr.formatted_address
    }
    
    if (!addr && (!order.delivery_address && !order.address)) return 'Endereço não informado'

    const parts = [
        addr, 
        num ? `nº ${num}` : null, 
        order.delivery_complement || order.complement ? `${order.delivery_complement || order.complement}` : null,
        neigh ? `(${neigh})` : null, 
        city
    ].filter(Boolean)
    
    return parts.length > 0 ? parts.join(' - ') : 'Endereço não informado'
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

export const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || { label: status, className: 'bg-slate-100 text-slate-400', variant: 'outline' }
}
