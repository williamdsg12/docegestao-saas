"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { 
    Bell, 
    MessageSquare, 
    UserPlus, 
    CreditCard,
    AlertCircle,
    ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Notification {
    id: string
    title: string
    description: string
    time: string
    type: 'message' | 'user' | 'payment' | 'alert'
    unread: boolean
}

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            title: 'Novo pedido recebido',
            description: 'A Confeitaria "Doces da Ana" recebeu um novo pedido premium.',
            time: 'Agora',
            type: 'payment',
            unread: true
        },
        {
            id: '2',
            title: 'Novo usuário registrado',
            description: 'William Souza acabou de criar uma conta na plataforma.',
            time: '2 min atrás',
            type: 'user',
            unread: true
        },
        {
            id: '3',
            title: 'Suporte: Novo Chamado',
            description: 'A empresa "Bolo Lindo" abriu um chamado urgente.',
            time: '15 min atrás',
            type: 'alert',
            unread: false
        }
    ])

    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const unreadCount = notifications.filter(n => n.unread).length

    const getIcon = (type: string) => {
        switch (type) {
            case 'message': return <MessageSquare className="size-4" />
            case 'user': return <UserPlus className="size-4" />
            case 'payment': return <CreditCard className="size-4" />
            case 'alert': return <AlertCircle className="size-4" />
            default: return <Bell className="size-4" />
        }
    }

    const getIconColor = (type: string) => {
        switch (type) {
            case 'message': return 'bg-blue-50 text-blue-500'
            case 'user': return 'bg-emerald-50 text-emerald-500'
            case 'payment': return 'bg-amber-50 text-amber-500'
            case 'alert': return 'bg-rose-50 text-rose-500'
            default: return 'bg-slate-50 text-slate-500'
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative size-12 rounded-2xl flex items-center justify-center transition-all duration-300 border border-slate-100 shadow-sm",
                    isOpen ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                )}
            >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 size-2.5 bg-rose-500 border-2 border-white rounded-full" />
                )}
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-80 md:w-96 bg-white border border-slate-100 rounded-[32px] shadow-2xl shadow-slate-200/50 z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">Notificações</h4>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">{unreadCount} Novas</span>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                notifications.map((n) => (
                                    <Link 
                                        key={n.id}
                                        href="#"
                                        className={cn(
                                            "flex items-start gap-4 px-8 py-6 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0",
                                            n.unread && "bg-blue-50/20"
                                        )}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner", getIconColor(n.type))}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-black text-slate-900 truncate tracking-tight">{n.title}</span>
                                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2">{n.description}</p>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{n.time}</span>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                                    <Bell className="size-12 mb-3 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Nenhuma notificação</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <Link 
                            href="/admin/notifications"
                            className="block px-8 py-5 text-center bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Ver Todas as Notificações
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
