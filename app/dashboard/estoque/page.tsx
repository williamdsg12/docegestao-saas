"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Plus,
    Search,
    Warehouse,
    AlertTriangle,
    ArrowUpRight,
    Filter,
    Package,
    History,
    Calculator,
    MoreVertical,
    Edit2,
    Wallet,
    Trash2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface StockItem {
    id: string
    nome: string
    categoria: string
    quantidade_atual: number
    unidade_padrao: string
    estoque_minimo: number
    preco_compra: number
    quantidade_embalagem: number
}

// Removendo mock antigo

export default function EstoquePage() {
    const { user } = useAuth()
    const [stock, setStock] = useState<StockItem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    
    const [newIngredientOpen, setNewIngredientOpen] = useState(false)
    const [editingIngredient, setEditingIngredient] = useState<StockItem | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    
    const [ingData, setIngData] = useState({
        nome: "",
        categoria: "",
        quantidade_atual: "0",
        unidade_padrao: "g",
        estoque_minimo: "0",
        preco_compra: "0",
        quantidade_embalagem: "1"
    })

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    async function fetchData() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('ingredientes')
                .select('*')
                .order('nome')

            if (error) throw error
            setStock(data || [])
        } catch (error: any) {
            console.error("Error fetching stock:", error.message || error)
            toast.error("Erro ao carregar estoque")
        } finally {
            setLoading(false)
        }
    }

    async function handleQuickRestock(id: string, current: number) {
        try {
            const added = 10 // Example increment
            const { error } = await supabase
                .from('ingredientes')
                .update({ quantidade_atual: current + added })
                .eq('id', id)

            if (error) throw error

            setStock(prev => prev.map(s => s.id === id ? { ...s, quantidade_atual: current + added } : s))
            toast.success("Estoque atualizado!")
        } catch (error: any) {
            console.error("Error updating stock:", error.message || error)
            toast.error("Erro ao atualizar")
        }
    }

    async function handleSaveIngredient() {
        if (!ingData.nome || !ingData.preco_compra) {
            toast.error("Nome e Preço são obrigatórios")
            return
        }

        setIsSaving(true)
        try {
            if (editingIngredient) {
                const { error } = await supabase
                    .from('ingredientes')
                    .update({
                        nome: ingData.nome,
                        categoria: ingData.categoria,
                        quantidade_atual: parseFloat(ingData.quantidade_atual) || 0,
                        unidade_padrao: ingData.unidade_padrao,
                        estoque_minimo: parseFloat(ingData.estoque_minimo) || 0,
                        preco_compra: parseFloat(ingData.preco_compra) || 0,
                        quantidade_embalagem: parseFloat(ingData.quantidade_embalagem) || 1
                    })
                    .eq('id', editingIngredient.id)

                if (error) throw error
                setStock(prev => prev.map(i => i.id === editingIngredient.id ? { ...i, ...ingData, quantidade_atual: parseFloat(ingData.quantidade_atual) || 0, estoque_minimo: parseFloat(ingData.estoque_minimo) || 0, preco_compra: parseFloat(ingData.preco_compra) || 0, quantidade_embalagem: parseFloat(ingData.quantidade_embalagem) || 1 } : i).sort((a, b) => a.nome.localeCompare(b.nome)))
                toast.success("Insumo atualizado!")
            } else {
                const { data, error } = await supabase
                    .from('ingredientes')
                    .insert({
                        user_id: user?.id,
                        nome: ingData.nome,
                        categoria: ingData.categoria,
                        quantidade_atual: parseFloat(ingData.quantidade_atual) || 0,
                        unidade_padrao: ingData.unidade_padrao,
                        estoque_minimo: parseFloat(ingData.estoque_minimo) || 0,
                        preco_compra: parseFloat(ingData.preco_compra) || 0,
                        quantidade_embalagem: parseFloat(ingData.quantidade_embalagem) || 1
                    })
                    .select()
                    .single()

                if (error) throw error
                setStock(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
                toast.success("Insumo cadastrado!")
            }
            
            handleCloseModal()
        } catch (error: any) {
            console.error("Error saving ingredient:", error.message || error)
            toast.error("Erro ao salvar insumo")
        } finally {
            setIsSaving(false)
        }
    }

    const handleCloseModal = () => {
        setNewIngredientOpen(false)
        setEditingIngredient(null)
        setIngData({
            nome: "",
            categoria: "",
            quantidade_atual: "0",
            unidade_padrao: "g",
            estoque_minimo: "0",
            preco_compra: "0",
            quantidade_embalagem: "1"
        })
    }

    async function handleDeleteIngredient(id: string) {
        if (!window.confirm("Deseja realmente excluir este insumo?")) return
        try {
            const { error } = await supabase.from('ingredientes').delete().eq('id', id)
            if (error) throw error
            setStock(prev => prev.filter(i => i.id !== id))
            toast.success("Insumo excluído!")
        } catch (error: any) {
            console.error("Error deleting:", error.message || error)
            toast.error("Erro ao excluir insumo")
        }
    }

    const handleEditIngredient = (ing: StockItem) => {
        setEditingIngredient(ing)
        setIngData({
            nome: ing.nome,
            categoria: ing.categoria || "",
            quantidade_atual: (ing.quantidade_atual || 0).toString(),
            unidade_padrao: ing.unidade_padrao,
            estoque_minimo: (ing.estoque_minimo || 0).toString(),
            preco_compra: (ing.preco_compra || 0).toString(),
            quantidade_embalagem: (ing.quantidade_embalagem || 1).toString()
        })
        setNewIngredientOpen(true)
    }

    const filtered = stock.filter((s) =>
        s.nome.toLowerCase().includes(search.toLowerCase()) || s.categoria.toLowerCase().includes(search.toLowerCase())
    )

    const stats = [
        { label: "Itens Cadastrados", value: stock.length, icon: Package, color: "text-primary" },
        { label: "Em Alerta Crítico", value: stock.filter(s => (s.quantidade_atual || 0) < (s.estoque_minimo || 0)).length, icon: AlertTriangle, color: "text-rose-600" },
        { label: "Investimento Total", value: `R$ ${stock.reduce((acc: number, curr: any) => acc + (curr.quantidade_atual * (curr.preco_compra / (curr.quantidade_embalagem || 1))), 0).toFixed(2)}`, icon: Wallet, color: "text-green-600" },
        { label: "Giro de Estoque", value: "1.2x", icon: Calculator, color: "text-blue-600" },
    ]

    return (
        <div className="space-y-12 pb-24">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
            >
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-2 uppercase italic leading-none">
                        Gestão de <span className="text-primary tracking-tighter">Estoque</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Controle de insumos e alertas de reposição para sua produção.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <Button variant="outline" className="h-14 px-8 rounded-3xl border-white bg-white/40 backdrop-blur-md text-slate-600 hover:text-primary font-black uppercase tracking-widest text-[10px] shadow-lg border transition-all">
                        <History className="mr-2 size-4" />
                        Movimentações
                    </Button>
                    <Dialog open={newIngredientOpen} onOpenChange={(val) => {
                        if (!val) handleCloseModal()
                        else setNewIngredientOpen(true)
                    }}>
                        <DialogTrigger asChild>
                            <Button className="h-14 px-10 rounded-[20px] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                                <Plus className="mr-2 size-5" />
                                Entrada de Insumo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl border-white/60 bg-white/90 backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl overflow-hidden">
                            <div className="absolute -top-24 -right-24 size-48 bg-primary/10 rounded-full blur-3xl" />
                            <DialogHeader className="mb-8 relative z-10">
                                <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic">
                                    {editingIngredient ? "Editar" : "Novo"} <span className="text-primary italic">Insumo</span>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="grid gap-6 relative z-10">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome</Label>
                                        <Input
                                            className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 font-bold"
                                            value={ingData.nome}
                                            onChange={e => setIngData({ ...ingData, nome: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</Label>
                                        <Input
                                            className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 font-bold"
                                            value={ingData.categoria}
                                            onChange={e => setIngData({ ...ingData, categoria: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Qtd Atual</Label>
                                        <Input
                                            type="number"
                                            className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 font-bold"
                                            value={ingData.quantidade_atual}
                                            onChange={e => setIngData({ ...ingData, quantidade_atual: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estoque Mínimo</Label>
                                        <Input
                                            type="number"
                                            className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 font-bold"
                                            value={ingData.estoque_minimo}
                                            onChange={e => setIngData({ ...ingData, estoque_minimo: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unidade (g, kg, un)</Label>
                                        <Input
                                            className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 font-bold"
                                            value={ingData.unidade_padrao}
                                            onChange={e => setIngData({ ...ingData, unidade_padrao: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preço Compra (R$)</Label>
                                        <Input
                                            type="number"
                                            className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 font-bold"
                                            value={ingData.preco_compra}
                                            onChange={e => setIngData({ ...ingData, preco_compra: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Qtd Rende (no pacote)</Label>
                                        <Input
                                            type="number"
                                            className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 font-bold"
                                            value={ingData.quantidade_embalagem}
                                            onChange={e => setIngData({ ...ingData, quantidade_embalagem: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSaveIngredient}
                                    disabled={isSaving}
                                    className="h-14 mt-4 rounded-2xl bg-gradient-to-r from-primary to-rose-500 hover:from-primary/90 hover:to-rose-600 font-black text-lg shadow-xl shadow-primary/20 text-white uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    {isSaving ? "Salvando..." : "Confirmar ✨"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </motion.div>

            {/* Stats Overview */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                    >
                        <div className="group relative h-full overflow-hidden rounded-[32px] border border-white/60 bg-white/40 backdrop-blur-xl p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2">
                            <div className="absolute -top-12 -right-12 size-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className={cn("flex size-14 items-center justify-center rounded-2xl text-white shadow-xl transform group-hover:rotate-6 transition-transform duration-500", stat.color.replace('text-', 'bg-').replace('600', '400').replace('primary', 'bg-primary/80'))}>
                                    <stat.icon className="size-7" />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Pesquisar insumos pelo nome ou categoria..."
                        className="h-14 rounded-3xl border-white/60 bg-white/40 backdrop-blur-md pl-14 text-slate-900 placeholder:text-slate-400 focus:ring-8 focus:ring-primary/5 focus:border-primary/20 transition-all shadow-xl shadow-rose-200/5"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-14 px-8 rounded-3xl border-white bg-white/40 backdrop-blur-md text-slate-600 hover:text-primary font-black uppercase tracking-widest text-[10px] shadow-lg border">
                    <Filter className="mr-2 size-4" />
                    Filtros Avançados
                </Button>
            </div>

            {/* Stock Grid 2.0 */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                    {filtered.map((item, i) => {
                        const isCritical = (item.quantidade_atual || 0) < (item.estoque_minimo || 0)
                        const percentage = Math.min(((item.quantidade_atual || 0) / (item.estoque_minimo || 1)) * 100, 100)

                        return (
                            <motion.div
                                layout
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                                transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }}
                                className="group relative flex flex-col overflow-hidden rounded-[40px] border border-white/60 bg-white/40 backdrop-blur-xl p-8 hover:shadow-[0_20px_50px_rgba(244,114,182,0.15)] transition-all duration-500 hover:-translate-y-2"
                            >
                                {/* Warning Glow for Critical */}
                                {isCritical && (
                                    <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none" />
                                )}

                                <div className="flex items-start justify-between mb-8 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("flex size-14 items-center justify-center rounded-2xl shadow-xl transform group-hover:rotate-[-3deg] transition-transform duration-500 text-white", isCritical ? "bg-rose-500 shadow-rose-200/50" : "bg-primary shadow-primary/20")}>
                                            <Package className="size-7" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID: #{item.id.slice(0, 8)}</p>
                                            <Badge className={cn("px-4 py-1.5 border-none font-black text-[10px] uppercase rounded-full shadow-sm", isCritical ? "bg-rose-50 text-rose-500" : "bg-rose-50 text-primary")}>
                                                {item.categoria || 'Geral'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditIngredient(item)} className="rounded-full hover:bg-white/50 text-slate-400 hover:text-primary transition-all">
                                            <Edit2 className="size-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteIngredient(item.id)} className="rounded-full hover:bg-white/50 text-slate-400 hover:text-rose-500 transition-all">
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="mb-8 space-y-2 relative z-10">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none truncate group-hover:text-primary transition-colors">
                                        {item.nome}
                                    </h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn("text-3xl font-black tracking-tighter", isCritical ? "text-rose-600" : "text-slate-900")}>
                                            {item.quantidade_atual}
                                        </span>
                                        <span className="text-sm font-black text-slate-400 uppercase">{item.unidade_padrao}</span>
                                    </div>
                                </div>

                                {/* Health Bar / Progress */}
                                <div className="mt-auto space-y-6 relative z-10">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível de Estoque</span>
                                            <span className={cn("text-xs font-black uppercase tracking-tighter", isCritical ? "text-rose-500 animate-bounce" : "text-green-500")}>
                                                {isCritical ? "⚠️ Reposição Urgente" : "✅ Nível Estável"}
                                            </span>
                                        </div>
                                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border-2 border-white shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                className={cn("h-full transition-all duration-1000", isCritical ? "bg-gradient-to-r from-rose-400 to-rose-600" : "bg-gradient-to-r from-primary to-rose-500")}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                            <span>Mínimo: {item.estoque_minimo}</span>
                                            <span>Meta Ideal</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-6 border-t border-rose-100/30">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Capital Preso</span>
                                            <span className="text-sm font-black text-slate-800 tracking-tighter">
                                                R$ {(item.quantidade_atual * (item.preco_compra / (item.quantidade_embalagem || 1))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <Button
                                            onClick={() => handleQuickRestock(item.id, item.quantidade_atual)}
                                            className={cn("h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95", isCritical ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200" : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-100 shadow-sm")}
                                        >
                                            <Plus className="mr-2 size-4" />
                                            Adicionar 10
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>

                {filtered.length === 0 && !loading && (
                    <div className="col-span-full py-32 text-center flex flex-col items-center justify-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="size-32 bg-rose-50 rounded-[40px] flex items-center justify-center text-primary mb-8"
                        >
                            <Warehouse className="size-16 opacity-20" />
                        </motion.div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Nenhum item em estoque</h3>
                        <p className="text-slate-500 mt-4 max-w-sm font-medium">Não encontramos insumos para o filtro pesquisado. Comece cadastrando seus primeiros itens!</p>
                        <Button className="mt-6 text-primary font-black uppercase tracking-widest text-xs">+ Cadastrar Insumo</Button>
                    </div>
                )}
            </div>
        </div>
    )
}


