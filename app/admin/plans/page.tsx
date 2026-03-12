"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Plus,
    Package,
    ShieldCheck,
    CheckCircle2,
    Edit3,
    Trash2,
    Users,
    ShoppingCart,
    Database,
    Zap,
    Layout
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
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">Gestão de <span className="text-primary">Planos</span></h2>
                    <p className="text-slate-500 font-medium">Defina os preços e limites do seu SaaS</p>
                </div>
                <Button 
                    onClick={openNewPlan}
                    className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase italic shadow-xl shadow-slate-900/20 hover:scale-105 transition-transform flex items-center gap-3"
                >
                    <Plus className="size-6" /> Novo Plano
                </Button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-[500px] bg-slate-50 rounded-[40px] animate-pulse" />
                    ))
                ) : plans.map((plan, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={plan.id}
                        className="bg-white border-2 border-slate-100 rounded-[40px] p-10 relative overflow-hidden group hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all"
                    >
                        {/* Status Badge */}
                        <div className={cn(
                            "absolute top-8 right-8 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic",
                            plan.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                        )}>
                            {plan.active ? 'Ativo' : 'Inativo'}
                        </div>

                        {/* Icon & Title */}
                        <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all mb-8 shadow-inner italic font-black text-2xl">
                            {plan.name.charAt(0)}
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter mb-2">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-10">
                            <span className="text-4xl font-black text-slate-900 tracking-tighter italic">R$ {plan.price}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/ mês</span>
                        </div>

                        {/* Limits Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-10 pb-10 border-b border-slate-50">
                            <div className="flex flex-col items-center gap-1">
                                <Users className="size-4 text-slate-300" />
                                <span className="font-black text-slate-900 text-xs tracking-tighter italic">{plan.max_clients === 99999 ? 'ILIM' : plan.max_clients}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Clientes</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <ShoppingCart className="size-4 text-slate-300" />
                                <span className="font-black text-slate-900 text-xs tracking-tighter italic">{plan.max_orders === 99999 ? 'ILIM' : plan.max_orders}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pedidos</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <Database className="size-4 text-slate-300" />
                                <span className="font-black text-slate-900 text-xs tracking-tighter italic">{plan.max_products === 99999 ? 'ILIM' : plan.max_products}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Receitas</span>
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="space-y-4 mb-12">
                            {plan.features.slice(0, 5).map((f: string, i: number) => (
                                <div key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    <span>{f}</span>
                                </div>
                            ))}
                            {plan.features.length > 5 && (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">+ {plan.features.length - 5} funcionalidades</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button 
                                onClick={() => openEditPlan(plan)}
                                className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic text-xs tracking-widest transition-all"
                            >
                                <Edit3 className="size-4 mr-2" /> Editar
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => toast.error("Ação de excluir não permitida em modo demonstração")}
                                className="size-12 rounded-xl border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 transition-all"
                            >
                                <Trash2 className="size-5" />
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Insights Section */}
            <div className="bg-slate-900 rounded-[40px] p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/20 blur-[120px] rounded-full translate-x-1/2" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div>
                        <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-6 shadow-inner">
                            <Zap className="size-7" />
                        </div>
                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Métricas de <span className="text-primary italic">Assinatura</span></h3>
                        <p className="text-slate-400 font-medium max-w-lg">Saiba qual é o seu plano de maior adesão e o valor médio de tempo de vida (LTV) do seu cliente.</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">ARPU</p>
                            <p className="text-3xl font-black text-white italic tracking-tighter">R$ 42.50</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Conversão</p>
                            <p className="text-3xl font-black text-white italic tracking-tighter">8.4%</p>
                        </div>
                        <div className="col-span-2 lg:col-span-1 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-12">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Receita Projetada</p>
                            <p className="text-3xl font-black text-emerald-400 italic tracking-tighter">R$ 145.2K</p>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-[40px]">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                            {selectedPlan ? 'Editar' : 'Novo'} <span className="text-primary">Plano</span>
                        </DialogTitle>
                        <DialogDescription className="font-medium text-slate-500">
                            Configure os limites e valores para os usuários da plataforma.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSavePlan} className="space-y-6 py-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Plano</Label>
                                <Input name="name" defaultValue={selectedPlan?.name} placeholder="Ex: Pro, Platinum..." className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preço (R$)</Label>
                                <Input name="price" type="number" step="0.01" defaultValue={selectedPlan?.price} placeholder="0.00" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Limite Clientes</Label>
                                <Input name="max_clients" type="number" defaultValue={selectedPlan?.max_clients} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Limite Pedidos</Label>
                                <Input name="max_orders" type="number" defaultValue={selectedPlan?.max_orders} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Limite Receitas</Label>
                                <Input name="max_products" type="number" defaultValue={selectedPlan?.max_products} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-center" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Funcionalidades (uma por linha)</Label>
                            <Textarea 
                                name="features" 
                                defaultValue={selectedPlan?.features?.join('\n')} 
                                placeholder="Ex: Relatórios Avançados&#10;Suporte 24/7" 
                                className="min-h-[100px] rounded-xl bg-slate-50 border-none font-bold" 
                            />
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)} className="h-14 px-8 rounded-2xl font-black uppercase italic text-xs tracking-widest">
                                Cancelar
                            </Button>
                            <Button type="submit" className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase italic text-xs tracking-widest flex-1">
                                {selectedPlan ? 'Salvar Alterações' : 'Criar Plano'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
