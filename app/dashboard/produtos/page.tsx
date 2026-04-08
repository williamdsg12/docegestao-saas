"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { toast } from "sonner"
import {
  Plus,
  Package,
  Calculator,
  TrendingUp,
  Tag,
  Trash2,
  Edit2,
  ChevronRight,
  ChefHat,
  Search,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { PageFilters } from "@/components/dashboard/PageFilters"
import { PageSearch } from "@/components/dashboard/PageSearch"
import { EmptyStateV2 } from "@/components/dashboard/EmptyStateV2"

interface Product {
  id: string
  name: string
  category: string
  price: number
  cost_base?: number
  margin?: number
  active: boolean
  variations?: any[]
  extras?: any[]
}

export default function ProdutosPage() {
  return (
    <FeatureGuard feature="produtos" planRequired="pro">
      <div className="space-y-8 pb-20">
        <ProdutosContent />
      </div>
    </FeatureGuard>
  )
}

function ProdutosContent() {
  const { profile } = useBusiness()
  const { limits, canAddProduct, refreshLimits } = usePlanLimits()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("todos")
  const [newProductOpen, setNewProductOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [formData, setFormData] = useState({ 
    name: "", 
    category: "", 
    price: "",
    variations: [] as any[],
    extras: [] as any[]
  })

  useEffect(() => {
    if (profile?.tenant_id || profile?.company_id) {
      fetchProducts()
    }
  }, [profile])

  async function fetchProducts() {
    const tenantId = profile?.tenant_id || profile?.company_id
    if (!tenantId) return
    try {
      setLoading(true)
      const { data, error } = await supabase.from('products').select('*').eq('tenant_id', tenantId).order('name')
      if (error) throw error
      setProducts(data || [])
    } finally { setLoading(false) }
  }

  const handleCloseModal = () => {
    setNewProductOpen(false)
    setEditingProduct(null)
    setFormData({ name: "", category: "", price: "", variations: [], extras: [] })
  }

  async function handleSaveProduct() {
    if (!editingProduct && !canAddProduct()) return toast.error("Limite do plano atingido!")
    if (!formData.name || !formData.price) return toast.error("Preencha todos os campos")

    setIsSaving(true)
    try {
      const tenantId = profile?.tenant_id || profile?.company_id
      const payload = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        variations: formData.variations,
        extras: formData.extras,
        tenant_id: tenantId
      }

      if (editingProduct) {
        await supabase.from('products').update(payload).eq('id', editingProduct.id)
        toast.success("Produto atualizado!")
      } else {
        await supabase.from('products').insert(payload)
        toast.success("Produto cadastrado!")
        refreshLimits()
      }
      fetchProducts()
      handleCloseModal()
    } catch (e) { toast.error("Erro ao salvar") } finally { setIsSaving(false) }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Excluir este produto permanentemente?")) return
    await supabase.from('products').delete().eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
    toast.success("Excluído")
  }

  const categories = Array.from(new Set(products.map(p => p.category || "Sem Categoria")))
  const filterOptions = [
    { key: "todos", label: "Tudo", count: products.length },
    ...categories.map(c => ({ key: c, label: c, count: products.filter(p => p.category === c).length }))
  ]

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === "todos" || p.category === filterCategory
    return matchSearch && matchCategory
  })

  return (
    <>
      <PageHeader 
        title="Catálogo de" 
        highlight="Produtos" 
        subtitle="Gerencie seus doces, preços e margens com precisão absoluta"
        actions={(
          <Button onClick={() => setNewProductOpen(true)} className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 font-black uppercase text-[10px] text-white shadow-lg">
            <Plus className="mr-2 size-4" /> Novo Produto {limits.max_products < 9999 && `(${limits.current_products}/${limits.max_products})`}
          </Button>
        )}
      />

      <div className="space-y-6">
        <PageFilters options={filterOptions} activeKey={filterCategory} onSelect={setFilterCategory} />
        <PageSearch value={search} onChange={setSearch} placeholder="Buscar por nome no cardápio..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                  <Package className="size-6" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-8 rounded-lg text-slate-400" onClick={() => { 
                    setEditingProduct(product); 
                    setFormData({ 
                      name: product.name, 
                      category: product.category || "", 
                      price: product.price.toString(),
                      variations: product.variations || [],
                      extras: product.extras || []
                    }); 
                    setNewProductOpen(true) 
                  }}>
                    <Edit2 className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 rounded-lg text-rose-400" onClick={() => handleDeleteProduct(product.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-lg font-black text-slate-900 uppercase italic leading-tight truncate">{product.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[8px] font-black uppercase text-slate-400 border-slate-100 px-1.5 py-0">{product.category || "Geral"}</Badge>
                  {product.active && <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[8px] uppercase px-1.5 py-0 italic">Ativo</Badge>}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Preço Final</span>
                  <span className="text-xl font-black text-slate-900 italic">R$ {product.price.toFixed(2)}</span>
                </div>
                {product.margin && (
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Margem de Lucro</span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase italic flex items-center gap-1">
                      <TrendingUp size={10} /> {product.margin}%
                    </span>
                  </div>
                )}
              </div>

              <Button variant="ghost" className="w-full h-10 rounded-xl bg-slate-50 text-slate-500 font-black uppercase text-[9px] hover:bg-slate-100 gap-2">
                <Calculator size={14} /> Ver Ficha Técnica
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && filtered.length === 0 && (
          <EmptyStateV2 
            icon={Package}
            title="Nenhum produto"
            subtitle="Organize seu cardápio e comece a vender suas delícias hoje mesmo"
            action={<Button onClick={() => setNewProductOpen(true)} className="h-10 px-6 rounded-xl bg-rose-500 text-white font-black uppercase text-[10px]">Cadastrar Produto</Button>}
          />
        )}
      </div>

      <Dialog open={newProductOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-2xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="p-8 bg-slate-900 text-white shrink-0">
             <DialogTitle className="text-2xl font-black uppercase italic">{editingProduct ? 'Editar' : 'Novo'} Produto</DialogTitle>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configure detalhes, preços e opções de personalização</p>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome do Produto</Label>
                <Input className="h-12 rounded-xl bg-slate-50 border-none font-bold px-6" placeholder="Ex: Bolo de Brigadeiro Gourmet" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</Label>
                  <select className="w-full h-12 rounded-xl border-none bg-slate-50 px-4 text-sm font-bold" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    <option value="">Selecione</option>
                    <option value="Bolos">Bolos</option>
                    <option value="Docinhos">Docinhos</option>
                    <option value="Tortas">Tortas</option>
                    <option value="Combos">Combos</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preço Base (R$)</Label>
                  <Input type="number" className="h-12 rounded-xl bg-slate-50 border-none font-bold px-6" placeholder="0.00" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Variações */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
               <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase italic text-slate-900">Variações</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tamanho, Sabores, etc.</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-[9px] font-black uppercase" onClick={() => setFormData({...formData, variations: [...formData.variations, { id: Math.random().toString(36).substr(2, 9), name: "", price_adjustment: 0 }]})}>+ Adicionar</Button>
               </div>
               <div className="space-y-3">
                  {formData.variations.map((v, i) => (
                    <div key={v.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                       <Input placeholder="Pequeno/Médio..." className="h-10 text-xs font-bold border-none bg-white" value={v.name} onChange={e => { const nv = [...formData.variations]; nv[i].name = e.target.value; setFormData({...formData, variations: nv}) }} />
                       <Input type="number" placeholder="+ R$" className="h-10 w-24 text-xs font-bold border-none bg-white" value={v.price_adjustment} onChange={e => { const nv = [...formData.variations]; nv[i].price_adjustment = parseFloat(e.target.value); setFormData({...formData, variations: nv}) }} />
                       <Button variant="ghost" size="icon" className="size-8 text-rose-500 hover:bg-rose-50" onClick={() => setFormData({...formData, variations: formData.variations.filter((_, idx) => idx !== i)})}>
                          <Trash2 size={14} />
                       </Button>
                    </div>
                  ))}
                  {formData.variations.length === 0 && <p className="text-[9px] text-center text-slate-300 uppercase font-bold italic py-4">Nenhuma variação cadastrada</p>}
               </div>
            </div>

            {/* Adicionais */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
               <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase italic text-slate-900">Adicionais</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Extras e Complementos</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-[9px] font-black uppercase" onClick={() => setFormData({...formData, extras: [...formData.extras, { id: Math.random().toString(36).substr(2, 9), name: "", price: 0, limit: 5 }]})}>+ Adicionar</Button>
               </div>
               <div className="space-y-3">
                  {formData.extras.map((ex, i) => (
                    <div key={ex.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                       <Input placeholder="Extra chocolate..." className="h-10 text-xs font-bold border-none bg-white" value={ex.name} onChange={e => { const ne = [...formData.extras]; ne[i].name = e.target.value; setFormData({...formData, extras: ne}) }} />
                       <Input type="number" placeholder="R$" className="h-10 w-24 text-xs font-bold border-none bg-white" value={ex.price} onChange={e => { const ne = [...formData.extras]; ne[i].price = parseFloat(e.target.value); setFormData({...formData, extras: ne}) }} />
                       <Button variant="ghost" size="icon" className="size-8 text-rose-500 hover:bg-rose-50" onClick={() => setFormData({...formData, extras: formData.extras.filter((_, idx) => idx !== i)})}>
                          <Trash2 size={14} />
                       </Button>
                    </div>
                  ))}
                  {formData.extras.length === 0 && <p className="text-[9px] text-center text-slate-300 uppercase font-bold italic py-4">Nenhum adicional cadastrado</p>}
               </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
            <Button onClick={handleSaveProduct} disabled={isSaving} className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic tracking-widest shadow-xl transition-all active:scale-95">
              {isSaving ? "Salvando..." : editingProduct ? "Salvar Alterações" : "Confirmar Cadastro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
