"use client"

import { useState, useEffect } from "react"
import { Plus, Edit3, Trash2, Check, X, Layers, TrendingUp, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
                toast.success("Plano excluído")
                fetchPlans()
            }
        } catch (err) {
            toast.error("Erro ao excluir plano")
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Layers className="size-5" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-wider">Gestão de <span className="text-primary italic">Planos</span></h3>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (!open) setEditingPlan(null)
                }}>
                    <DialogTrigger asChild>
                        <Button className="h-10 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase italic tracking-widest gap-2">
                            <Plus className="size-4" /> Novo Plano
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-[32px]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                                {editingPlan ? 'Editar' : 'Criar'} <span className="text-primary">Plano</span>
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSavePlan} className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome do Plano</Label>
                                    <Input name="name" defaultValue={editingPlan?.name} required className="h-12 bg-slate-50 border-none rounded-xl font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preço (R$)</Label>
                                    <Input name="price" type="number" defaultValue={editingPlan?.price} required className="h-12 bg-slate-50 border-none rounded-xl font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Intervalo</Label>
                                    <select name="interval" defaultValue={editingPlan?.interval || 'month'} className="w-full h-12 px-4 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none">
                                        <option value="month">Mensal</option>
                                        <option value="year">Anual</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Max Pedidos</Label>
                                    <Input name="max_orders" type="number" defaultValue={editingPlan?.max_orders} className="h-12 bg-slate-50 border-none rounded-xl font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Max Produtos</Label>
                                    <Input name="max_products" type="number" defaultValue={editingPlan?.max_products} className="h-12 bg-slate-50 border-none rounded-xl font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Max Usuários</Label>
                                    <Input name="max_clients" type="number" defaultValue={editingPlan?.max_clients} className="h-12 bg-slate-50 border-none rounded-xl font-bold" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full h-14 bg-slate-900 text-white font-black uppercase italic tracking-widest rounded-2xl">
                                    {editingPlan ? 'Salvar Alterações' : 'Criar Plano Master'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <Zap className="size-6 text-slate-900 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => {
                                    setEditingPlan(plan)
                                    setIsDialogOpen(true)
                                }} className="size-8 p-0 rounded-lg hover:bg-amber-50 hover:text-amber-600">
                                    <Edit3 className="size-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan.id)} className="size-8 p-0 rounded-lg hover:bg-rose-50 hover:text-rose-600">
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        </div>
                        <h4 className="text-xl font-black italic uppercase tracking-tighter mb-1">{plan.name}</h4>
                        <p className="text-2xl font-black text-primary mb-6">R$ {plan.price}<span className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">/ {plan.interval === 'month' ? 'mês' : 'ano'}</span></p>
                        
                        <div className="space-y-3 py-4 border-t border-slate-50">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>Pedidos</span>
                                <span className="text-slate-900">{plan.max_orders || '∞'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>Produtos</span>
                                <span className="text-slate-900">{plan.max_products || '∞'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>Usuários</span>
                                <span className="text-slate-900">{plan.max_clients || '∞'}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {loading && [1, 2, 3].map(i => (
                    <div key={i} className="h-[250px] bg-slate-50 rounded-[32px] animate-pulse" />
                ))}
            </div>
        </div>
    )
}
