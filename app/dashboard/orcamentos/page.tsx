"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import {
    Plus,
    Receipt,
    TrendingUp,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    ArrowRight,
    Copy,
    Sparkles,
    Layout
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { EmptyStateV2 } from "@/components/dashboard/EmptyStateV2"
import { MultiStepQuoteModal } from "@/components/dashboard/orcamentos/MultiStepQuoteModal"
import { QuoteCard } from "@/components/dashboard/orcamentos/QuoteCard"
import { PageSearch } from "@/components/dashboard/PageSearch"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Quote {
    id: string
    client_name: string
    total_final: number
    status: string
    created_at: string
    valid_until: string
}

const TEMPLATES = [
    { id: "t1", title: "Bolo de Casamento", subtitle: "2 andares + flores", price: 450, color: "from-pink-500 to-rose-500" },
    { id: "t2", title: "Kit Festa Kids", subtitle: "Bolo + 50 doces", price: 280, color: "from-amber-500 to-orange-500" },
    { id: "t3", title: "Combo Gourmet", subtitle: "100 doces variados", price: 180, color: "from-indigo-500 to-blue-500" },
]

export default function OrcamentosPage() {
    const { profile } = useBusiness()
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [filterStatus, setFilterStatus] = useState("todos")
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        if (profile?.company_id || profile?.tenant_id) {
            fetchQuotes()
        }
    }, [profile])

    async function fetchQuotes() {
        const tenantId = profile?.tenant_id || profile?.company_id
        if (!tenantId) return
        setLoading(true)
        try {
            // Join with customers to get client_name
            const { data, error } = await supabase
                .from('quotes')
                .select('*, customers(name)')
                .eq('company_id', tenantId)
                .order('created_at', { ascending: false })

            if (error) throw error
            
            setQuotes(data.map((q: any) => ({
                ...q,
                client_name: q.customers?.name || "Cliente Final"
            })))
        } catch (e) {
            console.error(e)
            // If table doesn't exist yet, we'll see 0 quotes
            setQuotes([])
        } finally {
            setLoading(false)
        }
    }

    const filtered = quotes.filter(q => {
        const matchSearch = q.client_name.toLowerCase().includes(search.toLowerCase())
        const matchStatus = filterStatus === "todos" || q.status === filterStatus
        return matchSearch && matchStatus
    })

    const stats = {
        total: quotes.length,
        approved: quotes.filter(q => q.status === 'approved').length,
        pending: quotes.filter(q => q.status === 'draft' || q.status === 'sent').length,
        conversion: quotes.length > 0 ? (quotes.filter(q => q.status === 'approved' || q.status === 'converted').length / quotes.length * 100).toFixed(0) : 0
    }

    async function handleDelete(id: string) {
        if (!confirm("Excluir este orçamento definitivamente?")) return
        try {
            await supabase.from('quotes').delete().eq('id', id)
            setQuotes(prev => prev.filter(q => q.id !== id))
            toast.success("Orçamento excluído")
        } catch (e) { toast.error("Erro ao excluir") }
    }

    async function handleUpdateStatus(id: string, newStatus: string) {
        try {
            await supabase.from('quotes').update({ status: newStatus }).eq('id', id)
            setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q))
            toast.success(`Status atualizado para ${newStatus}`)
        } catch (e) { toast.error("Erro ao atualizar") }
    }

    return (
        <div className="space-y-10 pb-20">
            <PageHeader 
                title="Gestão de" 
                highlight="Orçamentos" 
                subtitle="Transforme simples cotações em experiências de compra memoráveis"
                actions={(
                    <Button 
                        onClick={() => setIsModalOpen(true)} 
                        className="h-14 px-8 rounded-[24px] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs italic tracking-widest shadow-2xl flex gap-3 group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <Plus className="size-5" /> 
                        Criar Novo Orçamento
                    </Button>
                )}
            />

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Gerado", value: stats.total, icon: Receipt, color: "text-slate-400", bg: "bg-slate-100" },
                    { label: "Em Negociação", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
                    { label: "Aprovados", value: stats.approved, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
                    { label: "Taxa de Conversão", value: `${stats.conversion}%`, icon: TrendingUp, color: "text-pink-500", bg: "bg-pink-50" },
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between"
                    >
                        <div className={cn("size-14 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                            <stat.icon className="size-6" />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{stat.label}</p>
                            <h4 className="text-3xl font-black italic text-slate-900">{stat.value}</h4>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Templates Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black italic uppercase text-slate-900 leading-none">Venda Rápida</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Selecione um template pronto para agilizar</p>
                    </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    {TEMPLATES.map((t) => (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            key={t.id}
                            className="shrink-0 w-64 p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm text-left group hover:border-pink-200 transition-all cursor-pointer relative overflow-hidden"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <div className={cn("absolute top-0 right-0 w-20 h-20 bg-gradient-to-br opacity-5 rounded-full -mr-8 -mt-8", t.color)} />
                            <div className={cn("size-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-4 shadow-lg", t.color)}>
                                <Sparkles className="size-5" />
                            </div>
                            <h4 className="font-black italic text-sm uppercase text-slate-900 leading-tight">{t.title}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-4">{t.subtitle}</p>
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                                <span className="text-lg font-black text-slate-900 italic">R$ {t.price}</span>
                                <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-pink-500 group-hover:text-white transition-all">
                                    <ArrowRight size={14} />
                                </div>
                            </div>
                        </motion.button>
                    ))}
                    <button 
                        className="shrink-0 w-40 p-6 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-pink-200 hover:text-pink-500 transition-all cursor-pointer"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100"><Plus size={20} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-center">Novo Template</span>
                    </button>
                </div>
            </section>

            {/* Main List Section */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-full md:w-auto">
                        {["todos", "draft", "sent", "approved", "rejected"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    filterStatus === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {s === "todos" ? "Todos" : s === "draft" ? "Rascunhos" : s === "sent" ? "Enviados" : s === "approved" ? "Aprovados" : "Recusados"}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
                        <Input 
                            placeholder="BUSCAR CLIENTE..." 
                            className="h-12 pl-12 rounded-2xl bg-white border-slate-100 font-bold text-xs uppercase tracking-widest placeholder:text-slate-300"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((quote) => (
                            <QuoteCard 
                                key={quote.id} 
                                quote={quote} 
                                onDelete={handleDelete}
                                onUpdateStatus={handleUpdateStatus}
                                onView={(q) => console.log("View", q)}
                                onDuplicate={(q) => console.log("Duplicate", q)}
                            />
                        ))}
                    </AnimatePresence>

                    {!loading && filtered.length === 0 && (
                        <div className="col-span-full">
                            <EmptyStateV2 
                                icon={Receipt}
                                title="Nenhum orçamento encontrado"
                                subtitle="Crie propostas irresistíveis e acompanhe seu funil de vendas em tempo real"
                                action={
                                    <Button 
                                        onClick={() => setIsModalOpen(true)}
                                        className="h-12 px-6 rounded-2xl bg-rose-500 text-white font-black uppercase text-[10px] tracking-widest italic"
                                    >
                                        GERAR MEU PRIMEIRO ORÇAMENTO
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </div>
            </div>

            <MultiStepQuoteModal 
                open={isModalOpen} 
                onOpenChange={setIsModalOpen} 
                onSuccess={fetchQuotes}
            />
        </div>
    )
}
