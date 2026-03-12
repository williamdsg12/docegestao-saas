"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import {
    Plus,
    Search,
    FileText,
    MoreHorizontal,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRightLeft,
    Download,
    Eye
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface Quote {
    id: string
    client_name: string
    total: number
    status: "Aguardando" | "Aprovado" | "Recusado"
    created_at: string
    valid_until: string
}

export default function OrcamentosPage() {
    const { user } = useAuth()
    const { profile } = useBusiness()
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [companyId, setCompanyId] = useState<string | null>(null)

    const [newQuoteOpen, setNewQuoteOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        client_id: "",
        total: "",
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })

    useEffect(() => {
        if (profile?.company_id) {
            initData()
        }
    }, [profile])

    async function initData() {
        if (!profile?.company_id) return
        setLoading(true)
        try {
            const [quotesRes, clientsRes] = await Promise.all([
                supabase.from('quotes').select('id, status, total, created_at, valid_until, client_id, company_id').eq('company_id', profile.company_id).order('created_at', { ascending: false }),
                supabase.from('clients').select('id, name').eq('company_id', profile.company_id).order('name')
            ])

            const clientsData = clientsRes.data || []

            if (quotesRes.data) {
                setQuotes(quotesRes.data.map((q: any) => ({
                    id: q.id,
                    client_name: clientsData.find((c: any) => c.id === q.client_id)?.name || "Cliente Desconhecido",
                    total: q.total,
                    status: q.status,
                    created_at: q.created_at,
                    valid_until: q.valid_until
                })))
            }
            setClients(clientsData)
        } catch (error: any) {
            console.error(error)
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    async function handleSaveQuote() {
        if (!formData.client_id || !formData.total) {
            toast.error("Preencha o cliente e total")
            return
        }
        setIsSaving(true)
        try {
            const { data, error } = await supabase.from('quotes').insert({
                company_id: profile?.company_id,
                client_id: formData.client_id,
                total: parseFloat(formData.total),
                status: 'Aguardando',
                valid_until: formData.valid_until
            }).select('id, status, total, created_at, valid_until, client_id').single()

            if (error) throw error

            const clientName = clients.find(c => c.id === data.client_id)?.name || "Cliente Desconhecido"

            const newQuote: Quote = {
                id: data.id,
                client_name: clientName,
                total: data.total,
                status: data.status,
                created_at: data.created_at,
                valid_until: data.valid_until
            }
            setQuotes(prev => [newQuote, ...prev])
            setNewQuoteOpen(false)
            toast.success("Orçamento salvo!")
        } catch (e: any) {
            console.error(e)
            toast.error("Erro ao criar orçamento")
        } finally {
            setIsSaving(false)
        }
    }

    async function updateStatus(id: string, newStatus: string) {
        try {
            const { error } = await supabase.from('quotes').update({ status: newStatus }).eq('id', id)
            if (error) throw error
            setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: newStatus as any } : q))
            toast.success(`Orçamento ${newStatus}!`)
        } catch (e) {
            toast.error("Erro ao atualizar")
        }
    }

    const getStatusIcon = (status: Quote["status"]) => {
        switch (status) {
            case "Aguardando": return Clock
            case "Aprovado": return CheckCircle2
            case "Recusado": return XCircle
        }
    }

    const getStatusColor = (status: Quote["status"]) => {
        switch (status) {
            case "Aguardando": return "bg-amber-50 text-amber-600 border-amber-200"
            case "Aprovado": return "bg-emerald-50 text-emerald-600 border-emerald-200"
            case "Recusado": return "bg-rose-50 text-rose-600 border-rose-200"
        }
    }

    const convertToOrder = (quote: Quote) => {
        toast.success(`Orçamento de ${quote.client_name} convertido em pedido!`)
        // Logic to insert into orders table would go here
    }

    return (
        <div className="space-y-12 pb-24">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
            >
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 italic uppercase leading-none">
                        Orçamentos <span className="text-primary tracking-tighter italic">& Negócios</span>
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight italic">Gerencie suas cotações com profissionalismo e converta em vendas.</p>
                </div>
                <Dialog open={newQuoteOpen} onOpenChange={setNewQuoteOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-16 px-10 rounded-[28px] bg-primary hover:bg-rose-500 text-white font-black italic uppercase text-[11px] tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            <Plus className="mr-3 size-5" />
                            Novo Orçamento VIP
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl border-white/60 bg-white/90 backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-3xl font-black italic uppercase text-slate-900">
                                Novo <span className="text-primary italic">Orçamento</span>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</Label>
                                <select 
                                    className="w-full h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 text-sm font-bold outline-none"
                                    value={formData.client_id}
                                    onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                                >
                                    <option value="">Selecione um cliente...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Total Estimado (R$)</Label>
                                    <Input
                                        type="number"
                                        className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 font-bold"
                                        value={formData.total}
                                        onChange={e => setFormData({ ...formData, total: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Validade</Label>
                                    <Input
                                        type="date"
                                        className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 font-bold"
                                        value={formData.valid_until}
                                        onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button 
                                onClick={handleSaveQuote} disabled={isSaving}
                                className="h-14 mt-4 bg-primary text-white font-black uppercase shadow-xl hover:scale-105 rounded-2xl"
                            >
                                {isSaving ? "Gerando..." : "Gerar Orçamento VIP"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: "Aguardando Resposta", value: quotes.filter(q => q.status === 'Aguardando').length.toString().padStart(2, '0'), icon: Clock, color: "rose", bg: "bg-rose-50/50" },
                    { label: "Aprovados este Mês", value: quotes.filter(q => q.status === 'Aprovado').length.toString().padStart(2, '0'), icon: CheckCircle2, color: "emerald", bg: "bg-emerald-50/50" },
                    { label: "Total em Negociação", value: `R$ ${quotes.filter(q => q.status === 'Aguardando').reduce((a, b) => a + b.total, 0).toFixed(2)}`, icon: FileText, color: "indigo", bg: "bg-indigo-50/50" }
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                            "group relative overflow-hidden rounded-[40px] p-8 border border-white/60 shadow-xl transition-all hover:shadow-2xl",
                            stat.bg
                        )}
                    >
                        <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                            <stat.icon className="size-48" />
                        </div>
                        <div className="relative z-10 flex flex-col gap-1">
                            <span className={cn("text-[10px] font-black uppercase tracking-widest italic opacity-60", `text-${stat.color}-600`)}>
                                {stat.label}
                            </span>
                            <span className={cn("text-4xl font-black italic tracking-tighter uppercase", `text-${stat.color}-600`)}>
                                {stat.value}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters and Search */}
            <section className="p-4 rounded-[32px] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl flex items-center gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Pesquisar por cliente ou identificador..."
                        className="h-14 pl-14 pr-8 border-none bg-transparent font-black italic uppercase text-xs text-slate-900 placeholder:text-slate-300 focus-visible:ring-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="h-10 w-px bg-slate-200 hidden md:block" />
                <Button variant="ghost" className="hidden md:flex h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                    Filtrar Status
                </Button>
            </section>

            {/* Quotes Grid */}
            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                    {quotes.filter(q => q.client_name.toLowerCase().includes(searchTerm.toLowerCase())).map((quote, idx) => {
                        const Icon = getStatusIcon(quote.status)
                        return (
                            <motion.div
                                key={quote.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-[48px] p-8 border border-white/80 shadow-lg hover:shadow-2xl hover:border-primary/20 hover:bg-white transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-8 focus-within:ring-2 focus-within:ring-primary/20"
                            >
                                <div className="flex items-center gap-8">
                                    {/* Status Visual */}
                                    <div className={cn(
                                        "size-24 rounded-[32px] flex items-center justify-center shadow-inner shrink-0 relative overflow-hidden transition-transform group-hover:scale-105",
                                        getStatusColor(quote.status)
                                    )}>
                                        <div className="absolute inset-0 bg-white opacity-20" />
                                        <Icon className="size-10 relative z-10" />
                                    </div>

                                    {/* Info Block */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">
                                                {quote.client_name}
                                            </h3>
                                            <Badge className={cn("rounded-full font-black text-[9px] uppercase tracking-widest px-3 border-none", getStatusColor(quote.status))}>
                                                {quote.status}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-3" /> Emitido: {new Date(quote.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                                            <div className="flex items-center gap-2 text-rose-400">
                                                <Clock className="size-3" /> Expira em: {new Date(quote.valid_until).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial and Actions */}
                                <div className="flex flex-col md:flex-row items-center gap-10">
                                    <div className="text-center md:text-right">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 block mb-1">Preço Sugerido</span>
                                        <span className="text-4xl font-black text-slate-900 tracking-tightest italic leading-none">
                                            {quote.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {quote.status === "Aprovado" && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => convertToOrder(quote)}
                                                className="h-16 px-10 rounded-[28px] bg-emerald-500 hover:bg-emerald-600 text-white font-black italic uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-200/50 transition-all flex items-center gap-3"
                                            >
                                                <ArrowRightLeft className="size-5" />
                                                Converter Pedido
                                            </motion.button>
                                        )}

                                        <div className="flex gap-2">
                                            {quote.status === "Aguardando" && (
                                                <>
                                                    <Button 
                                                        variant="ghost" 
                                                        onClick={() => updateStatus(quote.id, "Aprovado")}
                                                        className="h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all"
                                                    >
                                                        Aprovar
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        onClick={() => updateStatus(quote.id, "Recusado")}
                                                        className="h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all"
                                                    >
                                                        Recusar
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}
