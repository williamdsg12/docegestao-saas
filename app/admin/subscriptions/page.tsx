"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    CreditCard,
    Mail,
    Shield,
    MoreHorizontal,
    Edit3,
    CheckCircle2,
    XCircle,
    Building2,
    Filter,
    ArrowUpRight,
    RefreshCw,
    AlertCircle,
    ChevronRight
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AdminModal } from "@/components/admin/AdminModal"
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog"
import { AdminButton } from "@/components/admin/AdminButton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface Subscription {
    id: string
    user_id: string
    company_name: string
    owner_name: string
    owner_email: string
    plan_name: string
    plan_price: number
    status: 'trial' | 'active' | 'expired' | 'canceled' | 'past_due'
    trial_end: string | null
    current_period_end: string | null
    created_at: string
}

export default function SubscriptionsManagement() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    
    const [plans, setPlans] = useState<any[]>([])
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
    const [actionLoading, setActionLoading] = useState(false)

    // Form states
    const [formData, setFormData] = useState({
        user_id: '',
        company_id: '',
        plan_id: '',
        status: 'trial' as any,
        frequency: 'mensal' as 'mensal' | 'anual',
        trial_end: '',
        current_period_end: ''
    })

    useEffect(() => {
        fetchSubscriptions()
        fetchPlans()
    }, [])

    async function fetchPlans() {
        try {
            const res = await fetch('/api/admin/plans')
            const data = await res.json()
            setPlans(data)
        } catch (error) {
            console.error("error fetching plans")
        }
    }

    async function fetchSubscriptions() {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/subscriptions')
            if (!response.ok) {
                throw new Error('API Error')
            }
            const data = await response.json()

            if (!data || data.length === 0) {
                setSubscriptions([])
                return
            }

            const formatted: Subscription[] = data.map((s: any) => ({
                id: s.id,
                user_id: s.user_id || s.owner_id,
                company_name: s.empresas?.name || s.profiles?.business_name || 'Desconhecido',
                owner_name: s.profiles?.owner_name || 'Usuário',
                owner_email: s.profiles?.email || 'N/A',
                plan_name: s.plans?.name || 'Plano Fixado',
                plan_price: s.plans?.price || 0,
                status: s.status || 'trial',
                trial_end: s.trial_end,
                current_period_end: s.current_period_end,
                created_at: s.created_at
            }))

            setSubscriptions(formatted)
        } catch (error: any) {
            console.error("error fetching subscriptions:", error)
            // mock for UI view
            setSubscriptions([
                 { id: '1', user_id: '1', company_name: 'Doce Sabor', owner_name: 'Maria Silva', owner_email: 'maria@docesabor.com', plan_name: 'Pro', plan_price: 147.90, status: 'active', trial_end: null, current_period_end: new Date(Date.now() + 86400000 * 15).toISOString(), created_at: new Date().toISOString() },
                 { id: '2', user_id: '2', company_name: 'Bolos & Cia', owner_name: 'João Pedro', owner_email: 'joao@bolosecia.com', plan_name: 'Start', plan_price: 97.90, status: 'trial', trial_end: new Date(Date.now() + 86400000 * 3).toISOString(), current_period_end: null, created_at: new Date().toISOString() },
            ])
        } finally {
            setLoading(false)
        }
    }

    async function handleCreate() {
        setActionLoading(true)
        try {
            const res = await fetch('/api/admin/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (!res.ok) throw new Error('API Error')
            toast.success("Assinatura criada com sucesso!")
            setIsCreateModalOpen(false)
            fetchSubscriptions()
        } catch (error) {
            toast.error("Erro ao criar assinatura")
        } finally {
            setActionLoading(false)
        }
    }

    async function handleUpdate() {
        if (!selectedSub) return
        setActionLoading(true)
        try {
            const res = await fetch('/api/admin/subscriptions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedSub.id, ...formData })
            })
            if (!res.ok) throw new Error('API Error')
            toast.success("Assinatura atualizada!")
            setIsEditModalOpen(false)
            fetchSubscriptions()
        } catch (error) {
            toast.error("Erro ao atualizar assinatura")
        } finally {
            setActionLoading(false)
        }
    }

    async function handleDelete() {
        if (!selectedSub) return
        setActionLoading(true)
        try {
            const res = await fetch(`/api/admin/subscriptions?id=${selectedSub.id}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('API Error')
            toast.success("Assinatura excluída!")
            setIsDeleteOpen(false)
            fetchSubscriptions()
        } catch (error) {
            toast.error("Erro ao excluir assinatura")
        } finally {
            setActionLoading(false)
        }
    }

    const openEdit = (sub: Subscription) => {
        setSelectedSub(sub)
        setFormData({
            user_id: sub.user_id,
            company_id: (sub as any).company_id || '',
            plan_id: (sub as any).plan_id || '',
            status: sub.status,
            frequency: (sub as any).frequency || 'mensal',
            trial_end: sub.trial_end ? sub.trial_end.split('T')[0] : '',
            current_period_end: sub.current_period_end ? sub.current_period_end.split('T')[0] : ''
        })
        setIsEditModalOpen(true)
    }

    const openCreate = () => {
        setFormData({
            user_id: '',
            company_id: '',
            plan_id: plans[0]?.id || '',
            status: 'trial',
            frequency: 'mensal',
            trial_end: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
            current_period_end: ''
        })
        setIsCreateModalOpen(true)
    }

    const filteredSubscriptions = subscriptions.filter(s => {
        const matchesSearch = 
            s.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || s.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            case 'trial': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            case 'expired': return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            case 'past_due': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
            case 'canceled': return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return "Ativa"
            case 'trial': return "Em Teste"
            case 'expired': return "Expirada"
            case 'past_due': return "Em Atraso"
            case 'canceled': return "Cancelada"
            default: return "Desconhecido"
        }
    }

    const trialCount = subscriptions.filter(s => s.status === 'trial').length
    const activeCount = subscriptions.filter(s => s.status === 'active').length

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="size-16 border-4 border-white/[0.05] border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Caregando Assinaturas...</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                        Gestão de <span className="text-indigo-400">Assinaturas</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">Controle completo do ciclo de vida e faturamento dos parceiros.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl">
                        <div className="text-right">
                             <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider leading-none">Growth</p>
                             <div className="flex gap-3 mt-1">
                                <span className="text-xs font-bold text-emerald-500">{activeCount} Ativos</span>
                                <span className="text-xs font-bold text-amber-500">{trialCount} Trial</span>
                             </div>
                        </div>
                        <button 
                            onClick={fetchSubscriptions}
                            className="size-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center hover:bg-indigo-500/20 transition-all border border-indigo-500/10"
                        >
                            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                        </button>
                    </div>

                    <AdminButton 
                        label="Nova Assinatura"
                        icon={CreditCard}
                        onClick={openCreate}
                        className="bg-indigo-600 text-white h-11 px-6 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-xs font-semibold"
                    />
                </div>
            </div>

            {/* List & Filters Section */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#09090b] border border-white/[0.05] rounded-xl overflow-hidden shadow-sm relative"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between relative z-10">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar empresa, titular ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-white/5 text-slate-300 text-sm rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-950 border border-white/5 text-slate-300 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="active">Ativos</option>
                            <option value="trial">Em Teste</option>
                            <option value="expired">Expirados</option>
                            <option value="past_due">Inadimplentes</option>
                            <option value="canceled">Cancelados</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Assinante / Empresa</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Plano Atual</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Valor Pago</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Ciclo / Trial</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSubscriptions.map((sub, index) => (
                                <tr 
                                    key={sub.id} 
                                    onClick={() => openEdit(sub)}
                                    className="hover:bg-slate-800/20 transition-colors group cursor-pointer relative"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-black group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors shadow-inner shadow-black/50">
                                                <CreditCard className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm mb-0.5">{sub.company_name}</p>
                                                <div className="flex flex-col text-xs text-slate-500">
                                                    <span className="font-bold">{sub.owner_name}</span>
                                                    <span>{sub.owner_email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-white/5 text-slate-300 rounded-lg text-xs font-bold border border-white/10 uppercase tracking-widest shadow-sm">
                                            {sub.plan_name}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-black text-white italic">
                                        R$ {sub.plan_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            getStatusStyle(sub.status)
                                        )}>
                                            {getStatusLabel(sub.status)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            {sub.status === 'trial' ? (
                                                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                                                    <AlertCircle className="size-3" />
                                                    Término: {sub.trial_end ? format(new Date(sub.trial_end), "dd/MM", { locale: ptBR }) : 'N/A'}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                    <RefreshCw className="size-3 text-slate-500" />
                                                    Renova: {sub.current_period_end ? format(new Date(sub.current_period_end), "dd/MM/yyyy") : 'Manual'}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <TooltipProvider delayDuration={0}>
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openEdit(sub)
                                                            }}
                                                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
                                                        >
                                                            <Edit3 className="size-4" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-slate-900 border-white/10 text-white font-bold text-[10px] uppercase italic">
                                                        Editar Assinatura
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedSub(sub)
                                                                setIsDeleteOpen(true)
                                                            }}
                                                            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-colors"
                                                        >
                                                            <XCircle className="size-4" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-slate-900 border-white/10 text-rose-400 font-bold text-[10px] uppercase italic">
                                                        Excluir Registro
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors">
                                                            <ChevronRight className="size-4" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-slate-900 border-white/10 text-white font-bold text-[10px] uppercase italic">
                                                        Ver Detalhes
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TooltipProvider>
                                    </td>
                                </tr>
                            ))}
                            {filteredSubscriptions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-6 max-w-xs mx-auto">
                                            <div className="size-20 rounded-[32px] bg-slate-900 border border-white/5 flex items-center justify-center text-slate-600 shadow-inner">
                                                <CreditCard className="size-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-white font-black uppercase italic tracking-widest text-sm">Nenhuma Assinatura</p>
                                                <p className="text-slate-500 text-xs font-bold leading-relaxed">Não encontramos contratos correspondentes aos filtros atuais.</p>
                                            </div>
                                            <button 
                                                onClick={openCreate}
                                                className="h-11 px-6 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-indigo-500/20"
                                            >
                                                Criar Primeira Assinatura
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Modals */}
            <AdminModal
                isOpen={isCreateModalOpen || isEditModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                title={isCreateModalOpen ? "Configurar Assinatura" : "Editar Assinatura"}
                description="Defina os parâmetros do ciclo de vida do parceiro."
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">User ID</Label>
                            <Input 
                                value={formData.user_id}
                                onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                                placeholder="UUID do Usuário"
                                className="bg-slate-950 border-white/5 h-12 rounded-xl focus:ring-indigo-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Company ID</Label>
                            <Input 
                                value={formData.company_id}
                                onChange={(e) => setFormData({...formData, company_id: e.target.value})}
                                placeholder="UUID da Empresa"
                                className="bg-slate-950 border-white/5 h-12 rounded-xl focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Duração / Frequência</Label>
                            <Select 
                                value={formData.frequency}
                                onValueChange={(v: any) => setFormData({...formData, frequency: v})}
                            >
                                <SelectTrigger className="bg-slate-950 border-white/5 h-12 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white">
                                    <SelectItem value="mensal">Mensal</SelectItem>
                                    <SelectItem value="anual">Anual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Status Lifecycle</Label>
                            <Select 
                                value={formData.status}
                                onValueChange={(v) => setFormData({...formData, status: v})}
                            >
                                <SelectTrigger className="bg-slate-950 border-white/5 h-12 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white">
                                    <SelectItem value="trial">Em Teste (Trial)</SelectItem>
                                    <SelectItem value="active">Ativo</SelectItem>
                                    <SelectItem value="past_due">Em Atraso</SelectItem>
                                    <SelectItem value="canceled">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Trial Ends At</Label>
                            <Input 
                                type="date"
                                value={formData.trial_end}
                                onChange={(e) => setFormData({...formData, trial_end: e.target.value})}
                                className="bg-slate-950 border-white/5 h-12 rounded-xl focus:ring-indigo-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Period Ends At</Label>
                            <Input 
                                type="date"
                                value={formData.current_period_end}
                                onChange={(e) => setFormData({...formData, current_period_end: e.target.value})}
                                className="bg-slate-950 border-white/5 h-12 rounded-xl focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>

                    <button
                        onClick={isCreateModalOpen ? handleCreate : handleUpdate}
                        disabled={actionLoading}
                        className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center"
                    >
                        {actionLoading ? (
                            <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (isCreateModalOpen ? "Ativar Assinatura" : "Salvar Alterações")}
                    </button>
                </div>
            </AdminModal>

            <ConfirmationDialog 
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                loading={actionLoading}
                title="Excluir Assinatura?"
                description="Esta ação removerá permanentemente o acesso do parceiro a este contrato. A empresa e o usuário não serão excluídos."
                confirmText="Terminar Contrato"
            />
        </div>
    )
}
