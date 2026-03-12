"use client"

import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, ExternalLink, ShoppingBag, DollarSign, UserPlus } from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
        return <ShoppingBag className="size-4 text-[var(--primary)]" />
      case "estoque":
        return <AlertTriangle className="size-4 text-amber-500" />
      case "pagamento":
        return <DollarSign className="size-4 text-emerald-500" />
      case "cliente":
        return <UserPlus className="size-4 text-blue-500" />
      default:
        return <Bell className="size-4" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-10 rounded-full border border-white/40 bg-white/20 backdrop-blur-md text-pink-700 hover:text-pink-900 hover:bg-white/40 transition-all shadow-sm group"
        >
          <Bell className="size-6 group-hover:rotate-12 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-pink-100">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 border-none shadow-2xl rounded-3xl overflow-hidden glass-card">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h4 className="font-black text-sm uppercase italic tracking-tighter">Notificações</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Últimas atualizações</p>
          </div>
          {unreadCount > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-[9px] font-black uppercase tracking-widest hover:bg-white/10 text-slate-400"
            >
              Lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div 
                    key={n.id} 
                    className={cn(
                        "p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer group",
                        !n.read && "bg-slate-50/50"
                    )}
                    onClick={() => markAsRead(n.id)}
                >
                  <div className="mt-1 shrink-0">
                    <NotificationIcon type={n.type} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn("text-xs leading-tight", n.read ? "text-slate-600" : "font-black text-slate-900")}>
                      {n.title}
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                        {n.message}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="size-2 rounded-full bg-primary mt-1 shadow-sm" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-slate-400 space-y-3">
              <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                <Bell className="size-8 text-slate-200" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest italic">Tudo limpo por aqui!</p>
            </div>
          )}
        </ScrollArea>

        <div className="p-3 bg-slate-50 border-t border-slate-100">
          <Link href="/dashboard/notificacoes">
            <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest italic group justify-center gap-2">
              Ver todas notificações
              <ExternalLink className="size-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
