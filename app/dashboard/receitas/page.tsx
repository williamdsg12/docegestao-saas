"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import { 
    Plus, 
    BookOpen, 
    Clock, 
    ChefHat, 
    Trash2, 
    Edit2, 
    UtensilsCrossed,
    ArrowRight,
    Search,
    Flame
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { PageSearch } from "@/components/dashboard/PageSearch"
import { EmptyStateV2 } from "@/components/dashboard/EmptyStateV2"
import { ImageUploader } from "@/components/dashboard/ImageUploader"
import { ProduzirModal } from "@/components/dashboard/estoque/ProduzirModal"
import { Badge } from "@/components/ui/badge"

interface RecipeIngredient {
    id?: string 
    ingrediente_id: string
    quantidade: string
    unidade: string
}

interface Recipe {
    id: string
    nome: string
    descricao: string
    tempo_preparo: string
    rendimento: string
    image_url: string
    modo_preparo: string
    receita_ingredientes?: any[]
}

export default function ReceitasPage() {
  return (
    <FeatureGuard feature="receitas" planRequired="pro">
      <div className="space-y-8 pb-20">
        <ReceitasContent />
      </div>
    </FeatureGuard>
  )
}

function ReceitasContent() {
    const { user } = useAuth()
    const { profile } = useBusiness()
    
    const [receitas, setReceitas] = useState<Recipe[]>([])
    const [availableIngredients, setAvailableIngredients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [isProducingModalOpen, setIsProducingModalOpen] = useState(false)
    const [recipeToProduce, setRecipeToProduce] = useState<any>(null)

    const [formData, setFormData] = useState({
        nome: "",
        descricao: "",
        tempo_preparo: "",
        rendimento: "",
        image_url: "",
        modo_preparo: "",
        ingredientes: [{ ingrediente_id: "", quantidade: "", unidade: "g" }] as RecipeIngredient[]
    })

    useEffect(() => {
        if (profile?.tenant_id || profile?.company_id) {
            fetchData()
        }
    }, [profile])

    async function fetchData() {
        const tenantId = profile?.tenant_id || profile?.company_id
        if (!tenantId) return
        setLoading(true)
        try {
            const { data: recipesData, error: rError } = await supabase
                .from('receitas')
                .select('*, receita_ingredientes(*, ingredientes(nome))')
                .eq('tenant_id', tenantId)
                .order('nome')
            
            if (rError) throw rError

            const { data: ingsData, error: iError } = await supabase
                .from('ingredientes')
                .select('id, nome, unidade_base')
                .eq('tenant_id', tenantId)
                .order('nome')
            
            if (iError) throw iError

            setReceitas(recipesData || [])
            setAvailableIngredients(ingsData || [])
        } catch (e) {
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        if (!formData.nome) return toast.error("Nome é obrigatório")
        const tenantId = profile?.tenant_id || profile?.company_id
        if (!tenantId) return

        setIsSaving(true)
        try {
            const recipePayload = {
                nome: formData.nome,
                descricao: formData.descricao,
                tempo_preparo: formData.tempo_preparo,
                rendimento: formData.rendimento,
                image_url: formData.image_url,
                modo_preparo: formData.modo_preparo,
                tenant_id: tenantId,
                company_id: tenantId,
                user_id: user?.id
            }

            let recipeId = editingRecipe?.id

            if (editingRecipe) {
                await supabase.from('receitas').update(recipePayload).eq('id', editingRecipe.id)
            } else {
                const { data: newRecipe, error: createError } = await supabase
                    .from('receitas')
                    .insert(recipePayload)
                    .select()
                    .single()
                
                if (createError) throw createError
                recipeId = newRecipe.id
            }

            if (editingRecipe) {
                await supabase.from('receita_ingredientes').delete().eq('receita_id', recipeId)
            }

            const validIngredients = formData.ingredientes.filter(i => i.ingrediente_id && i.quantidade)
            if (validIngredients.length > 0) {
                const ingredientsPayload = validIngredients.map(i => ({
                    receita_id: recipeId,
                    ingrediente_id: i.ingrediente_id,
                    quantidade: parseFloat(i.quantidade),
                    unidade: i.unidade
                }))

                const { error: ingError } = await supabase.from('receita_ingredientes').insert(ingredientsPayload)
                if (ingError) throw ingError
            }

            toast.success(editingRecipe ? "Receita atualizada!" : "Receita criada!")
            setIsDialogOpen(false)
            fetchData()
        } catch (e) {
            toast.error("Erro ao salvar")
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Excluir esta receita permanentemente?")) return
        await supabase.from('receitas').delete().eq('id', id)
        setReceitas(prev => prev.filter(r => r.id !== id))
        toast.success("Excluída")
    }

    const handleOpenEdit = (recipe: any) => {
        setEditingRecipe(recipe)
        setFormData({
            nome: recipe.nome || "",
            descricao: recipe.descricao || "",
            tempo_preparo: recipe.tempo_preparo || "",
            rendimento: recipe.rendimento || "",
            image_url: recipe.image_url || "",
            modo_preparo: recipe.modo_preparo || "",
            ingredientes: recipe.receita_ingredientes?.map((ri: any) => ({
                ingrediente_id: ri.ingrediente_id,
                quantidade: ri.quantidade.toString(),
                unidade: ri.unidade
            })) || [{ ingrediente_id: "", quantidade: "", unidade: "g" }]
        })
        setIsDialogOpen(true)
    }

    const filtered = receitas.filter(r => r.nome.toLowerCase().includes(search.toLowerCase()))

    return (
        <>
            <PageHeader 
                title="Caderno de" 
                highlight="Receitas" 
                subtitle="Organize seus segredos culinários e gerencie a baixar do estoque"
                actions={(
                    <Button onClick={() => { setEditingRecipe(null); setFormData({ nome: "", descricao: "", tempo_preparo: "", rendimento: "", image_url: "", modo_preparo: "", ingredientes: [{ ingrediente_id: "", quantidade: "", unidade: "g" }] }); setIsDialogOpen(true); }} className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 font-black uppercase text-[10px] text-white shadow-lg">
                        <Plus className="mr-2 size-4" /> Nova Receita
                    </Button>
                )}
            />

            <PageSearch value={search} onChange={setSearch} placeholder="Buscar por nome da receita..." />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {filtered.map((recipe) => (
                        <motion.div
                            key={recipe.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="group bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
                        >
                            <div className="h-56 bg-slate-100 relative overflow-hidden">
                                {recipe.image_url ? (
                                    <img src={recipe.image_url} alt={recipe.nome} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="size-full flex items-center justify-center text-slate-300">
                                        <ChefHat size={48} className="opacity-20" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                    <Button variant="secondary" size="icon" className="size-10 rounded-2xl bg-white/90 backdrop-blur-sm border shadow-xl" onClick={() => handleOpenEdit(recipe)}>
                                        <Edit2 size={16} className="text-slate-600" />
                                    </Button>
                                    <Button variant="destructive" size="icon" className="size-10 rounded-2xl shadow-xl shadow-rose-200" onClick={() => handleDelete(recipe.id)}>
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                                <div className="absolute bottom-4 left-4">
                                    <Badge className="bg-white/80 backdrop-blur-md text-slate-900 border-none font-black text-[9px] px-3 py-1.5 rounded-full uppercase italic tracking-widest shadow-lg">
                                        <Clock size={12} className="mr-1.5 text-pink-500" /> {recipe.tempo_preparo || '--'} min
                                    </Badge>
                                </div>
                            </div>
                            
                            <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <h3 className="text-xl font-black text-slate-900 uppercase italic truncate tracking-tighter leading-none">{recipe.nome}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest line-clamp-2 min-h-[32px]">
                                        {recipe.descricao || "Sem descrição disponível."}
                                    </p>
                                    <div className="flex items-center gap-4 pt-2">
                                        <span className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 italic">
                                            <UtensilsCrossed size={12} className="text-pink-500" /> {recipe.receita_ingredientes?.length || 0} Insumos
                                        </span>
                                        <span className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 italic">
                                            <ChefHat size={12} className="text-pink-500" /> Rendimento: {recipe.rendimento || '1'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 pt-4">
                                    <Button 
                                        onClick={() => { setRecipeToProduce(recipe); setIsProducingModalOpen(true); }}
                                        className="flex-1 h-14 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-pink-200"
                                    >
                                        <Flame size={18} fill="currentColor" /> Produzir
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-14 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100">
                                        <ArrowRight size={20} />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {!loading && filtered.length === 0 && (
                    <div className="col-span-full">
                        <EmptyStateV2 
                            icon={BookOpen}
                            title="Nenhuma receita encontrada"
                            subtitle="Comece registrando seus segredos culinários para padronizar sua produção e gerenciar seu estoque."
                            action={<Button onClick={() => setIsDialogOpen(true)} className="h-12 px-8 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-pink-200">Criar Primeira Receita</Button>}
                        />
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto rounded-[40px] p-12 border-none shadow-2xl">
                    <DialogHeader className="mb-10">
                        <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                            {editingRecipe ? 'Editar' : 'Nova'} Ficha Técnica
                        </DialogTitle>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic mt-1">Padronize seus processos e vincule insumos do estoque</p>
                    </DialogHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-4 italic">Nome da Receita</Label>
                                <Input className="h-12 rounded-2xl bg-slate-50 border-none px-6 font-bold" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-4 italic">Tempo (min)</Label>
                                    <Input type="number" className="h-12 rounded-2xl bg-slate-50 border-none px-6 font-bold" value={formData.tempo_preparo} onChange={e => setFormData({...formData, tempo_preparo: e.target.value})} />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-4 italic">Rendimento</Label>
                                    <Input type="number" className="h-12 rounded-2xl bg-slate-50 border-none px-6 font-bold" value={formData.rendimento} onChange={e => setFormData({...formData, rendimento: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <ImageUploader 
                                    value={formData.image_url} 
                                    onChange={url => setFormData({...formData, image_url: url})} 
                                    label="Foto da Receita" 
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-4 italic">Modo de Preparo</Label>
                                <Textarea className="min-h-[180px] rounded-[32px] bg-slate-50 border-none p-6 text-sm" value={formData.modo_preparo} onChange={e => setFormData({...formData, modo_preparo: e.target.value})} />
                            </div>
                        </div>

                        <div className="lg:col-span-3 space-y-6">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center">
                                        <UtensilsCrossed size={16} />
                                    </div>
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-900 italic">Ingredientes Reais</Label>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setFormData(prev => ({...prev, ingredientes: [...prev.ingredientes, { ingrediente_id: "", quantidade: "", unidade: "g" }] }))} className="text-pink-500 font-black uppercase text-[9px] tracking-widest hover:bg-pink-50 rounded-xl px-4">
                                    + Vincular Insumo
                                </Button>
                            </div>

                            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                {formData.ingredientes.map((ing, idx) => (
                                    <div key={idx} className="flex gap-3 bg-slate-50 p-3 rounded-2xl items-center border border-transparent hover:border-slate-200 transition-colors">
                                        <div className="flex-1">
                                            <select 
                                                className="h-11 w-full rounded-xl bg-white border-none text-[11px] font-black uppercase px-4 shadow-sm"
                                                value={ing.ingrediente_id}
                                                onChange={e => {
                                                    const n = [...formData.ingredientes];
                                                    n[idx].ingrediente_id = e.target.value;
                                                    setFormData({...formData, ingredientes: n});
                                                }}
                                            >
                                                <option value="">Selecione um insumo...</option>
                                                {availableIngredients.map(ai => (
                                                    <option key={ai.id} value={ai.id}>{ai.nome}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <Input 
                                            placeholder="Qtd" 
                                            className="h-11 w-20 rounded-xl bg-white border-none text-[11px] font-black text-center shadow-sm" 
                                            value={ing.quantidade} 
                                            onChange={e => { const n = [...formData.ingredientes]; n[idx].quantidade = e.target.value; setFormData({...formData, ingredientes: n}); }} 
                                        />
                                        <select 
                                            className="h-11 w-16 rounded-xl bg-white border-none text-[10px] font-black uppercase px-1 text-center shadow-sm" 
                                            value={ing.unidade} 
                                            onChange={e => { const n = [...formData.ingredientes]; n[idx].unidade = e.target.value; setFormData({...formData, ingredientes: n}); }}
                                        >
                                            {['g', 'kg', 'ml', 'L', 'un'].map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                        <Button variant="ghost" size="icon" className="size-10 text-slate-300 hover:text-rose-500" onClick={() => setFormData({...formData, ingredientes: formData.ingredientes.filter((_, i) => i !== idx) })}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-4 mt-12 pt-8 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400">
                            Cancelar
                        </Button>
                        <Button disabled={isSaving} onClick={handleSave} className="h-16 px-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95">
                            {isSaving ? "Salvando..." : "Gravar Ficha Técnica ✨"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ProduzirModal 
                isOpen={isProducingModalOpen} 
                onOpenChange={setIsProducingModalOpen} 
                recipe={recipeToProduce} 
            />
        </>
    )
}
