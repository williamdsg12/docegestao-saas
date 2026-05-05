"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface SupportTicket {
  id: string
  tenant_id: string
  user_id: string
  assunto: string
  categoria: 'pedidos' | 'pagamento' | 'cardapio' | 'tecnico' | 'financeiro' | 'outro'
  prioridade: 'normal' | 'alta' | 'urgente'
  status: 'aberto' | 'em_atendimento' | 'resolvido' | 'fechado'
  respondido: boolean
  criado_em: string
  atualizado_em: string
  last_message?: string
  unread_count?: number
  user?: {
    id: string
    owner_name: string
    business_name: string
  }
  company?: {
    id: string
    name: string
    logo_url: string
  }
  assigned?: {
    id: string
    owner_name: string
  }
}

export interface SupportMessage {
  id: string
  conteudo: string
  enviado_em: string
  lido: boolean
  remetente: 'usuario' | 'admin'
  remetente_id?: string
  tipo: 'texto' | 'audio' | 'imagem' | 'arquivo'
  audio_url?: string
  sender?: {
    id: string
    owner_name: string
  }
}

export function useSupportChat(ticketId?: string) {
  const { user, profile: authProfile } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTickets = useCallback(async () => {
    if (!user) return
    
    // Determine context (admin or user)
    const isAdmin = authProfile?.is_admin || false
    const tenantId = authProfile?.tenant_id

    let query = supabase
      .from('tickets')
      .select(`
        *,
        mensagens_suporte(
          id, conteudo, enviado_em, lido, remetente, remetente_id, tipo, audio_url,
          sender:profiles!mensagens_suporte_remetente_id_fkey(id, owner_name)
        ),
        user:profiles!tickets_user_id_fkey(id, owner_name, business_name),
        company:tenants!tickets_tenant_id_fkey(id, name, logo_url),
        assigned:profiles!tickets_assigned_to_fkey(id, owner_name)
      `)
      .order('atualizado_em', { ascending: false })

    if (!isAdmin) {
      // Usuário comum vê apenas seus próprios tickets
      query = query.eq('user_id', user.id)
    }
    // Se for admin, não aplica o filtro de user_id, permitindo ver todos os tickets de suporte do sistema.

    const { data, error } = await query

    if (error) {
        console.error("Error fetching tickets:", error.message, error.details)
    }

    if (data) {
      const formatted = data.map((t: any) => {
        const msgs = t.mensagens_suporte || []
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null
        const unreadCount = msgs.filter((m: any) => !m.lido && m.remetente === (isAdmin ? 'usuario' : 'admin')).length
        
        return {
          ...t,
          last_message: lastMsg?.conteudo || '',
          unread_count: unreadCount
        }
      })
      setTickets(formatted)
    }
    setLoading(false)
  }, [user, authProfile])

  const fetchMessages = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('mensagens_suporte')
      .select('*')
      .eq('ticket_id', id)
      .order('enviado_em', { ascending: true })

    if (!error && data) {
      setMessages(data)
    }
  }, [])

  const sendMessage = async (content: string, type: 'usuario' | 'admin' = 'usuario', audioUrl?: string) => {
    if (!ticketId || !user) return

    const { data, error } = await supabase
      .from('mensagens_suporte')
      .insert({
        ticket_id: ticketId,
        remetente: type,
        remetente_nome: authProfile?.owner_name || 'Equipe',
        tipo: audioUrl ? 'audio' : 'texto',
        conteudo: content,
        audio_url: audioUrl,
        lido: false
      })
      .select()
      .single()

    if (error) {
        console.error("Error sending message:", error.message, error.details)
        return null
    }

    if (data) {
      await supabase
        .from('tickets')
        .update({ 
          atualizado_em: new Date().toISOString(),
          respondido: type === 'admin'
        })
        .eq('id', ticketId)
      
      // Auto assign ticket if an admin replies and it's not assigned
      if (type === 'admin') {
        const ticket = tickets.find(t => t.id === ticketId)
        if (ticket && !ticket.assigned) {
          assignTicket(ticketId)
        }
      }
      
      return data
    }
    return null
  }

  const assignTicket = async (id: string) => {
    if (!user) return
    const { error } = await supabase
      .from('tickets')
      .update({ assigned_to: user.id, status: 'em_atendimento' })
      .eq('id', id)
      
    if (!error) {
      setTickets(prev => prev.map(t => 
        t.id === id 
          ? { ...t, status: 'em_atendimento', assigned: { id: user.id, owner_name: authProfile?.owner_name || 'Admin' } } 
          : t
      ))
    }
  }

  const startTicket = async (assunto: string, categoria: string, prioridade: string, initialMessage: string) => {
    if (!user || !authProfile) return null

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        tenant_id: authProfile.tenant_id,
        user_id: user.id,
        assunto,
        categoria,
        prioridade,
        status: 'aberto'
      })
      .select()
      .single()

    if (ticketError) {
      console.error("Error creating ticket:", ticketError.message, ticketError.details)
      return null
    }

    if (ticket) {
      const { error: msgError } = await supabase.from('mensagens_suporte').insert({
        ticket_id: ticket.id,
        conteudo: initialMessage,
        remetente: 'usuario',
        remetente_nome: authProfile.owner_name || authProfile.business_name || 'Usuário'
      })
      
      if (msgError) {
        console.error("Error creating initial message:", msgError.message, msgError.details)
      }

      fetchTickets()
      return ticket.id
    }
    return null
  }

  const updateTicketStatus = async (id: string, status: SupportTicket['status']) => {
    const { error } = await supabase
      .from('tickets')
      .update({ status, atualizado_em: new Date().toISOString() })
      .eq('id', id)
    
    if (!error) {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    }
  }

  const markMessagesAsRead = async (id: string, readerType: 'usuario' | 'admin') => {
    const targetRemetente = readerType === 'usuario' ? 'admin' : 'usuario'
    
    const { error } = await supabase
      .from('mensagens_suporte')
      .update({ lido: true })
      .eq('ticket_id', id)
      .eq('remetente', targetRemetente)
      .eq('lido', false)
    
    if (!error) {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, unread_count: 0 } : t))
    }
  }

  useEffect(() => {
    fetchTickets()

    const channel = supabase
      .channel('support-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => fetchTickets()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensagens_suporte' },
        (payload) => {
          if (payload.new.ticket_id === ticketId) {
            setMessages(prev => {
                if (prev.some(m => m.id === payload.new.id)) return prev
                return [...prev, payload.new as SupportMessage]
            })
          }
          fetchTickets()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, ticketId, fetchTickets])

  useEffect(() => {
    if (ticketId) {
      fetchMessages(ticketId)
    }
  }, [ticketId, fetchMessages])

  return {
    tickets,
    messages,
    loading,
    sendMessage,
    startTicket,
    updateTicketStatus,
    markMessagesAsRead,
    fetchTickets,
    assignTicket
  }
}
