"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    User,
    Phone,
    MapPin,
    CreditCard,
    MessageCircle,
    Clock,
    ChevronRight,
    Printer,
    X,
    Check,
    Bike,
    Pencil,
    Calendar,
    Timer as TimerIcon,
    PlusSquare,
    ExternalLink,
    Trash2,
    DollarSign,
    Package,
    Tag,
    ChevronDown,
    Globe,
    Loader2,
    Search
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { usePedidoStore } from "@/store/pedidoStore"
import { formatCurrency, formatPhone, formatAddress, getStatusConfig } from "@/lib/formatters"
import { printOrder } from "@/lib/printer"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"

interface PedidoDrawerProps {
    onUpdateStatus: (id: string, status: string) => Promise<void>
    onUpdatePaymentStatus: (id: string, status: string) => Promise<void>
}

export function PedidoDrawer({ onUpdateStatus, onUpdatePaymentStatus }: PedidoDrawerProps) {
    const pedido = usePedidoStore(s => s.pedidoSelecionado)
    const updatePedido = usePedidoStore(s => s.updatePedido)
    const setSelecionado = usePedidoStore(s => s.selecionarPedido)

    const [items, setItems] = useState<any[]>([])
    const [loadingItems, setLoadingItems] = useState(false)
    const [timeElapsed, setTimeElapsed] = useState({ min: 0, sec: 0 })
    const [currentTime, setCurrentTime] = useState(new Date())
    const [activeTab, setActiveTab] = useState<'produtos' | 'cozinha'>('produtos')
    const [loadingAction, setLoadingAction] = useState<string | null>(null)
    
    // Courier Selection
    const [couriers, setCouriers] = useState<any[]>([])
    const [loadingCouriers, setLoadingCouriers] = useState(false)
    const [courierSearch, setCourierSearch] = useState("")

    const isOpen = !!pedido

    useEffect(() => {
        if (isOpen && pedido) {
            fetchItems()
            fetchCouriers()

            // 1. Current Time Clock (Real-time)
            const clockInterval = setInterval(() => {
                setCurrentTime(new Date())
            }, 1000)

            // 2. Operational Timer (Stops when finished or dispatched)
            const updateTimer = () => {
                const isFinished = ['finalizado', 'delivered', 'done', 'cancelado', 'cancelled', 'saiu-entrega', 'saiu_entrega', 'delivery'].includes(pedido.status)
                const startTime = new Date(pedido.created_at).getTime()
                const endTime = isFinished ? new Date(pedido.updated_at || Date.now()).getTime() : Date.now()
                
                const diff = Math.max(0, endTime - startTime)
                const totalSeconds = Math.floor(diff / 1000)
                const min = Math.floor(totalSeconds / 60)
                const sec = totalSeconds % 60
                
                setTimeElapsed({ min, sec })
            }
            
            updateTimer()
            const timerInterval = setInterval(() => {
                const isFinished = ['finalizado', 'delivered', 'done', 'cancelado', 'cancelled', 'saiu-entrega', 'saiu_entrega', 'delivery'].includes(pedido.status)
                if (!isFinished) updateTimer()
            }, 1000)

            return () => {
                clearInterval(clockInterval)
                clearInterval(timerInterval)
            }
        }
    }, [isOpen, pedido?.id, pedido?.status])

    async function fetchItems() {
        if (!pedido) return
        setLoadingItems(true)
        try {
            const { data, error } = await supabase
                .from('order_items')
                .select('*, products(name, price)')
                .eq('order_id', pedido.id)

            if (error) throw error
            setItems(data || [])
        } catch (error) {
            console.error("Error fetching order items:", error)
        } finally {
            setLoadingItems(false)
        }
    }

    async function fetchCouriers() {
        setLoadingCouriers(true)
        try {
            // Buscamos perfis que possam ser entregadores. 
            // Como não temos certeza do role exato, buscamos por roles comuns ou permitimos pesquisa
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name')
                .limit(20)

            if (error) throw error
            setCouriers(data || [])
        } catch (error) {
            console.error("Error fetching couriers:", error)
        } finally {
            setLoadingCouriers(false)
        }
    }

    async function handleAssignCourier(courier: any) {
        if (!pedido) return
        setLoadingAction('courier')
        try {
            const { error } = await supabase
                .from('orders')
                .update({ 
                    courier_id: courier.id,
                    courier_name: courier.name 
                })
                .eq('id', pedido.id)

            if (error) throw error
            
            updatePedido(pedido.id, { 
                courier_id: courier.id, 
                courier_name: courier.name 
            })
            toast.success(`Entregador ${courier.name} atribuído!`)
        } catch (error) {
            toast.error("Erro ao atribuir entregador")
        } finally {
            setLoadingAction(null)
        }
    }

    if (!pedido) return null

    const isDelivery = !['retirada', 'pickup', 'balcao', 'mesa'].includes((pedido.delivery_type || pedido.order_type || '').toLowerCase())
    const subtotal = (pedido.total || 0) - (pedido.delivery_fee || 0) + (pedido.discount || 0)
    const statusCfg = getStatusConfig(pedido.status)

    const handleClose = () => setSelecionado(null)

    const handleAction = async (action: string, fn: () => Promise<void>) => {
        setLoadingAction(action)
        try {
            await fn()
        } finally {
            setLoadingAction(null)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <SheetContent className="w-full sm:max-w-md md:max-w-[480px] p-0 flex flex-col h-full bg-[#F4F7F6] border-none shadow-2xl">
                <SheetHeader className="sr-only">
                    <SheetTitle>Pedido #{pedido.id.slice(0, 4)}</SheetTitle>
                    <SheetDescription>Detalhes operativos do pedido</SheetDescription>
                </SheetHeader>

                {/* 1. Header - Orange/Yellow Bar */}
                <div className="bg-[#FBA41A] p-4 flex items-center justify-between shrink-0 shadow-md">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-black text-white italic tracking-tighter">#{pedido.id.slice(0, 4).toUpperCase()}</h2>
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 backdrop-blur-md rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-white">
                                <Bike className="size-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">{isDelivery ? 'Delivery' : 'Retirada'}</span>
                            </div>
                            <div className={cn("rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 shadow-sm", statusCfg.className)}>
                                {statusCfg.label}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-white hover:bg-white/10 rounded-full h-10 w-10"
                            onClick={() => printOrder(pedido, items)} 
                        >
                            <Printer className="size-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-10 w-10">
                            <Pencil className="size-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-10 w-10" onClick={handleClose}>
                            <X className="size-7" />
                        </Button>
                    </div>
                </div>

                {/* 2. Info Ribbon */}
                <div className="bg-[#FEF6ED] border-b border-[#FBEACF] px-4 py-2.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white border border-[#FBEACF] rounded-md px-2 py-0.5 flex items-center gap-1 shadow-sm">
                            <span className="text-[10px] font-black text-[#FBA41A]">{pedido.origin || 'WEB'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#5C5C5C] text-[11px] font-black">
                            <Clock className="size-3.5 text-[#FBA41A]" />
                            {format(currentTime, "HH:mm:ss")}
                        </div>
                        <Separator orientation="vertical" className="h-4 bg-orange-200" />
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                            <Calendar className="size-3.5" />
                            {format(new Date(pedido.created_at), "dd/MM/yy HH:mm")}
                        </div>
                    </div>
                    <div className={cn(
                        "flex items-center gap-2 font-black italic tracking-tighter transition-all px-4 py-2 rounded-2xl",
                        // iFood Style Urgency Colors
                        timeElapsed.min >= 15 ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200" : 
                        timeElapsed.min >= 5 ? "bg-amber-400 text-white shadow-md shadow-amber-100" :
                        ['finalizado', 'delivered', 'done'].includes(pedido.status) ? "bg-emerald-50 text-emerald-500 border border-emerald-100" : "bg-emerald-500 text-white shadow-md shadow-emerald-100"
                    )}>
                        <TimerIcon className={cn("size-4", (timeElapsed.min >= 5 || !['finalizado', 'delivered', 'done'].includes(pedido.status)) ? "text-white" : "text-emerald-500")} />
                        <div className="flex flex-col items-center">
                            <span className="text-[16px] tabular-nums font-mono leading-none">
                                {String(timeElapsed.min).padStart(2, '0')}:{String(timeElapsed.sec).padStart(2, '0')}
                            </span>
                            <span className="text-[7px] uppercase tracking-widest mt-0.5 opacity-80">
                                Pedido há {timeElapsed.min} min
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-[#F4F7F6]">
                    {/* Add Title Placeholder */}
                    <div className="px-4 py-2 bg-white border-b border-slate-100 mb-4">
                        <div className="flex items-center justify-between">
                            <input
                                className="bg-transparent border-none text-[#BDBDBD] font-bold text-sm focus:outline-none w-full"
                                placeholder="Adicionar observação interna..."
                            />
                            <div className="flex items-center gap-1.5 text-[#BDBDBD] text-[10px] font-bold whitespace-nowrap">
                                <span>ID: {pedido.id.toUpperCase()}</span>
                                <PlusSquare className="size-4" />
                            </div>
                        </div>
                    </div>

                    <div className="px-4 space-y-4 pb-8">
                        {/* 3. Cliente Section */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-slate-400">
                                    <User className="size-6" />
                                </div>
                                <div className="max-w-[150px]">
                                    <h4 className="font-black text-slate-900 text-sm leading-tight truncate">{pedido.customers?.name || "Cliente Final"}</h4>
                                    <p className="text-xs text-slate-400 font-bold">{formatPhone(pedido.customers?.phone || "")}</p>
                                </div>
                                <Badge variant="secondary" className="bg-[#EDF2F7] text-[#4A5568] border-none rounded-md px-2 py-0 text-[9px] font-bold uppercase shrink-0">Vip</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="icon"
                                    className="h-10 w-10 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl shadow-lg shadow-green-100 transition-all hover:scale-111 active:scale-95"
                                    onClick={() => window.open(`https://wa.me/55${pedido.customers?.phone?.replace(/\D/g, '')}`, '_blank')}
                                >
                                    <MessageCircle className="size-5 fill-current" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300">
                                    <ChevronDown className="size-5" />
                                </Button>
                            </div>
                        </div>

                        {/* 4. Address Section */}
                        <div className={cn(
                            "bg-white rounded-xl p-4 shadow-sm border flex items-center justify-between group transition-all",
                            formatAddress(pedido) !== "Endereço não informado" ? "border-emerald-100" : "border-slate-100"
                        )}>
                            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                <div className={cn(
                                    "size-8 rounded-lg flex items-center justify-center transition-colors",
                                    formatAddress(pedido) !== "Endereço não informado" ? "bg-emerald-50 text-emerald-500" : "bg-orange-50 text-[#FBA41A]"
                                )}>
                                    <MapPin className="size-5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className={cn(
                                        "text-[13px] font-bold truncate italic leading-tight",
                                        formatAddress(pedido) !== "Endereço não informado" ? "text-slate-900" : "text-slate-400"
                                    )}>
                                        {formatAddress(pedido) !== "Endereço não informado" ? `📍 ${formatAddress(pedido)}` : formatAddress(pedido)}
                                    </span>
                                    {formatAddress(pedido) !== "Endereço não informado" && (
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Endereço Confirmado</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-blue-500">
                                    <ExternalLink className="size-5" />
                                </Button>
                            </div>
                        </div>

                        {/* 5. Driver Assignment */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0070F3]">
                                            <Bike className="size-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={cn("text-[13px] font-black", pedido.courier_name ? "text-slate-900" : "text-slate-400")}>
                                                {pedido.courier_name || "Atribuir entregador"}
                                            </span>
                                            {pedido.courier_name && <span className="text-[10px] text-blue-500 font-bold uppercase">Em trânsito</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ChevronRight className="size-5 text-slate-300" />
                                    </div>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0 rounded-2xl overflow-hidden shadow-2xl border-slate-100" align="start">
                                <div className="p-3 border-b border-slate-100 bg-slate-50">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                        <Input 
                                            placeholder="Buscar entregador..." 
                                            className="pl-9 h-9 rounded-xl border-slate-200 text-xs"
                                            value={courierSearch}
                                            onChange={(e) => setCourierSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[200px] overflow-y-auto p-1">
                                    {loadingCouriers ? (
                                        <div className="p-4 text-center text-xs text-slate-400 animate-pulse">Carregando...</div>
                                    ) : couriers.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-slate-400">Nenhum encontrado</div>
                                    ) : (
                                        couriers.filter(c => c.name?.toLowerCase().includes(courierSearch.toLowerCase())).map((courier) => (
                                            <button
                                                key={courier.id}
                                                onClick={() => handleAssignCourier(courier)}
                                                className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500">
                                                        <User className="size-4" />
                                                    </div>
                                                    {courier.name}
                                                </div>
                                                {pedido.courier_id === courier.id && <Check className="size-4 text-blue-500" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* 6. Products Section with Tabs */}
                        <div className="pt-2">
                            <div className="flex border-b border-slate-200 mb-3 ml-2">
                                <button
                                    className={cn("px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2", activeTab === 'produtos' ? "border-[#0070F3] text-[#0070F3]" : "border-transparent text-slate-400")}
                                    onClick={() => setActiveTab('produtos')}
                                >
                                    <span className="text-base leading-none translate-y-[-1px]">+</span> Itens
                                </button>
                                <button
                                    className={cn("px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2", activeTab === 'cozinha' ? "border-[#0070F3] text-[#0070F3]" : "border-transparent text-slate-400")}
                                    onClick={() => setActiveTab('cozinha')}
                                >
                                    <Printer className="size-4" /> Log de Produção
                                </button>
                            </div>

                            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 divide-y divide-dashed divide-slate-100">
                                {loadingItems ? (
                                    <div className="p-8 text-center text-slate-400 animate-pulse font-bold">Buscando itens na base...</div>
                                ) : items.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 italic font-medium">O pedido parece estar vazio.</div>
                                ) : (
                                    items.map((item: any) => (
                                        <div key={item.id} className="p-4 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center font-black text-slate-900 border border-slate-100">
                                                    {item.quantity}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm tracking-tight">{item.products?.name || item.product_name}</p>
                                                    {item.notes && <p className="text-[10px] text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-full w-fit mt-1">Obs: {item.notes}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className="text-sm text-slate-900 font-black">{formatCurrency(item.price * item.quantity)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 7. Summary & Total Section */}
                        <div className="pt-4 border-t border-dashed border-slate-200 space-y-3">
                            <div className="flex justify-between items-center text-[13px] font-bold text-slate-500 px-2 uppercase tracking-tighter">
                                <span>Subtotal</span>
                                <span className="text-slate-900">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[13px] font-bold text-[#FBA41A] px-2 uppercase tracking-tighter">
                                <div className="flex items-center gap-1.5">
                                    <Bike className="size-4" /> Taxa de Entrega
                                </div>
                                <span>{formatCurrency(pedido.delivery_fee || 0)}</span>
                            </div>

                            <Separator className="bg-slate-200 my-4" />

                            <div className="flex justify-between items-end px-2">
                                <div className="flex flex-col gap-2">
                                    <div className={cn("rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-widest leading-none w-fit shadow-sm", pedido.payment_status === 'pago' ? "bg-green-500 text-white" : "bg-orange-500 text-white")}>
                                        {pedido.payment_status === 'pago' ? 'Confirmado' : 'Pendente'}
                                    </div>
                                    <div className="flex items-center gap-2 border border-slate-300 border-dashed rounded-full px-3 py-1 bg-white">
                                        <CreditCard className="size-3.5 text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase">{pedido.payment_method || 'A DEFINIR'}</span>
                                    </div>
                                    {pedido.payment_method === 'money' && pedido.change_for > 0 && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-1">
                                            <p className="text-[9px] font-bold text-amber-600 uppercase leading-none mb-1">Troco solicitado</p>
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-[10px] font-bold text-slate-500 italic">Pago: {formatCurrency(pedido.change_for)}</span>
                                                <span className="text-[11px] font-black text-amber-600">Troco: {formatCurrency(pedido.change_for - pedido.total)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total à Pagar</p>
                                    <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter leading-none bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        {formatCurrency(pedido.total)}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* 8. Footer Action Bar (3 Column) */}
                <div className="bg-white border-t border-slate-100 p-6 shrink-0 shadow-[0_-15px_40px_rgba(0,0,0,0.06)] z-20">
                    <div className="flex gap-3 h-20">
                        <Button
                            variant="outline"
                            disabled={loadingAction !== null}
                            className="w-1/4 h-full flex flex-col items-center justify-center border-rose-100 text-rose-500 rounded-3xl hover:bg-rose-50 border-2 transition-all active:scale-95 group"
                            onClick={() => handleAction('reject', () => onUpdateStatus(pedido.id, 'cancelado'))}
                        >
                            {loadingAction === 'reject' ? <Loader2 className="size-6 animate-spin" /> : <X className="size-6 mb-1 group-hover:rotate-90 transition-transform" />}
                            <span className="text-[9px] font-black uppercase tracking-widest leading-none">Recusar</span>
                        </Button>

                        <Button
                            variant="outline"
                            disabled={loadingAction !== null}
                            className={cn(
                                "w-1/4 h-full flex flex-col items-center justify-center border-2 rounded-3xl transition-all active:scale-95 shadow-sm",
                                pedido.payment_status === 'pago' ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50"
                            )}
                            onClick={() => handleAction('pay', () => onUpdatePaymentStatus(pedido.id, 'pago'))}
                        >
                            {loadingAction === 'pay' ? <Loader2 className="size-6 animate-spin" /> : <DollarSign className="size-6 mb-1" />}
                            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                                {pedido.payment_status === 'pago' ? 'Pago' : 'Pagar'}
                            </span>
                        </Button>

                        <Button
                            disabled={loadingAction !== null}
                            className={cn(
                                "flex-1 h-full flex flex-col items-center justify-center text-white rounded-3xl shadow-xl border-b-4 transition-all active:translate-y-1 active:border-b-0",
                                statusCfg.label === 'Pendente' ? "bg-[#FBA41A] hover:bg-orange-600 border-orange-800 shadow-orange-100" : 
                                (statusCfg.label === 'Em preparação' || statusCfg.label === 'Preparo') ? "bg-[#2ECC71] hover:bg-green-600 border-green-800 shadow-green-100" :
                                "bg-[#0070F3] hover:bg-blue-600 border-blue-800 shadow-blue-100"
                            )}
                            onClick={() => handleAction('next', async () => {
                                if (pedido.status === 'novo' || pedido.status === 'pending') await onUpdateStatus(pedido.id, 'preparando')
                                else {
                                    const map: Record<string, string> = {
                                        'preparando': 'saiu-entrega',
                                        'em_preparo': 'saiu-entrega',
                                        'preparing': 'saiu-entrega',
                                        'saiu-entrega': 'finalizado',
                                        'saiu_entrega': 'finalizado'
                                    }
                                    const next = map[pedido.status]
                                    if (next) await onUpdateStatus(pedido.id, next)
                                }
                            })}
                        >
                            {loadingAction === 'next' ? <Loader2 className="size-8 animate-spin" /> : <Check className="size-8 mb-0.5" />}
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] leading-none text-center">
                                {pedido.status === 'novo' || pedido.status === 'pending' ? 'ACEITAR PEDIDO' :
                                    (pedido.status === 'preparando' || pedido.status === 'em_preparo' || pedido.status === 'preparing') ? 'DESPACHAR AGORA' :
                                        (pedido.status === 'saiu-entrega' || pedido.status === 'saiu_entrega') ? 'FINALIZAR PEDIDO' : 'AVANÇAR'}
                            </span>
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
