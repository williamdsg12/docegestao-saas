"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { 
    FileText, 
    Calendar, 
    User, 
    Store, 
    Search, 
    ArrowLeft,
    ChevronRight,
    Loader2,
    DollarSign,
    Box
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export default function ComprasHistoryPage() {
    const { profile } = useBusiness()
    const router = useRouter()
    
    const [compras, setCompras] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        if (profile?.tenant_id || profile?.company_id) {
            fetchCompras()
        }
    }, [profile])

    async function fetchCompras() {
        const tenantId = profile?.tenant_id || profile?.company_id
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('compras')
                .select('*, profiles(full_name)')
                .eq('tenant_id', tenantId)
                .order('data_compra', { ascending: false })
            
            if (error) throw error
            setCompras(data || [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const filtered = compras.filter(c => 
        c.fornecedor?.toLowerCase().includes(search.toLowerCase()) ||
        c.numero_nota?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
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
                        Histórico de <span className="text-emerald-500">Compras (ERP)</span>
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                        Auditoria completa de notas fiscais e entradas de estoque
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-8 rounded-[32px] border-none shadow-sm bg-white">
                    <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
                        <DollarSign size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">Investimento Mensal</p>
                    <h3 className="text-3xl font-black italic tracking-tighter text-slate-900">
                        R$ {compras.reduce((acc, c) => acc + (c.valor_total || 0), 0).toFixed(2).replace('.', ',')}
                    </h3>
                </Card>
                <Card className="p-8 rounded-[32px] border-none shadow-sm bg-white">
                    <div className="size-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-6">
                        <FileText size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">Notas Processadas</p>
                    <h3 className="text-3xl font-black italic tracking-tighter text-slate-900">{compras.length}</h3>
                </Card>
                <Card className="p-8 rounded-[32px] border-none shadow-sm bg-white">
                    <div className="size-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-6">
                        <Store size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">Fornecedores Diferentes</p>
                    <h3 className="text-3xl font-black italic tracking-tighter text-slate-900">
                        {new Set(compras.map(c => c.fornecedor)).size}
                    </h3>
                </Card>
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <Input 
                    placeholder="Filtrar por fornecedor ou número da nota..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-16 pl-16 pr-8 rounded-[32px] border-none bg-white shadow-sm focus-visible:ring-emerald-500 font-bold text-sm tracking-tight"
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-500" size={48} />
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((compra, idx) => (
                        <motion.div
                            key={compra.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card className="p-6 rounded-[32px] border-slate-100 hover:border-emerald-200 transition-all hover:translate-y-[-4px] group shadow-sm bg-white flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer">
                                <div className="flex items-center gap-6">
                                    <div className="size-16 rounded-[22px] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors shrink-0">
                                        <FileText size={28} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-black italic text-slate-900 uppercase tracking-tight">NF № {compra.numero_nota}</h3>
                                            <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-100 text-slate-400 rounded-lg italic">Processado</Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                                            <span className="flex items-center gap-1.5"><Store size={12} className="text-emerald-500" /> {compra.fornecedor}</span>
                                            <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(compra.data_compra).toLocaleDateString('pt-BR')}</span>
                                            <span className="flex items-center gap-1.5"><User size={12} /> {compra.profiles?.full_name || "Sistema"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-12">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1 italic">Valor Total</p>
                                        <p className="text-xl font-black italic text-emerald-500 tracking-tighter">
                                            R$ {compra.valor_total?.toFixed(2).replace('.', ',')}
                                        </p>
                                    </div>
                                    <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
