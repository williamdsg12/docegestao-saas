"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { useAuth } from "@/hooks/useAuth"
import { 
    Plus, 
    Minus,
    Search, 
    ArrowUpDown,
    AlertTriangle,
    Package,
    Loader2,
    History,
    Filter,
    BarChart3,
    TrendingUp,
    DollarSign,
    MoreVertical,
    ShoppingCart,
    Edit2,
    Trash2,
    Save,
    X,
    Sparkles,
    FileText
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { StockImporter } from "@/components/dashboard/estoque/StockImporter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { handleStockMovement } from "@/utils/inventory"
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const CATEGORIES = ["Laticínios", "Secos", "Embalagens", "Frutas", "Congelados", "Geral"]

export default function InventoryERPPage() {
    const { profile } = useBusiness()
    const { user } = useAuth()
    const router = useRouter()
    
    const [ingredients, setIngredients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
    
    // Modal states
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
    const [isNewModalOpen, setIsNewModalOpen] = useState(false)
    const [selectedIngredient, setSelectedIngredient] = useState<any>(null)
    const [moveAmount, setMoveAmount] = useState("")
    const [moveType, setMoveType] = useState<'entrada' | 'saida'>('entrada')

    const [newIngredient, setNewIngredient] = useState({
        nome: "",
        codigo: "",
        descricao: "",
        categoria: "Geral",
        unidade_base: "g",
        estoque_atual: "",
        estoque_minimo: "",
        custo_medio: "",
        preco_total: "",
        quantidade_total: "1",
        fator_rendimento: "1",
        unidade_compra: "Unid"
    })

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [ingredientToEdit, setIngredientToEdit] = useState<any>(null)
    const [ingredientToDelete, setIngredientToDelete] = useState<any>(null)

    useEffect(() => {
        if (profile?.tenant_id || profile?.company_id) {
            fetchInsumos()
        }
    }, [profile])

    async function fetchInsumos() {
        const tenantId = profile?.tenant_id || profile?.company_id
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('ingredientes')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('nome')
            if (error) throw error
            setIngredients(data || [])
        } catch (e) {
            toast.error("Erro ao carregar insumos")
        } finally {
            setLoading(false)
        }
    }

    const filtered = ingredients.filter(i => {
        const matchSearch = i.nome.toLowerCase().includes(search.toLowerCase())
        const matchFilter = filter === 'all' 
            || (filter === 'low' && i.estoque_atual > 0 && i.estoque_atual <= i.estoque_minimo)
            || (filter === 'out' && i.estoque_atual <= 0)
        return matchSearch && matchFilter
    })

    const stats = {
        totalItems: ingredients.length,
        lowStock: ingredients.filter(i => i.estoque_atual > 0 && i.estoque_atual <= i.estoque_minimo).length,
        outOfStock: ingredients.filter(i => i.estoque_atual <= 0).length,
        totalValue: ingredients.reduce((acc, current) => acc + (Number(current.estoque_atual) * Number(current.custo_medio || 0)), 0)
    }

    const onAddStockManual = async () => {
        if (!selectedIngredient || !moveAmount) return
        const amount = parseFloat(moveAmount)
        if (isNaN(amount) || amount <= 0) return toast.error("Valor inválido")

        const tenantId = profile?.tenant_id || profile?.company_id
        if (!tenantId || !user) return

        toast.loading(moveType === 'entrada' ? "Registrando entrada..." : "Registrando saída...", { id: 'movement' })
        
        try {
            await handleStockMovement({
                ingredientId: selectedIngredient.id,
                type: moveType,
                quantity: amount,
                unit: selectedIngredient.unidade_base,
                origin: 'ajuste_manual',
                tenantId: tenantId,
                userId: user.id
            })

            toast.success("Estoque atualizado com sucesso!", { id: 'movement' })
            fetchInsumos()
            setIsMoveModalOpen(false)
            setMoveAmount("")
        } catch (e) {
            toast.error("Erro ao atualizar estoque", { id: 'movement' })
        }
    }

    const handleCreateIngredient = async () => {
        if (!newIngredient.nome) return toast.error("Nome é obrigatório")
        
        const tenantId = profile?.tenant_id || profile?.company_id
        if (!tenantId || !user?.id) return
        
        const costoUnitario = parseFloat(newIngredient.custo_medio || "0")

        try {
            const { error } = await supabase
                .from('ingredientes')
                .insert({
                    ...newIngredient,
                    user_id: user.id,
                    tenant_id: tenantId,
                    company_id: tenantId,
                    estoque_atual: parseFloat(newIngredient.estoque_atual || "0"),
                    estoque_minimo: parseFloat(newIngredient.estoque_minimo || "0"),
                    preco_total: parseFloat(newIngredient.preco_total || "0"),
                    valor_pago: parseFloat(newIngredient.preco_total || "0"),
                    quantidade_total: parseFloat(newIngredient.quantidade_total || "1"),
                    quantidade_embalagem: parseFloat(newIngredient.quantidade_total || "1"),
                    fator_rendimento: parseFloat(newIngredient.fator_rendimento || "1"),
                    custo_medio: costoUnitario,
                    custo_unitario: costoUnitario,
                    unidade: newIngredient.unidade_base,
                    unidade_compra: newIngredient.unidade_compra || 'un'
                })

            if (error) throw error
            toast.success("Ingrediente cadastrado!")
            setIsNewModalOpen(false)
            fetchInsumos()
            setNewIngredient({
                nome: "",
                codigo: "",
                descricao: "",
                categoria: "Geral",
                unidade_base: "g",
                estoque_atual: "",
                estoque_minimo: "",
                custo_medio: "",
                preco_total: "",
                quantidade_total: "1",
                fator_rendimento: "1",
                unidade_compra: "Unid"
            })
        } catch (e) {
            toast.error("Erro ao cadastrar ingrediente")
        }
    }

    const handleUpdateIngredient = async () => {
        if (!ingredientToEdit?.nome) return toast.error("Nome é obrigatório")
        
        setLoading(true)
        const costoUnitario = parseFloat(ingredientToEdit.custo_medio)
        try {
            const { error } = await supabase
                .from('ingredientes')
                .update({
                    nome: ingredientToEdit.nome,
                    codigo: ingredientToEdit.codigo,
                    descricao: ingredientToEdit.descricao,
                    categoria: ingredientToEdit.categoria,
                    unidade_base: ingredientToEdit.unidade_base,
                    unidade: ingredientToEdit.unidade_base, // Sync V1
                    unidade_compra: ingredientToEdit.unidade_compra,
                    estoque_atual: parseFloat(ingredientToEdit.estoque_atual),
                    estoque_minimo: parseFloat(ingredientToEdit.estoque_minimo),
                    preco_total: parseFloat(ingredientToEdit.preco_total),
                    valor_pago: parseFloat(ingredientToEdit.preco_total), // Sync V2
                    quantidade_total: parseFloat(ingredientToEdit.quantidade_total),
                    quantidade_embalagem: parseFloat(ingredientToEdit.quantidade_total), // Sync V2
                    fator_rendimento: parseFloat(ingredientToEdit.fator_rendimento),
                    custo_medio: costoUnitario,
                    custo_unitario: costoUnitario // Sync V2
                })
                .eq('id', ingredientToEdit.id)

            if (error) throw error
            toast.success("Ingrediente atualizado!")
            setIsEditModalOpen(false)
            fetchInsumos()
        } catch (e) {
            toast.error("Erro ao atualizar ingrediente")
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteIngredient = async () => {
        if (!ingredientToDelete) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('ingredientes')
                .delete()
                .eq('id', ingredientToDelete.id)

            if (error) throw error
            toast.success("Ingrediente excluído!")
            setIsDeleteDialogOpen(false)
            fetchInsumos()
        } catch (e) {
            toast.error("Erro ao excluir ingrediente")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic leading-none">
                        Estoque <span className="text-[var(--secondary)]">Inteligente</span>
                    </h1>
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-2 px-1 italic">
                        Gestão de insumos, custos e produção automática
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={async () => {
                            const lowStockItems = ingredients.filter(i => i.estoque_atual <= i.estoque_minimo);
                            if (lowStockItems.length === 0) return toast.success("Estoque em dia! Nenhuma sugestão.");
                            
                            const tenantId = profile?.tenant_id || profile?.company_id;
                            toast.loading(`Sugerindo ${lowStockItems.length} itens...`);
                            
                            try {
                                for (const item of lowStockItems) {
                                    await supabase.from('lista_compras').insert({
                                        tenant_id: tenantId,
                                        company_id: tenantId,
                                        ingrediente_id: item.id,
                                        nome: item.nome,
                                        quantidade: Math.max(1, item.estoque_minimo - item.estoque_atual + 1),
                                        unidade: item.unidade_base,
                                        status: 'pendente'
                                    });
                                }
                                toast.success("Itens adicionados à Lista de Compras!", { id: 'suggest' });
                                router.push('/dashboard/lista-compras');
                            } catch (e) {
                                toast.error("Erro ao sugerir compras");
                            }
                        }}
                        variant="ghost" 
                        className="h-12 px-6 rounded-2xl text-[var(--secondary)] hover:bg-[var(--accent-light)] font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                         <ShoppingCart size={16} /> Sugerir Compras
                    </Button>
                    <Button 
                        onClick={() => router.push('/dashboard/estoque/historico')}
                        variant="outline" 
                        className="h-12 px-6 rounded-2xl border-[var(--border)] font-black uppercase text-[10px] tracking-widest gap-2 text-[var(--text-muted)]"
                    >
                         <History size={16} /> Histórico
                    </Button>
                    <Button 
                        onClick={() => setIsImportModalOpen(true)}
                        variant="outline" 
                        className="h-12 px-6 rounded-2xl border-[var(--accent-light)] text-[var(--secondary)] hover:bg-[var(--accent-light)] font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                         <FileText size={16} /> Importar
                    </Button>
                    <Button 
                        onClick={() => setIsNewModalOpen(true)}
                        className="h-12 px-8 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-[var(--primary)]/10"
                    >
                        <Plus size={16} /> Novo Insumo
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    label="Valor Total" 
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalValue)} 
                    icon={DollarSign} 
                    color="text-[var(--secondary)]"
                    bgColor="bg-[var(--accent-light)]"
                />
                <MetricCard 
                    label="Total de Itens" 
                    value={stats.totalItems} 
                    icon={Package} 
                    color="text-[var(--primary)]"
                    bgColor="bg-[var(--accent-light)]"
                />
                <MetricCard 
                    label="Estoque Baixo" 
                    value={stats.lowStock} 
                    icon={AlertTriangle} 
                    color="text-[var(--accent)]"
                    bgColor="bg-[var(--accent-light)]"
                    active={stats.lowStock > 0}
                />
                <MetricCard 
                    label="Itens Zerados" 
                    value={stats.outOfStock} 
                    icon={TrendingUp} 
                    color="text-[var(--danger)]"
                    bgColor="bg-[var(--accent-light)]"
                    active={stats.outOfStock > 0}
                />
            </div>

            {/* Filters & Actions */}
            <section className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[32px] border border-[var(--border)] shadow-sm">
                <div className="relative w-full md:w-[450px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)] group-focus-within:text-[var(--secondary)] transition-colors" />
                    <Input 
                        placeholder="Buscar por nome ou categoria..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-12 pl-12 pr-4 rounded-2xl border-none bg-[var(--accent-light)]/30 focus-visible:ring-[var(--secondary)] font-black text-xs uppercase tracking-widest text-[var(--text-primary)]"
                    />
                </div>
                
                <div className="flex gap-2 p-1 bg-[var(--bg-app)] rounded-2xl w-full md:w-auto border border-[var(--border)]">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'low', label: 'Baixo' },
                        { id: 'out', label: 'Zerado' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setFilter(t.id as any)}
                            className={cn(
                                "flex-1 md:flex-none px-6 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                filter === t.id ? "bg-white text-[var(--primary)] shadow-sm border border-[var(--border)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Main Table - Responsive View */}
            <div className="bg-white rounded-[32px] border border-[var(--border)] shadow-sm overflow-hidden min-h-[400px]">
                {/* Desktop View */}
                <div className="hidden lg:block">
                    <Table>
                        <TableHeader className="bg-[var(--accent-light)]/30">
                            <TableRow className="hover:bg-transparent border-[var(--border)] italic">
                                <TableHead className="w-24 text-[10px] font-black uppercase tracking-widest px-8 text-[var(--text-muted)]">Código</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Item</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Descrição</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center text-[var(--text-muted)]">Qtd</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center text-[var(--text-muted)]">Un</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right text-[var(--text-muted)]">Vl. Unit</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right text-[var(--text-muted)]">Vl. Total</TableHead>
                                <TableHead className="text-right px-8"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-60 text-center">
                                            <Loader2 className="animate-spin mx-auto text-slate-300" />
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length > 0 ? filtered.map((item, index) => {
                                    const valorTotal = item.estoque_atual * item.custo_medio
                                    
                                    return (
                                        <TableRow key={item.id} className="group hover:bg-[var(--accent-light)]/10 border-[var(--border)] transition-colors">
                                            <TableCell className="px-8 py-5">
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                                                    {item.codigo || '---'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm text-[var(--text-primary)] uppercase italic truncate">
                                                        {index + 1}. {item.nome}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px]">
                                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter line-clamp-1 italic">
                                                        {item.descricao || '---'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-black text-sm text-[var(--text-primary)] italic">
                                                {item.estoque_atual}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="bg-[var(--accent-light)] text-[var(--primary)] font-black text-[8px] uppercase tracking-widest border border-[var(--border)]">
                                                    {item.unidade_base}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-xs text-[var(--text-muted)]">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.custo_medio)}
                                            </TableCell>
                                            <TableCell className="text-right font-black text-sm text-[var(--text-primary)] italic">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
                                            </TableCell>
                                            <TableCell className="text-right px-8">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button 
                                                        onClick={() => { setSelectedIngredient(item); setMoveType('entrada'); setIsMoveModalOpen(true); }}
                                                        variant="ghost" size="icon" className="size-9 rounded-xl text-emerald-500 hover:bg-emerald-50"
                                                        title="Entrada de Estoque"
                                                    >
                                                        <Plus size={18} />
                                                    </Button>
                                                    <Button 
                                                        onClick={() => { setSelectedIngredient(item); setMoveType('saida'); setIsMoveModalOpen(true); }}
                                                        variant="ghost" size="icon" className="size-9 rounded-xl text-rose-500 hover:bg-rose-50"
                                                        title="Saída de Estoque"
                                                    >
                                                        <Minus size={18} />
                                                    </Button>
                                                    
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-9 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                                                                <MoreVertical size={18} />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48 rounded-2xl border-none shadow-2xl p-2 bg-white">
                                                            <DropdownMenuItem 
                                                                onClick={() => { setIngredientToEdit(item); setIsEditModalOpen(true); }}
                                                                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group"
                                                            >
                                                                <div className="size-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                                    <Edit2 size={14} />
                                                                </div>
                                                                <span className="font-black text-[10px] uppercase tracking-widest text-slate-600">Editar Insumo</span>
                                                            </DropdownMenuItem>
                                                            
                                                            <DropdownMenuSeparator className="bg-slate-50 my-1" />
                                                            
                                                            <DropdownMenuItem 
                                                                onClick={() => { setIngredientToDelete(item); setIsDeleteDialogOpen(true); }}
                                                                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-rose-50 transition-colors group"
                                                            >
                                                                <div className="size-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
                                                                    <Trash2 size={14} />
                                                                </div>
                                                                <span className="font-black text-[10px] uppercase tracking-widest text-rose-600">Excluir Item</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-60">
                                            <div className="text-center opacity-40">
                                                <Package size={40} className="mx-auto mb-4 text-slate-300" />
                                                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Nenhum item encontrado</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile View - Cards */}
                <div className="lg:hidden p-4 space-y-4">
                    {loading ? (
                        <div className="h-60 flex items-center justify-center">
                            <Loader2 className="animate-spin text-slate-300" />
                        </div>
                    ) : filtered.length > 0 ? filtered.map((item) => (
                        <div key={item.id} className="bg-[var(--bg-app)] rounded-2xl border border-[var(--border)] p-4 space-y-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--primary)] font-black text-xs uppercase italic">
                                        {item.unidade_base}
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="font-black text-sm text-[var(--text-primary)] uppercase italic leading-none mb-1">{item.nome}</h4>
                                        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{item.codigo || 'SEM CÓDIGO'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="size-8 rounded-lg text-emerald-500" onClick={() => { setSelectedIngredient(item); setMoveType('entrada'); setIsMoveModalOpen(true); }}>
                                        <Plus size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-8 rounded-lg text-rose-500" onClick={() => { setSelectedIngredient(item); setMoveType('saida'); setIsMoveModalOpen(true); }}>
                                        <Minus size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-8 rounded-lg text-slate-400" onClick={() => { setIngredientToEdit(item); setIsEditModalOpen(true); }}>
                                        <Edit2 size={16} />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
                                    <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-1">Estoque Atual</span>
                                    <span className="text-sm font-black italic text-[var(--text-primary)]">{item.estoque_atual} <span className="text-[10px]">{item.unidade_base}</span></span>
                                </div>
                                <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
                                    <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-1">Valor Total</span>
                                    <span className="text-sm font-black italic text-[var(--text-primary)]">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.estoque_atual * item.custo_medio)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12 opacity-40">
                            <Package size={40} className="mx-auto mb-4 text-slate-300" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Nenhum item encontrado</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Movement Modal */}
            <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
                <DialogContent className="sm:max-w-xs rounded-[40px] p-10 border border-[var(--border)] shadow-2xl max-h-[90vh] overflow-y-auto bg-white">
                    <DialogHeader className="mb-8 items-center text-center">
                        <div className={cn(
                            "size-16 rounded-[24px] flex items-center justify-center mb-4 shadow-xl",
                            moveType === 'entrada' ? "bg-[var(--secondary)] text-white shadow-[var(--secondary)]/20" : "bg-[var(--danger)] text-white shadow-[var(--danger)]/20"
                        )}>
                            {moveType === 'entrada' ? <Plus size={32} /> : <Minus size={32} />}
                        </div>
                        <DialogTitle className="text-2xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter leading-none mb-1">
                            {selectedIngredient?.nome}
                        </DialogTitle>
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest italic">
                            Registrar {moveType === 'entrada' ? 'Entrada (Compra)' : 'Saída (Consumo)'}
                        </p>
                    </DialogHeader>

                    <div className="space-y-8">
                        <div className="relative">
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-black uppercase text-[10px] italic">
                                {selectedIngredient?.unidade_base}
                            </span>
                            <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={moveAmount}
                                onChange={e => setMoveAmount(e.target.value)}
                                className="h-20 rounded-[32px] bg-[var(--bg-app)] border border-[var(--border)] text-center text-4xl font-black italic focus-visible:ring-[var(--secondary)] shadow-inner text-[var(--text-primary)]"
                            />
                        </div>

                        <Button 
                            onClick={onAddStockManual}
                            className={cn(
                                "w-full h-16 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all active:scale-95",
                                moveType === 'entrada' ? "bg-[var(--secondary)] hover:bg-[var(--accent)] text-white shadow-[var(--secondary)]/20" : "bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white shadow-[var(--danger)]/20"
                            )}
                        >
                            Confirmar Atualização
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* New Ingredient Modal */}
            <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
                <DialogContent className="sm:max-w-md rounded-[40px] p-10 border border-[var(--border)] shadow-2xl max-h-[90vh] overflow-y-auto bg-white">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter leading-none">Novo Insumo</DialogTitle>
                        <DialogDescription className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] italic mt-1">Configure as bases do seu novo ingrediente</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-4 italic">Nome do Ingrediente</Label>
                                <Input 
                                    placeholder="Ex: Leite Condensado Moça"
                                    value={newIngredient.nome}
                                    onChange={e => setNewIngredient({...newIngredient, nome: e.target.value})}
                                    className="h-12 rounded-2xl bg-[var(--bg-app)] border border-[var(--border)] px-6 font-black italic text-[var(--text-primary)] focus-visible:ring-[var(--secondary)] shadow-sm"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-4 italic">Código / SKU</Label>
                                <Input 
                                    placeholder="Ex: SKU-12345"
                                    value={newIngredient.codigo}
                                    onChange={e => setNewIngredient({...newIngredient, codigo: e.target.value})}
                                    className="h-12 rounded-2xl bg-[var(--bg-app)] border border-[var(--border)] px-6 font-black italic text-[var(--text-primary)] focus-visible:ring-[var(--secondary)] shadow-sm"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-4 italic">Descrição Detalhada</Label>
                                <Textarea 
                                    placeholder="Ex: Chocolate meio amargo 50% cacau..."
                                    value={newIngredient.descricao}
                                    onChange={e => setNewIngredient({...newIngredient, descricao: e.target.value})}
                                    className="min-h-[60px] rounded-2xl bg-[var(--bg-app)] border border-[var(--border)] px-6 py-4 font-black italic text-[var(--text-primary)] focus-visible:ring-[var(--secondary)] shadow-sm resize-none"
                                />
                            </div>

                            <div className="md:col-span-2 p-6 bg-[var(--accent-light)]/30 rounded-[32px] space-y-4 border border-[var(--border)]">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--secondary)] italic flex items-center gap-2">
                                    <DollarSign size={14} /> Dados de Compra (Embalagem)
                                </Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Preço Embalagem (R$)</Label>
                                        <Input 
                                            type="number" 
                                            value={newIngredient.preco_total}
                                            onChange={e => {
                                                const p = parseFloat(e.target.value) || 0;
                                                const q = parseFloat(newIngredient.quantidade_total) || 1;
                                                const f = parseFloat(newIngredient.fator_rendimento) || 1;
                                                const unitCost = p / (q * f);
                                                setNewIngredient({...newIngredient, preco_total: e.target.value, custo_medio: unitCost.toFixed(4)});
                                            }}
                                            className="h-10 rounded-xl bg-white border border-[var(--border)] shadow-sm font-black italic text-[var(--text-primary)]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Un. Compra (Ex: Bandeja)</Label>
                                        <Input 
                                            value={newIngredient.unidade_compra}
                                            onChange={e => setNewIngredient({...newIngredient, unidade_compra: e.target.value})}
                                            className="h-10 rounded-xl bg-white border border-[var(--border)] shadow-sm font-black italic text-[var(--text-primary)]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Qtd na Embalagem</Label>
                                        <Input 
                                            type="number" 
                                            value={newIngredient.quantidade_total}
                                            onChange={e => {
                                                const q = parseFloat(e.target.value) || 1;
                                                const p = parseFloat(newIngredient.preco_total) || 0;
                                                const f = parseFloat(newIngredient.fator_rendimento) || 1;
                                                const unitCost = p / (q * f);
                                                setNewIngredient({...newIngredient, quantidade_total: e.target.value, custo_medio: unitCost.toFixed(4)});
                                            }}
                                            className="h-10 rounded-xl bg-white border border-[var(--border)] shadow-sm font-black italic text-[var(--text-primary)]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-bold text-[var(--accent)] uppercase italic">Fator Rendimento (0.1 - 1.0)</Label>
                                        <Input 
                                            type="number" 
                                            step="0.05"
                                            value={newIngredient.fator_rendimento}
                                            onChange={e => {
                                                const f = parseFloat(e.target.value) || 1;
                                                const p = parseFloat(newIngredient.preco_total) || 0;
                                                const q = parseFloat(newIngredient.quantidade_total) || 1;
                                                const unitCost = p / (q * f);
                                                setNewIngredient({...newIngredient, fator_rendimento: e.target.value, custo_medio: unitCost.toFixed(4)});
                                            }}
                                            className="h-10 rounded-xl bg-white border border-[var(--border)] shadow-sm font-black italic text-[var(--text-primary)]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--secondary)] ml-4 italic">Custo por {newIngredient.unidade_base} (Resultado)</Label>
                                <Input 
                                    type="number"
                                    value={newIngredient.custo_medio}
                                    onChange={e => setNewIngredient({...newIngredient, custo_medio: e.target.value})}
                                    className="h-12 rounded-2xl bg-[var(--accent-light)] border border-[var(--secondary)] px-6 font-black text-[var(--secondary)] shadow-sm italic focus-visible:ring-[var(--secondary)]"
                                />
                                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mt-1 ml-4 italic">* Baseado no preço da embalagem e rendimento</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-4 italic">Categoria</Label>
                                <Select onValueChange={v => setNewIngredient({...newIngredient, categoria: v})} defaultValue="Geral">
                                    <SelectTrigger className="h-12 rounded-2xl bg-[var(--bg-app)] border border-[var(--border)] font-black italic text-[var(--text-primary)] shadow-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border border-[var(--border)] shadow-xl bg-white">
                                        {CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-black italic uppercase text-[10px] tracking-widest">{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-4 italic">Unidade Base</Label>
                                <Select onValueChange={v => setNewIngredient({...newIngredient, unidade_base: v})} defaultValue="g">
                                    <SelectTrigger className="h-12 rounded-2xl bg-[var(--bg-app)] border border-[var(--border)] font-black italic text-[var(--text-primary)] shadow-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border border-[var(--border)] shadow-xl bg-white">
                                        {['g', 'kg', 'ml', 'l', 'un'].map(u => (
                                            <SelectItem key={u} value={u} className="font-black italic uppercase text-[10px] tracking-widest">{u}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-4 italic">Saldo Inicial</Label>
                                <Input 
                                    type="number" 
                                    value={newIngredient.estoque_atual}
                                    onChange={e => setNewIngredient({...newIngredient, estoque_atual: e.target.value})}
                                    className="h-12 rounded-2xl bg-[var(--bg-app)] border border-[var(--border)] px-6 font-black italic text-[var(--text-primary)] shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-4 italic">Estoque Mínimo</Label>
                                <Input 
                                    type="number" 
                                    value={newIngredient.estoque_minimo}
                                    onChange={e => setNewIngredient({...newIngredient, estoque_minimo: e.target.value})}
                                    className="h-12 rounded-2xl bg-[var(--bg-app)] border border-[var(--border)] px-6 font-black italic text-[var(--text-primary)] shadow-sm"
                                />
                            </div>
                        </div>

                        <Button 
                            onClick={handleCreateIngredient}
                            className="w-full h-16 rounded-[24px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black italic uppercase text-sm tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Sparkles size={18} />
                            Cadastrar Insumo
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Edit Ingredient Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl rounded-[40px] p-10 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">Editar Insumo</DialogTitle>
                        <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic mt-1">Atualize os dados do seu ingrediente</DialogDescription>
                    </DialogHeader>

                    {ingredientToEdit && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Nome do Ingrediente</Label>
                                    <Input 
                                        value={ingredientToEdit.nome}
                                        onChange={e => setIngredientToEdit({...ingredientToEdit, nome: e.target.value})}
                                        className="h-12 rounded-2xl bg-slate-50 border-none px-6 font-bold focus-visible:ring-pink-500 shadow-sm"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Código / SKU</Label>
                                    <Input 
                                        value={ingredientToEdit.codigo || ""}
                                        onChange={e => setIngredientToEdit({...ingredientToEdit, codigo: e.target.value})}
                                        className="h-12 rounded-2xl bg-slate-50 border-none px-6 font-bold focus-visible:ring-pink-500 shadow-sm"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Descrição Detalhada</Label>
                                    <Textarea 
                                        placeholder="Características do produto..."
                                        value={ingredientToEdit.descricao || ""}
                                        onChange={e => setIngredientToEdit({...ingredientToEdit, descricao: e.target.value})}
                                        className="min-h-[80px] rounded-2xl bg-slate-50 border-none px-6 py-4 font-bold focus-visible:ring-pink-500 shadow-sm resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Categoria</Label>
                                    <Select 
                                        value={ingredientToEdit.categoria} 
                                        onValueChange={v => setIngredientToEdit({...ingredientToEdit, categoria: v})}
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-xl">
                                            {CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Unidade Base</Label>
                                    <Select 
                                        value={ingredientToEdit.unidade_base} 
                                        onValueChange={v => setIngredientToEdit({...ingredientToEdit, unidade_base: v})}
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-xl">
                                            {['g', 'kg', 'ml', 'l', 'un'].map(u => (
                                                <SelectItem key={u} value={u} className="font-bold uppercase">{u}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Saldo Atual</Label>
                                    <Input 
                                        type="number" 
                                        value={ingredientToEdit.estoque_atual}
                                        onChange={e => setIngredientToEdit({...ingredientToEdit, estoque_atual: e.target.value})}
                                        className="h-12 rounded-2xl bg-slate-50 border-none px-6 font-bold shadow-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Estoque Mínimo</Label>
                                    <Input 
                                        type="number" 
                                        value={ingredientToEdit.estoque_minimo}
                                        onChange={e => setIngredientToEdit({...ingredientToEdit, estoque_minimo: e.target.value})}
                                        className="h-12 rounded-2xl bg-slate-50 border-none px-6 font-bold shadow-sm"
                                    />
                                </div>
                                
                                <div className="md:col-span-2 p-6 bg-blue-50/50 rounded-[32px] space-y-4 border border-blue-100">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic flex items-center gap-2">
                                        <DollarSign size={14} /> Dados de Compra (Embalagem)
                                    </Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase">Preço Embalagem (R$)</Label>
                                            <Input 
                                                type="number" 
                                                value={ingredientToEdit.preco_total}
                                                onChange={e => {
                                                    const p = parseFloat(e.target.value) || 0;
                                                    const q = parseFloat(ingredientToEdit.quantidade_total) || 1;
                                                    const f = parseFloat(ingredientToEdit.fator_rendimento) || 1;
                                                    const unitCost = p / (q * f);
                                                    setIngredientToEdit({...ingredientToEdit, preco_total: e.target.value, custo_medio: unitCost.toFixed(4)});
                                                }}
                                                className="h-10 rounded-xl bg-white border-none shadow-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase">Un. Compra (Ex: Caixa)</Label>
                                            <Input 
                                                value={ingredientToEdit.unidade_compra}
                                                onChange={e => setIngredientToEdit({...ingredientToEdit, unidade_compra: e.target.value})}
                                                className="h-10 rounded-xl bg-white border-none shadow-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase">Qtd na Embalagem</Label>
                                            <Input 
                                                type="number" 
                                                value={ingredientToEdit.quantidade_total}
                                                onChange={e => {
                                                    const q = parseFloat(e.target.value) || 1;
                                                    const p = parseFloat(ingredientToEdit.preco_total) || 0;
                                                    const f = parseFloat(ingredientToEdit.fator_rendimento) || 1;
                                                    const unitCost = p / (q * f);
                                                    setIngredientToEdit({...ingredientToEdit, quantidade_total: e.target.value, custo_medio: unitCost.toFixed(4)});
                                                }}
                                                className="h-10 rounded-xl bg-white border-none shadow-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase text-amber-600">Fator Rendimento (0.1 - 1.0)</Label>
                                            <Input 
                                                type="number" 
                                                step="0.05"
                                                value={ingredientToEdit.fator_rendimento || 1.0}
                                                onChange={e => {
                                                    const f = parseFloat(e.target.value) || 1;
                                                    const p = parseFloat(ingredientToEdit.preco_total) || 0;
                                                    const q = parseFloat(ingredientToEdit.quantidade_total) || 1;
                                                    const unitCost = p / (q * f);
                                                    setIngredientToEdit({...ingredientToEdit, fator_rendimento: e.target.value, custo_medio: unitCost.toFixed(4)});
                                                }}
                                                className="h-10 rounded-xl bg-white border-none shadow-sm font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-pink-500 ml-4 italic">Custo por {ingredientToEdit.unidade_base} (R$)</Label>
                                    <Input 
                                        type="number"
                                        value={ingredientToEdit.custo_medio}
                                        onChange={e => setIngredientToEdit({...ingredientToEdit, custo_medio: e.target.value})}
                                        className="h-12 rounded-2xl bg-pink-50 border-pink-100 px-6 font-black text-pink-600 shadow-sm italic focus-visible:ring-pink-500"
                                    />
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 ml-4 italic">* Calculado automaticamente, mas editável se necessário</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Valor Total em Estoque</Label>
                                    <div className="h-12 rounded-2xl bg-emerald-50 border border-emerald-100 px-6 flex items-center font-black text-emerald-600 shadow-sm italic">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                            (parseFloat(ingredientToEdit.estoque_atual) || 0) * (parseFloat(ingredientToEdit.custo_medio) || 0)
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button 
                                onClick={handleUpdateIngredient}
                                disabled={loading}
                                className="w-full h-16 rounded-[24px] bg-slate-900 hover:bg-black text-white font-black italic uppercase text-sm tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                Salvar Alterações ✨
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-[40px] p-10 border-none shadow-2xl max-w-sm">
                    <AlertDialogHeader className="items-center text-center">
                        <div className="size-20 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mb-6 shadow-xl shadow-rose-100/50">
                            <Trash2 size={40} />
                        </div>
                        <AlertDialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none mb-2">
                            Excluir Insumo?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                            Esta ação não pode ser desfeita. O item <span className="text-rose-500">"{ingredientToDelete?.nome}"</span> será removido permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-8">
                        <AlertDialogAction 
                            onClick={handleDeleteIngredient}
                            className="w-full h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-xs tracking-widest border-none shadow-xl shadow-rose-500/20"
                        >
                            Sim, Excluir Agora
                        </AlertDialogAction>
                        <AlertDialogCancel className="w-full h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-black uppercase text-xs tracking-widest border-none">
                            Cancelar
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <StockImporter 
                isOpen={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
                onImportComplete={fetchInsumos}
                tenantId={profile?.tenant_id || profile?.company_id || ""}
                userId={user?.id || ""}
            />
<<<<<<< HEAD
            <Button onClick={() => setNewIngredientOpen(true)} className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 font-black uppercase text-[10px] text-white shadow-lg">
              <Plus className="mr-2 size-4" /> Entrada Manual
            </Button>
          </div>
        )}
      />

      <div className="space-y-6">
        <PageFilters options={filterOptions} activeKey={filterCategory} onSelect={setFilterCategory} />
        <PageSearch value={search} onChange={setSearch} placeholder="Buscar por ingrediente ou categoria..." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => {
            const isCritical = item.current_quantity < item.min_stock
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "group bg-white rounded-2xl sm:rounded-3xl border p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden",
                  isCritical ? "border-rose-100 shadow-rose-500/5 bg-rose-50/10" : "border-slate-100"
                )}
              >
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className={cn("size-10 sm:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-white border", isCritical ? "bg-rose-500 border-rose-400" : "bg-primary border-rose-400")}>
                    <Package className="size-5 sm:size-6" />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-8 rounded-lg text-slate-400" onClick={() => { setEditingIngredient(item); setFormData({ name: item.name, category: item.category || "", current_quantity: item.current_quantity.toString(), unit: item.unit, min_stock: item.min_stock.toString(), purchase_price: item.purchase_price.toString(), package_quantity: item.package_quantity.toString() }); setNewIngredientOpen(true) }}>
                      <Edit2 className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 rounded-lg text-rose-400" onClick={() => handleDeleteIngredient(item.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1 mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase italic leading-tight truncate">{item.name}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[7px] sm:text-[8px] font-black uppercase text-slate-400 border-slate-100 px-1.5 py-0">{item.category || "Insumo"}</Badge>
                    {isCritical && <Badge className="bg-rose-500 text-white border-none font-black text-[7px] sm:text-[8px] uppercase px-1.5 py-0 italic animate-pulse">Crítico</Badge>}
                  </div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-wide sm:tracking-widest italic">Qtd Atual</span>
                    <span className={cn("text-lg sm:text-xl font-black italic", isCritical ? "text-rose-500" : "text-slate-900")}>
                      {item.current_quantity} <span className="text-[9px] sm:text-[10px] uppercase">{item.unit}</span>
                    </span>
                  </div>
                  <div className="pt-2 sm:pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] sm:text-[10px] font-black uppercase text-slate-400">
                    <span>Mín: {item.min_stock}{item.unit}</span>
                    <span className="text-slate-900">R$ {item.purchase_price.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                   onClick={() => handleQuickRestock(item.id, item.current_quantity)}
                   variant="outline" 
                   className="w-full h-9 sm:h-10 rounded-lg sm:rounded-xl border-slate-100 text-slate-500 font-black uppercase text-[8px] sm:text-[9px] hover:bg-slate-50 gap-1.5 sm:gap-2"
                >
                  <Plus className="size-3.5 sm:size-4" /> Reforçar (+10)
                </Button>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {!loading && filtered.length === 0 && (
          <EmptyStateV2 
            icon={Warehouse}
            title="Estoque vazio"
            subtitle="Cadastre seus insumos para controlar custos e evitar faltas na produção"
            action={<Button onClick={() => setNewIngredientOpen(true)} className="h-10 px-6 rounded-xl bg-rose-500 text-white font-black uppercase text-[10px]">Cadastrar Insumo</Button>}
          />
        )}
      </div>

      <Dialog open={newIngredientOpen} onOpenChange={setNewIngredientOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-2xl sm:rounded-[32px] p-4 sm:p-6 lg:p-8 mx-auto">
          <DialogHeader className="mb-4 sm:mb-6"><DialogTitle className="text-lg sm:text-xl lg:text-2xl font-black uppercase italic">{editingIngredient ? 'Editar' : 'Novo'} Insumo</DialogTitle></DialogHeader>
          <div className="space-y-3 sm:space-y-4 font-bold">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2"><Label className="text-[9px] sm:text-[10px] uppercase text-slate-400">Nome</Label><Input className="h-11 sm:h-12 rounded-lg sm:rounded-xl text-base" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="space-y-1.5 sm:space-y-2"><Label className="text-[9px] sm:text-[10px] uppercase text-slate-400">Categoria</Label><Input className="h-11 sm:h-12 rounded-lg sm:rounded-xl text-base" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2"><Label className="text-[8px] sm:text-[10px] uppercase text-slate-400">Qtd Atual</Label><Input type="number" className="h-11 sm:h-12 rounded-lg sm:rounded-xl text-base" value={formData.current_quantity} onChange={e => setFormData({ ...formData, current_quantity: e.target.value })} /></div>
              <div className="space-y-1.5 sm:space-y-2"><Label className="text-[8px] sm:text-[10px] uppercase text-slate-400">Mínimo</Label><Input type="number" className="h-11 sm:h-12 rounded-lg sm:rounded-xl text-base" value={formData.min_stock} onChange={e => setFormData({ ...formData, min_stock: e.target.value })} /></div>
              <div className="space-y-1.5 sm:space-y-2"><Label className="text-[8px] sm:text-[10px] uppercase text-slate-400">Unidade</Label><Input className="h-11 sm:h-12 rounded-lg sm:rounded-xl text-base" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-slate-900">
              <div className="space-y-1.5 sm:space-y-2 font-bold"><Label className="text-[8px] sm:text-[10px] uppercase text-slate-400">Preço (R$)</Label><Input type="number" className="h-11 sm:h-12 rounded-lg sm:rounded-xl text-base" value={formData.purchase_price} onChange={e => setFormData({ ...formData, purchase_price: e.target.value })} /></div>
              <div className="space-y-1.5 sm:space-y-2"><Label className="text-[8px] sm:text-[10px] uppercase text-slate-400">Qtd Pacote</Label><Input type="number" className="h-11 sm:h-12 rounded-lg sm:rounded-xl text-base" value={formData.package_quantity} onChange={e => setFormData({ ...formData, package_quantity: e.target.value })} /></div>
            </div>
            <Button onClick={handleSaveIngredient} disabled={isSaving} className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-rose-500 font-black uppercase text-white shadow-lg mt-3 sm:mt-4 text-sm sm:text-base">{isSaving ? "Gravando..." : "Confirmar Insumo"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
=======
        </div>
    )
}

function MetricCard({ label, value, icon: Icon, color, bgColor, active }: any) {
    return (
        <Card className="p-6 rounded-[32px] border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className={cn("absolute top-0 right-0 size-24 blur-3xl rounded-full opacity-10 -mr-12 -mt-12 transition-all group-hover:opacity-20", color.replace('text', 'bg'))} />
            <div className="flex items-center gap-4">
                <div className={cn("size-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500", bgColor, color)}>
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-normal mb-1">{label}</p>
                    <h3 className={cn("text-xl font-black italic uppercase tracking-tighter leading-normal pr-4", active ? color : "text-slate-900")}>
                        {value}
                    </h3>
                </div>
            </div>
        </Card>
    )
>>>>>>> d8bd0f007bcba4de2d011984f266ae7f01f1b5f5
}
