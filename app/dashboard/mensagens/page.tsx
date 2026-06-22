"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  Search, Send, Plus, Headphones, RefreshCcw, 
  Mic, Paperclip, X, Clock, AlertCircle, CheckCircle2,
  ChevronLeft, Play, Pause, Square
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useSupportChat, SupportTicket } from "@/hooks/useSupportChat"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function MensagensPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const { 
    tickets, messages, loading, sendMessage, 
    startTicket, markMessagesAsRead 
  } = useSupportChat(selectedTicketId || undefined)
  
  const [activeTab, setActiveTab] = useState<'Suporte' | 'Todos'>('Suporte')
  const [searchTerm, setSearchTerm] = useState("")
  const [messageText, setMessageText] = useState("")
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // New Ticket State
  const [newSubject, setNewSubject] = useState("")
  const [newCategory, setNewCategory] = useState("cardapio")
  const [newPriority, setNewPriority] = useState("normal")
  const [initialMessage, setInitialMessage] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  // Audio State
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.assunto.toLowerCase().includes(searchTerm.toLowerCase())
    if (activeTab === 'Todos') return matchesSearch
    return matchesSearch
  })

  const selectedTicket = tickets.find(t => t.id === selectedTicketId)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (selectedTicketId) {
      markMessagesAsRead(selectedTicketId, 'usuario')
    }
  }, [selectedTicketId, messages.length, markMessagesAsRead])

  const handleSend = async () => {
    if (!messageText.trim() || !selectedTicketId) return
    await sendMessage(messageText, 'usuario')
    setMessageText("")
  }

  const handleCreateTicket = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    if (!newSubject.trim() || !initialMessage.trim()) {
      setError("Preencha todos os campos obrigatórios")
      return
    }
    
    setCreating(true)
    setError("")
    
    try {
      const id = await startTicket(newSubject, newCategory, newPriority, initialMessage)
      if (id) {
        setSelectedTicketId(id)
        setIsNewTicketModalOpen(false)
        setNewSubject("")
        setInitialMessage("")
        setNewCategory("cardapio")
        setNewPriority("normal")
        toast.success("Atendimento enviado com sucesso!")
      } else {
        throw new Error("Falha ao criar ticket")
      }
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.message || "Erro ao enviar atendimento"
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setCreating(false)
    }
  }

  // Audio Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      setMediaRecorder(recorder)
      setAudioChunks([])

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks(prev => [...prev, e.data])
        }
      }

      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      toast.error("Erro ao acessar microfone")
    }
  }

  const stopAndUploadAudio = async () => {
    if (!mediaRecorder || !selectedTicketId) return
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      const fileName = `support-audios/audio-${Date.now()}.webm`
      
      const { data, error } = await supabase.storage
        .from('suporte-audios')
        .upload(fileName, audioBlob)
      
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage
          .from('suporte-audios')
          .getPublicUrl(fileName)
        
        await sendMessage("Áudio enviado", 'usuario', publicUrl)
      }
      setIsRecording(false)
    }
    
    mediaRecorder.stop()
    mediaRecorder.stream.getTracks().forEach(track => track.stop())
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
      
      {/* 👤 COLUNA ESQUERDA — LISTA DE ATENDIMENTOS (280px fixa) */}
      <div className="w-[280px] border-r border-slate-100 flex flex-col bg-[#fafafa]/50">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black uppercase tracking-tighter">
                Suporte <span className="text-[#e53e3e] italic">Interno</span>
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                Central de Ajuda Doce Gestão
              </p>
            </div>
            <button 
              onClick={() => setIsNewTicketModalOpen(true)}
              className="size-8 bg-[#e53e3e] text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md shadow-red-100"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-300 group-focus-within:text-[#e53e3e] transition-colors" />
            <Input 
              placeholder="BUSCAR ATENDIMENTOS..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-slate-100 rounded-lg pl-9 h-10 text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300 focus-visible:ring-red-100"
            />
          </div>

          <div className="flex border-b border-slate-100">
            {['Suporte', 'Todos'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all relative",
                  activeTab === tab ? "text-[#e53e3e]" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e53e3e]" />
                )}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 px-3 pb-4">
          <div className="space-y-1">
            {filteredTickets.length === 0 ? (
                <div className="py-20 text-center space-y-3 opacity-30">
                    <Headphones size={32} className="mx-auto text-slate-400" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Nenhum Atendimento</p>
                </div>
            ) : filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className={cn(
                  "p-4 rounded-xl cursor-pointer transition-all border-l-[3px]",
                  selectedTicketId === ticket.id ? "bg-white border-[#e53e3e] shadow-sm" : "border-transparent hover:bg-slate-50"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-[11px] font-black uppercase tracking-tight text-slate-800 truncate flex-1">
                    {ticket.assunto}
                  </h4>
                  <span className="text-[9px] font-bold text-slate-400">
                    {format(new Date(ticket.atualizado_em), 'HH:mm')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mb-2 font-medium">
                  {ticket.last_message || 'Inicie a conversa...'}
                </p>
                <div className="flex gap-1.5">
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded">Suporte</span>
                  <span className={cn(
                    "px-1.5 py-0.5 text-[8px] font-black uppercase rounded",
                    ticket.status === 'aberto' ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                  )}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* 👤 COLUNA DIREITA — CONVERSA */}
      <div className="flex-1 flex flex-col bg-white">
        {!selectedTicket ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="size-24 bg-[#e53e3e]/5 rounded-full flex items-center justify-center text-[#e53e3e]">
              <Headphones size={48} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase tracking-tighter">Suporte Especializado</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[280px] leading-relaxed">
                Inicie uma conversa com nossa equipe técnica para resolver qualquer dúvida ou problema.
              </p>
            </div>
            <Button 
              onClick={() => setIsNewTicketModalOpen(true)}
              className="bg-[#e53e3e] hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-lg shadow-lg shadow-red-100 gap-2"
            >
              <Headphones size={16} /> Novo Atendimento
            </Button>
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shadow-sm z-10">
              <div className="flex items-center gap-4">
                <Avatar className="size-10 rounded-xl border border-slate-100">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Support`} />
                  <AvatarFallback>S</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-tighter">
                      {selectedTicket.assigned ? `Suporte • ${selectedTicket.assigned.owner_name}` : "Equipe DoceGestão"}
                    </h3>
                    <span className={cn(
                      "px-2 py-0.5 text-[8px] font-black rounded uppercase",
                      selectedTicket.status === 'aberto' ? "bg-emerald-500 text-white" : (selectedTicket.status === 'em_atendimento' ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-500")
                    )}>
                      {selectedTicket.status.toUpperCase()}
                    </span>
                    {selectedTicket.prioridade === 'urgente' && (
                      <span className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded uppercase italic animate-pulse">
                        Urgente
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Assunto: {selectedTicket.assunto} • Iniciado há {formatDistanceToNow(new Date(selectedTicket.criado_em), { locale: ptBR, addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6 bg-slate-50/30">
              <div className="space-y-6 max-w-3xl mx-auto">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={cn("flex gap-3", msg.remetente === 'usuario' ? "flex-row-reverse" : "")}
                  >
                    <Avatar className="size-8 rounded-lg shrink-0 border border-slate-100">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender?.owner_name || msg.remetente}`} />
                      <AvatarFallback className={msg.remetente === 'usuario' ? 'bg-slate-100' : 'bg-rose-100 text-rose-600 font-black'}>
                        {(msg.sender?.owner_name || msg.remetente)[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={cn("flex flex-col space-y-1", msg.remetente === 'usuario' ? "items-end" : "items-start")}>
                      <div className={cn(
                        "p-3.5 rounded-2xl max-w-[400px] text-[11px] font-medium leading-relaxed shadow-sm",
                        msg.remetente === 'usuario' 
                          ? "bg-[#fce8e8] text-slate-800 rounded-tr-none" 
                          : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                      )}>
                        {msg.tipo === 'audio' ? (
                          <div className="flex items-center gap-3 bg-white/50 p-2 rounded-xl min-w-[180px]">
                            <button className="size-8 rounded-full bg-[#e53e3e] flex items-center justify-center text-white">
                              <Play size={14} fill="white" />
                            </button>
                            <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-[#e53e3e] w-1/3" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 italic">0:12</span>
                          </div>
                        ) : (
                          msg.conteudo
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 px-1 mt-1">
                        <span className="text-[9px] font-bold text-slate-400">{format(new Date(msg.enviado_em), 'HH:mm')}</span>
                        {msg.remetente === 'admin' && (
                          <span className="text-[9px] font-black italic text-rose-500">{msg.sender?.owner_name || 'Suporte'}</span>
                        )}
                        {msg.remetente === 'usuario' && msg.lido && (
                          <span className="text-[10px] text-blue-500 font-bold">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-slate-100 bg-white">
               <div className="max-w-4xl mx-auto flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <div className="flex items-center">
                    <button className="size-9 rounded-xl hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
                      <Paperclip size={18} />
                    </button>
                    <button 
                      onMouseDown={startRecording}
                      onMouseUp={stopAndUploadAudio}
                      className={cn(
                        "size-9 rounded-xl flex items-center justify-center transition-all",
                        isRecording ? "bg-rose-500 text-white animate-pulse" : "hover:bg-slate-200 text-slate-400"
                      )}
                    >
                      <Mic size={18} />
                    </button>
                  </div>
                  <input 
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isRecording ? "Gravando áudio..." : "Digite sua mensagem..."}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] font-bold uppercase tracking-widest text-slate-800"
                    disabled={isRecording}
                  />
                  <Button 
                    onClick={handleSend}
                    disabled={!messageText.trim() && !isRecording}
                    className="h-10 px-5 bg-[#e53e3e] hover:bg-red-600 text-white font-black uppercase italic text-[10px] rounded-xl gap-2 shadow-md shadow-red-100"
                  >
                    Enviar <Send size={14} />
                  </Button>
               </div>
            </div>
          </>
        )}
      </div>

      {/* 🔧 MODAL NOVO ATENDIMENTO CORRIGIDO */}
      <AnimatePresence>
        {isNewTicketModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl w-full max-w-[480px] shadow-[0_8_32px_rgba(0,0,0,0.15)] overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                 <h2 className="text-[15px] font-bold uppercase text-[#111] tracking-tight">Novo Atendimento</h2>
                 <button onClick={() => setIsNewTicketModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="p-6 space-y-5">
                 {/* Assunto */}
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-[#e53e3e] tracking-wider">Assunto *</label>
                    <input 
                      placeholder="EX: MEU CARDAPIO..." 
                      className="w-full h-11 border border-slate-200 rounded-lg px-4 text-xs font-bold uppercase focus:border-[#e53e3e] outline-none transition-all"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                    />
                 </div>

                 <div className="flex gap-5">
                    {/* Categoria */}
                    <div className="flex-1 space-y-1.5">
                       <label className="text-[11px] font-bold uppercase text-[#e53e3e] tracking-wider">Categoria *</label>
                       <div className="relative">
                         <select 
                           value={newCategory}
                           onChange={(e) => setNewCategory(e.target.value)}
                           className="w-full h-11 border border-slate-200 rounded-lg px-4 text-[10px] font-black uppercase appearance-none focus:border-[#e53e3e] outline-none"
                         >
                            <option value="cardapio">Cardápio</option>
                            <option value="pedidos">Pedidos</option>
                            <option value="pagamento">Pagamento</option>
                            <option value="tecnico">Técnico</option>
                            <option value="financeiro">Financeiro</option>
                            <option value="outro">Outro</option>
                         </select>
                         <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 size-4 -rotate-90 text-slate-400 pointer-events-none" />
                       </div>
                    </div>
                    {/* Prioridade */}
                    <div className="flex-1 space-y-1.5">
                       <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Prioridade</label>
                       <div className="flex gap-1.5">
                          {['normal', 'alta', 'urgente'].map((p) => (
                             <button
                               key={p}
                               type="button"
                               onClick={() => setNewPriority(p)}
                               className={cn(
                                 "flex-1 h-11 rounded-full text-[8px] font-black uppercase transition-all border",
                                 newPriority === p 
                                  ? "bg-[#e53e3e] border-[#e53e3e] text-white" 
                                  : "bg-white border-slate-100 text-slate-400 hover:border-red-200"
                               )}
                             >
                               {p}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Mensagem Inicial */}
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-[#e53e3e] tracking-wider">Mensagem Inicial *</label>
                    <textarea 
                      placeholder="DESCREVA SEU PROBLEMA EM DETALHES..." 
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      className="w-full h-32 border border-slate-200 rounded-lg p-4 text-[11px] font-bold uppercase focus:border-[#e53e3e] outline-none transition-all resize-none"
                    />
                 </div>

                 {error && (
                   <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[10px] font-bold uppercase italic">
                     ⚠️ {error}
                   </div>
                 )}
              </div>

              <div className="p-5 border-t border-slate-50 flex items-center justify-between bg-[#fafafa]/50">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase px-4"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateTicket}
                  disabled={creating || !newSubject.trim() || !initialMessage.trim()}
                  className={cn(
                    "bg-[#e53e3e] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-100 transition-all",
                    creating ? "opacity-50 cursor-not-allowed" : "hover:bg-red-600 active:scale-95"
                  )}
                >
                  {creating ? "Enviando..." : "Enviar ✓"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
