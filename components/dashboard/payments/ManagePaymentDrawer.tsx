"use client"

import { useState, useEffect } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { X, Trash2, Smartphone, Loader2, Info } from "lucide-react"

interface ManagePaymentDrawerProps {
  isOpen: boolean
  onClose: () => void
  method: any
  onSuccess: () => void
}

export function ManagePaymentDrawer({ isOpen, onClose, method, onSuccess }: ManagePaymentDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    is_active_delivery: true,
    is_active_pickup: true,
    is_active_local: true,
    is_active_pos: true,
    instructions: "",
    payment_code: "",
    fee_percentage: 0
  })

  useEffect(() => {
    if (method) {
      setFormData({
        is_active_delivery: method.is_active_delivery ?? true,
        is_active_pickup: method.is_active_pickup ?? true,
        is_active_local: method.is_active_local ?? true,
        is_active_pos: method.is_active_pos ?? true,
        instructions: method.instructions || "",
        payment_code: method.payment_code || "",
        fee_percentage: method.fee_percentage || 0
      })
    }
  }, [method])

  const handleSave = async () => {
    if (!method?.id) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('company_payment_methods')
        .update({
          ...formData,
          is_enabled: formData.is_active_delivery || formData.is_active_pickup || formData.is_active_local || formData.is_active_pos
        })
        .eq('id', method.id)

      if (error) throw error
      toast.success("Configurações salvas!")
      onSuccess()
      onClose()
    } catch (e) {
      toast.error("Erro ao salvar")
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!method?.id) return
    if (!confirm("Deseja realmente remover este método de pagamento?")) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('company_payment_methods')
        .delete()
        .eq('id', method.id)

      if (error) throw error
      toast.success("Método removido!")
      onSuccess()
      onClose()
    } catch (e) {
      toast.error("Erro ao remover")
    } finally {
      setLoading(false)
    }
  }

  if (!method) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md md:max-w-xl p-0 border-none bg-white flex flex-col h-full ring-0 focus-visible:ring-0 italic">
        {/* Header Fixo */}
        <div className="p-10 border-b flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="space-y-2">
            <SheetTitle className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
               Configurar: <span className="text-blue-600">"{method.method_name}"</span>
            </SheetTitle>
            <SheetDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Gestão de canais e taxas personalizadas</SheetDescription>
          </div>
          <button onClick={onClose} className="size-12 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Corpo Scrollável */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-none pb-40">
          {/* SEÇÃO 1: MENU DIGITAL */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
               <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Smartphone size={20} strokeWidth={3} />
               </div>
               <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight leading-none">Ativar no Menu Digital</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic leading-tight tracking-wider">Disponibilize este método no seu site de pedidos</p>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { id: "delivery", label: "Entrega (Delivery)", key: "is_active_delivery" },
                { id: "pickup", label: "Retirada (Takeout)", key: "is_active_pickup" },
                { id: "local", label: "No local (Tipo Balcão)", key: "is_active_local" }
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors group">
                  <Label htmlFor={item.id} className="text-slate-700 font-black uppercase italic text-xs flex-1 cursor-pointer">
                    {item.label}
                  </Label>
                  <Switch 
                    id={item.id} 
                    checked={(formData as any)[item.key]} 
                    onCheckedChange={(val) => setFormData({...formData, [item.key]: val})}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* SEÇÃO 2: PDV (POS) */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
               <div className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Info size={20} strokeWidth={3} />
               </div>
               <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight leading-none">Ativar no PDV (Sistema Interno)</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic leading-tight tracking-wider">Habilite para uso manual no painel de pedidos</p>
               </div>
            </div>

            <div className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-slate-900 text-white group">
               <Label htmlFor="pos-active" className="font-black uppercase italic text-xs flex-1 cursor-pointer">Unidade de PDV / Balcão</Label>
               <Switch 
                 id="pos-active" 
                 checked={formData.is_active_pos} 
                 onCheckedChange={(val) => setFormData({...formData, is_active_pos: val})}
                 className="data-[state=checked]:bg-blue-400"
               />
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* SEÇÃO 3: TAXAS E REGRAS */}
          <section className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Regras e Taxas Adicionais</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase italic leading-tight tracking-wider">
                Personalize os dados que o cliente verá ao escolher este método
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase text-slate-900 italic">Taxa Adicional (%)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <span className="text-blue-600 font-black italic text-lg">%</span>
                  </div>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="h-16 pl-14 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-black italic text-right pr-8 text-xl bg-slate-50/50"
                    value={formData.fee_percentage}
                    onChange={(e) => setFormData({...formData, fee_percentage: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase italic tracking-widest pl-2">Ex: 3.50 para repassar taxa de cartão</p>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase text-slate-900 italic">Instruções aos Clientes</Label>
                <Textarea 
                  placeholder="Ex: Pague o motoboy na entrega via cartão..." 
                  className="min-h-[120px] rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold uppercase italic text-[11px] placeholder:text-slate-300 bg-slate-50/50 p-6 leading-relaxed"
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase text-slate-900 italic">Código / Chave (Opcional)</Label>
                <Input 
                  placeholder="Ex: Sua chave PIX ou Link de Pagamento..." 
                  className="h-16 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold uppercase italic text-[11px] placeholder:text-slate-300 bg-slate-50/50 px-6"
                  value={formData.payment_code}
                  onChange={(e) => setFormData({...formData, payment_code: e.target.value})}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer Fixo */}
        <div className="p-10 border-t bg-white shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_-20px_60px_rgba(0,0,0,0.04)]">
          <button 
            className="text-slate-400 hover:text-rose-600 font-black uppercase text-[10px] italic h-12 flex items-center gap-3 px-4 transition-all group"
            onClick={handleRemove}
            disabled={loading}
          >
            <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-rose-50 transition-colors">
               <Trash2 size={16} />
            </div>
            Excluir Canal
          </button>
          <Button 
            className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white font-black uppercase italic text-xs tracking-widest h-16 px-16 rounded-[24px] shadow-2xl transition-all hover:scale-105 active:scale-95"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-3 animate-spin" size={20} /> : null}
            Confirmar Alterações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
