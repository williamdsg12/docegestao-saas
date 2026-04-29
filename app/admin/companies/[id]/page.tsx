"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    ChevronLeft,
    Building2,
    Calendar,
    Mail,
    Phone,
    ShieldCheck,
    TrendingUp,
    Package,
    ShoppingCart,
    ExternalLink,
    Ban,
    UserCircle,
    ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

import { use } from "react"

export default function CompanyDetail({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise)
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDetail()
    }, [params.id])

    async function fetchDetail() {
        if (!params.id || params.id === 'undefined') return
        
        try {
            const res = await fetch(`/api/admin/companies/${params.id}`)
            if (!res.ok) throw new Error("API Error")
            const json = await res.json()
            setData(json)
        } catch (error) {
            toast.error("Erro ao carregar detalhes")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-10">
                <Skeleton className="h-10 w-32" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Skeleton className="h-[400px] lg:col-span-2 rounded-[40px]" />
                    <Skeleton className="h-[400px] rounded-[40px]" />
                </div>
            </div>
        )
    }

    if (!data || !data.empresa) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-bold uppercase italic translate-y-10">
                <Building2 className="size-20 opacity-10 mb-6" />
                Empresa não encontrada ou erro na conexão.
            </div>
        )
    }

    const { empresa, subscription, metrics, latestOrders } = data

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header / Back */}
            <div className="flex items-center justify-between">
                <Link 
                    href="/admin/companies"
                    className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors group"
                >
                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                        <ArrowLeft className="size-5" />
                    </div>
                    <span className="font-bold uppercase italic text-xs tracking-widest">Voltar para a lista</span>
                </Link>

                <div className="flex gap-4">
                     <button className="h-12 px-6 rounded-2xl bg-white/5 text-slate-300 font-bold text-xs uppercase italic hover:bg-white/10 transition-all border border-white/5 active:scale-95">
                        Acessar como...
                    </button>
                    <button className="h-12 px-6 rounded-2xl bg-rose-600 text-white font-bold text-xs uppercase italic hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95">
                        Bloquear Empresa
                    </button>
                </div>
            </div>

            {/* Profile Overview Card */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-[#0B0F1A] border border-white/5 rounded-[40px] p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 size-96 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
                        <div className="size-32 md:size-40 rounded-[40px] bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 shadow-inner group-hover:rotate-3 transition-transform">
                            <Building2 className="size-16" />
                        </div>
                        
                        <div className="flex-1 space-y-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                        empresa.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                    )}>
                                        {empresa.status || 'active'}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID: {empresa.id}</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">{empresa.name}</h1>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                                    <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                                        <UserCircle className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Responsável</p>
                                        <p className="text-sm font-bold text-slate-200">{empresa.profiles?.owner_name || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                                    <div className="size-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                        <Mail className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Email Principal</p>
                                        <p className="text-sm font-bold text-slate-200">{empresa.email || empresa.profiles?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                                    <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                        <Phone className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Telefone / Whats</p>
                                        <p className="text-sm font-bold text-slate-200">{empresa.whatsapp || empresa.telefone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                                    <div className="size-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                                        <Calendar className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Membro desde</p>
                                        <p className="text-sm font-bold text-slate-200">{format(new Date(empresa.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plan Info Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group flex flex-col justify-between h-full">
                    <div className="absolute top-0 right-0 size-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all duration-700" />
                    
                    <div className="relative z-10">
                        <div className="size-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-10 shadow-xl border border-white/20">
                            <ShieldCheck className="size-8" />
                        </div>
                        <h4 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-2">Plano Ativo</h4>
                        <p className="text-5xl font-black italic uppercase tracking-tighter mb-8">{subscription?.plans?.name || 'FREE'}</p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm py-3 border-b border-white/10">
                                <span className="font-medium opacity-70">Valor Mensal</span>
                                <span className="font-black">R$ {subscription?.plans?.price || 0},00</span>
                            </div>
                            <div className="flex items-center justify-between text-sm py-3 border-b border-white/10">
                                <span className="font-medium opacity-70">Status Assinatura</span>
                                <span className="font-black px-2 py-0.5 rounded-lg bg-emerald-500/30 border border-emerald-500/50 uppercase text-[10px]">Paga</span>
                            </div>
                        </div>
                    </div>

                    <button className="relative z-10 w-full h-14 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest italic text-xs shadow-2xl hover:scale-[1.02] transition-transform active:scale-95 mt-10">
                        Alterar Plano Manualmente
                    </button>
                </div>
            </div>

            {/* Metrics & Usage */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                 <div className="bg-[#0B0F1A] border border-white/5 p-8 rounded-[32px] shadow-2xl group flex flex-col justify-between">
                    <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                        <ShoppingCart className="size-6" />
                    </div>
                    <div>
                        <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Pedidos Criados</h5>
                        <p className="text-4xl font-black text-white italic tracking-tighter">{metrics.orders}</p>
                    </div>
                 </div>
                 <div className="bg-[#0B0F1A] border border-white/5 p-8 rounded-[32px] shadow-2xl group flex flex-col justify-between">
                    <div className="size-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
                        <Package className="size-6" />
                    </div>
                    <div>
                        <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Produtos Ativos</h5>
                        <p className="text-4xl font-black text-white italic tracking-tighter">{metrics.products}</p>
                    </div>
                 </div>
                 <div className="bg-[#0B0F1A] border border-white/5 p-8 rounded-[32px] shadow-2xl group flex flex-col justify-between">
                    <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                        <TrendingUp className="size-6" />
                    </div>
                    <div>
                        <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Faturamento Bruto</h5>
                        <p className="text-4xl font-black text-white italic tracking-tighter">R$ ---</p>
                    </div>
                 </div>
                 <div className="bg-[#0B0F1A] border border-white/5 p-8 rounded-[32px] shadow-2xl group flex flex-col justify-between">
                    <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6">
                        <ShieldCheck className="size-6" />
                    </div>
                    <div>
                        <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Reputação B2B</h5>
                        <p className="text-4xl font-black text-white italic tracking-tighter">A+</p>
                    </div>
                 </div>
            </div>

            {/* Latest Orders from this Company */}
            <div className="bg-[#0B0F1A] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Últimos Pedidos</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Sincronização de vendas em tempo real</p>
                    </div>
                    <button className="px-6 py-3 rounded-2xl bg-white/5 text-slate-400 font-bold text-xs uppercase italic hover:text-white transition-all">
                        Ver Todos
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50">
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">ID Pedido / Cliente</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Valor Total</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Data</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {latestOrders.map((o: any) => (
                                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 group-hover:text-amber-500 transition-colors">
                                                <ShoppingCart className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-200">#{o.id.split('-')[0]}</p>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">{o.cliente_nome || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 font-black text-white italic tracking-tighter text-lg">
                                        R$ {o.valor_total || o.total || 0},00
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            o.status === 'concluido' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                        )}>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-xs text-slate-500 font-bold">
                                        {format(new Date(o.created_at), "dd/MM/yyyy HH:mm")}
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <button className="p-2 rounded-lg text-slate-600 hover:text-white transition-colors">
                                            <ExternalLink className="size-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {latestOrders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-10 py-20 text-center text-slate-500 font-black uppercase tracking-widest italic text-sm">
                                        Nenhum pedido gerado por esta empresa ainda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
