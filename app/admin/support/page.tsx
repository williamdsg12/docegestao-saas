"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Search, Send, Headphones, RefreshCcw, 
  Mic, Paperclip, X, Clock, AlertCircle, CheckCircle2,
  ChevronLeft, MessageSquare, Star, Zap, Smile, 
  Sparkles, BookOpen, Trash2, Filter, MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useSupportChat, SupportTicket } from "@/hooks/useSupportChat"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function AdminSupportPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const { 
    tickets, messages, loading, sendMessage, 
    updateTicketStatus, markMessagesAsRead, assignTicket
  } = useSupportChat(selectedTicketId || undefined)
  
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Não respondidos' | 'Urgentes'>('Todos')
  const [messageText, setMessageText] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Metrics
  const activeTickets = tickets.filter(t => t.status === 'aberto' || t.status === 'em_atendimento').length
  const urgentTickets = tickets.filter(t => t.prioridade === 'urgente' && t.status === 'aberto').length
  const premiumTickets = tickets.filter(t => t.prioridade === 'alta').length // Mocked for plans
  const avgSla = "1.2h"

  const filteredTickets = tickets.filter(t => {
    if (filterStatus === 'Todos') return true
    if (filterStatus === 'Não respondidos') return !t.respondido
    if (filterStatus === 'Urgentes') return t.prioridade === 'urgente'
    return true
  })

  const selectedTicket = tickets.find(t => t.id === selectedTicketId)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (selectedTicketId) {
      markMessagesAsRead(selectedTicketId, 'admin')
    }
  }, [selectedTicketId, messages.length, markMessagesAsRead])

  const handleSend = async (customText?: string) => {
    const text = customText || messageText
    if (!text.trim() || !selectedTicketId) return
    await sendMessage(text, 'admin')
    if (!customText) setMessageText("")
    
    if (selectedTicket?.status === 'aberto') {
      updateTicketStatus(selectedTicketId, 'em_atendimento')
    }
  }

  const suggestResponse = () => {
    const suggestions = [
      "Olá! Compreendo sua dúvida. Como posso ajudar especificamente com este ponto?",
      "Lamento pelo transtorno. Você poderia me enviar um print do erro para que nosso time técnico analise?",
      "Identifiquei sua solicitação. O prazo de resolução para este tipo de categoria é de até 24 horas."
    ]
    setMessageText(suggestions[Math.floor(Math.random() * suggestions.length)])
    toast.success("Sugestão de IA aplicada!")
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-white p-6 gap-6 font-sans">
      
      {/* 2b. CARDS DE MÉTRICAS (topo) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'TICKETS ATIVOS', value: activeTickets, icon: MessageSquare, color: 'text-white' },
          { label: 'MÉDIA SLA', value: avgSla, icon: Clock, color: 'text-amber-500' },
          { label: 'SATISFAÇÃO (CSAT)', value: '4.8/5.0', icon: Smile, color: 'text-emerald-500' },
          { label: 'PLANOS PREMIUM', value: premiumTickets, icon: Zap, color: 'text-[#e53e3e]' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1c1c1c] border border-[#2a2a2a] p-5 rounded-xl flex items-center gap-4 shadow-lg transition-all hover:border-slate-700">
            <div className={cn("size-12 rounded-xl bg-black/20 flex items-center justify-center", stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#888] uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black italic tracking-tighter leading-none">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 min-h-0 bg-[#161616] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-2xl">
        
        {/* 2c. LAYOUT PRINCIPAL — LISTA DE TICKETS */}
        <div className="w-[320px] border-r border-[#2a2a2a] flex flex-col bg-[#0f0f0f]/40">
          <div className="p-5 border-b border-[#2a2a2a] space-y-4">
            <div className="flex items-center justify-between">
               <h2 className="text-lg font-black uppercase tracking-tighter italic">
                 Suporte <span className="text-[#e53e3e]">Master</span>
               </h2>
               <Badge className="bg-[#e53e3e] text-white text-[8px] font-black border-none px-1.5 h-4">PRO</Badge>
            </div>
            
            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
               {['Todos', 'Não respondidos', 'Urgentes'].map((tab) => (
                 <button
                   key={tab}
                   onClick={() => setFilterStatus(tab as any)}
                   className={cn(
                     "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                     filterStatus === tab ? "bg-[#e53e3e] text-white" : "bg-[#2a2a2a] text-[#888] hover:text-white"
                   )}
                 >
                   {tab}
                 </button>
               ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
             <div className="p-2 space-y-1">
                {filteredTickets.length === 0 ? (
                  <div className="py-20 text-center text-[10px] font-black uppercase text-[#888] tracking-[0.2em]">Nenhum Ticket</div>
                ) : filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={cn(
                      "p-4 rounded-xl cursor-pointer transition-all border-l-[3px] relative",
                      selectedTicketId === t.id ? "bg-[#1c1c1c] border-[#e53e3e]" : "border-transparent hover:bg-[#1a1a1a]"
                    )}
                  >
                    {!t.respondido && (
                      <div className="absolute top-4 right-4 size-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                    )}
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="size-5 rounded bg-[#2a2a2a] shrink-0">
                          <AvatarImage src={t.company?.logo_url} />
                          <AvatarFallback className="text-[8px] bg-transparent text-[#888]">
                            {(t.company?.name || t.user?.business_name || '?')[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h4 className="text-[11px] font-bold text-white truncate max-w-[140px]">
                          {t.company?.name || t.user?.business_name || 'Sem Empresa'}
                        </h4>
                      </div>
                      <span className="text-[9px] font-bold text-[#888] shrink-0">
                        {format(new Date(t.atualizado_em), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888] font-bold uppercase tracking-tight mb-2 truncate">
                      {t.assunto}
                    </p>
                    <div className="flex gap-2">
                       <span className={cn(
                         "px-1.5 py-0.5 text-[8px] font-black uppercase rounded",
                         t.prioridade === 'urgente' ? "bg-rose-500/20 text-rose-500" : "bg-blue-500/10 text-blue-400"
                       )}>
                         {t.prioridade}
                       </span>
                       <span className="px-1.5 py-0.5 bg-white/5 text-[#888] text-[8px] font-black uppercase rounded">
                         {t.status}
                       </span>
                    </div>
                    {t.assigned && (
                      <div className="flex items-center gap-1.5 mt-2 bg-black/30 p-1.5 rounded-lg border border-[#2a2a2a]">
                        <Avatar className="size-4 rounded">
                          <AvatarFallback className="text-[6px] bg-[#e53e3e] text-white font-black">{t.assigned.owner_name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-[8px] font-bold text-[#888] uppercase truncate">{t.assigned.owner_name}</span>
                      </div>
                    )}
                  </div>
                ))}
             </div>
          </ScrollArea>
        </div>

        {/* 2c. PAINEL DIREITO — CONVERSA DO ADMIN */}
        <div className="flex-1 flex flex-col bg-[#0f0f0f]/20">
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
               <div className="size-20 bg-white/5 rounded-full flex items-center justify-center text-slate-700">
                  <Headphones size={40} />
               </div>
               <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-tighter italic">Central de Atendimento</h3>
                  <p className="text-[10px] font-bold text-[#888] uppercase tracking-widest max-w-[280px]">
                    Selecione uma conversa para iniciar o suporte especializado.
                  </p>
               </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-5 border-b border-[#2a2a2a] flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-4">
                  <Avatar className="size-10 rounded-xl border border-[#2a2a2a]">
                    <AvatarImage src={selectedTicket.company?.logo_url} />
                    <AvatarFallback className="bg-[#1c1c1c] text-[#888]">
                      {(selectedTicket.company?.name || selectedTicket.user?.business_name || 'U')[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-black uppercase tracking-tighter italic">
                        {selectedTicket.company?.name || selectedTicket.user?.business_name || 'Sem Empresa'}
                      </h3>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black h-4 uppercase">
                        {selectedTicket.status}
                      </Badge>
                      {selectedTicket.prioridade === 'urgente' && (
                        <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[8px] font-black h-4 uppercase animate-pulse">
                          Urgente
                        </Badge>
                      )}
                    </div>
                    <p className="text-[9px] font-bold text-[#888] uppercase tracking-[0.1em] mt-0.5">
                      {selectedTicket.assunto} • {selectedTicket.user?.owner_name || 'Usuário'} • há {formatDistanceToNow(new Date(selectedTicket.criado_em), { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   {selectedTicket.assigned ? (
                     <div className="flex items-center gap-2 bg-[#1c1c1c] p-1.5 px-3 rounded-lg border border-[#2a2a2a]">
                       <span className="text-[8px] font-black uppercase text-[#888]">Atendido por:</span>
                       <Avatar className="size-5 rounded">
                         <AvatarFallback className="text-[8px] bg-[#e53e3e] text-white font-black">{selectedTicket.assigned.owner_name[0]}</AvatarFallback>
                       </Avatar>
                       <span className="text-[9px] font-bold text-white uppercase truncate max-w-[100px]">{selectedTicket.assigned.owner_name}</span>
                     </div>
                   ) : (
                     <Button 
                      onClick={() => assignTicket(selectedTicket.id)}
                      className="h-8 px-4 bg-[#e53e3e]/10 text-[#e53e3e] hover:bg-[#e53e3e]/20 text-[9px] font-black uppercase italic rounded-lg border border-[#e53e3e]/20 transition-all"
                     >
                       Assumir Atendimento
                     </Button>
                   )}
                   
                   <Button 
                    onClick={() => updateTicketStatus(selectedTicket.id, 'resolvido')}
                    className="h-8 px-4 bg-[#16a34a] hover:bg-emerald-600 text-white text-[9px] font-black uppercase italic rounded-lg shadow-lg shadow-emerald-900/20"
                   >
                     ✓ Resolver
                   </Button>
                   <Button variant="ghost" size="icon" className="text-[#888] hover:text-white">
                      <MoreVertical size={18} />
                   </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-8">
                 <div className="space-y-8 max-w-4xl mx-auto">
                    {messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={cn("flex gap-3", msg.remetente === 'admin' ? "flex-row-reverse" : "")}
                      >
                        <Avatar className="size-8 rounded-lg shrink-0 border border-[#2a2a2a]">
                           <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender?.owner_name || msg.remetente}`} />
                           <AvatarFallback className="bg-[#1c1c1c] text-[#888] text-[10px] font-black">
                              {(msg.sender?.owner_name || msg.remetente)[0]?.toUpperCase()}
                           </AvatarFallback>
                        </Avatar>
                        <div className={cn("flex flex-col space-y-1.5", msg.remetente === 'admin' ? "items-end" : "items-start")}>
                           <div className={cn(
                             "p-4 rounded-2xl max-w-[460px] text-[11px] font-medium leading-relaxed shadow-lg",
                             msg.remetente === 'admin' 
                               ? "bg-[#e53e3e] text-white rounded-tr-none" 
                               : "bg-[#1c1c1c] border border-[#2a2a2a] text-white rounded-tl-none"
                           )}>
                             {msg.tipo === 'audio' ? (
                               <div className="flex items-center gap-3 min-w-[200px]">
                                  <button className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                                     <Play size={14} fill="white" />
                                  </button>
                                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                     <div className="h-full bg-white/40 w-1/4" />
                                  </div>
                                  <span className="text-[9px] font-bold opacity-60">0:08</span>
                               </div>
                             ) : (
                               msg.conteudo
                             )}
                           </div>
                           <div className="flex items-center gap-2 px-1">
                              <span className="text-[9px] font-bold text-[#888]">{format(new Date(msg.enviado_em), 'HH:mm')}</span>
                              {msg.remetente === 'usuario' && !msg.lido && (
                                <span className="text-[8px] font-black text-[#e53e3e] uppercase">Não lido 🔴</span>
                              )}
                              {msg.remetente === 'admin' && (
                                <span className="text-[9px] text-[#888] italic font-bold">você</span>
                              )}
                           </div>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRef} />
                 </div>
              </ScrollArea>

              {/* Chat Footer */}
              <div className="p-6 border-t border-[#2a2a2a] bg-black/40 space-y-4">
                 <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <Button 
                      onClick={suggestResponse}
                      variant="outline" 
                      className="h-8 gap-2 bg-[#6366f1]/10 border-[#6366f1]/20 text-[#6366f1] hover:bg-[#6366f1]/20 rounded-lg text-[9px] font-black uppercase italic"
                    >
                      <Sparkles size={14} /> Sugerir Resposta (IA)
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-8 gap-2 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 rounded-lg text-[9px] font-black uppercase italic"
                    >
                      <BookOpen size={14} /> Respostas Rápidas
                    </Button>
                 </div>

                 <div className="max-w-4xl mx-auto flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-[#e53e3e]/30 transition-all">
                    <div className="flex items-center gap-1">
                       <button className="size-9 rounded-xl hover:bg-white/5 flex items-center justify-center text-[#888]">
                          <Paperclip size={18} />
                       </button>
                       <button className="size-9 rounded-xl hover:bg-white/5 flex items-center justify-center text-[#888]">
                          <Mic size={18} />
                       </button>
                    </div>
                    <input 
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="DIGITE SUA RESPOSTA..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] font-bold uppercase tracking-widest text-white placeholder:text-slate-600"
                    />
                    <Button 
                      onClick={() => handleSend()}
                      disabled={!messageText.trim()}
                      className="h-10 px-6 bg-[#e53e3e] hover:bg-red-600 text-white font-black uppercase italic text-[10px] rounded-xl gap-2 shadow-lg shadow-red-900/20"
                    >
                      Responder <Send size={14} />
                    </Button>
                 </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
