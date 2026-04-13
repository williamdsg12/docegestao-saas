"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Plus, Trash2, Edit2, Loader2, Save, X, Info } from "lucide-react"
import { toast } from "sonner"
import { 
  calcularCustoUnitario, 
  getUnidadeBase, 
  formatarMoeda, 
  converterParaBase,
  Unidade 
} from "@/utils/pricing"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Ingredient {
  id: string
  nome: string
  preco_total: number
  quantidade_total: number
  unidade: string // Unidade de uso (g, ml, un)
  unidade_compra: string // Unidade de compra (kg, L, un)
  custo_unitario: number // Custo por unidade de uso
}

const UNIDADES = ["g", "kg", "ml", "L", "unidade"]

export function IngredientManager() {
  const { user } = useAuth()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    preco_total: "",
    quantidade_total: "",
    unidade: "g",
    unidade_compra: "kg"
  })

  useEffect(() => {
    if (user) fetchIngredients()
  }, [user])

  async function fetchIngredients() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("ingredientes")
        .select("*")
        .order("nome")
      
      if (error) throw error
      setIngredients(data || [])
    } catch (error: any) {
      toast.error("Erro ao carregar ingredientes: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      const unitCost = calcularCustoUnitario(
        parseFloat(formData.preco_total),
        parseFloat(formData.quantidade_total),
        formData.unidade_compra
      )
      
      const payload = {
        user_id: user.id,
        nome: formData.nome,
        preco_total: parseFloat(formData.preco_total),
        quantidade_total: parseFloat(formData.quantidade_total),
        unidade: formData.unidade,
        unidade_compra: formData.unidade_compra,
        custo_unitario: unitCost
      }

      if (editingId) {
        const { error } = await supabase
          .from("ingredientes")
          .update(payload)
          .eq("id", editingId)
        
        if (error) throw error
        toast.success("Ingrediente atualizado!")
      } else {
        const { error } = await supabase
          .from("ingredientes")
          .insert([payload])
        
        if (error) throw error
        toast.success("Ingrediente cadastrado!")
      }

      setFormData({ 
        nome: "", 
        preco_total: "", 
        quantidade_total: "", 
        unidade: "g", 
        unidade_compra: "kg" 
      })
      setEditingId(null)
      fetchIngredients()
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este ingrediente?")) return

    try {
      const { error } = await supabase
        .from("ingredientes")
        .delete()
        .eq("id", id)
      
      if (error) throw error
      toast.success("Ingrediente removido!")
      fetchIngredients()
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message)
    }
  }

  const startEdit = (ing: Ingredient) => {
    setEditingId(ing.id)
    setFormData({
      nome: ing.nome,
      preco_total: ing.preco_total.toString(),
      quantidade_total: ing.quantidade_total.toString(),
      unidade: ing.unidade || "g",
      unidade_compra: ing.unidade_compra || "kg"
    })
  }

  // Helper to calculate conversion for display
  const currentUnitCost = calcularCustoUnitario(
    parseFloat(formData.preco_total),
    parseFloat(formData.quantidade_total),
    formData.unidade_compra
  )

  const conversionHint = () => {
    const qty = parseFloat(formData.quantidade_total) || 0
    if (qty <= 0) return null
    if (formData.unidade_compra === 'kg') return `${qty}kg = ${qty * 1000}g`
    if (formData.unidade_compra === 'L') return `${qty}L = ${qty * 1000}ml`
    return null
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl bg-[var(--bg-card)] rounded-3xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-[var(--text-primary)]">
            {editingId ? "Editar Ingrediente" : "Novo Ingrediente"}
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
            Cadastre os insumos que você utiliza em suas receitas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 italic">Qual o nome do insumo?</Label>
                <Input 
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Chocolate Meio Amargo"
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 font-black italic"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 italic">Preço Pago (R$)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.preco_total}
                  onChange={e => setFormData({ ...formData, preco_total: e.target.value })}
                  placeholder="0,00"
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 font-black italic"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-blue-500 ml-1 italic">Como você compra?</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number"
                      step="0.001"
                      value={formData.quantidade_total}
                      onChange={e => setFormData({ ...formData, quantidade_total: e.target.value })}
                      placeholder="Qtd."
                      required
                      className="h-12 rounded-xl border-slate-200 bg-white font-black italic"
                    />
                    <Select 
                      value={formData.unidade_compra} 
                      onValueChange={v => setFormData({ 
                        ...formData, 
                        unidade_compra: v, 
                        unidade: getUnidadeBase(v) 
                      })}
                    >
                      <SelectTrigger className="w-28 h-12 rounded-xl border-slate-200 bg-white font-black italic">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDADES.map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {conversionHint() && (
                    <p className="text-[9px] font-bold text-blue-500 uppercase mt-1 ml-1 animate-pulse">
                      ✨ Conversão automática: {conversionHint()}
                    </p>
                  )}
               </div>

               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-1 italic">Como você usa na receita?</Label>
                  <Select value={formData.unidade} onValueChange={v => setFormData({ ...formData, unidade: v })}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-black italic">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-blue-100 opacity-70">
                      Custo calculado por {formData.unidade}
                    </p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info size={10} className="text-blue-200 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white border-none text-[10px] p-3 rounded-xl max-w-[200px]">
                          <p>Este é o custo real que será usado nas suas fichas técnicas. Se você comprou 1kg por R$ 10,00, o custo por grama será R$ 0,0100.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xl font-black italic tracking-tighter">
                    {formatarMoeda(currentUnitCost, 4)}
                  </p>
               </div>
               <div className="flex gap-2">
                  {editingId && (
                    <Button 
                      type="button" 
                      variant="ghost"
                      onClick={() => {
                        setEditingId(null)
                        setFormData({ nome: "", preco_total: "", quantidade_total: "", unidade: "g", unidade_compra: "kg" })
                      }}
                      className="rounded-xl border-white/20 text-white hover:bg-white/10"
                    >
                      <X size={18} />
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="h-12 px-8 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-black uppercase italic tracking-widest"
                  >
                    {saving ? <Loader2 className="animate-spin" /> : editingId ? "Atualizar" : "Salvar Insumo"}
                  </Button>
               </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl bg-[var(--bg-card)] rounded-3xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-[var(--text-primary)]">
            Seus Ingredientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-[var(--primary)]" />
            </div>
          ) : ingredients.length === 0 ? (
            <div className="text-center p-8 text-[var(--text-secondary)] font-bold uppercase text-xs italic">
              Nenhum ingrediente cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[var(--border)]">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Ingrediente</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Preço Compra</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Qtd.</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Custo Unit.</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ing) => (
                  <TableRow key={ing.id} className="border-b border-[var(--border)] group">
                    <TableCell className="font-black text-[var(--text-primary)] uppercase italic">{ing.nome}</TableCell>
                    <TableCell className="text-[var(--text-primary)] font-bold italic">
                      {ing.preco_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-[var(--text-primary)]">
                      {ing.quantidade_total} {ing.unidade_compra || (['g', 'ml'].includes(ing.unidade) ? (ing.unidade === 'g' ? 'kg' : 'L') : ing.unidade)}
                    </TableCell>
                    <TableCell className="font-black text-[var(--primary)] text-sm">
                      {formatarMoeda(ing.custo_unitario, 4)} <span className="text-[8px] opacity-60">/ {ing.unidade}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => startEdit(ing)}
                          className="hover:bg-indigo-500/10 text-indigo-500 rounded-lg"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(ing.id)}
                          className="hover:bg-rose-500/10 text-rose-500 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
