"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Save, Milk, DollarSign, Package, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface AddIngredientModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

export function AddIngredientModal({ isOpen, onClose, onSave }: AddIngredientModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "Básicos",
    marca: "",
    unidade_compra: "kg",
    quantidade_embalagem: 1,
    valor_pago: 0
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const unitCost = formData.quantidade_embalagem > 0 ? formData.valor_pago / formData.quantidade_embalagem : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none shadow-2xl bg-white rounded-[40px]">
        <div className="p-10 bg-slate-900 text-white relative">
           <div className="absolute top-0 right-0 size-40 bg-[#FF2F81] rounded-full blur-[80px] opacity-20" />
           <DialogHeader className="relative z-10">
              <div className="flex items-center gap-4 mb-2">
                 <div className="size-12 rounded-2xl bg-[#FF2F81] flex items-center justify-center">
                    <Milk size={24} />
                 </div>
                 <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Novo <span className="text-[#FF2F81]">Ingrediente</span></DialogTitle>
              </div>
              <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Cadastre o insumo base com preço de compra para calcular custos reais.
              </DialogDescription>
           </DialogHeader>
        </div>

        <div className="p-10 space-y-8">
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nome do Ingrediente</Label>
                 <Input 
                   placeholder="Ex: Leite Condensado" 
                   className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6"
                   value={formData.nome}
                   onChange={e => setFormData({ ...formData, nome: e.target.value })}
                 />
              </div>

              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Categoria</Label>
                 <select 
                   className="w-full h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 outline-none text-sm"
                   value={formData.categoria}
                   onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                 >
                    <option>Básicos</option>
                    <option>Chocolates</option>
                    <option>Laticínios</option>
                    <option>Embalagens</option>
                    <option>Extras</option>
                 </select>
              </div>

              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Marca (Opcional)</Label>
                 <Input 
                   placeholder="Ex: Nestlé" 
                   className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6"
                   value={formData.marca}
                   onChange={e => setFormData({ ...formData, marca: e.target.value })}
                 />
              </div>

              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Unidade de Compra</Label>
                 <select 
                   className="w-full h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 outline-none text-sm"
                   value={formData.unidade_compra}
                   onChange={e => setFormData({ ...formData, unidade_compra: e.target.value })}
                 >
                    <option value="kg">Quilo (kg)</option>
                    <option value="g">Grama (g)</option>
                    <option value="L">Litro (L)</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="un">Unidade (un)</option>
                 </select>
              </div>

              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Qtd na Embalagem</Label>
                 <Input 
                   type="number"
                   className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-6"
                   value={formData.quantidade_embalagem}
                   onChange={e => setFormData({ ...formData, quantidade_embalagem: Number(e.target.value) })}
                 />
              </div>

              <div className="space-y-2 col-span-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Valor Pago (R$)</Label>
                 <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black italic text-[#FF2F81]">R$</span>
                    <Input 
                      type="number"
                      className="h-16 rounded-2xl bg-slate-50 border-none font-black italic text-2xl px-16"
                      value={formData.valor_pago}
                      onChange={e => setFormData({ ...formData, valor_pago: Number(e.target.value) })}
                    />
                 </div>
              </div>
           </div>

           <div className="bg-pink-50 p-6 rounded-[32px] flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#FF2F81]">Custo por {formData.unidade_compra === 'kg' ? 'grama' : 'unidade'}</p>
              <p className="text-2xl font-black italic text-slate-900 tracking-tighter">R$ {unitCost.toFixed(4)}</p>
           </div>

           <div className="flex gap-4 pt-4">
              <Button variant="ghost" onClick={onClose} className="flex-1 h-16 rounded-[24px] font-black uppercase italic tracking-widest text-[11px] text-slate-400">Cancelar</Button>
              <Button 
                onClick={handleSave}
                disabled={loading || !formData.nome || formData.valor_pago <= 0}
                className="flex-[2] h-16 rounded-[24px] bg-[#FF2F81] hover:bg-[#e02970] text-white font-black uppercase italic tracking-widest text-[11px] shadow-xl shadow-pink-200"
              >
                {loading ? "Salvando..." : "Salvar Ingrediente"}
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
