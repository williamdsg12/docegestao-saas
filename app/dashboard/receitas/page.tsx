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
    ChevronRight,
    UtensilsCrossed,
    ArrowRight,
    Search
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

interface RecipeIngredient {
    nome: string
    quantidade: string
    unidade: string
}

interface Recipe {
    id: string
    nome: string
    descricao: string
    tempo_preparo: string
    rendimento: string
    foto_url: string
    ingredientes: RecipeIngredient[]
    modo_preparo: string
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
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState({
        nome: "",
        descricao: "",
        tempo_preparo: "",
        rendimento: "",
        foto_url: "",
        modo_preparo: "",
        ingredientes: [{ nome: "", quantidade: "", unidade: "g" }] as RecipeIngredient[]
    })

    useEffect(() => {
        if (profile?.tenant_id || profile?.company_id) {
            fetchReceitas()
        }
    }, [profile])

    async function fetchReceitas() {
        const tenantId = profile?.tenant_id || profile?.company_id
        if (!tenantId) return
        try {
            setLoading(true)
            const { data, error } = await supabase.from('receitas').select('*').eq('tenant_id', tenantId).order('nome')
            if (error) throw error
            setReceitas(data || [])
        } finally { setLoading(false) }
    }

    async function handleSave() {
        if (!formData.nome) return toast.error("Nome é obrigatório")
        setIsSaving(true)
        try {
            const tenantId = profile?.tenant_id || profile?.company_id
            const payload = { ...formData, tenant_id: tenantId, company_id: tenantId, user_id: user?.id }

            if (editingRecipe) {
                await supabase.from('receitas').update(payload).eq('id', editingRecipe.id)
                toast.success("Receita atualizada!")
            } else {
                await supabase.from('receitas').insert(payload)
                toast.success("Receita criada!")
            }
            setIsDialogOpen(false)
            fetchReceitas()
        } catch (e) { toast.error("Erro ao salvar") } finally { setIsSaving(false) }
    }

    async function handleDelete(id: string) {
        if (!confirm("Excluir esta receita permanentemente?")) return
        await supabase.from('receitas').delete().eq('id', id)
        setReceitas(prev => prev.filter(r => r.id !== id))
        toast.success("Excluída")
    }

    const filtered = receitas.filter(r => r.nome.toLowerCase().includes(search.toLowerCase()))

    return (
        <>
            <PageHeader 
                title="Caderno de" 
                highlight="Receitas" 
                subtitle="Organize seus segredos culinários e garanta a padronização total"
                actions={(
                    <Button onClick={() => { setEditingRecipe(null); setFormData({ nome: "", descricao: "", tempo_preparo: "", rendimento: "", foto_url: "", modo_preparo: "", ingredientes: [{ nome: "", quantidade: "", unidade: "g" }] }); setIsDialogOpen(true); }} className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 font-black uppercase text-[10px] text-white shadow-lg">
                        <Plus className="mr-2 size-4" /> Nova Receita
                    </Button>
                )}
            />

            <PageSearch value={search} onChange={setSearch} placeholder="Buscar por nome da receita..." />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {filtered.map((recipe) => (
                        <motion.div
                            key={recipe.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                        >
                            <div className="aspect-video bg-slate-100 relative group-hover:scale-105 transition-transform duration-500">
                                {recipe.foto_url ? (
                                    <img src={recipe.foto_url} alt={recipe.nome} className="size-full object-cover" />
                                ) : (
                                    <div className="size-full flex items-center justify-center text-slate-300">
                                        <ChefHat size={32} />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="secondary" size="icon" className="size-8 rounded-lg bg-white/90 backdrop-blur-sm" onClick={() => { setEditingRecipe(recipe); setFormData(recipe); setIsDialogOpen(true); }}>
                                        <Edit2 size={14} />
                                    </Button>
                                    <Button variant="destructive" size="icon" className="size-8 rounded-lg" onClick={() => handleDelete(recipe.id)}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="p-5 space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-base font-black text-slate-900 uppercase italic truncate leading-tight">{recipe.nome}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400 italic">
                                            <Clock size={10} className="text-rose-500" /> {recipe.tempo_preparo || '--'} min
                                        </span>
                                        <span className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400 italic">
                                            <UtensilsCrossed size={10} className="text-rose-500" /> {recipe.ingredientes?.length || 0} Itens
                                        </span>
                                    </div>
                                </div>
                                
                                <Button variant="ghost" className="w-full h-10 rounded-xl bg-slate-50 text-slate-500 font-black uppercase text-[9px] hover:bg-slate-100 gap-2">
                                    Ver preparo completo <ArrowRight size={14} />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {!loading && filtered.length === 0 && (
                    <EmptyStateV2 
                        icon={BookOpen}
                        title="Sem receitas"
                        subtitle="Comece registrando seus segredos culinários para padronizar sua produção"
                        action={<Button onClick={() => setIsDialogOpen(true)} className="h-10 px-6 rounded-xl bg-rose-500 text-white font-black uppercase text-[10px]">Nova Receita</Button>}
                    />
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] p-10">
                    <DialogHeader className="mb-8"><DialogTitle className="text-2xl font-black uppercase italic">{editingRecipe ? 'Editar' : 'Nova'} Receita</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 font-bold">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase text-slate-400">Nome</Label>
                                <Input className="h-12 rounded-xl bg-slate-50 border-none px-4" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Tempo (min)</Label><Input type="number" className="h-12 rounded-xl bg-slate-50 border-none px-4" value={formData.tempo_preparo} onChange={e => setFormData({...formData, tempo_preparo: e.target.value})} /></div>
                                <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Rendimento</Label><Input type="number" className="h-12 rounded-xl bg-slate-50 border-none px-4" value={formData.rendimento} onChange={e => setFormData({...formData, rendimento: e.target.value})} /></div>
                            </div>
                            <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">URL da Foto</Label><Input className="h-12 rounded-xl bg-slate-50 border-none px-4" placeholder="https://..." value={formData.foto_url} onChange={e => setFormData({...formData, foto_url: e.target.value})} /></div>
                            <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Modo de Preparo</Label><Textarea className="min-h-[150px] rounded-2xl bg-slate-50 border-none p-4" value={formData.modo_preparo} onChange={e => setFormData({...formData, modo_preparo: e.target.value})} /></div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between"><Label className="text-[10px] uppercase text-slate-400">Ingredientes</Label><Button variant="ghost" size="sm" onClick={() => setFormData(prev => ({...prev, ingredientes: [...prev.ingredientes, { nome: "", quantidade: "", unidade: "g" }] }))} className="text-rose-500 font-black uppercase text-[9px] tracking-widest">+ Adicionar</Button></div>
                            <div className="space-y-3">
                                {formData.ingredientes.map((ing, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input placeholder="Insumo" className="h-10 flex-1 rounded-lg bg-slate-50 border-none text-[11px]" value={ing.nome} onChange={e => { const n = [...formData.ingredientes]; n[idx].nome = e.target.value; setFormData({...formData, ingredientes: n}); }} />
                                        <Input placeholder="Qtd" className="h-10 w-16 rounded-lg bg-slate-50 border-none text-[11px] text-center" value={ing.quantidade} onChange={e => { const n = [...formData.ingredientes]; n[idx].quantidade = e.target.value; setFormData({...formData, ingredientes: n}); }} />
                                        <select className="h-10 w-14 rounded-lg bg-slate-50 border-none text-[10px] font-black uppercase px-2" value={ing.unidade} onChange={e => { const n = [...formData.ingredientes]; n[idx].unidade = e.target.value; setFormData({...formData, ingredientes: n}); }}><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="un">un</option></select>
                                        <Button variant="ghost" size="icon" className="size-10 text-slate-300 hover:text-rose-500" onClick={() => setFormData({...formData, ingredientes: formData.ingredientes.filter((_, i) => i !== idx) })}><Trash2 size={14} /></Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <Button disabled={isSaving} onClick={handleSave} className="h-14 px-10 mt-10 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-xs tracking-widest shadow-xl transition-all w-full md:w-auto">{isSaving ? "Gravando..." : "Salvar Receita ✨"}</Button>
                </DialogContent>
            </Dialog>
        </>
    )
}
