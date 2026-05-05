"use client"

import { useState } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Plus, 
  X, 
  CreditCard, 
  Wallet, 
  Smartphone, 
  Banknote,
  Navigation,
  Globe,
  Loader2,
  Sparkles
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface AddPaymentMethodDrawerProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
  existingMethods: string[]
  onSuccess: () => void
}

const AVAILABLE_METHODS = [
  { key: 'dinheiro', name: 'Dinheiro', type: 'manual', icon: <Banknote size={20} /> },
  { key: 'cartao_manual', name: 'Cartão', type: 'manual', icon: <CreditCard size={20} /> },
  { key: 'cartao_credito', name: 'Cartão de crédito', type: 'manual', icon: <CreditCard size={20} /> },
  { key: 'cartao_debito', name: 'Cartão de débito', type: 'manual', icon: <CreditCard size={20} /> },
  { key: 'visa', name: 'Visa', type: 'manual', icon: <CreditCard size={20} /> },
  { key: 'mastercard', name: 'Mastercard', type: 'manual', icon: <CreditCard size={20} /> },
  { key: 'amex', name: 'American Express', type: 'manual', icon: <CreditCard size={20} /> },
  { key: 'diners', name: 'Diners Club', type: 'manual', icon: <CreditCard size={20} /> },
  { key: 'transferencia', name: 'Transferência bancária', type: 'manual', icon: <Navigation size={20} /> },
  { key: 'pix_manual', name: 'PIX', type: 'manual', icon: <Smartphone size={20} /> },
  { key: 'pagamento_online', name: 'Pagamento Online', type: 'online', icon: <Globe size={20} /> },
  { key: 'paypal', name: 'PayPal', type: 'online', icon: <Wallet size={20} /> },
  { key: 'ticket_restaurante', name: 'Ticket Restaurante', type: 'manual', icon: <Banknote size={20} /> },
  { key: 'picpay', name: 'PicPay', type: 'manual', icon: <Smartphone size={20} /> },
  { key: 'alelo_refeicao', name: 'Alelo Refeição', type: 'manual', icon: <Banknote size={20} /> },
  { key: 'ame_digital', name: 'Ame Digital', type: 'manual', icon: <Smartphone size={20} /> },
  { key: 'sodexo_alimentacao', name: 'Sodexo Alimentação', type: 'manual', icon: <Banknote size={20} /> },
  { key: 'sodexo_refeicao', name: 'Sodexo Refeição', type: 'manual', icon: <Banknote size={20} /> },
  { key: 'vale_card', name: 'Vale Card', type: 'manual', icon: <CreditCard size={20} /> },
  { key: 'vr_alimentacao', name: 'VR Alimentação', type: 'manual', icon: <Banknote size={20} /> },
  { key: 'vr_refeicao', name: 'VR Refeição', type: 'manual', icon: <Banknote size={20} /> },
  { key: 'bitcoin', name: 'Bitcoin', type: 'manual', icon: <Wallet size={20} /> },
  { key: 'boleto', name: 'Boleto', type: 'manual', icon: <Banknote size={20} /> },
  { key: 'vale_alimentacao', name: 'Vale Alimentação', type: 'manual', icon: <Banknote size={20} /> },
  { key: 'elo', name: 'ELO', type: 'manual', icon: <CreditCard size={20} /> },
  { key: 'mercado_pago', name: 'Mercado Pago', type: 'manual', icon: <Smartphone size={20} /> },
  { key: 'cartao_presente', name: 'Cartão presente', type: 'manual', icon: <CreditCard size={20} /> },
  { key: 'carteira_digital', name: 'Carteira digital', type: 'manual', icon: <Wallet size={20} /> },
  { key: 'meal_voucher', name: 'Meal Voucher', type: 'manual', icon: <Banknote size={20} /> },
  { key: 'food_voucher', name: 'Food Voucher', type: 'manual', icon: <Banknote size={20} /> },
  { key: 'gift_card', name: 'Gift card', type: 'manual', icon: <CreditCard size={20} /> },
  { key: 'digital_wallet', name: 'Digital Wallet', type: 'manual', icon: <Wallet size={20} /> },
  { key: 'google_pay', name: 'Google Pay', type: 'manual', icon: <Smartphone size={20} /> },
  { key: 'outro', name: 'Outro', type: 'manual', icon: <Plus size={20} /> },
]

export function AddPaymentMethodDrawer({ isOpen, onClose, tenantId, existingMethods, onSuccess }: AddPaymentMethodDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState<string | null>(null)

  const filteredMethods = AVAILABLE_METHODS.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !existingMethods.includes(m.key)
  )

  const handleAdd = async (method: typeof AVAILABLE_METHODS[0]) => {
    if (!tenantId || tenantId === '') {
      toast.error("Erro: ID da empresa não encontrado. Tente recarregar a página.")
      return
    }

    setLoading(method.key)
    try {
      const { error } = await supabase
        .from('company_payment_methods')
        .upsert({
          tenant_id: tenantId,
          method_key: method.key,
          method_name: method.name,
          method_type: method.type,
          is_enabled: true,
          sort_order: existingMethods.length,
          is_active_delivery: true,
          is_active_pickup: true,
          is_active_local: true,
          is_active_pos: true
        }, {
          onConflict: 'tenant_id, method_key'
        })

      if (error) throw error

      toast.success(`${method.name} adicionado com sucesso!`)
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.message || "Erro ao adicionar método")
    } finally {
      setLoading(null)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md md:max-w-xl p-0 border-none bg-white flex flex-col h-full ring-0 focus-visible:ring-0 italic">
        {/* Header Fixo */}
        <div className="p-10 border-b flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="space-y-2">
            <SheetTitle className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
               Novo <span className="text-blue-600">Método</span>
            </SheetTitle>
            <SheetDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic leading-none">Selecione para ativar instantaneamente no seu painel</SheetDescription>
          </div>
          <button onClick={onClose} className="size-12 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Busca fixa */}
        <div className="p-10 border-b shrink-0 bg-white">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} strokeWidth={3} />
            <Input 
              placeholder="Pesquisar forma de pagamento..."
              className="h-16 pl-16 rounded-[24px] border-slate-100 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-black italic text-sm placeholder:text-slate-300 placeholder:font-bold placeholder:italic transition-all shadow-sm focus:shadow-2xl focus:shadow-blue-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Lista Scrollável */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-10 pt-4">
          {filteredMethods.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {filteredMethods.map((method) => (
                <button
                  key={method.key}
                  disabled={loading === method.key}
                  onClick={() => handleAdd(method)}
                  className="w-full h-24 px-8 rounded-[30px] flex items-center justify-between hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group disabled:opacity-50 relative overflow-hidden"
                >
                   {/* Background Glow on Hover */}
                   <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/[0.02] transition-colors" />
                   
                   <div className="flex items-center gap-6 relative z-10">
                    <div className="size-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-sm group-hover:shadow-lg group-hover:shadow-blue-100">
                      {loading === method.key ? <Loader2 className="animate-spin" size={20} /> : method.icon}
                    </div>
                    <div className="text-left">
                       <span className="text-base font-black text-slate-800 uppercase italic tracking-tighter block group-hover:text-blue-600 transition-colors">
                         {method.name}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic group-hover:text-slate-500">
                          {method.type === 'manual' ? 'Canal Local / Offline' : 'Gateway Online'}
                       </span>
                    </div>
                  </div>

                  <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-500">
                    <Plus size={20} strokeWidth={3} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center space-y-8">
              <div className="size-24 rounded-[40px] bg-slate-50 flex items-center justify-center mx-auto text-slate-200 border border-slate-100 shadow-inner group-hover:rotate-12 transition-transform">
                <Search size={48} strokeWidth={1} />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-black text-slate-400 uppercase italic tracking-tighter">Nenhum meio disponível</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase italic tracking-[0.2em]">Tente uma busca diferente</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Informativo */}
        <div className="p-10 border-t bg-slate-900 shrink-0 text-center">
             <div className="flex items-center justify-center gap-3 text-blue-400 mb-2">
                <Sparkles size={16} />
                <span className="text-[10px] font-black uppercase italic tracking-widest">Dica Doce Gestão</span>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest leading-relaxed px-10">
                Adicione quantos métodos precisar. Você poderá configurar taxas e instruções individuais após a ativação.
             </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
