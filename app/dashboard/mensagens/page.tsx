"use client"

import { useState } from "react"
import { Search, Send, Plus, MoreVertical, Phone, Video, Info, User, MessageCircle, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const chats = [
  { id: 1, name: "Andressa Marcucci", lastMessage: "Olá, gostaria de encomendar um bolo para sábado.", time: "10:30", unread: 2, online: true, type: "cliente" },
  { id: 2, name: "Suporte Doce Gestão", lastMessage: "Sua conta Pro foi ativada com sucesso!", time: "Ontem", unread: 0, online: true, type: "suporte" },
  { id: 3, name: "Equipe de Produção", lastMessage: "João: O estoque de chocolate acabou.", time: "09:15", unread: 5, online: false, type: "equipe" },
  { id: 4, name: "Maria Silva", lastMessage: "Obrigada pelo atendimento!", time: "Segunda", unread: 0, online: false, type: "cliente" },
]

export default function MensagensPage() {
  const [selectedChat, setSelectedChat] = useState(chats[0])
  const [message, setMessage] = useState("")

  return (
    <div className="flex h-[calc(100vh-160px)] bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] overflow-hidden shadow-2xl">
      {/* Sidebar de Chats */}
      <div className="w-full md:w-80 lg:w-96 border-r border-[var(--border)] flex flex-col bg-[var(--bg-app)]/50">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-[var(--text-primary)]">Mensagens</h2>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Central de Atendimento</p>
            </div>
            <Button size="icon" className="rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-lg">
              <Plus size={20} />
            </Button>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)] group-focus-within:text-[var(--secondary)] transition-colors" />
            <Input 
              placeholder="BUSCAR CONVERSAS..." 
              className="bg-[var(--bg-card)] border-[var(--border)] rounded-2xl pl-11 h-12 text-[10px] font-black uppercase tracking-widest placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--secondary)]/20"
            />
          </div>

          <div className="flex gap-2">
            {['Todos', 'Clientes', 'Suporte', 'Equipe'].map((tab) => (
              <button
                key={tab}
                className={cn(
                  "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                  tab === 'Todos' ? "bg-[var(--secondary)] text-white shadow-md" : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--accent-light)]"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 pb-6">
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={cn(
                  "p-4 rounded-3xl cursor-pointer transition-all flex gap-4 items-center group relative",
                  selectedChat.id === chat.id ? "bg-[var(--bg-card)] border border-[var(--border)] shadow-md" : "hover:bg-[var(--bg-card)]/50"
                )}
              >
                <div className="relative">
                  <Avatar className="size-12 rounded-2xl border-2 border-[var(--bg-app)]">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.name}`} />
                    <AvatarFallback className="bg-[var(--accent-light)] text-[var(--primary)] font-black uppercase">{chat.name[0]}</AvatarFallback>
                  </Avatar>
                  {chat.online && (
                    <div className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 rounded-full border-[3px] border-[var(--bg-app)]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[11px] font-black uppercase tracking-tight text-[var(--text-primary)] truncate">{chat.name}</h4>
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">{chat.time}</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] truncate leading-tight font-medium">
                    {chat.lastMessage}
                  </p>
                </div>

                {chat.unread > 0 && (
                  <div className="size-5 rounded-full bg-[var(--secondary)] text-white text-[8px] font-black flex items-center justify-center shadow-md">
                    {chat.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Janela de Chat */}
      <div className="flex-1 flex flex-col bg-[var(--bg-card)]">
        {/* Header do Chat */}
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-card)]/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Avatar className="size-12 rounded-2xl border-2 border-[var(--bg-app)] shadow-sm">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat.name}`} />
              <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-black uppercase italic tracking-tighter text-[var(--text-primary)]">{selectedChat.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={cn("size-1.5 rounded-full", selectedChat.online ? "bg-emerald-500 animate-pulse" : "bg-[var(--text-muted)]")} />
                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                  {selectedChat.online ? "Online Agora" : "Visto por último às 09:00"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-2xl text-[var(--text-muted)] hover:bg-[var(--accent-light)] hover:text-[var(--primary)]">
              <Phone size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-2xl text-[var(--text-muted)] hover:bg-[var(--accent-light)] hover:text-[var(--primary)]">
              <Video size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-2xl text-[var(--text-muted)] hover:bg-[var(--accent-light)] hover:text-[var(--primary)]">
              <Info size={18} />
            </Button>
            <div className="h-6 w-px bg-[var(--border)] mx-2" />
            <Button variant="ghost" size="icon" className="rounded-2xl text-[var(--text-muted)] hover:bg-[var(--accent-light)] hover:text-[var(--primary)]">
              <MoreVertical size={18} />
            </Button>
          </div>
        </div>

        {/* Mensagens */}
        <ScrollArea className="flex-1 p-8 bg-[var(--bg-app)]/30">
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex justify-center">
              <span className="px-4 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-full text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] shadow-sm">
                Hoje, 24 de Outubro
              </span>
            </div>

            {/* Balão Recebido */}
            <div className="flex gap-4 max-w-[80%]">
              <Avatar className="size-8 rounded-xl shrink-0 mt-1">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat.name}`} />
              </Avatar>
              <div className="space-y-1.5">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-3xl rounded-tl-none shadow-premium">
                  <p className="text-[11px] leading-relaxed text-[var(--text-primary)] font-medium">
                    Olá! Estava vendo os produtos no seu catálogo e me interessei pelo Bolo de Chocolate Belga.
                  </p>
                </div>
                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase px-1">10:30</span>
              </div>
            </div>

            {/* Balão Enviado */}
            <div className="flex gap-4 max-w-[80%] ml-auto flex-row-reverse">
              <div className="space-y-1.5 items-end flex flex-col">
                <div className="bg-[var(--primary)] p-4 rounded-3xl rounded-tr-none shadow-lg shadow-[var(--primary)]/20">
                  <p className="text-[11px] leading-relaxed text-white font-medium">
                    Olá Andressa! Que escolha maravilhosa. Esse bolo é o nosso campeão de vendas! 🎂✨
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-[8px] font-black text-[var(--text-muted)] uppercase">10:32</span>
                  <div className="flex">
                    <span className="text-emerald-500 text-[10px]">✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 max-w-[80%]">
              <Avatar className="size-8 rounded-xl shrink-0 mt-1">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat.name}`} />
              </Avatar>
              <div className="space-y-1.5">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-3xl rounded-tl-none shadow-premium">
                  <p className="text-[11px] leading-relaxed text-[var(--text-primary)] font-medium">
                    Você teria disponibilidade para entregar no sábado às 15h? É para um aniversário surpresa.
                  </p>
                </div>
                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase px-1">10:33</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Input de Mensagem */}
        <div className="p-6 bg-[var(--bg-card)]/50 border-t border-[var(--border)] backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex items-center gap-4 bg-[var(--bg-app)] border border-[var(--border)] p-2 rounded-[24px] focus-within:ring-2 focus-within:ring-[var(--secondary)]/20 transition-all shadow-premium">
            <Button variant="ghost" size="icon" className="rounded-full text-[var(--text-muted)] hover:bg-[var(--accent-light)] hover:text-[var(--primary)] size-10">
              <Plus size={20} />
            </Button>
            <input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="DIGITE SUA MENSAGEM AQUI..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] font-bold uppercase tracking-widest text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
            <Button 
              className={cn(
                "rounded-2xl h-10 px-6 transition-all font-black uppercase tracking-widest text-[10px] italic shadow-lg",
                message.length > 0 ? "bg-[var(--secondary)] hover:bg-[var(--accent)] text-white scale-105" : "bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed"
              )}
            >
              Enviar
              <Send className="ml-2 size-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
