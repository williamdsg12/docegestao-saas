"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import {
    Plus,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRightLeft,
    Eye,
    Receipt,
    Trash2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { PageFilters } from "@/components/dashboard/PageFilters"
import { PageSearch } from "@/components/dashboard/PageSearch"
import { EmptyStateV2 } from "@/components/dashboard/EmptyStateV2"

interface Quote {
    id: string
    client_name: string
    total: number
    status: "Aguardando" | "Aprovado" | "Recusado"
    created_at: string
    valid_until: string
}

const statusConfig: Record<string, any> = {
    Aguardando: { label: "Em Negociação", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    Aprovado: { label: "Aprovado", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    Recusado: { label: "Recusado", icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
}

export default function OrcamentosPage() {
  return (
    <FeatureGuard feature="orcamentos" planRequired="pro">
      <div className="space-y-8 pb-20">
        <OrcamentosContent />
      </div>
    </FeatureGuard>
  )
}

function OrcamentosContent() {
    const { profile } = useBusiness()
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [search, setSearch] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("todos")
    const [loading, setLoading] = useState(true)
    const [newQuoteOpen, setNewQuoteOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState({
        client_id: "",
        total: "",
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })

    useEffect(() => {
        if (profile?.company_id || profile?.tenant_id) {
            initData()
        }
    }, [profile])

    async function initData() {
        const tenantId = profile?.tenant_id || profile?.company_id
        if (!tenantId) return
        setLoading(true)
        try {
            const [quotesRes, clientsRes] = await Promise.all([
                supabase.from('quotes').select('*').eq('company_id', tenantId).order('created_at', { ascending: false }),
                supabase.from('customers').select('id, name').eq('tenant_id', tenantId).order('name')
            ])

            const clientsData = clientsRes.data || []
            setQuotes(quotesRes.data?.map((q: any) => ({
                ...q,
                client_name: clientsData.find((c: any) => c.id === q.client_id)?.name || "Cliente Desconhecido"
            })) || [])
            setClients(clientsData)
        } catch (error) {
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    async function handleSaveQuote() {
        if (!formData.client_id || !formData.total) return toast.error("Preencha cliente e valor")
        setIsSaving(true)
        try {
            const tenantId = profile?.tenant_id || profile?.company_id
            const { data, error } = await supabase.from('quotes').insert({
                company_id: tenantId,
                client_id: formData.client_id,
                total: parseFloat(formData.total),
                status: 'Aguardando',
                valid_until: formData.valid_until
            }).select().single()

            if (error) throw error
            toast.success("Orçamento gerado!")
            initData()
            setNewQuoteOpen(false)
        } catch (e) {
            toast.error("Erro ao criar orçamento")
        } finally {
            setIsSaving(false)
        }
    }

    async function updateStatus(id: string, newStatus: string) {
        try {
            await supabase.from('quotes').update({ status: newStatus }).eq('id', id)
            setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: newStatus as any } : q))
            toast.success(`Status atualizado!`)
        } catch (e) { toast.error("Erro ao atualizar") }
    }

    async function deleteQuote(id: string) {
        if (!confirm("Excluir este orçamento?")) return
        try {
            await supabase.from('quotes').delete().eq('id', id)
            setQuotes(prev => prev.filter(q => q.id !== id))
            toast.success("Excluído")
        } catch (e) { toast.error("Erro") }
    }

    const filtered = quotes.filter(q => {
        const matchSearch = q.client_name.toLowerCase().includes(search.toLowerCase())
        const matchStatus = filterStatus === "todos" || q.status === filterStatus
        return matchSearch && matchStatus
    })

    const statusCounts = {
        total: quotes.length,
        Aguardando: quotes.filter(q => q.status === 'Aguardando').length,
        Aprovado: quotes.filter(q => q.status === 'Aprovado').length,
        Recusado: quotes.filter(q => q.status === 'Recusado').length,
    }

    const filterOptions = [
        { key: "todos", label: "Todos", count: statusCounts.total },
        { key: "Aguardando", label: "Aguardando", count: statusCounts.Aguardando },
        { key: "Aprovado", label: "Aprovado", count: statusCounts.Aprovado },
        { key: "Recusado", label: "Recusado", count: statusCounts.Recusado },
    ]

    return (
        <>
            <PageHeader 
                title="Gestão de" 
                highlight="Orçamentos" 
                subtitle="Crie cotações profissionais e converta em vendas incríveis"
                actions={(
                    <Button onClick={() => setNewQuoteOpen(true)} className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 font-black uppercase text-[10px] text-white shadow-lg">
                        <Plus className="mr-2 size-4" /> Novo Orçamento
                    </Button>
                )}
            />

            <div className="space-y-6">
                <PageFilters options={filterOptions} activeKey={filterStatus} onSelect={setFilterStatus} />
                <PageSearch value={search} onChange={setSearch} placeholder="Buscar por cliente ou valor..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filtered.map((quote) => {
                        const config = statusConfig[quote.status]
                        return (
                            <motion.div
                                key={quote.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", config.bg, config.color)}>
                                        <config.icon className="size-6" />
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="size-8 rounded-lg text-slate-400" onClick={() => deleteQuote(quote.id)}>
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-6">
                                    <h3 className="text-lg font-black text-slate-900 uppercase italic leading-tight truncate">{quote.client_name}</h3>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase border-none px-0", config.color)}>{config.label}</Badge>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Validade: {new Date(quote.valid_until).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between mb-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Total</span>
                                    <span className="text-xl font-black text-slate-900 italic">R$ {quote.total.toFixed(2)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {quote.status === "Aguardando" ? (
                                        <>
                                            <Button onClick={() => updateStatus(quote.id, "Aprovado")} className="flex-1 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px]">Aprovar</Button>
                                            <Button onClick={() => updateStatus(quote.id, "Recusado")} variant="outline" className="h-10 rounded-xl font-black uppercase text-[10px] text-rose-500 border-rose-100 bg-rose-50/50">Recusar</Button>
                                        </>
                                    ) : (
                                        <Button variant="outline" className="w-full h-10 rounded-xl border-slate-100 text-slate-400 font-black uppercase text-[10px] gap-2">
                                            <Eye className="size-4" /> Visualizar Detalhes
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>

                {!loading && filtered.length === 0 && (
                    <EmptyStateV2 
                        icon={Receipt}
                        title="Nenhum orçamento"
                        subtitle="Crie orçamentos profissionais para encantar seus clientes"
                        action={<Button onClick={() => setNewQuoteOpen(true)} className="h-10 px-6 rounded-xl bg-rose-500 text-white font-black uppercase text-[10px]">Novo Orçamento</Button>}
                    />
                )}
            </div>

            <Dialog open={newQuoteOpen} onOpenChange={setNewQuoteOpen}>
                <DialogContent className="sm:max-w-lg rounded-[32px] p-8">
                    <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-black uppercase italic">Gerar Orçamento</DialogTitle></DialogHeader>
                    <div className="space-y-5 font-bold">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-slate-400">Cliente</Label>
                            <select className="w-full h-12 rounded-xl border-slate-100 bg-slate-50 px-4 text-sm font-bold" value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })}><option value="">Selecione</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Valor Estimado</Label><Input type="number" className="h-12 rounded-xl" value={formData.total} onChange={e => setFormData({ ...formData, total: e.target.value })} /></div>
                            <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Validade</Label><Input type="date" className="h-12 rounded-xl" value={formData.valid_until} onChange={e => setFormData({ ...formData, valid_until: e.target.value })} /></div>
                        </div>
                        <Button onClick={handleSaveQuote} disabled={isSaving} className="w-full h-14 rounded-2xl bg-rose-500 font-black uppercase text-white shadow-lg mt-4">{isSaving ? "Gerando..." : "Gerar Orçamento VIP"}</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
