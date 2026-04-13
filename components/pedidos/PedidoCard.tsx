"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Clock,
    User,
    MapPin,
    Check,
    X,
    Bike,
    Calendar,
    Timer as TimerIcon,
    MessageCircle,
    DollarSign,
    Package,
    Scan,
    MoreVertical,
    Printer,
    ChevronRight,
    ChevronLeft,
    ExternalLink,
    ChevronDown,
    Globe,
    CreditCard,
    Store,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePedidoStore } from "@/store/pedidoStore"
import { formatCurrency, formatPhone, formatAddress, getStatusConfig } from "@/lib/formatters"

interface PedidoCardProps {
    pedido: any
    onAccept: (id: string) => Promise<void>
    onReject: (id: string) => Promise<void>
    onNextStep: (id: string, currentStatus: string) => Promise<void>
    onUpdatePaymentStatus: (id: string, status: string) => Promise<void>
}

export function StatusBadge({ status }: { status: string }) {
    const item = getStatusConfig(status)
    return (
        <Badge 
            variant={item.variant as any} 
            className={cn("rounded-lg px-2 py-0.5 font-black uppercase text-[9px] tracking-wider transition-all duration-300", item.className)}
        >
            {item.label}
        </Badge>
    )
}

export function PedidoCard({ pedido, onAccept, onReject, onNextStep, onUpdatePaymentStatus }: PedidoCardProps) {
    const setSelecionado = usePedidoStore(s => s.selecionarPedido)
    const [timeElapsed, setTimeElapsed] = useState({ min: 0, sec: 0 })
    const [loading, setLoading] = useState<string | null>(null)

    useEffect(() => {
        const updateTimer = () => {
            const start = new Date(pedido.created_at).getTime()
            const now = Date.now()
            const diff = Math.max(0, now - start)
            
            const totalSeconds = Math.floor(diff / 1000)
            const min = Math.floor(totalSeconds / 60)
            const sec = totalSeconds % 60
            
            setTimeElapsed({ min, sec })
        }
        
        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
    }, [pedido.created_at])

    const isNew = pedido.status === "novo" || pedido.status === "pending"
    const isDelivery = pedido.delivery_type === "entrega"

    // Helper para botões com loading
    const handleAction = async (action: string, fn: () => Promise<void>) => {
        setLoading(action)
        try {
            await fn()
        } finally {
            setLoading(null)
        }
    }

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-300 hover:shadow-xl border-slate-100 bg-white cursor-pointer",
                isNew ? "ring-2 ring-[#FBA41A] ring-offset-2 animate-in fade-in zoom-in duration-500" : ""
            )}
            onClick={() => setSelecionado(pedido)}
        >
            <div className="flex flex-col lg:flex-row items-stretch min-h-[100px]">

                {/* 1. DATA/TIME/ID */}
                <div className="w-full lg:w-[220px] p-4 flex flex-col justify-center border-r border-slate-50 bg-[#F8FAFC]/50">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xs font-black italic tracking-tighter uppercase", isNew ? "text-[#FBA41A]" : "text-[#2ECC71]")}>
                            #{pedido.id.slice(0, 4).toUpperCase()} {isDelivery ? 'Delivery' : 'Retirada'}
                        </span>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1.5 font-black text-[11px] mb-1 transition-colors",
                        timeElapsed.min >= 30 ? "text-rose-600 animate-pulse bg-rose-50 px-2 py-0.5 rounded-md w-fit" : "text-rose-500"
                    )}>
                        <TimerIcon className="size-3.5" />
                        <span>{String(timeElapsed.min).padStart(2, '0')}:{String(timeElapsed.sec).padStart(2, '0')} min</span>
                        {timeElapsed.min >= 30 && <span className="text-[8px] uppercase ring-1 ring-rose-200 rounded-px px-1 ml-1 font-bold">Atrasado</span>}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px]">
                        <Calendar className="size-3.5" />
                        {format(new Date(pedido.created_at), "dd/MM/yy HH:mm")}
                    </div>
                </div>

                {/* 2. ESTADO */}
                <div className="w-full lg:w-[160px] p-4 flex flex-col justify-center gap-2 border-r border-slate-50">
                    <StatusBadge status={pedido.status} />
                    <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[8px] font-black uppercase rounded-md px-1.5">{pedido.origin || 'WEB'}</Badge>
                        <span className="text-[10px] font-bold text-slate-300">BR-{pedido.id.slice(0, 6).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold italic">
                        {pedido.origin === 'IFOOD' ? (
                            <span className="text-red-600 font-black">iFood</span>
                        ) : (
                            <>
                                <Store className="size-3" />
                                <span>{pedido.origin || 'PDV Local'}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. TOTAL */}
                <div className="w-full lg:w-[160px] p-4 flex flex-col justify-center border-r border-slate-50">
                    <span className="text-sm font-black text-slate-900 mb-1">{formatCurrency(pedido.total)}</span>
                    <div className="flex flex-col gap-1.5">
                        <div className={cn(
                            "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase w-fit",
                            pedido.payment_status === 'pago' ? "bg-green-500 text-white" : "bg-[#FBA41A] text-white"
                        )}>
                            {pedido.payment_status === 'pago' ? 'Pago' : 'Não pago'}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 border border-dashed border-slate-200 rounded-full px-2 py-0.5 w-fit bg-slate-50/50 overflow-hidden max-w-full">
                            <CreditCard className="size-3 shrink-0" />
                            <span className="text-[9px] font-bold uppercase truncate">{pedido.payment_method || 'A DEFINIR'}</span>
                        </div>
                    </div>
                </div>

                {/* 4. CLIENTE / LOGISTICA */}
                <div className="flex-1 p-4 flex flex-col justify-center gap-1.5 overflow-hidden">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-700 truncate">{pedido.customers?.name || "Cliente Final"}</span>
                        <div className="flex items-center gap-1 bg-[#F0FDF4] text-[#22C55E] rounded-md px-1.5 py-0.5 border border-[#DCFCE7] cursor-pointer hover:bg-[#DCFCE7]">
                            <MessageCircle className="size-3 fill-current" />
                            <span className="text-[9px] font-black">{formatPhone(pedido.customers?.phone || "")}</span>
                            <ChevronDown className="size-2.5" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold truncate italic">
                        <MapPin className="size-3.5 text-slate-300 shrink-0" />
                        <span className="truncate">{formatAddress(pedido)}</span>
                    </div>
                    <Button
                        variant="outline"
                        className="h-7 w-fit rounded-lg border-blue-500 text-blue-500 text-[9px] font-black uppercase px-3 gap-1.5 hover:bg-blue-50 transition-all mt-1"
                    >
                        <Globe className="size-3" /> 
                        {pedido.courier_name ? `Entregador: ${pedido.courier_name}` : 'Escolher entregador'} 
                        <ChevronRight className="size-3" />
                    </Button>
                </div>

                {/* 5. AÇÕES (RIGHT) */}
                <div className="p-4 flex items-center gap-2 bg-[#F8FAFC]/30 border-l border-slate-50 shrink-0">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {pedido.status === 'novo' || pedido.status === 'pending' ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={loading !== null}
                                    onClick={() => handleAction('reject', () => onReject(pedido.id))}
                                    className="h-12 w-20 flex flex-col items-center justify-center border-rose-100 text-rose-500 rounded-xl hover:bg-rose-50 border-2"
                                >
                                    {loading === 'reject' ? <Loader2 className="size-5 animate-spin" /> : <X className="size-5 mb-0.5" />}
                                    <span className="text-[9px] font-black uppercase leading-none">Rejeitar</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={loading !== null}
                                    onClick={() => handleAction('pay', () => onUpdatePaymentStatus(pedido.id, 'pago'))}
                                    className="h-12 w-20 flex flex-col items-center justify-center border-blue-100 text-blue-500 rounded-xl hover:bg-blue-50 border-2"
                                >
                                    {loading === 'pay' ? <Loader2 className="size-5 animate-spin" /> : <DollarSign className="size-5 mb-0.5" />}
                                    <span className="text-[9px] font-black uppercase leading-none">Pagar</span>
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={loading !== null}
                                    onClick={() => handleAction('accept', () => onAccept(pedido.id))}
                                    className="h-12 w-20 flex flex-col items-center justify-center bg-[#2ECC71] hover:bg-[#27AE60] text-white rounded-xl shadow-lg shadow-green-100 border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all"
                                >
                                    {loading === 'accept' ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-6 mb-0.5" />}
                                    <span className="text-[9px] font-black uppercase leading-none">Aceitar</span>
                                </Button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center border border-slate-200 rounded-xl h-12">
                                    <Button variant="ghost" size="icon" className="h-full w-10 border-r border-slate-100 rounded-none text-slate-400">
                                        <Printer className="size-4" />
                                    </Button>
                                    <Button variant="ghost" className="h-full px-4 flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-50">
                                        <Scan className="size-4" />
                                        <span className="text-[10px] font-black uppercase">Status</span>
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={loading !== null}
                                    onClick={() => handleAction('pay_done', () => onUpdatePaymentStatus(pedido.id, 'pago'))}
                                    className={cn(
                                        "h-12 w-20 flex flex-col items-center justify-center border-2 rounded-xl transition-all",
                                        pedido.payment_status === 'pago' ? "bg-green-50 border-green-200 text-green-600 shadow-inner" : "border-blue-100 text-blue-500 hover:bg-blue-50"
                                    )}
                                >
                                    {loading === 'pay_done' ? <Loader2 className="size-5 animate-spin" /> : <DollarSign className="size-5 mb-0.5" />}
                                    <span className="text-[9px] font-black uppercase leading-none">
                                        {pedido.payment_status === 'pago' ? 'Pago' : 'Pagar'}
                                    </span>
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={loading !== null}
                                    onClick={() => handleAction('next', () => onNextStep(pedido.id, pedido.status))}
                                    className="h-12 w-24 flex flex-col items-center justify-center bg-[#0070F3] hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-100 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
                                >
                                    {loading === 'next' ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-6 mb-0.5" />}
                                    <span className="text-[9px] font-black uppercase tracking-tighter leading-none">
                                        {(pedido.status === 'preparando' || pedido.status === 'em_preparo') ? 'Despachar' : 'Finalizar'}
                                    </span>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-12 w-10 text-slate-300">
                                    <MoreVertical className="size-5" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* FEEDBACK VISUAL PARA NOVOS PEDIDOS */}
            {isNew && (
                <div className="absolute inset-0 pointer-events-none border-2 border-[#FBA41A] rounded-lg animate-pulse opacity-50 shadow-[inset_0_0_20px_rgba(251,164,26,0.1)]" />
            )}
        </Card>
    )
}
