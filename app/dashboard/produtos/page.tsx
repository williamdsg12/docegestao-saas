"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Sparkles,
  Smartphone,
  Share2,
  PlusCircle,
  Filter,
  Grid as GridIcon,
  ChevronRight,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  Menu,
  ChevronLeft,
  Package
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"

// Custom Components
import { ProductCardV3 } from "@/components/dashboard/products/ProductCardV3"
import { MobileSimulator } from "@/components/dashboard/products/MobileSimulator"
import { AIOptimizerModal } from "@/components/dashboard/products/AIOptimizerModal"

interface Product {
  id: string
  name: string
  category: string
  price: number
  active: boolean
  image_url?: string
  description?: string
  preparation_time?: number
  order_position?: number
  ai_score?: number
  ai_optimized?: boolean
  marketing_data?: any
  original_data?: any
}

const CATEGORIES = ["Todos", "Bolos", "Doces", "Combos", "Bebidas", "Outros"]

export default function ProdutosPage() {
  return (
    <FeatureGuard feature="produtos" planRequired="pro">
      <ProdutosContentV4 />
    </FeatureGuard>
  )
}

function ProdutosContentV4() {
  const { business, profile } = useBusiness()
  const { limits, canAddProduct, refreshLimits } = usePlanLimits()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  
  // Modals & UI
  const [modalOpen, setModalOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [optimizerOpen, setOptimizerOpen] = useState(false)
  const [optimizingProduct, setOptimizingProduct] = useState<Product | null>(null)
  const [optimizationResult, setOptimizationResult] = useState<any>(null)
  
  // Edit State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "", category: "Bolos", price: 0, description: "", preparation_time: 30, active: true
  })

  // Wow State
  const [showWowPrompt, setShowWowPrompt] = useState(false)
  const [justCreatedProduct, setJustCreatedProduct] = useState<Product | null>(null)

  useEffect(() => {
    if (profile?.tenant_id || profile?.company_id) fetchProducts()
  }, [profile])

  async function fetchProducts() {
    const tenantId = profile?.tenant_id || profile?.company_id
    if (!tenantId) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('order_position', { ascending: true })
      
      if (error) throw error
      setProducts(data || [])
    } finally { setLoading(false) }
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, search, selectedCategory])

  // --- Handlers ---
  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({ ...product })
    } else {
      setEditingProduct(null)
      setFormData({ name: "", category: selectedCategory !== "Todos" ? selectedCategory : "Bolos", price: 0, description: "", preparation_time: 30, active: true })
    }
    setModalOpen(true)
  }

  const handleSaveProduct = async () => {
    if (!editingProduct && !canAddProduct()) return toast.error("Limite do plano atingido!")
    if (!formData.name) return toast.error("Nome é obrigatório")

    try {
      const tenantId = profile?.tenant_id || profile?.company_id
      const payload = { ...formData, tenant_id: tenantId }

      if (editingProduct) {
        await supabase.from('products').update(payload).eq('id', editingProduct.id)
        toast.success("Atualizado!")
      } else {
        const { data, error } = await supabase.from('products').insert({ ...payload, order_position: products.length }).select().single()
        if (error) throw error
        setJustCreatedProduct(data)
        setShowWowPrompt(true)
        refreshLimits()
        toast.success("Produto cadastrado com sucesso!")
      }
      fetchProducts()
      setModalOpen(false)
    } catch (e) { toast.error("Erro ao salvar") }
  }

  const handleToggleStatus = async (id: string, current: boolean) => {
    try {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !current } : p))
      await supabase.from('products').update({ active: !current }).eq('id', id)
      toast.success(current ? "Produto ocultado" : "Produto visível", { duration: 1000 })
    } catch (error) { toast.error("Erro ao atualizar status") }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este produto?")) return
    try {
      await supabase.from('products').delete().eq('id', id)
      setProducts(prev => prev.filter(p => p.id !== id))
      toast.success("Produto removido")
    } catch (e) { toast.error("Erro ao excluir") }
  }

  const handleDuplicate = async (product: Product) => {
    if (!canAddProduct()) return toast.error("Limite do plano atingido!")
    try {
      const { id, ...rest } = product
      const payload = { ...rest, name: `${product.name} (Cópia)`, order_position: products.length }
      await supabase.from('products').insert(payload)
      fetchProducts()
      toast.success("Produto duplicado")
      refreshLimits()
    } catch (e) { toast.error("Erro ao duplicar") }
  }

  const handleUpdateInline = async (id: string, updates: Partial<Product>) => {
    try {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
      await supabase.from('products').update(updates).eq('id', id)
    } catch (error) { toast.error("Erro na atualização") }
  }

  const handleOptimize = async (product: Product) => {
    setOptimizingProduct(product)
    toast.loading("IA analisando seu produto...", { id: "opt" })
    try {
      const res = await fetch("/api/products/optimize", {
        method: "POST",
        body: JSON.stringify({ product })
      })
      const data = await res.json()
      setOptimizationResult(data)
      setOptimizerOpen(true)
      toast.dismiss("opt")
    } catch (e) { toast.error("Erro na inteligência artificial", { id: "opt" }) }
  }

  const handleApplyOptimization = async (data: any) => {
     if (!optimizingProduct) return
     try {
        await supabase.from('products').update({
           name: data.name,
           description: data.description,
           price: data.price_suggestion.ideal,
           category: data.category || optimizingProduct.category,
           ai_score: data.score,
           ai_optimized: true
        }).eq('id', optimizingProduct.id)
        fetchProducts()
        setOptimizerOpen(false)
        toast.success("Produto otimizado com sucesso! ✨")
     } catch(e) { toast.error("Erro ao aplicar melhorias") }
  }

  const handleFixCategories = async () => {
    const productsToFix = products.filter(p => p.category === "Outros")
    if (productsToFix.length === 0) return toast.info("Todos os produtos estão bem categorizados!")
    
    toast.loading(`Organizando ${productsToFix.length} produtos...`, { id: "fix" })
    try {
      for (const p of productsToFix) {
         const res = await fetch("/api/products/optimize", { 
           method: "POST", 
           body: JSON.stringify({ product: p, mode: "category_only" }) 
         })
         const data = await res.json()
         if (data.category && data.category !== "Outros") {
           await supabase.from('products').update({ category: data.category }).eq('id', p.id)
         }
      }
      fetchProducts()
      toast.success("IA organizou seu estoque perfeitamente!", { id: "fix" })
    } catch(e) { toast.error("Falha na organização automática", { id: "fix" }) }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      
      {/* HEADER PREMIUM - FULLY RESPONSIVE */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
         <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-16 sm:h-20 lg:h-24 flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-1 min-w-0">
               <div className="hidden md:flex flex-col shrink-0">
                  <h1 className="text-base lg:text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Meus <span className="text-indigo-600">Produtos</span></h1>
                  <p className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-wide lg:tracking-widest mt-0.5 whitespace-nowrap">Gestão de Cardápio</p>
               </div>
               
               <div className="relative flex-1 max-w-xl group">
                  <Search className="absolute left-3 sm:left-4 lg:left-5 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <Input 
                    placeholder="Buscar produtos..." 
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 sm:h-12 lg:h-14 pl-10 sm:pl-12 lg:pl-14 rounded-xl sm:rounded-2xl border-none bg-slate-50 font-bold text-slate-600 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner text-sm sm:text-base"
                  />
               </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
               <Button 
                onClick={() => setShowPreview(!showPreview)}
                variant={showPreview ? "default" : "outline"} 
                className={cn(
                  "hidden lg:flex h-10 lg:h-12 px-4 lg:px-6 rounded-xl lg:rounded-2xl font-bold text-[9px] lg:text-[10px] uppercase italic gap-2 transition-all shadow-sm",
                  showPreview ? "bg-indigo-600 text-white" : "border-slate-100 bg-white text-slate-500"
                )}
               >
                  <Smartphone className="size-4" /> {showPreview ? "Ocultar" : "Preview"}
               </Button>
               <Button 
                onClick={() => handleOpenModal()}
                className="h-10 sm:h-12 lg:h-14 px-4 sm:px-6 lg:px-8 rounded-xl sm:rounded-2xl lg:rounded-[24px] bg-slate-900 hover:bg-black text-white font-black italic uppercase text-[9px] sm:text-[10px] lg:text-[11px] gap-1.5 sm:gap-2 lg:gap-3 shadow-2xl shadow-slate-900/20 active:scale-95 transition-all"
               >
                  <PlusCircle className="size-4 sm:size-4.5 lg:size-5" /> <span className="hidden sm:inline">Novo</span> Produto
               </Button>
            </div>
         </div>

         {/* CATEGORIES PILLS - RESPONSIVE SCROLL */}
         <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-12 sm:h-14 lg:h-16 flex items-center border-t border-slate-50 overflow-x-auto no-scrollbar gap-1.5 sm:gap-2">
            {CATEGORIES.map(category => (
               <button
                 key={category}
                 onClick={() => setSelectedCategory(category)}
                 className={cn(
                   "h-8 sm:h-9 lg:h-10 px-3 sm:px-4 lg:px-6 rounded-full text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase italic tracking-wide lg:tracking-widest transition-all shrink-0 border-2",
                   selectedCategory === category 
                     ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20" 
                     : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                 )}
               >
                 {category}
               </button>
            ))}
            
            <div className="h-5 sm:h-6 w-px bg-slate-100 mx-1 sm:mx-2 shrink-0" />
            
            <button
              onClick={handleFixCategories}
              className="h-8 sm:h-9 lg:h-10 px-3 sm:px-4 lg:px-6 rounded-full bg-emerald-50 text-emerald-600 text-[8px] sm:text-[9px] font-black uppercase italic tracking-wide lg:tracking-widest gap-1.5 sm:gap-2 flex items-center hover:bg-emerald-100 transition-all shrink-0"
            >
              <Sparkles className="size-3 sm:size-3.5" /> <span className="hidden sm:inline">Sugestão</span> IA
            </button>
         </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6 lg:pt-10 flex flex-col xl:flex-row gap-4 sm:gap-6 lg:gap-8">
         {/* GRID DE PRODUTOS */}
         <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
               {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                     <div key={i} className="h-96 rounded-[32px] bg-slate-100 animate-pulse" />
                  ))
               ) : filteredProducts.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                     {filteredProducts.map(product => (
                        <motion.div 
                          key={product.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                        >
                           <ProductCardV3 
                             product={product}
                             onEdit={handleOpenModal}
                             onDelete={handleDelete}
                             onDuplicate={handleDuplicate}
                             onToggleStatus={handleToggleStatus}
                             onUpdateInline={handleUpdateInline}
                             onOptimize={handleOptimize}
                           />
                        </motion.div>
                     ))}
                  </AnimatePresence>
               ) : (
                  <div className="col-span-full h-96 flex flex-col items-center justify-center text-center space-y-6">
                     <div className="size-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <Package size={40} />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Opa! Nada por aqui</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto">Não encontramos nenhum produto nesta categoria ou com este nome.</p>
                     </div>
                     <Button onClick={() => { setSearch(""); setSelectedCategory("Todos"); }} variant="outline" className="h-12 px-8 rounded-2xl border-slate-200">Limpar Filtros</Button>
                  </div>
               )}
            </div>
         </div>

         {/* SIMULADOR LATERAL (DRAWER PREMIUM) */}
         <AnimatePresence>
            {showPreview && business && (
               <motion.aside 
                 initial={{ opacity: 0, scale: 0.9, y: 40 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 40 }}
                 transition={{ duration: 0.4, ease: "easeOut" }}
                 className="hidden xl:block shrink-0 sticky top-28 h-[calc(100vh-140px)] w-[400px]"
               >
                  <div className="bg-white/70 backdrop-blur-2xl rounded-[40px] border border-white shadow-2xl h-full flex flex-col overflow-hidden relative group">
                     {/* Borda de brilho suave */}
                     <div className="absolute inset-0 rounded-[40px] border-2 border-indigo-500/5 pointer-events-none" />
                     
                     <div className="p-6 border-b border-slate-50 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                           <div className="size-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                              <Smartphone size={16} />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase italic tracking-tighter text-slate-900 leading-none">Simulador Nativo</span>
                              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sincronização 0ms</span>
                           </div>
                        </div>
                        <Badge className="bg-emerald-500 text-white border-none font-black text-[8px] uppercase px-2 shadow-sm">LIVE</Badge>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-2">
                        <MobileSimulator 
                          business={business} 
                          products={products} 
                          selectedCategory={selectedCategory} 
                        />
                     </div>
                  </div>
               </motion.aside>
            )}
         </AnimatePresence>
      </main>

      {/* --- MODAIS --- */}

      {/* MODAL: OTIMIZADOR AI */}
      <AIOptimizerModal isOpen={optimizerOpen} onClose={() => setOptimizerOpen(false)} product={optimizingProduct} optimization={optimizationResult} onApply={handleApplyOptimization} />

      {/* MODAL: EDIÇÃO/CADASTRO (SIMPLIFICADO) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
         <DialogContent className="max-w-2xl p-0 overflow-hidden border-none rounded-[40px] shadow-4xl bg-white">
            <div className="p-10 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 h-full aspect-square bg-indigo-600/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
               <div className="relative z-10 flex items-center gap-6">
                  <div className="size-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white"><Package size={28} /></div>
                  <div>
                     <h3 className="text-2xl font-black uppercase italic tracking-tighter">{editingProduct ? 'Editar' : 'Novo'} Produto</h3>
                     <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1 italic">Configure os dados do seu item principal</p>
                  </div>
               </div>
            </div>
            
            <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome Irresistível</Label>
                     <Input 
                       placeholder="Ex: Bolo de Pote Gourmet..." 
                       value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                       className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-bold italic text-lg focus:border-indigo-400 transition-all"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Categoria</Label>
                     <select 
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full h-14 px-5 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-bold italic text-slate-700 outline-none focus:border-indigo-400 transition-all"
                     >
                        {CATEGORIES.filter(c => c !== "Todos").map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Preço Sugerido (R$)</Label>
                     <Input 
                       type="number" step="0.01"
                       value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                       className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-black italic text-xl focus:border-indigo-400 transition-all"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tempo de Preparo (min)</Label>
                     <Input 
                       type="number"
                       value={formData.preparation_time} onChange={e => setFormData({...formData, preparation_time: parseInt(e.target.value)})}
                       className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-bold italic text-lg focus:border-indigo-400 transition-all"
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Descrição Sensorial (Opcional)</Label>
                  <textarea 
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full h-32 p-6 rounded-3xl border-2 border-slate-50 bg-slate-50/50 font-bold italic text-sm outline-none focus:border-indigo-400 transition-all resize-none"
                    placeholder="Descreva o sabor, os ingredientes e a experiência..."
                  />
               </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
               <Button variant="ghost" onClick={() => setModalOpen(false)} className="h-12 px-6 rounded-xl font-bold uppercase text-[10px] text-slate-400 hover:text-slate-600">Cancelar</Button>
               <Button onClick={handleSaveProduct} className="h-16 px-12 rounded-[24px] bg-slate-900 text-white font-black uppercase italic text-sm shadow-xl hover:shadow-2xl hover:bg-black active:scale-95 transition-all">SALVAR PRODUTO</Button>
            </div>
         </DialogContent>
      </Dialog>
      
      {/* --- WOW PROMPT --- */}
      <AnimatePresence>
         {showWowPrompt && justCreatedProduct && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-6">
               <div className="bg-[#0F172A] border-2 border-indigo-500/20 rounded-[32px] p-8 shadow-4xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 size-40 bg-indigo-600/10 blur-[60px] translate-x-1/2 -translate-y-1/2" />
                  <div className="flex items-center gap-6 relative z-10">
                     <div className="size-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/20"><Sparkles size={32} /></div>
                     <div className="flex-1 space-y-1">
                        <h4 className="text-xl font-black uppercase italic tracking-tighter">Venda <span className="text-indigo-400">mais rápido!</span></h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Quer transformar este produto simples em uma vitrine de luxo agora?</p>
                     </div>
                  </div>
                  <div className="flex gap-3 mt-8 relative z-10">
                     <Button onClick={() => { setShowWowPrompt(false); handleOptimize(justCreatedProduct); }} className="flex-1 h-14 rounded-2xl bg-white text-slate-900 font-black italic uppercase text-[10px] hover:bg-emerald-400 hover:text-white transition-all">DEIXAR PROFISSIONAL COM IA ✨</Button>
                     <Button variant="ghost" onClick={() => setShowWowPrompt(false)} className="h-14 px-6 rounded-2xl font-black uppercase italic text-[9px] text-slate-500 hover:text-white">AGORA NÃO</Button>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  )
}
