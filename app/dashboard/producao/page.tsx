"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"
import { 
    ChefHat, 
    Plus, 
    Calendar, 
    DollarSign,
    Package,
    Search,
    Loader2,
    Utensils,
    History,
    TrendingUp,
    CheckCircle2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ProduzirModal } from "@/components/dashboard/estoque/ProduzirModal"

export default function ProductionERPPage() {
    const { profile } = useBusiness()
    const { user } = useAuth()
    
    const [productions, setProductions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        if (profile?.tenant_id || profile?.company_id) {
            fetchProductions()
        }
    }, [profile])

    async function fetchProductions() {
        const tenantId = profile?.tenant_id || profile?.company_id
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('producoes')
                .select('*, receitas(nome, image_url)')
                .eq('tenant_id', tenantId)
                .order('data_producao', { ascending: false })
            
            if (error) throw error
            setProductions(data || [])
        } catch (e) {
            toast.error("Erro ao carregar produções")
        } finally {
            setLoading(false)
        }
    }

    const filtered = productions.filter(p => 
        p.receitas?.nome.toLowerCase().includes(search.toLowerCase())
    )

    const stats = {
        totalSessions: productions.length,
        totalProduced: productions.reduce((acc, p) => acc + Number(p.quantidade), 0),
        totalCost: productions.reduce((acc, p) => acc + Number(p.custo_total), 0)
    }

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
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100 italic">
                            <TableHead className="w-[200px] text-[10px] font-black uppercase tracking-widest px-8">Data</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Receita</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Quantidade</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Custo Total</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                            <TableHead className="text-right px-8"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-60 text-center">
                                        <Loader2 className="animate-spin mx-auto text-slate-300" />
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length > 0 ? filtered.map((item) => (
                                <TableRow key={item.id} className="group hover:bg-slate-50/30 border-slate-50 transition-colors">
                                    <TableCell className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-xs text-slate-900 uppercase italic leading-none">{new Date(item.data_producao).toLocaleDateString()}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(item.data_producao).toLocaleTimeString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
                                                <Utensils size={18} />
                                            </div>
                                            <span className="font-black text-xs uppercase italic text-slate-700">{item.receitas?.nome}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-black text-sm italic text-slate-900">
                                        {item.quantidade} <span className="text-[10px] opacity-40 uppercase">unid</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="px-3 py-1 bg-slate-100 rounded-lg font-black text-[10px] italic text-slate-900">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.custo_total)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="bg-emerald-50 text-emerald-500 border-none font-black text-[8px] uppercase tracking-widest italic h-6 px-4">
                                            Estoque Baixado
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right px-8">
                                        <CheckCircle2 size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-60">
                                        <div className="text-center opacity-40">
                                            <ChefHat size={40} className="mx-auto mb-4 text-slate-300" />
                                            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Nenhuma produção registrada</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none mb-1">{label}</p>
                    <h3 className={cn("text-xl font-black italic uppercase tracking-tighter leading-none truncate")}>
                        {value}
                    </h3>
                </div>
            </div>
        </Card>
    )
}
