"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { 
    History,
    Search,
    Filter,
    ArrowUpCircle,
    ArrowDownCircle,
    Settings,
    Package,
    Loader2,
    Calendar,
    ChevronLeft,
    Clock,
    User as UserIcon,
    AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function InventoryHistoryPage() {
    const { profile } = useBusiness()
    const router = useRouter()
    const [movements, setMovements] = useState<any[]>([])
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
                .from('estoque_movimentacoes')
                .select(`
                    *,
                    ingredientes (
                        nome,
                        unidade_base
                    )
                `)
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })
            
            if (error) throw error
            setMovements(data || [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const filtered = movements.filter(m => 
        m.ingredientes?.nome?.toLowerCase().includes(search.toLowerCase()) ||
        m.origem?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-slate-100"
                    >
                        <ChevronLeft size={24} />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                            Auditoria de <span className="text-blue-500">Estoque</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                            Histórico completo de entradas, saídas e produções
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <section className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                        placeholder="Buscar por ingrediente ou origem..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-12 pl-12 pr-4 rounded-2xl border-none bg-slate-50 focus-visible:ring-blue-500 font-bold text-xs uppercase tracking-widest"
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Últimos 30 dias</span>
                </div>
            </section>

            {/* Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">Data & Hora</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Insumo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Tipo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Quantidade</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Origem</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-8">Auditado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-80 text-center">
                                        <Loader2 className="animate-spin mx-auto text-slate-200" size={40} />
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length > 0 ? filtered.map((m) => (
                                <TableRow key={m.id} className="group hover:bg-slate-50/30 border-slate-50 transition-colors">
                                    <TableCell className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                                                <Clock size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-900 leading-none">
                                                    {new Date(m.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 mt-1">
                                                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Package size={14} className="text-slate-300" />
                                            <span className="text-xs font-black text-slate-700 uppercase italic truncate max-w-[200px]">
                                                {m.ingredientes?.nome}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                            m.tipo === 'entrada' ? "bg-emerald-50 text-emerald-500" : m.tipo === 'saida' ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"
                                        )}>
                                            {m.tipo === 'entrada' ? <ArrowUpCircle size={10} /> : m.tipo === 'saida' ? <ArrowDownCircle size={10} /> : <Settings size={10} />}
                                            {m.tipo}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-black italic text-sm">
                                        {m.tipo === 'saida' ? '-' : '+'}{m.quantidade} <span className="text-[10px] opacity-30">{m.ingredientes?.unidade_base}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-[0.1em] border-slate-200">
                                            {m.origem}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right px-8">
                                        <div className="flex items-center justify-end gap-2 text-slate-300">
                                            <UserIcon size={12} />
                                            <span className="text-[8px] font-black uppercase">Sistema Auto</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-80">
                                        <div className="text-center opacity-20">
                                            <AlertCircle size={40} className="mx-auto mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma movimentação registrada</p>
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
