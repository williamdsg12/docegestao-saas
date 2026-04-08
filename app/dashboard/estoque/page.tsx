"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import { 
  Plus, 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  Trash2, 
  Edit2, 
  Warehouse,
  History,
  TrendingUp,
  Receipt
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
import { InvoiceImportModal } from "@/components/dashboard/InvoiceImportModal"

interface StockItem {
  id: string
  name: string
  category: string
  current_quantity: number
  unit: string
  min_stock: number
  purchase_price: number
  package_quantity: number
}

export default function EstoquePage() {
  return (
    <FeatureGuard feature="estoque" planRequired="pro">
      <div className="space-y-8 pb-20">
        <EstoqueContent />
      </div>
    </FeatureGuard>
  )
}

function EstoqueContent() {
  const { user } = useAuth()
  const { profile } = useBusiness()
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("todos")
  const [newIngredientOpen, setNewIngredientOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<StockItem | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    current_quantity: "0",
    unit: "g",
    min_stock: "0",
    purchase_price: "0",
    package_quantity: "1"
  })

  useEffect(() => {
    if (profile?.tenant_id || profile?.company_id) {
      fetchStock()
    }
  }, [profile])

  async function fetchStock() {
    const tenantId = profile?.tenant_id || profile?.company_id
    if (!tenantId) return
    try {
      setLoading(true)
      const { data, error } = await supabase.from('ingredients').select('*').eq('tenant_id', tenantId).order('name')
      if (error) throw error
      setStock(data || [])
    } finally { setLoading(false) }
  }

  async function handleSaveIngredient() {
    if (!formData.name || !formData.purchase_price) return toast.error("Preencha nome e preço")
    setIsSaving(true)
    try {
      const tenantId = profile?.tenant_id || profile?.company_id
      const payload = {
        name: formData.name,
        category: formData.category,
        current_quantity: parseFloat(formData.current_quantity) || 0,
        unit: formData.unit,
        min_stock: parseFloat(formData.min_stock) || 0,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        package_quantity: parseFloat(formData.package_quantity) || 1,
        tenant_id: tenantId
      }

      if (editingIngredient) {
        await supabase.from('ingredients').update(payload).eq('id', editingIngredient.id)
        toast.success("Insumo atualizado!")
      } else {
        await supabase.from('ingredients').insert(payload)
        toast.success("Insumo cadastrado!")
      }
      fetchStock()
      handleCloseModal()
    } catch (e) { toast.error("Erro ao salvar") } finally { setIsSaving(false) }
  }

  const handleCloseModal = () => {
    setNewIngredientOpen(false)
    setEditingIngredient(null)
    setFormData({ name: "", category: "", current_quantity: "0", unit: "g", min_stock: "0", purchase_price: "0", package_quantity: "1" })
  }

  async function handleDeleteIngredient(id: string) {
    if (!confirm("Excluir este insumo? Isso pode afetar suas receitas.")) return
    await supabase.from('ingredients').delete().eq('id', id)
    setStock(prev => prev.filter(i => i.id !== id))
    toast.success("Excluído")
  }

  async function handleQuickRestock(id: string, current: number) {
    const added = 10
    await supabase.from('ingredients').update({ current_quantity: current + added }).eq('id', id)
    setStock(prev => prev.map(s => s.id === id ? { ...s, current_quantity: current + added } : s))
    toast.success("Estoque reforçado!")
  }

  const categories = Array.from(new Set(stock.map(s => s.category || "Geral")))
  const filterOptions = [
    { key: "todos", label: "Tudo", count: stock.length },
    { key: "alerta", label: "Criticos", count: stock.filter(s => s.current_quantity < s.min_stock).length },
    ...categories.map(c => ({ key: c, label: c, count: stock.filter(s => s.category === c).length }))
  ]

  const filtered = stock.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === "todos" || (filterCategory === "alerta" && s.current_quantity < s.min_stock) || s.category === filterCategory
    return matchSearch && matchCategory
  })

  return (
    <>
      <PageHeader 
        title="Gestão de" 
        highlight="Estoque" 
        subtitle="Controle de insumos, alertas de reposição e auditoria de compras"
        actions={(
          <div className="flex gap-3">
             <InvoiceImportModal 
                companyId={profile?.company_id || ""}
                tenantId={profile?.tenant_id || ""}
                userId={user?.id || ""}
                onSuccess={fetchStock}
            />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                  "group bg-white rounded-3xl border p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden",
                  isCritical ? "border-rose-100 shadow-rose-500/5 bg-rose-50/10" : "border-slate-100"
                )}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={cn("size-12 rounded-2xl flex items-center justify-center text-white border", isCritical ? "bg-rose-500 border-rose-400" : "bg-primary border-rose-400")}>
                    <Package className="size-6" />
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

                <div className="space-y-1 mb-6">
                  <h3 className="text-lg font-black text-slate-900 uppercase italic leading-tight truncate">{item.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[8px] font-black uppercase text-slate-400 border-slate-100 px-1.5 py-0">{item.category || "Insumo"}</Badge>
                    {isCritical && <Badge className="bg-rose-500 text-white border-none font-black text-[8px] uppercase px-1.5 py-0 italic animate-pulse">Crítico</Badge>}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Qtd Atual</span>
                    <span className={cn("text-xl font-black italic", isCritical ? "text-rose-500" : "text-slate-900")}>
                      {item.current_quantity} <span className="text-[10px] uppercase">{item.unit}</span>
                    </span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>Mínimo: {item.min_stock}{item.unit}</span>
                    <span className="text-slate-900">R$ {item.purchase_price.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                   onClick={() => handleQuickRestock(item.id, item.current_quantity)}
                   variant="outline" 
                   className="w-full h-10 rounded-xl border-slate-100 text-slate-500 font-black uppercase text-[9px] hover:bg-slate-50 gap-2"
                >
                  <Plus size={14} /> Reforçar Estoque (+10)
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
        <DialogContent className="sm:max-w-lg rounded-[32px] p-8">
          <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-black uppercase italic">{editingIngredient ? 'Editar' : 'Novo'} Insumo</DialogTitle></DialogHeader>
          <div className="space-y-4 font-bold">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Nome</Label><Input className="h-12 rounded-xl" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Categoria</Label><Input className="h-12 rounded-xl" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Qtd Atual</Label><Input type="number" className="h-12 rounded-xl" value={formData.current_quantity} onChange={e => setFormData({ ...formData, current_quantity: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Mínimo</Label><Input type="number" className="h-12 rounded-xl" value={formData.min_stock} onChange={e => setFormData({ ...formData, min_stock: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Unidade</Label><Input className="h-12 rounded-xl" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-slate-900">
              <div className="space-y-2 font-bold"><Label className="text-[10px] uppercase text-slate-400">Preço Compra (R$)</Label><Input type="number" className="h-12 rounded-xl" value={formData.purchase_price} onChange={e => setFormData({ ...formData, purchase_price: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Qtd no Pacote</Label><Input type="number" className="h-12 rounded-xl" value={formData.package_quantity} onChange={e => setFormData({ ...formData, package_quantity: e.target.value })} /></div>
            </div>
            <Button onClick={handleSaveIngredient} disabled={isSaving} className="w-full h-14 rounded-2xl bg-rose-500 font-black uppercase text-white shadow-lg mt-4">{isSaving ? "Gravando..." : "Confirmar Insumo"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
