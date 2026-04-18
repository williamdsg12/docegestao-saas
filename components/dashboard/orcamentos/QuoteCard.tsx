"use client"

import { motion } from "framer-motion"
import { 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Trash2, 
    Eye, 
    Smartphone, 
    MoreVertical,
    Calendar,
    ArrowUpRight,
    Copy,
    Receipt
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface QuoteCardProps {
    quote: any
    onDelete: (id: string) => void
    onUpdateStatus: (id: string, status: string) => void
    onView: (quote: any) => void
    onDuplicate: (quote: any) => void
}

const statusConfig: Record<string, any> = {
    draft: { label: "Rascunho", icon: Clock, color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100" },
    sent: { label: "Enviado", icon: Smartphone, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
    approved: { label: "Aprovado", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
    rejected: { label: "Recusado", icon: XCircle, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" },
    converted: { label: "Virou Pedido", icon: ArrowUpRight, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
}

export function QuoteCard({ quote, onDelete, onUpdateStatus, onView, onDuplicate }: QuoteCardProps) {
    const config = statusConfig[quote.status] || statusConfig.draft

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
        >
            {/* Background Accent */}
            <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-10 transition-opacity duration-700", config.bg)} />

            <div className="flex items-start justify-between mb-8">
                <div className={cn("size-14 rounded-2xl flex items-center justify-center transition-all shadow-lg group-hover:scale-110 duration-500", config.bg, config.color)}>
                    <config.icon className="size-6" />
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-10 rounded-xl text-slate-400">
                                <MoreVertical className="size-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 border-slate-100 shadow-xl">
                            <DropdownMenuItem onClick={() => onDuplicate(quote)} className="rounded-xl font-bold gap-2 text-xs uppercase tracking-widest text-slate-600">
                                <Copy size={16} /> Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus(quote.id, 'approved')} className="rounded-xl font-bold gap-2 text-xs uppercase tracking-widest text-emerald-600">
                                <CheckCircle2 size={16} /> Aprovar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(quote.id)} className="rounded-xl font-bold gap-2 text-xs uppercase tracking-widest text-rose-600">
                                <Trash2 size={16} /> Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn("text-[8px] font-black uppercase border-none px-0 leading-none", config.color)}>
                            {config.label}
                        </Badge>
                        <span className="text-slate-200 text-xs">•</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            ID: #{quote.id.slice(0, 5)}
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase italic leading-tight truncate">
                        {quote.client_name || "Cliente Final"}
                    </h3>
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-pink-500" />
                        <span className="text-[9px] font-bold uppercase">{new Date(quote.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-amber-500" />
                        <span className="text-[9px] font-bold uppercase">Expira {new Date(quote.valid_until).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-between mb-8 group-hover:bg-slate-900 group-hover:border-slate-800 transition-all duration-500 group-hover:scale-[1.02]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic group-hover:text-pink-500 transition-colors">Venda</span>
                <span className="text-2xl font-black text-slate-900 italic group-hover:text-white transition-colors">
                    R$ {Number(quote.total_final).toFixed(2)}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <Button 
                    onClick={() => onView(quote)}
                    className="flex-1 h-12 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 hover:border-pink-500 hover:text-pink-500 font-black uppercase text-[10px] tracking-widest shadow-sm transition-all gap-2"
                >
                    <Eye size={16} /> Ver Detalhes
                </Button>
                
                {quote.status !== 'approved' && quote.status !== 'converted' && (
                    <Button 
                        onClick={() => onUpdateStatus(quote.id, 'approved')}
                        className="h-12 w-12 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                    >
                        <Check size={20} />
                    </Button>
                )}
            </div>
        </motion.div>
    )
}

function Check({ size, className }: { size: number, className?: string }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}
