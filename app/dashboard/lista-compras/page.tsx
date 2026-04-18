"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { useAuth } from "@/hooks/useAuth"
import { 
    ShoppingBag, 
    Plus, 
    CheckCircle2, 
    Trash2, 
    MessageSquare,
    Loader2,
    DollarSign,
    ShoppingCart,
    Clock,
    AlertCircle,
    Package,
    ArrowRight,
    Store,
    Filter,
    Edit2,
    Search,
    History,
    Zap,
    FileCode,
    Sparkles
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { finalizeShoppingList, generateAutoShoppingList } from "@/utils/inventory"
import { NfeImportModal } from "@/components/dashboard/NfeImportModal"
import { TextImportModal } from "@/components/dashboard/TextImportModal"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const ExportPdfButton = dynamic(() => import("@/components/dashboard/ExportPdfButton"), { ssr: false })

export default function ProfessionalShoppingListPage() {
    const { profile } = useBusiness()
    const { user } = useAuth()
    const router = useRouter()
    
    const [items, setItems] = useState<any[]>([])
    const [availableIngredients, setAvailableIngredients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    
    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false)
    const [isNfeModalOpen, setIsNfeModalOpen] = useState(false)
    const [isTextImportModalOpen, setIsTextImportModalOpen] = useState(false)
    const [isFinalizing, setIsFinalizing] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    
    const [newItem, setNewItem] = useState({
        nome_item: "",
        ingrediente_id: "",
        quantidade: "",
        unidade: "un",
        preco_unitario: "",
        fornecedor: ""
    })

    useEffect(() => {
        if (profile?.tenant_id || profile?.company_id) {
            fetchData()
        }
    }, [profile])

    async function fetchData() {
        const tenantId = profile?.tenant_id || profile?.company_id
        setLoading(true)
        try {
            // Fetch Shopping List (excluding those already added to stock)
            const { data: listData, error: lError } = await supabase
                .from('lista_compras')
                .select('*, ingredientes(categoria)')
                .eq('tenant_id', tenantId)
                .neq('status', 'adicionado_estoque')
                .order('created_at', { ascending: false })
            
            if (lError) throw lError

            // Fetch Ingredients for linking
            const { data: ingsData } = await supabase
                .from('ingredientes')
                .select('id, nome, unidade_base')
                .eq('tenant_id', tenantId)
                .order('nome')

            setItems(listData || [])
            setAvailableIngredients(ingsData || [])
        } catch (e) {
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    const filteredItems = items.filter(item => 
        item.nome_item.toLowerCase().includes(search.toLowerCase()) ||
        item.fornecedor?.toLowerCase().includes(search.toLowerCase())
    )

    const stats = {
        toBuy: items.filter(i => i.status === 'pendente').length,
        bought: items.filter(i => i.status === 'comprado').length,
        totalPending: items.filter(i => i.status === 'pendente').reduce((acc, i) => acc + (Number(i.valor_total) || 0), 0),
        totalGeneral: items.reduce((acc, i) => acc + (Number(i.valor_total) || 0), 0)
    }

    async function handleAddItem() {
        if (!newItem.nome_item && !newItem.ingrediente_id) return toast.error("Selecione ou nomeie um item")
        
        const tenantId = profile?.tenant_id || profile?.company_id
        
        const selectedIng = availableIngredients.find(i => i.id === newItem.ingrediente_id)
        const finalName = selectedIng ? selectedIng.nome : newItem.nome_item
        const finalUnit = selectedIng ? selectedIng.unidade_base : newItem.unidade

        try {
            const { error } = await supabase
                .from('lista_compras')
                .insert({
                    tenant_id: tenantId,
                    company_id: tenantId,
                    ingrediente_id: newItem.ingrediente_id || null,
                    nome_item: finalName,
                    quantidade: parseFloat(newItem.quantidade) || 1,
                    unidade: finalUnit,
                    preco_unitario: parseFloat(newItem.preco_unitario) || 0,
                    valor_total: (parseFloat(newItem.quantidade) || 1) * (parseFloat(newItem.preco_unitario) || 0),
                    fornecedor: newItem.fornecedor,
                    status: 'pendente',
                    usuario_id: user?.id
                })

            if (error) throw error
            toast.success("Item adicionado à lista!")
            setIsAddModalOpen(false)
            setNewItem({ nome_item: "", ingrediente_id: "", quantidade: "", unidade: "un", preco_unitario: "", fornecedor: "" })
            fetchData()
        } catch (e) {
            toast.error("Erro ao adicionar")
        }
    }

    async function toggleStatus(item: any) {
        const newStatus = item.status === 'pendente' ? 'comprado' : 'pendente'
        try {
            const { error } = await supabase
                .from('lista_compras')
                .update({ status: newStatus })
                .eq('id', item.id)
            
            if (error) throw error
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i))
            toast.success(newStatus === 'comprado' ? "Marcado como comprado!" : "Voltado para pendente")
        } catch (e) {
            toast.error("Erro ao atualizar")
        }
    }

    async function handleDelete(id: string) {
        try {
            await supabase.from('lista_compras').delete().eq('id', id)
            setItems(prev => prev.filter(i => i.id !== id))
        } catch (e) {
            toast.error("Erro ao excluir")
        }
    }

    async function handleAutoGenerate() {
        setIsGenerating(true)
        const tenantId = profile?.tenant_id || profile?.company_id
        try {
            const { count } = await generateAutoShoppingList(tenantId as string, user?.id as string)
            if (count > 0) {
                toast.success(`${count} itens adicionados automaticamente por estoque baixo!`)
                fetchData()
            } else {
                toast.info("Nenhum ingrediente abaixo do estoque mínimo.")
            }
        } catch (e) {
            toast.error("Erro ao gerar lista automática")
        } finally {
            setIsGenerating(false)
        }
    }

    async function onFinalize() {
        const boughtItems = items.filter(i => i.status === 'comprado')
        if (boughtItems.length === 0) return toast.error("Nenhum item comprado para finalizar")
        
        setIsFinalizing(true)
        const tenantId = profile?.tenant_id || profile?.company_id
        
        try {
            await finalizeShoppingList(boughtItems.map(i => i.id), tenantId as string, user?.id as string)
            toast.success("Compra finalizada! Estoque atualizado com sucesso.")
            setIsFinalizeModalOpen(false)
            fetchData()
        } catch (e: any) {
            console.error("Erro na finalização:", e)
            const errorMsg = e.message || (typeof e === 'string' ? e : JSON.stringify(e))
            toast.error("Erro: " + errorMsg)
        } finally {
            setIsFinalizing(false)
        }
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                        Lista de <span className="text-emerald-500">Compras</span>
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                        Gerencie suas compras e automatize seu estoque
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 p-1.5 rounded-[22px] gap-1">
                        <Button 
                            variant="ghost"
                            onClick={() => router.push('/dashboard/lista-compras/historico')}
                            className="h-10 px-4 rounded-2xl text-slate-500 hover:text-slate-900 font-bold uppercase text-[9px] tracking-widest gap-2"
                        >
                            <History size={14} /> Histórico
                        </Button>
                        <ExportPdfButton items={items.filter(i => i.status === 'pendente')} />
                    </div>

                    <Button 
                        onClick={handleAutoGenerate}
                        disabled={isGenerating}
                        className="h-12 px-6 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-black uppercase text-[10px] tracking-widest gap-2 border-none transition-all"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                        Gerar Automático
                    </Button>

                    <Button 
                        onClick={() => setIsNfeModalOpen(true)}
                        className="h-12 px-6 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-black uppercase text-[10px] tracking-widest gap-2 border-none transition-all"
                    >
                        <FileCode size={16} /> Nota Fiscal
                    </Button>

                    <Button 
                        onClick={() => setIsTextImportModalOpen(true)}
                        className="h-12 px-6 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-black uppercase text-[10px] tracking-widest gap-2 border-none transition-all"
                    >
                        <Sparkles size={16} /> Colar Texto (IA)
                    </Button>

                    <Button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-slate-900/10"
                    >
                        <Plus size={16} /> Novo Item
                    </Button>

                    <Button 
                        disabled={stats.bought === 0 || isFinalizing}
                        onClick={() => setIsFinalizeModalOpen(true)}
                        className="h-12 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-emerald-500/10"
                    >
                        {isFinalizing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                        Finalizar Compra
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard label="A Comprar" value={stats.toBuy} icon={ShoppingCart} color="text-slate-400" bgColor="bg-slate-50" />
                <MetricCard label="Comprados" value={stats.bought} icon={CheckCircle2} color="text-amber-500" bgColor="bg-amber-50" />
                <MetricCard label="Pendente R$" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalPending)} icon={Clock} color="text-blue-500" bgColor="bg-blue-50" />
                <MetricCard label="Total Geral" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalGeneral)} icon={DollarSign} color="text-emerald-500" bgColor="bg-emerald-100" />
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <Input 
                    placeholder="Buscar produto ou fornecedor..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-16 pl-16 pr-8 rounded-[32px] border-none bg-white shadow-sm focus-visible:ring-emerald-500 font-bold text-sm tracking-tight"
                />
            </div>

            {/* Shopping List Groups */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* To Buy Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="size-5 text-slate-400" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Para Comprar ({stats.toBuy})</h2>
                    </div>
                    
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                <div className="h-40 flex items-center justify-center bg-white rounded-[32px] border border-slate-100">
                                    <Loader2 className="animate-spin text-slate-200" />
                                </div>
                            ) : filteredItems.filter(i => i.status === 'pendente').length > 0 ? (
                                filteredItems.filter(i => i.status === 'pendente').map((item) => (
                                    <ShoppingItemCard key={item.id} item={item} onToggle={() => toggleStatus(item)} onDelete={() => handleDelete(item.id)} />
                                ))
                            ) : (
                                <div className="py-12 text-center opacity-40 bg-white rounded-[32px] border border-dashed border-slate-100 flex flex-col items-center">
                                    <ShoppingBag size={32} className="mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Nenhum item pendente</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Already Bought Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="size-5 text-amber-500" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Já no Carrinho ({stats.bought})</h2>
                    </div>
                    
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {filteredItems.filter(i => i.status === 'comprado').length > 0 ? (
                                filteredItems.filter(i => i.status === 'comprado').map((item) => (
                                    <ShoppingItemCard key={item.id} item={item} onToggle={() => toggleStatus(item)} onDelete={() => handleDelete(item.id)} isBought />
                                ))
                            ) : (
                                <div className="py-12 text-center opacity-20 bg-slate-50 rounded-[32px] border border-dashed border-slate-100 flex flex-col items-center">
                                    <Package size={32} className="mb-2" />
                                    <p className="text-[10px] font-black uppercase italic tracking-widest">Carrinho vazio</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Add Item Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-md rounded-[40px] p-10 border-none shadow-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="mb-8 items-center text-center">
                        <div className="size-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                            <Plus size={32} />
                        </div>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Novo Item</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Vincular a Insumo Existente</Label>
                            <Select onValueChange={v => setNewItem({...newItem, ingrediente_id: v === "none" ? "" : v})} defaultValue="none">
                                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold shadow-sm">
                                    <SelectValue placeholder="Selecione um insumo (opcional)" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-xl">
                                    <SelectItem value="none" className="font-bold">Item Novo (não vinculado)</SelectItem>
                                    {availableIngredients.map(ai => (
                                        <SelectItem key={ai.id} value={ai.id} className="font-bold">{ai.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {!newItem.ingrediente_id && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Nome do Item</Label>
                                <Input 
                                    placeholder="Ex: Sacolas de Papel"
                                    value={newItem.nome_item}
                                    onChange={e => setNewItem({...newItem, nome_item: e.target.value})}
                                    className="h-12 rounded-2xl bg-slate-50 border-none px-6 font-bold"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Quantidade</Label>
                                <Input 
                                    type="number"
                                    value={newItem.quantidade}
                                    onChange={e => setNewItem({...newItem, quantidade: e.target.value})}
                                    className="h-12 rounded-2xl bg-slate-50 border-none px-6 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Preço Est. (Unid)</Label>
                                <Input 
                                    type="number"
                                    placeholder="R$ 0.00"
                                    value={newItem.preco_unitario}
                                    onChange={e => setNewItem({...newItem, preco_unitario: e.target.value})}
                                    className="h-12 rounded-2xl bg-slate-50 border-none px-6 font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Fornecedor / Loja</Label>
                            <Input 
                                placeholder="Ex: Atacadão ou Mercado Livre"
                                value={newItem.fornecedor}
                                onChange={e => setNewItem({...newItem, fornecedor: e.target.value})}
                                className="h-12 rounded-2xl bg-slate-50 border-none px-6 font-bold"
                            />
                        </div>

                        <Button 
                            onClick={handleAddItem}
                            className="w-full h-16 rounded-[24px] bg-slate-900 hover:bg-black text-white font-black italic uppercase text-sm tracking-widest shadow-2xl transition-all active:scale-95"
                        >
                            Adicionar à Lista ✨
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Finalize Purchase Modal */}
            <Dialog open={isFinalizeModalOpen} onOpenChange={setIsFinalizeModalOpen}>
                <DialogContent className="sm:max-w-md rounded-[40px] p-10 border-none shadow-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="mb-8 items-center text-center">
                        <div className="size-20 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-xl shadow-emerald-200">
                            <CheckCircle2 size={40} />
                        </div>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Finalizar Compra</DialogTitle>
                        <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mt-2">
                            Confirmar entrada de {stats.bought} itens no seu estoque físico.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                            {items.filter(i => i.status === 'comprado').map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl font-bold text-[10px] uppercase">
                                    <div className="flex flex-col">
                                        <span className="text-slate-600 italic truncate max-w-[150px]">{item.nome_item}</span>
                                        <span className="text-[8px] text-slate-400">{item.fornecedor || 'Sem fornecedor'}</span>
                                    </div>
                                    <span className="text-emerald-500">{item.quantidade}{item.unidade}</span>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Total da Compra</span>
                                <span className="text-2xl font-black italic text-slate-900 leading-none">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(items.filter(i => i.status === 'comprado').reduce((acc, i) => acc + (Number(i.valor_total) || 0), 0))}
                                </span>
                            </div>
                        </div>

                        {items.some(i => i.status === 'comprado' && !i.ingrediente_id) && (
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                <AlertCircle className="size-5 text-amber-500 shrink-0" />
                                <p className="text-[9px] font-bold text-amber-800 uppercase leading-normal"> Itens novos sem vínculo serão criados automaticamente no seu estoque.</p>
                            </div>
                        )}

                        <Button 
                            disabled={isFinalizing}
                            onClick={onFinalize}
                            className="w-full h-18 rounded-[24px] bg-emerald-500 hover:bg-emerald-600 text-white font-black italic uppercase text-base tracking-widest shadow-2xl shadow-emerald-200 transition-all active:scale-95"
                        >
                            {isFinalizing ? <Loader2 className="animate-spin" /> : "Confirmar e Abastecer 🚀"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <NfeImportModal 
                isOpen={isNfeModalOpen} 
                onClose={() => setIsNfeModalOpen(false)} 
                ingredients={availableIngredients}
                onSuccess={fetchData}
            />

            <TextImportModal 
                isOpen={isTextImportModalOpen} 
                onClose={() => setIsTextImportModalOpen(false)} 
                ingredients={availableIngredients}
                onSuccess={fetchData}
            />
        </div>
    )
}

function ShoppingItemCard({ item, onToggle, onDelete, isBought }: any) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: isBought ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                "p-4 md:p-6 rounded-[32px] border transition-all flex items-center justify-between group h-fit",
                isBought ? "bg-amber-50/30 border-amber-100 shadow-inner" : "bg-white border-slate-100 shadow-sm hover:shadow-xl duration-500"
            )}
        >
            <div className="flex items-center gap-5 flex-1 cursor-pointer" onClick={onToggle}>
                <div className={cn(
                    "size-14 rounded-[22px] flex items-center justify-center transition-all shadow-md group-hover:scale-110 duration-500 shrink-0",
                    isBought ? "bg-amber-500 text-white shadow-amber-100" : "bg-white text-slate-200 border border-slate-100 shadow-slate-100"
                )}>
                    {isBought ? <CheckCircle2 size={28} /> : <div className="size-4 rounded-full border-2 border-slate-200" />}
                </div>
                
                <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn("font-black uppercase italic tracking-tighter text-base truncate max-w-[200px] md:max-w-xs", isBought ? 'text-slate-400 line-through' : 'text-slate-900')}>
                            {item.nome_item}
                        </h3>
                        {item.ingrediente_id ? (
                            <Badge className="bg-emerald-50 text-emerald-500 border-none font-black text-[7px] uppercase tracking-widest italic h-4 px-2">Stock Linked</Badge>
                        ) : (
                            <Badge className="bg-blue-50 text-blue-500 border-none font-black text-[7px] uppercase tracking-widest italic h-4 px-2">New Item</Badge>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-black uppercase tracking-[0.1em] italic">
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-bold">Qtd:</span>
                            <span className={cn(isBought ? "text-amber-600" : "text-slate-900")}>
                                {item.quantidade} <span className="opacity-50 text-[8px]">{item.unidade}</span>
                            </span>
                        </div>

                        {item.preco_unitario > 0 && (
                            <>
                                <div className="flex items-center gap-1.5 border-l border-slate-100 pl-4">
                                    <span className="text-slate-400 font-bold">Un:</span>
                                    <span className="text-slate-600">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_unitario)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 border-l border-slate-100 pl-4">
                                    <span className="text-slate-400 font-bold">Total:</span>
                                    <span className="text-emerald-500 text-sm">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_total)}
                                    </span>
                                </div>
                            </>
                        )}

                        {item.fornecedor && (
                            <div className="flex items-center gap-1.5 border-l border-slate-100 pl-4 text-blue-400">
                                <Store size={12} className="shrink-0" />
                                <span className="truncate max-w-[100px]">{item.fornecedor}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-500">
                <Button variant="ghost" size="icon" className="size-10 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                    <Trash2 size={18} />
                </Button>
            </div>
        </motion.div>
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
