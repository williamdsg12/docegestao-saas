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
import { Plus, Trash2, Edit2, Loader2, Save, X } from "lucide-react"
import { toast } from "sonner"

interface Ingredient {
  id: string
  nome: string
  preco_total: number
  quantidade_total: number
  unidade: string
  custo_unitario: number
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
    unidade: "g"
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
      const payload = {
        user_id: user.id,
        nome: formData.nome,
        preco_total: parseFloat(formData.preco_total),
        quantidade_total: parseFloat(formData.quantidade_total),
        unidade: formData.unidade
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

      setFormData({ nome: "", preco_total: "", quantidade_total: "", unidade: "g" })
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
      unidade: ing.unidade
    })
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
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Nome</Label>
              <Input 
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Farinha de Trigo"
                required
                className="rounded-xl border-[var(--border)] bg-[var(--bg-app)]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Preço Total (R$)</Label>
              <Input 
                type="number"
                step="0.01"
                value={formData.preco_total}
                onChange={e => setFormData({ ...formData, preco_total: e.target.value })}
                placeholder="0,00"
                required
                className="rounded-xl border-[var(--border)] bg-[var(--bg-app)]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Qtd. Total</Label>
              <div className="flex gap-2">
                <Input 
                  type="number"
                  step="0.001"
                  value={formData.quantidade_total}
                  onChange={e => setFormData({ ...formData, quantidade_total: e.target.value })}
                  placeholder="0.000"
                  required
                  className="rounded-xl border-[var(--border)] bg-[var(--bg-app)]"
                />
                <Select 
                  value={formData.unidade} 
                  onValueChange={v => setFormData({ ...formData, unidade: v })}
                >
                  <SelectTrigger className="w-24 rounded-xl border-[var(--border)] bg-[var(--bg-app)]">
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
            <div className="flex items-end gap-2">
              <Button 
                type="submit" 
                disabled={saving}
                className="w-full h-10 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-black uppercase italic tracking-widest"
              >
                {saving ? <Loader2 className="animate-spin" /> : editingId ? <Save size={18} /> : <Plus size={18} />}
                <span className="ml-2">{editingId ? "Salvar" : "Adicionar"}</span>
              </Button>
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setEditingId(null)
                    setFormData({ nome: "", preco_total: "", quantidade_total: "", unidade: "g" })
                  }}
                  className="rounded-xl border-[var(--border)]"
                >
                  <X size={18} />
                </Button>
              )}
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
                    <TableCell className="text-[var(--text-primary)]">R$ {ing.preco_total.toFixed(2)}</TableCell>
                    <TableCell className="text-[var(--text-primary)]">{ing.quantidade_total} {ing.unidade}</TableCell>
                    <TableCell className="font-black text-[var(--primary)]">
                      R$ {ing.custo_unitario.toFixed(4)} / {ing.unidade}
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
