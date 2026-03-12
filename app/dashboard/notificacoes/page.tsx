"use client"

import { useState, useEffect } from "react"
import { useNotifications, Notification } from "@/hooks/useNotifications"
import { motion, AnimatePresence } from "framer-motion"
import {
    CheckCircle,
    AlertTriangle,
    Info,
    Trash2,
    Check,
    Filter,
    MoreVertical,
    Calendar,
    BellOff,
    Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
    const {
        notifications,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        fetchAll
    } = useNotifications()

    const [filter, setFilter] = useState<'all' | 'unread' | 'info' | 'success' | 'warning'>('all')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchAll()
    }, [])

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter =
            filter === 'all' ? true :
                filter === 'unread' ? !n.read :
                    n.type === filter

        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase())

        return matchesFilter && matchesSearch
    })

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="size-5 text-emerald-500" />
            case 'warning': return <AlertTriangle className="size-5 text-amber-500" />
            case 'error': return <AlertTriangle className="size-5 text-rose-500" />
            default: return <Info className="size-5 text-blue-500" />
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-lg" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 w-full bg-slate-100 animate-pulse rounded-2xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">
                        Minhas <span className="text-primary">Notificações</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 italic flex items-center gap-2">
                        <Calendar className="size-3" />
                        Histórico completo de alertas e atualizações
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={markAllAsRead}
                        className="rounded-full px-6 bg-slate-900 text-white hover:bg-primary transition-all text-[10px] font-black uppercase tracking-widest italic h-11"
                    >
                        <Check className="size-4 mr-2" />
                        Lidas (Tudo)
                    </Button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Pesquisar notificações..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-14 rounded-2xl border-none shadow-sm bg-white/50 backdrop-blur-md focus-visible:ring-primary/20 transition-all font-medium text-slate-600"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {[
                        { id: 'all', label: 'Todas' },
                        { id: 'unread', label: 'Não Lidas' },
                        { id: 'success', label: 'Sucesso' },
                        { id: 'warning', label: 'Alertas' },
                        { id: 'info', label: 'Info' },
                    ].map((btn) => (
                        <Button
                            key={btn.id}
                            variant={filter === btn.id ? 'default' : 'ghost'}
                            onClick={() => setFilter(btn.id as any)}
                            className={cn(
                                "rounded-full h-11 px-6 text-[10px] font-black uppercase tracking-widest italic transition-all",
                                filter === btn.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-slate-400 hover:bg-white/50 hover:text-slate-600"
                            )}
                        >
                            {btn.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((n, index) => (
                            <motion.div
                                key={n.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className={cn(
                                    "border-none shadow-xl shadow-slate-200/40 rounded-[32px] overflow-hidden transition-all group",
                                    !n.read ? "bg-white ring-1 ring-primary/10" : "bg-white/60 grayscale-[0.5]"
                                )}>
                                    <CardContent className="p-0">
                                        <div className="flex items-center gap-6 p-6">
                                            <div className={cn(
                                                "size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500",
                                                !n.read ? "bg-slate-50" : "bg-slate-100/50"
                                            )}>
                                                {getIcon(n.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className={cn(
                                                        "text-sm uppercase italic tracking-tighter truncate",
                                                        !n.read ? "font-black text-slate-900" : "font-black text-slate-500"
                                                    )}>
                                                        {n.title}
                                                    </h4>
                                                    {!n.read && (
                                                        <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest px-2 py-0">Novo</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium line-clamp-1 group-hover:line-clamp-none transition-all">
                                                    {n.message}
                                                </p>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                                                        {format(new Date(n.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!n.read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => markAsRead(n.id)}
                                                        className="size-10 rounded-full hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 transition-colors"
                                                        title="Marcar como lida"
                                                    >
                                                        <CheckCircle className="size-5" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteNotification(n.id)}
                                                    className="size-10 rounded-full hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="size-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-[400px] flex flex-col items-center justify-center text-center space-y-6"
                        >
                            <div className="size-24 rounded-[40px] bg-white shadow-xl flex items-center justify-center border border-slate-100">
                                <BellOff className="size-10 text-slate-200" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Nenhuma notificação encontrada</h3>
                                <p className="text-slate-400 font-medium text-sm max-w-xs mt-2">
                                    Parece que não temos nada por aqui no momento. Fique atento para novas atualizações!
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => { setFilter('all'); setSearchQuery(''); }}
                                className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest italic"
                            >
                                Limpar filtros
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
