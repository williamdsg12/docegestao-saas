"use client"

import { useState, useMemo, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { useAuth } from "@/hooks/useAuth"
import { 
    DollarSign, 
    Plus, 
    TrendingUp,
    Search,
    Loader2,
    Users,
    ArrowUpRight,
    Calculator
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { registerSale, calculateRecipeCost } from "@/utils/inventory"
import { useSales } from "@/hooks/useSales"

export default function SalesERPPage() {
    const { profile } = useBusiness()
    const { user } = useAuth()
    const tenantId = profile?.tenant_id || profile?.company_id
    
    const { data: sales = [], isLoading, refresh } = useSales(tenantId)
    const [recipes, setRecipes] = useState<any[]>([])
    const [loadingRecipes, setLoadingRecipes] = useState(false)
    const [search, setSearch] = useState("")
    
    // New Sale Modal
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
    const [isRegistering, setIsRegistering] = useState(false)
    const [newSale, setNewSale] = useState({
        recipeId: "",
        quantity: "1",
        priceUnit: "",
        customer: ""
    })
    const [estimatedCost, setEstimatedCost] = useState(0)

    // Fetch Recipes for selection
    useEffect(() => {
        if (tenantId) {
            setLoadingRecipes(true)
            supabase
                .from('receitas')
                .select('id, nome')
                .eq('tenant_id', tenantId)
                .order('nome')
                .then(({ data }) => {
                    setRecipes(data || [])
                    setLoadingRecipes(false)
                })
        }
    }, [tenantId])

    // Update estimated cost when recipe changes
    useEffect(() => {
        if (newSale.recipeId && tenantId) {
            calculateRecipeCost(newSale.recipeId, tenantId)
                .then(setEstimatedCost)
        }
    }, [newSale.recipeId, tenantId])

    const filtered = useMemo(() => 
        sales.filter(s => 
            (s.receitas?.nome?.toLowerCase() || "").includes(search.toLowerCase()) ||
            (s.cliente?.toLowerCase() || "").includes(search.toLowerCase())
        ), [sales, search])

    const stats = useMemo(() => ({
        totalRevenue: sales.reduce((acc, s) => acc + Number(s.valor_total || 0), 0),
        totalCMV: sales.reduce((acc, s) => acc + Number(s.custo_total || 0), 0),
        totalProfit: sales.reduce((acc, s) => acc + Number(s.lucro_total || 0), 0)
    }), [sales])

    async function handleRegisterSale() {
        if (!newSale.recipeId || !newSale.priceUnit) return toast.error("Preencha todos os campos")
        if (!tenantId || !user) return

        setIsRegistering(true)
        try {
            await registerSale({
                recipeId: newSale.recipeId,
                quantity: Number(newSale.quantity),
                priceUnit: Number(newSale.priceUnit),
                customer: newSale.customer,
                tenantId: tenantId,
                userId: user.id
            })

            toast.success("Venda registrada com sucesso! 💰")
            setIsSaleModalOpen(false)
            setNewSale({ recipeId: "", quantity: "1", priceUnit: "", customer: "" })
            refresh()
        } catch (e) {
            toast.error("Erro ao registrar venda")
        } finally {
            setIsRegistering(false)
        }
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                        Painel de <span className="text-emerald-500">Vendas</span>
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                        Controle de faturamento, lucro real e CMV automático
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => setIsSaleModalOpen(true)}
                        className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-slate-900/10"
                    >
                        <Plus size={16} /> Nova Venda
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard 
                    label="Faturamento Total" 
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)} 
                    icon={TrendingUp} 
                    color="text-emerald-500" 
                    bgColor="bg-emerald-50" 
                />
                <MetricCard 
                    label="CMV Total (Custos)" 
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalCMV)} 
                    icon={Calculator} 
                    color="text-rose-500" 
                    bgColor="bg-rose-50" 
                />
                <MetricCard 
                    label="Lucro Líquido" 
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalProfit)} 
                    icon={DollarSign} 
                    color="text-blue-500" 
                    bgColor="bg-blue-50" 
                />
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <Input 
                    placeholder="Buscar por produto vendido ou nome do cliente..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-16 pl-16 pr-8 rounded-[32px] border-none bg-white shadow-sm focus-visible:ring-emerald-500 font-bold text-sm tracking-tight"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr className="italic border-b border-slate-100">
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest">Data</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Produto</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Cliente</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Faturamento</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">CMV (Custo)</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Lucro</th>
                                <th className="p-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="h-60 text-center">
                                            <Loader2 className="animate-spin mx-auto text-slate-300" />
                                        </td>
                                    </tr>
                                ) : filtered.length > 0 ? filtered.map((item) => (
                                    <motion.tr 
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-slate-50/30 border-b border-slate-50 transition-colors"
                                    >
                                        <td className="p-8">
                                            <div className="flex flex-col">
                                                <span className="font-black text-xs text-slate-900 uppercase italic leading-none">{new Date(item.data_venda).toLocaleDateString('pt-BR')}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(item.data_venda).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col">
                                                <span className="font-black text-xs uppercase italic text-slate-700">{item.receitas?.nome}</span>
                                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{item.quantidade} unidade(s)</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center text-[10px] font-bold uppercase text-slate-500">
                                            <div className="flex items-center justify-center gap-2">
                                                <Users size={12} className="text-slate-300" />
                                                {item.cliente || 'Consumidor Final'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-black text-xs italic text-slate-900 text-emerald-600">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_total)}
                                        </td>
                                        <td className="p-4 text-center text-[10px] font-bold italic text-rose-500">
                                            -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.custo_total)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <Badge className="bg-emerald-50 text-emerald-500 border-none font-black text-[9px] uppercase tracking-widest italic h-6 px-4">
                                                +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.lucro_total)}
                                            </Badge>
                                        </td>
                                        <td className="p-8 text-right">
                                            <ArrowUpRight size={16} className="text-slate-200 group-hover:text-emerald-500 transition-colors cursor-pointer ml-auto" />
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="h-60 text-center opacity-40">
                                            <TrendingUp size={40} className="mx-auto mb-4 text-slate-300" />
                                            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Nenhuma venda registrada</p>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Register Sale Modal */}
            <Dialog open={isSaleModalOpen} onOpenChange={setIsSaleModalOpen}>
                <DialogContent className="sm:max-w-md rounded-[40px] p-10 border-none shadow-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="mb-8 items-center text-center">
                        <div className="size-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                            <DollarSign size={32} />
                        </div>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Registrar Venda</DialogTitle>
                        <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mt-1">Lançamento de faturamento e apuração de CMV</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Produto / Receita</Label>
                            <Select onValueChange={v => setNewSale({...newSale, recipeId: v})}>
                                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold shadow-sm">
                                    <SelectValue placeholder={loadingRecipes ? "Carregando..." : "Selecione o produto vendido"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-xl">
                                    {recipes.map(r => (
                                        <SelectItem key={r.id} value={r.id} className="font-bold">{r.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Quantidade</Label>
                                <Input 
                                    type="number"
                                    value={newSale.quantity}
                                    onChange={e => setNewSale({...newSale, quantity: e.target.value})}
                                    className="h-12 rounded-2xl bg-slate-50 border-none px-6 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Preço Unitário</Label>
                                <Input 
                                    type="number"
                                    placeholder="R$ 0.00"
                                    value={newSale.priceUnit}
                                    onChange={e => setNewSale({...newSale, priceUnit: e.target.value})}
                                    className="h-12 rounded-2xl bg-slate-50 border-none px-6 font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Nome do Cliente (Opcional)</Label>
                            <Input 
                                placeholder="Ex: Maria Oliveira"
                                value={newSale.customer}
                                onChange={e => setNewSale({...newSale, customer: e.target.value})}
                                className="h-12 rounded-2xl bg-slate-50 border-none px-6 font-bold"
                            />
                        </div>

                        {newSale.recipeId && (
                            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span className="text-slate-400 italic">Custo Estimado (CMV)</span>
                                    <span className="text-rose-500">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedCost * Number(newSale.quantity))}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span className="text-slate-400 italic">Previsão de Lucro</span>
                                    <span className="text-emerald-500 text-lg">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(newSale.priceUnit) - estimatedCost) * Number(newSale.quantity))}
                                    </span>
                                </div>
                            </div>
                        )}

                        <Button 
                            disabled={isRegistering}
                            onClick={handleRegisterSale}
                            className="w-full h-14 rounded-[24px] bg-slate-900 hover:bg-black text-white font-black italic uppercase text-sm tracking-widest shadow-2xl transition-all active:scale-95"
                        >
                            {isRegistering ? <Loader2 className="animate-spin" /> : "Registrar Venda ✨"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function MetricCard({ label, value, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="p-6 rounded-[32px] border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className={cn("absolute top-0 right-0 size-24 blur-3xl rounded-full opacity-10 -mr-12 -mt-12", color.replace('text', 'bg'))} />
            <div className="flex items-center gap-4">
                <div className={cn("size-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500", bgColor, color)}>
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none mb-1">{label}</p>
                    <h3 className={cn("text-xl font-black italic uppercase tracking-tighter leading-none truncate")}>
                        {value}
                    </h3>
                </div>
            </div>
        </Card>
    )
}
