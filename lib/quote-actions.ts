import { supabase } from "./supabase"
import { toast } from "sonner"

export const convertQuoteToOrder = async (quoteId: string, company_id: string) => {
    try {
        // 1. Fetch Quote with Items
        const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .select('*, items:quote_items(*)')
            .eq('id', quoteId)
            .single()

        if (quoteError) throw quoteError

        // 2. Insert into Orders
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                company_id: company_id,
                customer_id: quote.client_id,
                total: quote.total_final,
                status: 'pending',
                notes: `Convertido do Orçamento #${quoteId.slice(0, 5)} - ${quote.description}`,
            })
            .select()
            .single()

        if (orderError) throw orderError

        // 3. Update Quote Status
        await supabase.from('quotes').update({ status: 'converted' }).eq('id', quoteId)

        return { success: true, orderId: order.id }
    } catch (e: any) {
        console.error(e)
        return { success: false, error: e.message }
    }
}

export const duplicateQuote = async (quoteId: string) => {
    try {
        const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .select('*, items:quote_items(*), costs:quote_costs(*)')
            .eq('id', quoteId)
            .single()

        if (quoteError) throw quoteError

        const { id, created_at, updated_at, opened_at, public_token, status, ...cloneData } = quote
        
        const { data: newQuote, error: newError } = await supabase
            .from('quotes')
            .insert({ ...cloneData, status: 'draft' })
            .select()
            .single()

        if (newError) throw newError

        // Duplicate costs
        if (quote.costs?.length > 0) {
            const newCosts = quote.costs.map(({ id, created_at, ...c }: any) => ({ ...c, quote_id: newQuote.id }))
            await supabase.from('quote_costs').insert(newCosts)
        }

        return { success: true, newId: newQuote.id }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export const sendWhatsAppQuote = (quote: any, businessName: string) => {
    const phone = quote.client_whatsapp?.replace(/\D/g, '')
    if (!phone) {
        toast.error("Cliente sem WhatsApp cadastrado")
        return
    }

    const message = encodeURIComponent(
        `Oi ${quote.client_name || 'tudo bem'}! 😊\n\n` +
        `Aqui é da *${businessName}*. Seu orçamento profissional está pronto!\n\n` +
        `*Valor Proposto:* R$ ${Number(quote.total_final).toFixed(2)}\n` +
        `*Validade:* ${new Date(quote.valid_until).toLocaleDateString()}\n\n` +
        `Você pode visualizar os detalhes completos clicando aqui:\n` +
        `https://docegestao.com.br/visualizar-orcamento/${quote.id}\n\n` +
        `Qualquer dúvida estou à disposição!`
    )

    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank')
}

export const sendWhatsAppFollowUp = (quote: any, businessName: string) => {
    const phone = quote.client_whatsapp?.replace(/\D/g, '')
    if (!phone) return

    const message = encodeURIComponent(
        `Olá ${quote.client_name}! Passando para saber se conseguiu ver o orçamento que te enviamos ontem. 😊\n\n` +
        `Temos poucas vagas para a data solicitada (${new Date(quote.event_date).toLocaleDateString()}). Aceita fechar o pedido hoje?`
    )

    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank')
}
