"use client"

import { useState, useRef, useEffect } from "react"
import { useWhatsAppChat } from "@/hooks/useWhatsAppChat"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  MessageSquare, Send, User, Search, Store, Phone,
  Clock, CheckCircle2, ChevronRight, Pause, Play,
  ShoppingBag, Calendar, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function AtendimentoWhatsAppPage() {
  const {
    conversations,
    activeConvId,
    setActiveConvId,
    messages,
    customerOrders,
    loading,
    sendMessage,
    assumeConversation,
    finalizeConversation
  } = useWhatsAppChat()

  const [text, setText] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const activeConv = conversations.find(c => c.id === activeConvId)

  const filteredConvs = conversations.filter(c => 
    c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_phone?.includes(searchTerm)
  )

  const handleSend = () => {
    if (!text.trim()) return
    sendMessage(text)
    setText("")
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm font-sans w-full max-w-full">
      
      {/* 📱 1. LISTA DE CONVERSAS (ESQUERDA) */}
      <div className="w-[320px] border-r border-slate-100 flex flex-col bg-[#fafafa]/50 shrink-0">
        <div className="p-5 space-y-4 border-b border-slate-100">
          <div className="flex items-center gap-3 text-slate-800">
             <div className="p-2 bg-green-100 text-green-600 rounded-xl">
               <MessageSquare size={20} className="fill-current" />
             </div>
             <div>
                <h2 className="text-sm font-black uppercase tracking-tighter">Atendimento</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp Live</p>
             </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-300 group-focus-within:text-green-500 transition-colors" />
            <Input 
              placeholder="BUSCAR CLIENTE..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-slate-200 rounded-lg pl-9 h-10 text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300 focus-visible:ring-green-100"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="space-y-1">
            {filteredConvs.length === 0 ? (
               <p className="text-center text-xs text-slate-400 font-bold uppercase mt-10">Nenhuma conversa encontrada</p>
            ) : filteredConvs.map(conv => (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={cn(
                  "p-3 rounded-xl cursor-pointer transition-all border-l-4 flex gap-3 items-center",
                  activeConvId === conv.id ? "bg-white border-green-500 shadow-sm" : "border-transparent hover:bg-slate-50"
                )}
              >
                <Avatar className="size-10 rounded-full border border-slate-200 shrink-0">
                  <AvatarFallback className="bg-slate-100 text-slate-500 font-black text-xs uppercase">
                    {conv.customer_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start">
                     <h4 className="text-xs font-black text-slate-800 truncate">{conv.customer_name}</h4>
                     <span className="text-[9px] font-bold text-slate-400 shrink-0">
                       {conv.last_message_at ? format(new Date(conv.last_message_at), 'HH:mm') : ''}
                     </span>
                   </div>
                   <p className="text-[10px] text-slate-500 truncate mt-0.5">
                     {conv.status === 'em_atendimento' ? '⏳ Atendimento Humano' : (conv.status === 'finalizada' ? '✓ Finalizada' : '🤖 Com o Bot')}
                   </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* 💬 2. CHAT ATIVO (CENTRO) */}
      <div className="flex-1 flex flex-col bg-[#e5ddd5]/10 relative min-w-0">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
             <div className="p-4 bg-slate-100 text-slate-400 rounded-full">
               <MessageSquare size={48} className="opacity-20" />
             </div>
             <p className="text-xs font-black uppercase text-slate-500 tracking-widest">
               Selecione uma conversa para começar
             </p>
          </div>
        ) : (
          <>
            {/* Header Chat */}
            <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 z-10 shadow-sm">
               <div className="flex items-center gap-3">
                 <Avatar className="size-10 rounded-full border border-slate-200">
                   <AvatarFallback className="bg-green-100 text-green-700 font-black uppercase">
                     {activeConv.customer_name?.charAt(0) || '?'}
                   </AvatarFallback>
                 </Avatar>
                 <div>
                   <h3 className="text-sm font-black text-slate-800">{activeConv.customer_name}</h3>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                     {activeConv.customer_phone} 
                     {activeConv.status === 'em_atendimento' && <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[8px] ml-2">Humano</Badge>}
                     {activeConv.status === 'aberta' && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[8px] ml-2">Bot Ativo</Badge>}
                   </p>
                 </div>
               </div>

               <div className="flex items-center gap-2">
                 {activeConv.status !== 'em_atendimento' && activeConv.status !== 'finalizada' && (
                   <Button onClick={() => assumeConversation(activeConv.id)} variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase gap-2">
                     <Pause size={12} /> Assumir (Pausar Bot)
                   </Button>
                 )}
                 {activeConv.status === 'em_atendimento' && (
                   <Button onClick={() => finalizeConversation(activeConv.id)} className="h-8 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase gap-2">
                     <CheckCircle2 size={12} /> Encerrar Atendimento
                   </Button>
                 )}
               </div>
            </div>

            {/* Area de Mensagens */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 max-w-4xl mx-auto flex flex-col">
                <div className="text-center my-4">
                   <span className="bg-white/60 text-slate-500 text-[9px] font-bold uppercase px-3 py-1 rounded-full shadow-sm">
                     Início da Conversa
                   </span>
                </div>

                {messages.map((msg) => {
                  const isOutbound = msg.direction === 'outbound'
                  return (
                    <div key={msg.id} className={cn("flex w-full", isOutbound ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[70%] p-3 rounded-2xl shadow-sm relative text-sm",
                        isOutbound 
                          ? "bg-[#dcf8c6] text-slate-800 rounded-tr-none" 
                          : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                      )}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400 font-bold uppercase">
                          {format(new Date(msg.created_at), 'HH:mm')}
                          {isOutbound && <CheckCircle2 size={10} className={msg.status === 'sent' ? 'text-blue-500' : 'text-slate-300'} />}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input Área */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
               <div className="max-w-4xl mx-auto flex items-center gap-2">
                  <Input 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 h-12 bg-white border-slate-200 shadow-sm rounded-xl"
                  />
                  <Button 
                    onClick={handleSend}
                    className="size-12 rounded-xl bg-green-600 hover:bg-green-700 shadow-md shrink-0"
                  >
                    <Send size={18} className="text-white" />
                  </Button>
               </div>
               {activeConv.status === 'aberta' && (
                 <p className="text-center mt-2 text-[9px] text-slate-400 uppercase font-bold flex items-center justify-center gap-1">
                   <AlertCircle size={10} /> O bot está ativo nesta conversa. Se você enviar mensagem, o bot será pausado.
                 </p>
               )}
            </div>
          </>
        )}
      </div>

      {/* 👤 3. INFORMAÇÕES DO CLIENTE (DIREITA) */}
      <div className="w-[300px] border-l border-slate-100 bg-white shrink-0 flex flex-col">
        {activeConv ? (
          <>
            <div className="p-6 flex flex-col items-center border-b border-slate-100 text-center">
               <Avatar className="size-20 rounded-full border-4 border-slate-50 shadow-sm mb-3">
                 <AvatarFallback className="bg-slate-100 text-slate-400 text-2xl font-black uppercase">
                   {activeConv.customer_name?.charAt(0)}
                 </AvatarFallback>
               </Avatar>
               <h3 className="text-sm font-black text-slate-800">{activeConv.customer_name}</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                 {activeConv.customer_phone}
               </p>
            </div>
            
            <ScrollArea className="flex-1 p-5">
               <div className="space-y-6">
                 
                 {/* Ações Rápidas */}
                 <div className="space-y-2">
                   <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</h4>
                   <Button variant="outline" className="w-full justify-start text-xs font-bold gap-2" size="sm">
                     <ShoppingBag size={14} className="text-blue-500" /> Criar Pedido Manual
                   </Button>
                 </div>

                 {/* Histórico de Pedidos */}
                 <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Últimos Pedidos</h4>
                     <Badge variant="secondary" className="text-[8px]">{customerOrders.length}</Badge>
                   </div>
                   
                   {customerOrders.length === 0 ? (
                     <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-[10px] font-bold uppercase text-slate-400">Nenhum pedido</p>
                     </div>
                   ) : (
                     <div className="space-y-2">
                       {customerOrders.map(order => (
                         <div key={order.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                           <div className="flex justify-between items-center mb-1">
                             <span className="font-black text-slate-800">#{order.code || order.id.slice(-4).toUpperCase()}</span>
                             <span className="font-bold text-slate-500">
                               {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                             </span>
                           </div>
                           <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                             <Calendar size={10} /> {format(new Date(order.created_at), 'dd/MM/yyyy')}
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>

               </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center opacity-30">
            <User size={48} className="text-slate-400" />
          </div>
        )}
      </div>
      
    </div>
  )
}
