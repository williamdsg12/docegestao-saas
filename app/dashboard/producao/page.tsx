"use client"

import { useState, useMemo } from "react"
import { useBusiness } from "@/hooks/useBusiness"
import Link from "next/link"
import { 
    ChefHat, 
    Plus, 
    DollarSign,
    Package,
    Search,
    Loader2,
    Utensils,
    History,
    CheckCircle2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useProductions } from "@/hooks/useProductions"

export default function ProductionERPPage() {
    const { profile } = useBusiness()
    const tenantId = profile?.tenant_id || profile?.company_id
    
    const { data: productions = [], isLoading } = useProductions(tenantId)
    const [search, setSearch] = useState("")

    const filtered = useMemo(() => 
        productions.filter(p => 
            p.receitas?.nome?.toLowerCase().includes(search.toLowerCase())
        ), [productions, search])

    const stats = useMemo(() => ({
        totalSessions: productions.length,
        totalProduced: productions.reduce((acc, p) => acc + Number(p.quantidade || 0), 0),
        totalCost: productions.reduce((acc, p) => acc + Number(p.custo_total || 0), 0)
    }), [productions])

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                        Painel de <span className="text-pink-500">Produção</span>
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                        Controle suas sessões de preparo e consumo de estoque
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/receitas">
                        <Button 
                            className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-slate-900/10"
                        >
                            <Plus size={16} /> Nova Produção
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard 
                    label="Sessões Realizadas" 
                    value={stats.totalSessions} 
                    icon={History} 
                    color="text-blue-500" 
                    bgColor="bg-blue-50" 
                />
                <MetricCard 
                    label="Volume Produzido" 
                    value={stats.totalProduced} 
                    icon={Package} 
                    color="text-pink-500" 
                    bgColor="bg-pink-50" 
                />
                <MetricCard 
                    label="Custo Operacional" 
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalCost)} 
                    icon={DollarSign} 
                    color="text-emerald-500" 
                    bgColor="bg-emerald-50" 
                />
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-pink-500 transition-colors" />
                <Input 
                    placeholder="Buscar por receita produzida..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-16 pl-16 pr-8 rounded-[32px] border-none bg-white shadow-sm focus-visible:ring-pink-500 font-bold text-sm tracking-tight"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr className="italic border-b border-slate-100">
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest">Data</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Receita</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Quantidade</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Custo Total</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Status</th>
                                <th className="p-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="h-60 text-center">
                                            <Loader2 className="animate-spin mx-auto text-slate-300" />
                                        </td>
                                    </tr>
                                ) : filtered.length > 0 ? filtered.map((item) => (
                                    <motion.tr 
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-slate-50/30 border-b border-slate-50 transition-colors"
                                    >
                                        <td className="p-8">
                                            <div className="flex flex-col">
                                                <span className="font-black text-xs text-slate-900 uppercase italic leading-none">{new Date(item.data_producao).toLocaleDateString('pt-BR')}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(item.data_producao).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
                                                    <Utensils size={18} />
                                                </div>
                                                <span className="font-black text-xs uppercase italic text-slate-700">{item.receitas?.nome}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-black text-sm italic text-slate-900">
                                            {item.quantidade} <span className="text-[10px] opacity-40 uppercase">unid</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-3 py-1 bg-slate-100 rounded-lg font-black text-[10px] italic text-slate-900">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.custo_total)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <Badge className="bg-emerald-50 text-emerald-500 border-none font-black text-[8px] uppercase tracking-widest italic h-6 px-4">
                                                Estoque Baixado
                                            </Badge>
                                        </td>
                                        <td className="p-8 text-right">
                                            <CheckCircle2 size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="h-60 text-center opacity-40">
                                            <ChefHat size={40} className="mx-auto mb-4 text-slate-300" />
                                            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Nenhuma produção registrada</p>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ label, value, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="p-6 rounded-[32px] border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className={cn("absolute top-0 right-0 size-24 blur-3xl rounded-full opacity-10 -mr-12 -mt-12", color.replace('text', 'bg'))} />
            <div className="flex items-center gap-4">
                <div className={cn("size-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500", bgColor, color)}>
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-normal mb-1">{label}</p>
                    <h3 className={cn("text-xl font-black italic uppercase tracking-tighter leading-normal pr-4")}>
                        {value}
                    </h3>
                </div>
            </div>
        </Card>
    )
}
