"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    ChevronLeft, 
    ChevronRight, 
    Plus, 
    Trash2, 
    Check, 
    User, 
    Calendar, 
    DollarSign, 
    Layout, 
    Eye, 
    Send,
    Package,
    Loader2,
    CalendarDays,
    Info,
    Smartphone,
    Mail,
    FileText,
    ArrowRight,
    TrendingUp,
    CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useBusiness } from "@/hooks/useBusiness"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MultiStepQuoteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

const STEPS = [
    { id: 1, title: "Cliente", icon: User },
    { id: 2, title: "Detalhes", icon: CalendarDays },
    { id: 3, title: "Custos", icon: DollarSign },
    { id: 4, title: "Lucro", icon: TrendingUp },
    { id: 5, title: "Visualização", icon: Eye },
    { id: 6, title: "Resumo", icon: FileText },
    { id: 7, title: "Envio", icon: Send },
]

export function MultiStepQuoteModal({ open, onOpenChange, onSuccess }: MultiStepQuoteModalProps) {
    const { profile } = useBusiness()
    const [step, setStep] = useState(1)
    const [isSaving, setIsSaving] = useState(false)
    const [clients, setClients] = useState<any[]>([])
    const [searchingClient, setSearchingClient] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        client_id: "",
        client_name: "",
        client_whatsapp: "",
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        event_date: "",
        delivery_date: "",
        description: "",
        internal_costs: [] as { description: string; value: number; show: boolean }[],
        profit_type: "percent" as "fixed" | "percent",
        profit_value: 30,
        display_options: {
            showDetails: true,
            language: "pt-BR",
            template: "premium-confectionery"
        },
        observations: "",
        include_business_info: true,
        include_payment_info: true,
    })

    useEffect(() => {
        if (open) {
            setStep(1)
            fetchClients()
        }
    }, [open])

    async function fetchClients() {
        const tenantId = profile?.tenant_id || profile?.company_id
        if (!tenantId) return
        setSearchingClient(true)
        try {
            const { data } = await supabase.from('customers').select('*').eq('tenant_id', tenantId).order('name')
            setClients(data || [])
        } catch (e) {
            console.error(e)
        } finally {
            setSearchingClient(false)
        }
    }

    // Calculations
    const costsTotal = useMemo(() => {
        return formData.internal_costs.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
    }, [formData.internal_costs])

    const profitAmount = useMemo(() => {
        if (formData.profit_type === 'fixed') return Number(formData.profit_value) || 0
        return costsTotal * ((Number(formData.profit_value) || 0) / 100)
    }, [costsTotal, formData.profit_type, formData.profit_value])

    const finalTotal = useMemo(() => {
        return costsTotal + profitAmount
    }, [costsTotal, profitAmount])

    const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length))
    const prevStep = () => setStep(s => Math.max(s - 1, 1))

    async function handleSave() {
        setIsSaving(true)
        try {
            const tenantId = profile?.tenant_id || profile?.company_id
            
            // 1. Insert Quote
            const { data: quote, error: quoteError } = await supabase.from('quotes').insert({
                company_id: tenantId,
                client_id: formData.client_id || null,
                status: 'draft',
                event_date: formData.event_date || null,
                delivery_date: formData.delivery_date || null,
                valid_until: formData.valid_until,
                description: formData.description,
                internal_costs_total: costsTotal,
                profit_type: formData.profit_type,
                profit_value: formData.profit_value,
                total_final: finalTotal,
                display_options: formData.display_options,
                observations: formData.observations,
            }).select().single()

            if (quoteError) throw quoteError

            // 2. Insert Costs
            if (formData.internal_costs.length > 0) {
                const costsToInsert = formData.internal_costs.map(c => ({
                    quote_id: quote.id,
                    description: c.description,
                    value: c.value,
                    show_to_client: c.show
                }))
                await supabase.from('quote_costs').insert(costsToInsert)
            }

            toast.success("Orçamento gerado com sucesso!")
            onSuccess?.()
            onOpenChange(false)
        } catch (e: any) {
            toast.error("Erro ao salvar: " + e.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1100px] w-[95vw] p-0 overflow-hidden bg-white rounded-[24px] border-none shadow-2xl">
                <div className="flex flex-col md:flex-row h-[85vh]">
                    
                    {/* COLUNA ESQUERDA (PROGRESSO) - 260px fixa no desktop */}
                    <div className="w-full md:w-[260px] bg-slate-950 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shrink-0 border-r border-slate-800">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[100px] rounded-full -mr-16 -mt-16" />
                        
                        <div>
                            {/* Logo Placeholder */}
                            <div className="mb-10 flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                    <Layout size={20} />
                                </div>
                                <div>
                                    <h3 className="text-white font-black uppercase tracking-tighter text-lg leading-none">
                                        Doce <span className="text-indigo-400">Gestão</span>
                                    </h3>
                                    <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mt-1">SaaS Edition v4</p>
                                </div>
                            </div>

                            {/* Steps Indicator */}
                            <div className="relative space-y-2">
                                {/* Line connector */}
                                <div className="absolute left-5 top-5 bottom-5 w-px bg-slate-800 z-0 hidden md:block" />
                                
                                {STEPS.map((s, idx) => (
                                    <div key={s.id} className={cn(
                                        "flex items-center gap-4 transition-all duration-300 relative z-10",
                                        step === s.id ? "translate-x-1" : ""
                                    )}>
                                        <div className={cn(
                                            "size-10 rounded-xl flex items-center justify-center transition-all border-2",
                                            step === s.id ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30" : 
                                            step > s.id ? "bg-slate-900 border-slate-700 text-indigo-400" : "bg-slate-950 border-slate-800 text-slate-600"
                                        )}>
                                            {step > s.id ? <CheckCircle2 className="size-5" /> : <s.icon className="size-4" />}
                                        </div>
                                        <div className={cn("hidden md:block transition-all", step === s.id ? "opacity-100" : "opacity-40")}>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Etapa {s.id}</p>
                                            <p className={cn("text-xs font-bold", step >= s.id ? "text-slate-200" : "text-slate-500")}>{s.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Card Total Estimado (Sticky Bottom) */}
                        <div className="mt-8 md:mt-0 p-5 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 backdrop-blur-md">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Total Estimado</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xs font-bold text-indigo-300">R$</span>
                                <p className="text-2xl font-black text-white italic tracking-tighter">
                                    {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-indigo-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(step / STEPS.length) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DIREITA (CONTEÚDO) */}
                    <div className="flex-1 flex flex-col bg-slate-50/50 relative overflow-hidden">
                        
                        {/* Header Content */}
                        <header className="px-8 md:px-12 py-8 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-xl z-10 sticky top-0">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-black text-[9px] uppercase tracking-widest border border-indigo-100">
                                        PASSO {step} DE {STEPS.length}
                                    </div>
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mt-2 leading-none">
                                    {STEPS[step - 1].title}
                                </h2>
                            </div>
                            <Button 
                                variant="ghost" 
                                className="size-10 rounded-full hover:bg-slate-100 text-slate-400" 
                                onClick={() => onOpenChange(false)}
                            >
                                <Plus className="size-6 rotate-45" />
                            </Button>
                        </header>

                        {/* Form Body */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <ScrollArea className="flex-1 h-full px-8 md:px-12 py-8">
                                <AnimatePresence mode="wait">
                                        <motion.div
                                            key={step}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                            className="w-full space-y-10 pb-24"
                                        >
                                        {/* STEP 1: CLIENTE */}
                                        {step === 1 && (
                                            <div className="space-y-8">
                                                <div className="space-y-4">
                                                    <Label className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] ml-2 italic">Selecionar Base</Label>
                                                    <div className="relative group">
                                                        <select 
                                                            className="w-full h-12 rounded-[10px] bg-white border border-slate-200 px-5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                                                            value={formData.client_id}
                                                            onChange={(e) => {
                                                                const c = clients.find(cl => cl.id === e.target.value)
                                                                setFormData({ 
                                                                    ...formData, 
                                                                    client_id: e.target.value,
                                                                    client_name: c?.name || "",
                                                                    client_whatsapp: c?.phone || ""
                                                                })
                                                            }}
                                                        >
                                                            <option value="">Selecione um cliente (opcional)</option>
                                                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                        </select>
                                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                            <ChevronRight size={16} className="rotate-90" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-4">
                                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Nome do Cliente</Label>
                                                        <Input 
                                                            placeholder="Ex: João Silva" 
                                                            className="h-12 rounded-[10px] border-slate-200 px-5 font-bold focus:ring-2 focus:ring-indigo-500/20"
                                                            value={formData.client_name}
                                                            onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">WhatsApp</Label>
                                                        <Input 
                                                            placeholder="(00) 00000-0000" 
                                                            className="h-12 rounded-[10px] border-slate-200 px-5 font-bold focus:ring-2 focus:ring-indigo-500/20"
                                                            value={formData.client_whatsapp}
                                                            onChange={e => setFormData({ ...formData, client_whatsapp: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-4">
                                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Validade</Label>
                                                        <Input 
                                                            type="date" 
                                                            className="h-12 rounded-[10px] border-slate-200 px-5 font-bold focus:ring-2 focus:ring-indigo-500/20"
                                                            value={formData.valid_until}
                                                            onChange={e => setFormData({...formData, valid_until: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Template</Label>
                                                        <div className="relative group">
                                                            <select 
                                                                className="w-full h-12 rounded-[10px] bg-white border border-slate-200 px-5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                                                                value={formData.display_options.template}
                                                                onChange={(e) => setFormData({
                                                                    ...formData, 
                                                                    display_options: { ...formData.display_options, template: e.target.value }
                                                                })}
                                                            >
                                                                <option value="premium-confectionery">Premium Confectionery</option>
                                                                <option value="minimalist-modern">Minimalist Modern</option>
                                                                <option value="classic-elegant">Classic Elegant</option>
                                                            </select>
                                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                                <ChevronRight size={16} className="rotate-90" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 2: DETALHES */}
                                        {step === 2 && (
                                            <div className="space-y-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-4">
                                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Data do Evento</Label>
                                                        <Input 
                                                            type="date" 
                                                            className="h-12 rounded-[10px] border-slate-200 px-5 font-bold"
                                                            value={formData.event_date}
                                                            onChange={e => setFormData({...formData, event_date: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Entrega</Label>
                                                        <Input 
                                                            type="date" 
                                                            className="h-12 rounded-[10px] border-slate-200 px-5 font-bold"
                                                            value={formData.delivery_date}
                                                            onChange={e => setFormData({...formData, delivery_date: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Descrição do Projeto</Label>
                                                    <textarea 
                                                        className="w-full min-h-[140px] rounded-[10px] border border-slate-200 p-5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all outline-none resize-none"
                                                        placeholder="Descreva detalhes do bolo, sabores, decoração..."
                                                        value={formData.description}
                                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 3: CUSTOS */}
                                        {step === 3 && (
                                            <div className="space-y-8">
                                                <div className="space-y-4">
                                                    {formData.internal_costs.map((item, idx) => (
                                                        <motion.div 
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            key={idx} 
                                                            className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm"
                                                        >
                                                            <Input 
                                                                placeholder="Descrição do custo" 
                                                                className="h-10 border-none bg-slate-50 font-bold text-xs"
                                                                value={item.description}
                                                                onChange={e => {
                                                                    const newCosts = [...formData.internal_costs]
                                                                    newCosts[idx].description = e.target.value
                                                                    setFormData({...formData, internal_costs: newCosts})
                                                                }}
                                                            />
                                                            <div className="w-32 flex items-center gap-2 px-3 bg-slate-50 rounded-lg">
                                                                <span className="text-[10px] font-black text-slate-400">R$</span>
                                                                <Input 
                                                                    type="number" 
                                                                    className="h-10 border-none bg-transparent font-black text-right p-0"
                                                                    value={item.value}
                                                                    onChange={e => {
                                                                        const newCosts = [...formData.internal_costs]
                                                                        newCosts[idx].value = Number(e.target.value)
                                                                        setFormData({...formData, internal_costs: newCosts})
                                                                    }}
                                                                />
                                                            </div>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="text-slate-300 hover:text-rose-500"
                                                                onClick={() => {
                                                                    const newCosts = formData.internal_costs.filter((_, i) => i !== idx)
                                                                    setFormData({...formData, internal_costs: newCosts})
                                                                }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </motion.div>
                                                    ))}

                                                    <Button 
                                                        variant="outline" 
                                                        className="w-full h-12 border-dashed border-2 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 rounded-[10px] font-black uppercase text-[10px] tracking-widest gap-2"
                                                        onClick={() => setFormData({
                                                            ...formData, 
                                                            internal_costs: [...formData.internal_costs, { description: "", value: 0, show: false }]
                                                        })}
                                                    >
                                                        <Plus size={16} /> Adicionar Custo
                                                    </Button>
                                                </div>

                                                <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-3 font-bold text-indigo-900 uppercase text-xs tracking-tight">
                                                        <Package size={18} className="text-indigo-500" />
                                                        Subtotal de Produção
                                                    </div>
                                                    <p className="text-xl font-black text-indigo-600 italic">R$ {costsTotal.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEEP 4: LUCRO */}
                                        {step === 4 && (
                                            <div className="space-y-8">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <button 
                                                        className={cn(
                                                            "p-6 rounded-2xl border-2 text-left transition-all relative group",
                                                            formData.profit_type === 'percent' ? "border-indigo-600 bg-indigo-50/50" : "border-slate-100 bg-white hover:border-slate-200"
                                                        )}
                                                        onClick={() => setFormData({...formData, profit_type: 'percent', profit_value: 30})}
                                                    >
                                                        <div className={cn(
                                                            "size-10 rounded-xl flex items-center justify-center mb-4 transition-all",
                                                            formData.profit_type === 'percent' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 font-bold"
                                                        )}>
                                                            %
                                                        </div>
                                                        <h4 className="font-black italic text-sm uppercase tracking-tight text-slate-900 leading-none">Percentual</h4>
                                                        <p className="text-[9px] font-bold text-slate-400 mt-1">Margem sobre custos</p>
                                                    </button>

                                                    <button 
                                                        className={cn(
                                                            "p-6 rounded-2xl border-2 text-left transition-all relative group",
                                                            formData.profit_type === 'fixed' ? "border-indigo-600 bg-indigo-50/50" : "border-slate-100 bg-white hover:border-slate-200"
                                                        )}
                                                        onClick={() => setFormData({...formData, profit_type: 'fixed', profit_value: 50})}
                                                    >
                                                        <div className={cn(
                                                            "size-10 rounded-xl flex items-center justify-center mb-4 transition-all",
                                                            formData.profit_type === 'fixed' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 font-bold"
                                                        )}>
                                                            $
                                                        </div>
                                                        <h4 className="font-black italic text-sm uppercase tracking-tight text-slate-900 leading-none">Valor Fixo</h4>
                                                        <p className="text-[9px] font-bold text-slate-400 mt-1">Valor adicionado bruto</p>
                                                    </button>
                                                </div>

                                                <div className="space-y-4">
                                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Definir {formData.profit_type === 'percent' ? 'Porcentagem (%)' : 'Valor (R$)'}</Label>
                                                    <div className="relative">
                                                        <Input 
                                                            type="number"
                                                            className="h-14 rounded-2xl border-slate-200 text-2xl font-black text-center pr-12"
                                                            value={formData.profit_value}
                                                            onChange={e => setFormData({...formData, profit_value: Number(e.target.value)})}
                                                        />
                                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl italic">{formData.profit_type === 'percent' ? '%' : 'R$'}</span>
                                                    </div>
                                                </div>

                                                <div className="p-8 rounded-[24px] bg-slate-900 text-white flex items-center justify-between shadow-xl">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">Resultado Final</p>
                                                        <h4 className="text-xl font-black italic uppercase leading-none">Preço de Venda</h4>
                                                    </div>
                                                    <p className="text-4xl font-black italic tracking-tighter">R$ {finalTotal.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEPS 5, 6, 7 Logic flows (Simplified but visually improved) */}
                                        {step === 5 && (
                                            <div className="space-y-8">
                                                <div className="p-6 rounded-2xl bg-white border border-slate-100 flex items-center justify-between shadow-sm">
                                                    <div>
                                                        <h5 className="font-black italic uppercase text-slate-900 text-sm">Privacidade de Itens</h5>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mostrar discriminação de custos para o cliente?</p>
                                                    </div>
                                                    <Switch 
                                                        checked={formData.display_options.showDetails}
                                                        onCheckedChange={val => setFormData({
                                                            ...formData, 
                                                            display_options: { ...formData.display_options, showDetails: val }
                                                        })}
                                                    />
                                                </div>
                                                <div className="space-y-4">
                                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Observações Financeiras</Label>
                                                    <textarea 
                                                        className="w-full min-h-[140px] rounded-[10px] border border-slate-200 p-5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all outline-none resize-none"
                                                        placeholder="Ex: 50% de entrada para confirmação, saldo na entrega..."
                                                        value={formData.observations}
                                                        onChange={e => setFormData({...formData, observations: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {step === 6 && (
                                            <div className="space-y-8">
                                                <div className="p-10 rounded-[24px] bg-white border border-slate-200 shadow-xl space-y-8 relative">
                                                    <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none">Proposta Comercial</p>
                                                            <h3 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">{formData.client_name || "Cliente"}</h3>
                                                        </div>
                                                        <Badge className="bg-slate-900 text-white font-black italic uppercase text-[9px] px-4 py-2 rounded-full">ESTADO: RASCUNHO</Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Investimento</p>
                                                            <p className="text-xl font-black text-slate-900 italic leading-none">R$ {finalTotal.toFixed(2)}</p>
                                                        </div>
                                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Validade</p>
                                                            <p className="text-xl font-black text-slate-900 italic leading-none">{new Date(formData.valid_until).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {step === 7 && (
                                             <div className="space-y-8">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <Button className="h-24 rounded-[20px] bg-white border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 flex flex-col gap-2 transition-all group overflow-hidden relative">
                                                        <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-indigo-100"><FileText size={18} /></div>
                                                        <span className="font-black uppercase text-[9px] tracking-widest relative z-10">Baixar PDF</span>
                                                    </Button>
                                                    <Button className="h-24 rounded-[20px] bg-white border-2 border-slate-100 hover:border-emerald-600 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 flex flex-col gap-2 transition-all group">
                                                        <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-emerald-100"><Smartphone size={18} /></div>
                                                        <span className="font-black uppercase text-[9px] tracking-widest">Enviar WhatsApp</span>
                                                    </Button>
                                                </div>

                                                <Button 
                                                    disabled={isSaving}
                                                    onClick={handleSave}
                                                    className="w-full h-16 rounded-[16px] bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-sm italic tracking-[0.2em] text-white shadow-xl shadow-indigo-500/20 gap-3"
                                                >
                                                    {isSaving ? <Loader2 className="animate-spin" /> : <><Check /> SALVAR E FINALIZAR</>}
                                                </Button>
                                             </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </ScrollArea>
                        </div>

                        {/* FOOTER FIXO */}
                        <footer className="h-24 px-8 md:px-12 bg-white border-t border-slate-100 flex items-center justify-between shrink-0 relative z-20">
                            <Button 
                                variant="ghost" 
                                disabled={step === 1}
                                onClick={prevStep}
                                className="h-12 px-8 rounded-[12px] font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                            >
                                <ChevronLeft size={16} className="mr-2" /> Voltar
                            </Button>
                            
                            {step < STEPS.length ? (
                                <Button 
                                    onClick={nextStep}
                                    className="h-12 px-10 rounded-[12px] bg-slate-900 hover:bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
                                >
                                    Próximo Passo <ChevronRight size={16} className="ml-2" />
                                </Button>
                            ) : (
                                <div />
                            )}
                        </footer>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
