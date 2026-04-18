"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { 
    History, 
    ArrowLeft, 
    Calendar, 
    Store, 
    DollarSign,
    Package,
    Search,
    ChevronRight,
    Loader2,
    Filter,
    ArrowUpRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
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

export default function ShoppingHistoryPage() {
    const { profile } = useBusiness()
    const router = useRouter()
    
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        if (profile?.tenant_id || profile?.company_id) {
            fetchHistory()
        }
    }, [profile])

    async function fetchHistory() {
        const tenantId = profile?.tenant_id || profile?.company_id
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('lista_compras')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('status', 'adicionado_estoque')
                .order('updated_at', { ascending: false })
            
            if (error) throw error
            setHistory(data || [])
        } catch (e) {
            toast.error("Erro ao carregar histórico")
        } finally {
            setLoading(false)
        }
    }

    const filtered = history.filter(item => 
        item.nome_item.toLowerCase().includes(search.toLowerCase()) ||
        item.fornecedor?.toLowerCase().includes(search.toLowerCase())
    )

    const totalSpent = filtered.reduce((acc, current) => acc + (Number(current.valor_total) || 0), 0)

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.back()}
                        className="size-12 rounded-2xl bg-white shadow-sm text-slate-400 hover:text-slate-900"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                            Histórico de <span className="text-emerald-500">Compras</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                            Auditoria completa de todos os suprimentos adquiridos
                        </p>
                    </div>
                </div>
                
                <Card className="px-6 py-4 rounded-[24px] border-emerald-100 bg-emerald-50/50 flex flex-col items-end">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 italic">Total Investido</span>
                    <span className="text-2xl font-black italic text-emerald-700 leading-none">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSpent)}
                    </span>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="relative w-full md:w-[450px] group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <Input 
                        placeholder="Buscar por produto ou fornecedor..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-12 pl-16 pr-4 rounded-2xl border-none bg-slate-50 focus-visible:ring-emerald-500 font-bold text-xs uppercase tracking-widest"
                    />
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-100 font-bold text-[10px] uppercase tracking-widest gap-2">
                        <Filter size={16} /> Filtrar Data
                    </Button>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100 italic">
                            <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-widest px-8">Data</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Insumo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Quantidade</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Fornecedor</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Valor</TableHead>
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
                                            <span className="font-black text-xs text-slate-900 uppercase italic leading-none">{new Date(item.updated_at).toLocaleDateString()}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(item.updated_at).toLocaleTimeString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
                                                <Package size={18} />
                                            </div>
                                            <span className="font-black text-xs uppercase italic text-slate-700">{item.nome_item}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col">
                                            <span className="font-black text-xs italic text-emerald-600">+{item.quantidade} <span className="text-[9px] opacity-60 uppercase">{item.unidade}</span></span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-[10px] uppercase text-slate-400 tracking-tight">
                                        {item.fornecedor || '---'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="px-3 py-1 bg-slate-100 rounded-lg font-black text-[10px] italic text-slate-900">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_total)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right px-8">
                                        <Button variant="ghost" size="icon" className="size-8 rounded-lg text-slate-200 hover:text-emerald-500 hover:bg-emerald-50 transition-all opacity-0 group-hover:opacity-100">
                                            <ArrowUpRight size={16} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-60">
                                        <div className="text-center opacity-40">
                                            <History size={40} className="mx-auto mb-4 text-slate-300" />
                                            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Nenhuma compra finalizada</p>
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
