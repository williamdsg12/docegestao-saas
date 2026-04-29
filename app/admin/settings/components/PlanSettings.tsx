"use client"

import { useState, useEffect } from "react"
import { Plus, Edit3, Trash2, Layers, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function PlanSettings() {
    const [plans, setPlans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<any>(null)

    useEffect(() => {
        fetchPlans()
    }, [])

    async function fetchPlans() {
        try {
            const res = await fetch('/api/admin/plans')
            const data = await res.json()
            setPlans(data)
        } catch (error) {
            toast.error("Erro ao carregar planos")
        } finally {
            setLoading(false)
        }
    }

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        const planData = {
            name: formData.get('name'),
            price: Number(formData.get('price')),
            interval: formData.get('interval') || 'month',
            max_orders: Number(formData.get('max_orders')),
            max_products: Number(formData.get('max_products')),
            max_clients: Number(formData.get('max_clients')),
            is_active: true,
            slug: (formData.get('name') as string).toLowerCase().replace(/\s+/g, '-')
        }

        try {
            const method = editingPlan ? 'PUT' : 'POST'
            const res = await fetch('/api/admin/plans', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPlan ? { ...planData, id: editingPlan.id } : planData)
            })

            if (res.ok) {
                toast.success(editingPlan ? "Plano atualizado!" : "Plano criado!")
                setIsDialogOpen(false)
                fetchPlans()
            } else {
                throw new Error()
            }
        } catch (err) {
            toast.error("Erro ao salvar plano")
        }
    }

    const handleDeletePlan = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este plano?")) return

        try {
            const res = await fetch(`/api/admin/plans?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success("Plano removido")
                fetchPlans()
            }
        } catch (err) {
            toast.error("Erro ao excluir plano")
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <Layers className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gestão de Planos</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Configuração comercial do SaaS</p>
                    </div>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (!open) setEditingPlan(null)
                }}>
                    <DialogTrigger asChild>
                        <Button className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                            <Plus className="size-4" /> Novo Plano
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-[#09090b] border-white/[0.05] text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                                {editingPlan ? 'Editar' : 'Criar'} <span className="text-indigo-400">Plano Master</span>
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSavePlan} className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Identificação do Plano</Label>
                                    <Input name="name" defaultValue={editingPlan?.name} required className="h-11 bg-white/[0.03] border-white/[0.05] rounded-xl font-bold text-white" placeholder="Ex: Professional" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Preço (BRL)</Label>
                                    <Input name="price" type="number" defaultValue={editingPlan?.price} required className="h-11 bg-white/[0.03] border-white/[0.05] rounded-xl font-bold text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ciclo</Label>
                                    <select name="interval" defaultValue={editingPlan?.interval || 'month'} className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-xl text-sm font-bold text-white outline-none">
                                        <option value="month">Mensal</option>
                                        <option value="year">Anual</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-tighter text-slate-500">Max Pedidos</Label>
                                    <Input name="max_orders" type="number" defaultValue={editingPlan?.max_orders} className="h-10 bg-white/[0.05] border-none rounded-lg text-xs font-bold text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-tighter text-slate-500">Max Produtos</Label>
                                    <Input name="max_products" type="number" defaultValue={editingPlan?.max_products} className="h-10 bg-white/[0.05] border-none rounded-lg text-xs font-bold text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-tighter text-slate-500">Max Usuários</Label>
                                    <Input name="max_clients" type="number" defaultValue={editingPlan?.max_clients} className="h-10 bg-white/[0.05] border-none rounded-lg text-xs font-bold text-white" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full h-12 bg-indigo-600 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all">
                                    {editingPlan ? 'Atualizar Ecossistema' : 'Registrar Plano'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-white/[0.02] rounded-xl p-6 border border-white/[0.05] hover:border-indigo-500/20 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Zap className="size-5 text-indigo-500" />
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => {
                                    setEditingPlan(plan)
                                    setIsDialogOpen(true)
                                }} className="size-8 p-0 text-slate-500 hover:text-white hover:bg-white/[0.05]">
                                    <Edit3 className="size-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan.id)} className="size-8 p-0 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10">
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        </div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight mb-1">{plan.name}</h4>
                        <p className="text-xl font-bold text-white mb-6">R$ {plan.price}<span className="text-[10px] text-slate-500 uppercase tracking-widest ml-1">/ {plan.interval === 'month' ? 'mês' : 'ano'}</span></p>
                        
                        <div className="space-y-2 py-4 border-t border-white/[0.05]">
                            <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>Pedidos</span>
                                <span className="text-white">{plan.max_orders || '∞'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>Produtos</span>
                                <span className="text-white">{plan.max_products || '∞'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>Usuários</span>
                                <span className="text-white">{plan.max_clients || '∞'}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {loading && [1, 2, 3].map(i => (
                    <div key={i} className="h-[200px] bg-white/[0.02] border border-white/[0.05] rounded-xl animate-pulse" />
                ))}
            </div>
        </div>
    )
}
