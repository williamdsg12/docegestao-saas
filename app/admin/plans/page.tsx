"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus,
    CheckCircle2,
    Edit3,
    Trash2,
    Users,
    ShoppingCart,
    Database,
    Zap,
    AlertCircle,
    XCircle,
    Package
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Plan {
    id: string
    name: string
    price: number
    interval: string
    features: string[]
    active: boolean
    max_orders: number
    max_products: number
    max_clients: number
}

export default function PlansManagement() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const formData = new FormData(e.target as HTMLFormElement)
            const featuresArray = (formData.get('features') as string)
                .split('\n')
                .map(f => f.trim())
                .filter(f => f.length > 0)
                
            const updates = {
                name: formData.get('name') as string,
                price: parseFloat(formData.get('price') as string),
                max_clients: parseInt(formData.get('max_clients') as string),
                max_orders: parseInt(formData.get('max_orders') as string),
                max_products: parseInt(formData.get('max_products') as string),
                features: featuresArray
            }

            if (selectedPlan) {
                const { error } = await supabase.from('plans').update(updates).eq('id', selectedPlan.id)
                if (error) throw error
                toast.success("Plano editado com sucesso!")
                setPlans(prev => prev.map(p => p.id === selectedPlan.id ? { ...p, ...updates } : p))
            } else {
                toast.error("Criação de novos planos deve ser via banco por enquanto.")
            }
            setIsDialogOpen(false)
            setSelectedPlan(null)
        } catch (error: any) {
            console.error("Erro ao salvar:", error)
            toast.error("Erro ao salvar o plano")
        }
    }

    const openNewPlan = () => {
        setSelectedPlan(null)
        setIsDialogOpen(true)
    }

    const openEditPlan = (plan: Plan) => {
        setSelectedPlan(plan)
        setIsDialogOpen(true)
    }

    useEffect(() => {
        fetchPlans()
    }, [])

    async function fetchPlans() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .order('price', { ascending: true })

            if (error) throw error

            const formatted: Plan[] = data.map((p: any) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                interval: p.interval || 'month',
                features: p.features || [],
                active: p.is_active !== false,
                max_orders: p.max_orders || 0,
                max_products: p.max_products || 0,
                max_clients: p.max_clients || 0
            }))

            setPlans(formatted)
        } catch (error: any) {
            console.error("Error fetching plans:", error)
            // Mock data for UI 
            setPlans([
                 { id: '1', name: 'Start', price: 97.90, interval: 'month', features: ['Até 100 Clientes', 'Suporte Básico'], active: true, max_clients: 100, max_orders: 500, max_products: 50 },
                 { id: '2', name: 'Pro', price: 147.90, interval: 'month', features: ['Clientes Ilimitados', 'Suporte Prioritário', 'Múltiplos Usuários'], active: true, max_clients: 99999, max_orders: 99999, max_products: 99999 }
            ])
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-slate-800 border-t-purple-500 rounded-full animate-spin shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Caregando Planos...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 w-full xl:max-w-[70%]">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                        <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] italic">Pricing Engine</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-[0.85]">
                        Gestão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-400">Planos</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic mt-4">Defina os preços e limites do seu SaaS</p>
                </div>
                
                <div className="flex items-center gap-4 bg-slate-900 border border-white/5 px-6 py-4 rounded-2xl shadow-xl">
                    <button 
                        onClick={openNewPlan}
                        className="flex items-center gap-2 h-12 px-6 rounded-xl bg-purple-600 text-white font-black uppercase italic text-xs tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                        <Plus className="size-4" /> Novo Plano
                    </button>
                </div>
            </div>

            {/* Quick Insights Section */}
            <div className="bg-slate-900 border border-white/5 rounded-[40px] p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-purple-500/10 blur-[100px] rounded-full translate-x-1/2 pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div>
                        <div className="size-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 shadow-inner shadow-purple-500/20">
                            <Zap className="size-6" />
                        </div>
                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Métricas de <span className="text-purple-400 italic">Conversão</span></h3>
                        <p className="text-slate-400 font-bold text-sm max-w-lg">Acompanhe qual é o plano de maior adesão e o valor médio gerado por cada cliente no ecossistema.</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">ARPU</p>
                            <p className="text-3xl font-black text-white italic tracking-tighter">R$ 142.50</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Plano Popular</p>
                            <p className="text-3xl font-black text-purple-400 italic tracking-tighter">Pro</p>
                        </div>
                        <div className="col-span-2 lg:col-span-1 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-12">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Receita ARR</p>
                            <p className="text-3xl font-black text-emerald-400 italic tracking-tighter">R$ 1.7M</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {plans.map((plan, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={plan.id}
                        className="bg-slate-900 border border-white/5 rounded-[40px] p-10 relative overflow-hidden group hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 transition-all"
                    >
                        {/* Status Badge */}
                        <div className={cn(
                            "absolute top-8 right-8 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            plan.active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        )}>
                            {plan.active ? 'Ativo' : 'Inativo'}
                        </div>

                        {/* Icon & Title */}
                        <div className="size-16 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 mb-8 shadow-inner shadow-black/50 italic font-black text-2xl group-hover:scale-110">
                            <Package className="size-8" />
                        </div>

                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-10">
                            <span className="text-5xl font-black text-white tracking-tighter italic">R$ {plan.price}</span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">/ {plan.interval === 'month' ? 'mês' : plan.interval}</span>
                        </div>

                        {/* Limits Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-10 pb-10 border-b border-white/5">
                            <div className="flex flex-col items-center gap-2">
                                <Users className="size-5 text-slate-400" />
                                <span className="font-black text-white text-sm tracking-tighter italic">{plan.max_clients === 99999 ? 'ILIMITADO' : plan.max_clients}</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Clientes</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 border-x border-white/5">
                                <ShoppingCart className="size-5 text-slate-400" />
                                <span className="font-black text-white text-sm tracking-tighter italic">{plan.max_orders === 99999 ? 'ILIMITADO' : plan.max_orders}</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Pedidos</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <Database className="size-5 text-slate-400" />
                                <span className="font-black text-white text-sm tracking-tighter italic">{plan.max_products === 99999 ? 'ILIMITADO' : plan.max_products}</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Produtos</span>
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="space-y-4 mb-12">
                            {plan.features.slice(0, 5).map((f: string, i: number) => (
                                <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                    <CheckCircle2 className="size-4 text-purple-400 shrink-0" />
                                    <span>{f}</span>
                                </div>
                            ))}
                            {plan.features.length > 5 && (
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">+ {plan.features.length - 5} funcionalidades extras</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-auto">
                            <button 
                                onClick={() => openEditPlan(plan)}
                                className="flex-1 h-14 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase italic text-xs tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center justify-center gap-2"
                            >
                                <Edit3 className="size-4" /> Configurar
                            </button>
                            <button 
                                onClick={() => toast.error("Ação de excluir não permitida em modo demonstração")}
                                className="size-14 rounded-xl border border-rose-500/20 text-rose-500 hover:text-white hover:bg-rose-500 transition-all focus:outline-none flex items-center justify-center"
                            >
                                <Trash2 className="size-5" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] border-white/10 bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl overflow-hidden">
                    <div className="absolute -top-40 -right-40 size-80 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <DialogHeader className="mb-6 relative z-10">
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                            {selectedPlan ? 'Editar' : 'Novo'} <span className="text-purple-400">Plano</span>
                        </DialogTitle>
                        <DialogDescription className="font-bold uppercase tracking-widest text-[10px] text-slate-400 mt-2">
                            Configure os limites e valores para os usuários do ecossistema.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSavePlan} className="space-y-6 relative z-10">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Plano</Label>
                                <Input name="name" defaultValue={selectedPlan?.name} placeholder="Ex: Pro, Platinum..." className="h-14 rounded-2xl bg-slate-950 border-white/5 font-bold text-white focus:ring-2 focus:ring-purple-500/50 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preço (R$)</Label>
                                <Input name="price" type="number" step="0.01" defaultValue={selectedPlan?.price} placeholder="0.00" className="h-14 rounded-2xl bg-slate-950 border-white/5 font-bold text-white focus:ring-2 focus:ring-purple-500/50 transition-all" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 truncate">Lim. Clientes (99999 = Ilimitado)</Label>
                                <Input name="max_clients" type="number" defaultValue={selectedPlan?.max_clients} className="h-14 rounded-2xl bg-slate-950 border-white/5 font-bold text-white text-center focus:ring-2 focus:ring-purple-500/50" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 truncate">Lim. Pedidos (99999 = Ilimitado)</Label>
                                <Input name="max_orders" type="number" defaultValue={selectedPlan?.max_orders} className="h-14 rounded-2xl bg-slate-950 border-white/5 font-bold text-white text-center focus:ring-2 focus:ring-purple-500/50" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 truncate">Lim. Receitas (99999 = Ilimitado)</Label>
                                <Input name="max_products" type="number" defaultValue={selectedPlan?.max_products} className="h-14 rounded-2xl bg-slate-950 border-white/5 font-bold text-white text-center focus:ring-2 focus:ring-purple-500/50" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Funcionalidades (uma por linha)</Label>
                            <Textarea 
                                name="features" 
                                defaultValue={selectedPlan?.features?.join('\n')} 
                                placeholder="Ex: Relatórios Avançados&#10;Suporte 24/7" 
                                className="min-h-[120px] rounded-2xl bg-slate-950 border-white/5 font-bold text-white focus:ring-2 focus:ring-purple-500/50 p-4" 
                            />
                        </div>
                        <DialogFooter className="gap-4 mt-8">
                            <button type="button" onClick={() => setIsDialogOpen(false)} className="h-14 px-8 rounded-2xl text-slate-400 font-black uppercase italic text-xs tracking-widest hover:text-white transition-colors focus:outline-none">
                                Cancelar
                            </button>
                            <button type="submit" className="h-14 px-8 rounded-2xl bg-purple-600 text-white font-black uppercase italic text-xs tracking-widest hover:scale-[1.02] shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-transform flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                                {selectedPlan ? 'Salvar Configurações' : 'Implantar Plano'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
