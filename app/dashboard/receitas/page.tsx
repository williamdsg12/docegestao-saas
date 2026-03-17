"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
    Plus, 
    Search, 
    BookOpen, 
    Clock, 
    ChefHat, 
    Trash2, 
    Edit2, 
    Image as ImageIcon,
    ChevronRight,
    UtensilsCrossed,
    Camera
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"

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
    created_at: string
}

export default function ReceitasPage() {
    const { user } = useAuth()
    const { profile } = useBusiness()
    const [receitas, setReceitas] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Form State
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
        if (profile?.company_id) {
            fetchReceitas()
        }
    }, [profile])

    async function fetchReceitas() {
        if (!profile?.company_id) return
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('receitas')
                .select('*')
                .eq('company_id', profile.company_id)
                .order('nome')
            
            if (error) throw error
            setReceitas(data || [])
        } catch (error: any) {
            console.error("Error fetching recipes:", error.message || error)
            toast.error("Erro ao carregar receitas")
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        if (!formData.nome) return toast.error("Nome é obrigatório")
        
        setIsSaving(true)
        try {
            const recipeToSave = {
                ...formData,
                company_id: profile?.company_id,
                user_id: user?.id
            }

            if (editingRecipe) {
                const { error } = await supabase
                    .from('receitas')
                    .update(recipeToSave)
                    .eq('id', editingRecipe.id)
                if (error) throw error
                toast.success("Receita atualizada!")
            } else {
                const { error } = await supabase
                    .from('receitas')
                    .insert(recipeToSave)
                if (error) throw error
                toast.success("Receita criada!")
            }

            setIsDialogOpen(false)
            resetForm()
            fetchReceitas()
        } catch (error: any) {
            console.error(">>> Erro ao salvar receita:", error.message || error)
            toast.error("Erro ao salvar receita")
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Excluir esta receita?")) return
        try {
            const { error } = await supabase.from('receitas').delete().eq('id', id)
            if (error) throw error
            toast.success("Excluída!")
            fetchReceitas()
        } catch (error: any) {
            toast.error("Erro ao excluir")
        }
    }

    function resetForm() {
        setFormData({
            nome: "",
            descricao: "",
            tempo_preparo: "",
            rendimento: "",
            foto_url: "",
            modo_preparo: "",
            ingredientes: [{ nome: "", quantidade: "", unidade: "g" }]
        })
        setEditingRecipe(null)
    }

    function addIngredient() {
        setFormData(prev => ({
            ...prev,
            ingredientes: [...prev.ingredientes, { nome: "", quantidade: "", unidade: "g" }]
        }))
    }

    const filtered = receitas.filter(r => r.nome.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-2 italic uppercase text-center lg:text-left">
                        Minhas <span className="text-primary font-black">Receitas</span>
                    </h1>
                    <p className="text-slate-500 font-medium italic text-sm md:text-base text-center lg:text-left">Gerencie seu catálogo de criações e segredos culinários.</p>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 w-full lg:w-auto">
                    <Plus className="mr-2 size-5" />
                    Nova Receita
                </Button>
            </header>

            <div className="relative group w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                    placeholder="Pesquisar receitas..."
                    className="w-full h-14 rounded-2xl border border-slate-200 bg-white pl-12 text-slate-900 font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((recipe) => (
                    <motion.div
                        layout
                        key={recipe.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group bg-white rounded-[32px] sm:rounded-[40px] border border-slate-100 p-5 sm:p-6 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden"
                    >
                        <div className="aspect-square rounded-[32px] overflow-hidden bg-slate-100 mb-6 relative group/img">
                            {recipe.foto_url ? (
                                <img src={recipe.foto_url} alt={recipe.nome} className="size-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                            ) : (
                                <div className="size-full flex items-center justify-center text-slate-300">
                                    <BookOpen className="size-16" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button variant="secondary" size="icon" onClick={() => { setEditingRecipe(recipe); setFormData(recipe); setIsDialogOpen(true); }} className="rounded-xl size-12 bg-white text-slate-900">
                                    <Edit2 className="size-5" />
                                </Button>
                                <Button variant="destructive" size="icon" onClick={() => handleDelete(recipe.id)} className="rounded-xl size-12 shadow-xl">
                                    <Trash2 className="size-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black italic uppercase text-slate-900 tracking-tight leading-none truncate">{recipe.nome}</h3>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 italic">
                                    <Clock className="size-3 text-primary" /> {recipe.tempo_preparo || '--'} min
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 italic">
                                    <ChefHat className="size-3 text-primary" /> {recipe.rendimento || '--'} un
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 italic">
                                    <UtensilsCrossed className="size-3 text-primary" /> {recipe.ingredientes?.length || 0} Itens
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] sm:rounded-[40px] border-none p-6 sm:p-10 bg-white">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-black italic uppercase text-slate-900">
                            {editingRecipe ? 'Editar' : 'Nova'} <span className="text-primary">Receita</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Left Side: General Info */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome da Receita</Label>
                                <Input 
                                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg" 
                                    value={formData.nome} 
                                    onChange={e => setFormData({...formData, nome: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tempo (min)</Label>
                                    <Input 
                                        type="number" 
                                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold" 
                                        value={formData.tempo_preparo} 
                                        onChange={e => setFormData({...formData, tempo_preparo: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rendimento (un)</Label>
                                    <Input 
                                        type="number" 
                                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold" 
                                        value={formData.rendimento} 
                                        onChange={e => setFormData({...formData, rendimento: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Link da Foto</Label>
                                <Input 
                                    placeholder="https://..." 
                                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold" 
                                    value={formData.foto_url} 
                                    onChange={e => setFormData({...formData, foto_url: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Modo de Preparo</Label>
                                <Textarea 
                                    className="min-h-[200px] rounded-[32px] bg-slate-50 border-none font-medium p-6" 
                                    value={formData.modo_preparo} 
                                    onChange={e => setFormData({...formData, modo_preparo: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Right Side: Ingredients */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ingredientes</Label>
                                <Button variant="ghost" size="sm" onClick={addIngredient} className="text-primary font-black uppercase text-[9px] tracking-widest italic">
                                    <Plus className="mr-1 size-3" /> Adicionar
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {formData.ingredientes.map((ing, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input 
                                            placeholder="Ingrediente" 
                                            className="h-12 flex-1 rounded-xl bg-slate-50 border-none font-bold text-xs" 
                                            value={ing.nome} 
                                            onChange={e => {
                                                const newIng = [...formData.ingredientes];
                                                newIng[idx].nome = e.target.value;
                                                setFormData({...formData, ingredientes: newIng});
                                            }}
                                        />
                                        <Input 
                                            placeholder="Qtd" 
                                            className="h-12 w-20 rounded-xl bg-slate-50 border-none font-bold text-center text-xs" 
                                            value={ing.quantidade} 
                                            onChange={e => {
                                                const newIng = [...formData.ingredientes];
                                                newIng[idx].quantidade = e.target.value;
                                                setFormData({...formData, ingredientes: newIng});
                                            }}
                                        />
                                        <select 
                                            className="h-12 w-16 rounded-xl bg-slate-50 border-none font-black text-[9px] uppercase px-2 outline-none"
                                            value={ing.unidade}
                                            onChange={e => {
                                                const newIng = [...formData.ingredientes];
                                                newIng[idx].unidade = e.target.value;
                                                setFormData({...formData, ingredientes: newIng});
                                            }}
                                        >
                                            <option value="g">g</option>
                                            <option value="kg">kg</option>
                                            <option value="ml">ml</option>
                                            <option value="L">L</option>
                                            <option value="un">un</option>
                                        </select>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="size-12 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors"
                                            onClick={() => {
                                                const newIng = formData.ingredientes.filter((_, i) => i !== idx);
                                                setFormData({...formData, ingredientes: newIng});
                                            }}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-10 sm:justify-start">
                            <Button 
                            disabled={isSaving} 
                            onClick={handleSave} 
                            className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-200 transition-all w-full sm:w-auto"
                        >
                            {isSaving ? "Salvando..." : "Salvar Receita ✨"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
