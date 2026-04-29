"use client"

import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, ExternalLink, ShoppingBag, DollarSign, UserPlus, MessageCircle } from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  function NotificationIcon({ type }: { type: string }) {
    switch (type) {
      case "pedido":
        return <div className="size-8 rounded-xl bg-[var(--secondary)]/10 flex items-center justify-center"><ShoppingBag className="size-4 text-[var(--secondary)]" /></div>
      case "estoque":
        return <div className="size-8 rounded-xl bg-amber-500/10 flex items-center justify-center"><AlertTriangle className="size-4 text-amber-500" /></div>
      case "pagamento":
        return <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center"><DollarSign className="size-4 text-emerald-500" /></div>
      case "cliente":
        return <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center"><UserPlus className="size-4 text-blue-500" /></div>
      case "mensagem":
        return <div className="size-8 rounded-xl bg-purple-500/10 flex items-center justify-center"><MessageCircle className="size-4 text-purple-500" /></div>
      default:
        return <div className="size-8 rounded-xl bg-[var(--bg-app)] flex items-center justify-center"><Bell className="size-4 text-[var(--text-muted)]" /></div>
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-10 rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--accent-light)] transition-all shadow-sm group"
        >
          <Bell className="size-5 group-hover:rotate-12 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--danger)] text-[10px] font-black text-white ring-2 ring-[var(--bg-card)]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] p-0 border border-[var(--border)] shadow-2xl rounded-3xl overflow-hidden bg-[var(--bg-card)]/95 backdrop-blur-xl">
        <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-between">
          <div>
            <h4 className="font-black text-[12px] uppercase italic tracking-widest text-[var(--text-primary)]">Notificações</h4>
            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none mt-1">Inteligência de Vendas</p>
          </div>
          {unreadCount > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-[9px] font-black uppercase tracking-widest hover:bg-[var(--accent-light)] text-[var(--text-muted)] h-7 px-3 rounded-full"
            >
              Marcar lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {notifications.length > 0 ? (
            <div className="divide-y divide-[var(--border)]">
              {notifications.map((n) => (
                <div 
                    key={n.id} 
                    className={cn(
                        "p-5 flex gap-4 hover:bg-[var(--bg-app)] transition-all cursor-pointer group relative",
                        !n.read && "bg-[var(--accent-light)]/30"
                    )}
                    onClick={() => markAsRead(n.id)}
                >
                  <div className="shrink-0">
                    <NotificationIcon type={n.type} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className={cn("text-[11px] leading-tight uppercase tracking-tight", n.read ? "text-[var(--text-secondary)] font-bold" : "font-black text-[var(--text-primary)]")}>
                        {n.title}
                      </p>
                      <p className="text-[8px] text-[var(--text-muted)] font-black uppercase whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {n.message}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-[var(--secondary)] shadow-[0_0_10px_var(--secondary)]" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-[var(--text-muted)] space-y-4">
              <div className="size-16 rounded-3xl bg-[var(--bg-app)] flex items-center justify-center border border-[var(--border)]">
                <Bell className="size-8 text-[var(--text-muted)]/30" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest italic">Central de Alertas</p>
                <p className="text-[9px] font-bold uppercase opacity-50 mt-1">Tudo limpo por aqui!</p>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 bg-[var(--bg-app)]/50 border-t border-[var(--border)]">
          <Link href="/dashboard/notificacoes">
            <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest italic group justify-center gap-2 h-10 rounded-xl hover:bg-[var(--accent-light)] text-[var(--text-primary)]">
              Ver todas notificações
              <ExternalLink className="size-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

