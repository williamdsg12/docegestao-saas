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
import { X, Trash2, Smartphone } from "lucide-react"

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
          is_enabled: formData.is_active_delivery || formData.is_active_pickup || formData.is_active_local
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
      <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 border-none bg-white flex flex-col h-full ring-0 focus-visible:ring-0">
        {/* Header Fixo */}
        <div className="p-6 border-b flex items-center justify-between shrink-0">
          <SheetTitle className="text-lg font-black text-slate-900 tracking-tight italic uppercase">
             Método de pagamento: <span className="text-blue-600">"{method.method_name}"</span>
          </SheetTitle>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Corpo Scrollável */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-none pb-32">
          {/* SEÇÃO: ATIVAR NO MENU */}
          <section className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Ativar no meu Menu digital</h3>
              <p className="text-xs font-bold text-slate-400 uppercase italic leading-tight">
                Selecione os serviços para os quais deseja habilitar este método de pagamento.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-2">
                <Label htmlFor="delivery" className="text-slate-700 font-bold uppercase italic text-xs flex-1 cursor-pointer">Entrega</Label>
                <Switch 
                  id="delivery" 
                  checked={formData.is_active_delivery} 
                  onCheckedChange={(val) => setFormData({...formData, is_active_delivery: val})}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              <div className="flex items-center justify-between p-2">
                <Label htmlFor="pickup" className="text-slate-700 font-bold uppercase italic text-xs flex-1 cursor-pointer">Retirada</Label>
                <Switch 
                  id="pickup" 
                  checked={formData.is_active_pickup} 
                  onCheckedChange={(val) => setFormData({...formData, is_active_pickup: val})}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              <div className="flex items-center justify-between p-2">
                <Label htmlFor="local" className="text-slate-700 font-bold uppercase italic text-xs flex-1 cursor-pointer">No local (Tipo balcão)</Label>
                <Switch 
                  id="local" 
                  checked={formData.is_active_local} 
                  onCheckedChange={(val) => setFormData({...formData, is_active_local: val})}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* SEÇÃO: CONFIGURAÇÃO AVANÇADA */}
          <section className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Configuração avançada</h3>
              <p className="text-xs font-bold text-slate-400 uppercase italic leading-tight">
                Ajuste configurações adicionais para personalizar a operação do seu negócio.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-700 italic">Instruções de pagamento <span className="text-slate-400 font-bold lowercase">(opcional)</span></Label>
                <p className="text-[10px] font-bold text-slate-400 uppercase italic leading-tight mb-2">Exibido ao cliente durante o pagamento do seu pedido.</p>
                <Textarea 
                  placeholder="Escreva aqui..." 
                  className="min-h-[100px] rounded-xl border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium placeholder:italic placeholder:font-bold"
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-700 italic">Código de pagamento <span className="text-slate-400 font-bold lowercase">(opcional)</span></Label>
                <p className="text-[10px] font-bold text-slate-400 uppercase italic leading-tight mb-2">Será exibido no momento de pagar seu pedido, com a opção de copiar o texto com um botão.</p>
                <Input 
                  placeholder="Escreva aqui..." 
                  className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium placeholder:italic placeholder:font-bold"
                  value={formData.payment_code}
                  onChange={(e) => setFormData({...formData, payment_code: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-700 italic">Taxa por método de pagamento <span className="text-slate-400 font-bold lowercase">(opcional)</span></Label>
                <p className="text-[10px] font-bold text-slate-400 uppercase italic leading-tight mb-2">Aplica uma taxa adicional de acordo com o método de pagamento selecionado pelos seus clientes.</p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none border-r border-slate-200 pr-3">
                    <span className="text-slate-400 font-bold italic">%</span>
                  </div>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="h-12 pl-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-black italic text-right pr-6"
                    value={formData.fee_percentage}
                    onChange={(e) => setFormData({...formData, fee_percentage: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* SEÇÃO: POS */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Ativar com meus pedidos POS</h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 italic">
               <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed">Este meio de pagamento estará sempre habilitado no seu ponto de venda.</p>
            </div>
          </section>
        </div>

        {/* Footer Fixo */}
        <div className="p-6 border-t bg-white shrink-0 flex items-center justify-between gap-4">
          <Button 
            variant="ghost" 
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-black uppercase text-[10px] italic h-12"
            onClick={handleRemove}
            disabled={loading}
          >
            <Trash2 size={16} className="mr-2" /> Remover método de pagamento
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] h-12 px-10 rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
            onClick={handleSave}
            loading={loading}
          >
            Salvar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
