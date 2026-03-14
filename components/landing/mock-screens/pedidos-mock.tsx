"use client"

import { ClipboardList, CheckCircle2, Flame, Truck, FileText, Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"

const orders = [
    { id: "1024", client: "Ana Clara Silva", product: "Bolo de Casamento", status: "producao", value: "R$ 450,00" },
    { id: "1025", client: "João Pedro", product: "50 Brigadeiros", status: "confirmado", value: "R$ 150,00" },
    { id: "1026", client: "Marcia Souza", product: "Torta de Limão", status: "entregue", value: "R$ 120,00" },
]

const statusConfig = {
    confirmado: { label: "Confirmado", color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle2 },
    producao: { label: "Produção", color: "text-amber-600", bg: "bg-amber-50", icon: Flame },
    entregue: { label: "Entregue", color: "text-green-600", bg: "bg-green-50", icon: Truck },
}

export function PedidosMock() {
    return (
        <div className="w-full h-full bg-[#f8fafc] p-6 overflow-hidden">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase italic leading-none">
                        Gestão de <span className="text-primary italic">Pedidos</span>
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Seu fluxo de encomendas organizado</p>
                </div>
                <div className="h-10 w-32 rounded-xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-widest cursor-pointer hover:scale-105 transition-transform">
                    Novo Pedido
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 h-[calc(100%-80px)]">
                <div className="col-span-2 space-y-4">
                    {orders.map((order) => {
                        const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.confirmado
                        const Icon = config.icon
                        return (
                            <div key={order.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        <ClipboardList className="size-6" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">#{order.id}</p>
                                        <h4 className="text-sm font-black text-slate-900 uppercase italic leading-none">{order.client}</h4>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1">{order.product}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase inline-block mb-2", config.bg, config.color)}>
                                        {config.label}
                                    </div>
                                    <p className="text-sm font-black text-primary">{order.value}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                        <div className="size-12 bg-[#FFF1F5] text-[#FF6B9A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Smartphone className="size-6" />
                        </div>
                        <h3 className="text-xs font-black text-slate-800 uppercase italic mb-2">Cardápio Digital</h3>
                        <p className="text-[9px] text-slate-400 font-bold mb-4 uppercase">Link exclusivo ativo</p>
                        <div className="bg-slate-50 p-2 rounded-lg text-[8px] font-bold text-slate-500 border border-slate-100">
                            docegestao.com/atelie
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 size-20 bg-primary/20 blur-2xl" />
                        <h3 className="text-[10px] font-black uppercase italic mb-4">Meta Mensal</h3>
                        <div className="flex justify-between text-[10px] font-black mb-2 uppercase">
                            <span>Progresso</span>
                            <span>85%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-[85%]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
