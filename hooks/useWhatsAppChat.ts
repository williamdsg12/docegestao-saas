import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useBusiness } from '@/hooks/useBusiness'
import { toast } from 'sonner'
import { normalizePhone } from '@/lib/formatters'

export function useWhatsAppChat() {
  const { profile } = useBusiness()
  const tenantId = profile?.tenant_id || profile?.company_id

  const [conversations, setConversations] = useState<any[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [customerOrders, setCustomerOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    loadConversations()

    const convChannel = supabase
      .channel('wa_conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chatbot_conversations', filter: `tenant_id=eq.${tenantId}` }, () => {
        loadConversations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(convChannel)
    }
  }, [tenantId])

  useEffect(() => {
    if (!activeConvId || !tenantId) return
    loadMessages(activeConvId)
    loadCustomerOrders(activeConvId)

    const msgChannel = supabase
      .channel('wa_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `conversation_id=eq.${activeConvId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(msgChannel)
    }
  }, [activeConvId, tenantId])

  const loadConversations = async () => {
    const { data } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('last_message_at', { ascending: false })
    
    if (data) setConversations(data)
    setLoading(false)
  }

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    
    if (data) setMessages(data)
  }

  const loadCustomerOrders = async (convId: string) => {
    const conv = conversations.find(c => c.id === convId)
    if (!conv) return
    
    const normPhone = normalizePhone(conv.customer_phone)
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('telefone_normalizado', normPhone)
      .is('deleted_at', null)
      .maybeSingle()
    if (customer) {
      const { data: orders } = await supabase.from('orders').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }).limit(5)
      if (orders) setCustomerOrders(orders)
    }
  }

  const sendMessage = async (text: string) => {
    if (!activeConvId || !text.trim()) return
    const conv = conversations.find(c => c.id === activeConvId)
    if (!conv) return

    // Optistic UI Update
    const optimisticMsg = {
      id: Math.random().toString(),
      conversation_id: activeConvId,
      direction: 'outbound',
      content: text,
      status: 'sending',
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res = await fetch('/api/chatbot/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          phone: conv.customer_phone,
          message: text
        })
      })
      if (!res.ok) throw new Error('Failed')
      
      // Mudar status para 'em_atendimento' automaticamente se o admin falar
      if (conv.status !== 'em_atendimento') {
         await supabase.from('chatbot_conversations').update({ status: 'em_atendimento', is_paused: true }).eq('id', activeConvId)
      }
    } catch (err) {
      toast.error('Erro ao enviar mensagem')
      // Revert optimistic msg
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
    }
  }

  const assumeConversation = async (convId: string) => {
    await supabase.from('chatbot_conversations').update({ status: 'em_atendimento', is_paused: true }).eq('id', convId)
  }

  const finalizeConversation = async (convId: string) => {
    await supabase.from('chatbot_conversations').update({ status: 'finalizada', is_paused: false, bot_state: {} }).eq('id', convId)
  }

  return {
    conversations,
    activeConvId,
    setActiveConvId,
    messages,
    customerOrders,
    loading,
    sendMessage,
    assumeConversation,
    finalizeConversation
  }
}
