"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import { 
  Plus, 
  Wallet, 
  CreditCard, 
  QrCode, 
  ShieldCheck,
  Zap,
  Layout,
  Info,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PaymentMethodCard } from "./PaymentMethodCard"
import { ManagePaymentDrawer } from "./ManagePaymentDrawer"
import { TunaOnboardingModal } from "./TunaOnboardingModal"
import { cn } from "@/lib/utils"

export function PaymentMethodsSettings() {
  const { profile } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [methods, setMethods] = useState<any[]>([])
  const [tunaAccount, setTunaAccount] = useState<any>(null)
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isTunaModalOpen, setIsTunaModalOpen] = useState(false)
  
  const [stripeSettings, setStripeSettings] = useState<any>(null)
  const [stripeLoading, setStripeLoading] = useState(false)

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchData()
    }
  }, [profile])

  async function fetchData() {
    try {
      setLoading(true)
      
      // 1. Fetch Company Payment Methods
      const { data: methodsData, error: methodsError } = await supabase
        .from('company_payment_methods')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .order('created_at', { ascending: true })

      if (methodsError) throw methodsError
      setMethods(methodsData || [])

      // 2. Fetch Tuna Status
      const { data: tunaData } = await supabase
        .from('tuna_accounts')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .single()

      setTunaAccount(tunaData)

      // 3. Fetch Stripe Status Real-time
      const stripeRes = await fetch('/api/stripe/account-status')
      const stripeData = await stripeRes.json()
      setStripeSettings(stripeData)
      
    } catch (e) {
      console.error(e)
      toast.error("Erro ao carregar métodos de pagamento")
    } finally {
      setLoading(false)
    }
  }

  const handleActivateStripe = async () => {
    try {
      setStripeLoading(true)
      
      // 1. Criar ou obter account_id
      const createRes = await fetch('/api/stripe/create-account', { method: 'POST' })
      const createData = await createRes.json()
      
      if (!createData.account_id) {
        throw new Error(createData.error || "Erro ao criar conta Stripe")
      }

      // 2. Gerar link de onboarding
      const linkRes = await fetch('/api/stripe/onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: createData.account_id })
      })
      const linkData = await linkRes.json()

      if (linkData.url) {
        window.location.href = linkData.url
      } else {
        throw new Error(linkData.error || "Erro ao gerar link de onboarding")
      }

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setStripeLoading(false)
    }
  }

  const manualMethods = methods.filter(m => m.method_type === 'manual')

  const handleManage = (method: any) => {
    setSelectedMethod(method)
    setIsDrawerOpen(true)
  }

  const handleOpenTuna = () => {
    setIsTunaModalOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-40 bg-slate-50 rounded-[40px]" />
        <div className="h-64 bg-slate-50 rounded-[40px]" />
      </div>
    )
  }

  return (
    <div className="space-y-12 pb-20">
      {/* SEÇÃO 1: PAGAMENTOS MANUAIS */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Pagamentos manuais</h2>
          <p className="text-sm font-bold text-slate-400 uppercase italic mt-1">
            Pagamento manual significa que seus clientes pagam seus pedidos em dinheiro ou pessoalmente
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {manualMethods.map((method) => (
            <PaymentMethodCard 
              key={method.id} 
              method={method} 
              onManage={handleManage} 
            />
          ))}

          <Button 
            variant="ghost" 
            className="w-full h-16 rounded-[24px] border-2 border-dashed border-slate-200 text-slate-400 font-black uppercase text-xs italic hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all gap-2"
          >
            <Plus size={18} /> Adicionar método de pagamento
          </Button>
        </div>
      </section>

      {/* SEÇÃO 2: PAGAMENTOS ONLINE */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Pagamentos online</h2>
          <p className="text-sm font-bold text-slate-400 uppercase italic mt-1">
            Significa que os seus clientes pagam o pedido pelo seu menu digital, fazendo com que os pedidos que entram para você estejam todos pagos
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* TUNA PIX */}
          <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-6 flex-1">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">PAGAMENTO COM PIX</h3>
                        <div className="size-6 overflow-hidden rounded-md flex items-center justify-center">
                           <img src="https://tunapagamentos.com.br/wp-content/uploads/2021/08/logo-tuna-red.svg" alt="Tuna" className="w-5" />
                        </div>
                     </div>
                     <Badge className={cn(
                       "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border shrink-0",
                       tunaAccount?.pix_enabled ? "bg-emerald-100 text-emerald-600 border-emerald-200" : "bg-rose-100 text-rose-500 border-rose-200"
                     )}>
                        {tunaAccount?.pix_enabled ? "Ativo" : "Inativo"}
                     </Badge>
                   </div>

                   <div className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center gap-4 group-hover:border-rose-200 transition-colors">
                      <div className="size-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-rose-500 shrink-0">
                         <QrCode size={24} />
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase italic leading-relaxed">
                        Taxa de R$0,50 por transação, com recebimento em até 1 dia útil (D+1). Isento de impostos. Taxa mínima: US$0,06. 
                        Repasses L-V sem custo. Finais de semana e feriados têm tarifa: automático R$4,99 e manual R$0,99.
                      </p>
                   </div>

                   {!tunaAccount?.pix_enabled && (
                     <div className="flex flex-col md:flex-row items-center gap-4 pt-2">
                        {tunaAccount?.status === 'pending' ? (
                          <div className="px-6 py-3 rounded-xl bg-amber-50 text-amber-600 font-black uppercase text-[10px] italic border border-amber-100 animate-pulse">
                             Aguardando validação...
                          </div>
                        ) : (
                          <Button 
                             onClick={handleOpenTuna}
                             className="h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-105"
                          >
                             Ativar pagamentos
                          </Button>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                           Processado por <span className="text-rose-500 font-black">TUNA</span>
                        </span>
                     </div>
                   )}

                   {tunaAccount?.pix_enabled && (
                     <p className="text-emerald-500 font-black uppercase italic text-xs flex items-center gap-2">
                        <ShieldCheck size={16} /> PIX ATIVO
                     </p>
                   )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* STRIPE CONNECT CARD */}
          <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-6 flex-1">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">CARTÃO DE CRÉDITO (STRIPE)</h3>
                        <div className="size-6 overflow-hidden rounded-md flex items-center justify-center bg-[#6366f1]">
                           <span className="text-[8px] text-white font-black">S</span>
                        </div>
                      </div>
                      <Badge className={cn(
                        "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border shrink-0",
                        stripeSettings?.status === 'ativo' ? "bg-emerald-100 text-emerald-600 border-emerald-200" : 
                        stripeSettings?.status === 'restrito' ? "bg-amber-100 text-amber-600 border-amber-200" :
                        stripeSettings?.status === 'em análise' ? "bg-blue-100 text-blue-600 border-blue-200" :
                        stripeSettings?.status === 'erro_configuracao' ? "bg-rose-100 text-rose-600 border-rose-200" :
                        "bg-rose-100 text-rose-500 border-rose-200"
                      )}>
                        {stripeSettings?.status === 'ativo' ? "Ativo" : 
                         stripeSettings?.status === 'restrito' ? "Ação Requerida" : 
                         stripeSettings?.status === 'em análise' ? "Em Análise" : 
                         stripeSettings?.status === 'erro_configuracao' ? "Erro na Plataforma" : "Inativo"}
                      </Badge>
                   </div>

                   <div className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center gap-4 group-hover:border-indigo-200 transition-colors">
                      <div className="size-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#6366f1] shrink-0">
                         <CreditCard size={24} />
                      </div>
                       <div className="space-y-1 flex-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase italic leading-relaxed">
                          Receba pagamentos com Cartão de Crédito e Apple/Google Pay. 
                          Taxas competitivas e recebimento direto na sua conta bancária via <span className="text-[#6366f1] font-black">STRIPE</span>.
                          O <span className="text-blue-600 font-black">Doce Gestão</span> aplicará uma taxa adicional de 1% por transação.
                        </p>
                        {stripeSettings?.status === 'erro_configuracao' && (
                          <div className="mt-2 p-4 rounded-xl bg-rose-50 border border-rose-100 space-y-3">
                             <div className="flex items-start gap-3">
                               <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                               <div className="space-y-1">
                                  <p className="text-[10px] font-black text-rose-800 uppercase leading-snug">
                                    {stripeSettings.error || "Pendente de Configuração"}
                                  </p>
                                  <p className="text-[9px] font-bold text-rose-600 uppercase italic">
                                    É obrigatório confirmar quem gerencia as perdas financeiras na sua plataforma.
                                  </p>
                               </div>
                             </div>
                             <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 border-rose-200 bg-white text-rose-600 hover:bg-rose-100 font-black uppercase text-[8px] italic"
                                onClick={() => window.open(stripeSettings.action_url, '_blank')}
                             >
                               Finalizar Configuração na Stripe <Zap size={10} className="ml-1" />
                             </Button>
                          </div>
                        )}
                        {stripeSettings?.details && stripeSettings?.status !== 'erro_configuracao' && (
                          <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                            <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[9px] font-black text-amber-700 uppercase leading-snug">
                              {stripeSettings.details}
                            </p>
                          </div>
                        )}
                      </div>
                   </div>

                   {(stripeSettings?.status !== 'ativo') ? (
                     <div className="flex flex-col md:flex-row items-center gap-4 pt-2">
                        <Button 
                          onClick={handleActivateStripe}
                          disabled={stripeLoading}
                          className="h-12 px-10 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-black uppercase text-[11px] rounded-xl shadow-lg shadow-indigo-100 transition-all hover:scale-105"
                        >
                          {stripeLoading ? <Loader2 className="animate-spin" /> : (
                            stripeSettings?.account_id ? "Continuar Cadastro Stripe" : "Ativar Cartão Online"
                          )}
                        </Button>
                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                           Processado por <span className="text-[#6366f1] font-black">STRIPE CONNECT</span>
                        </span>
                     </div>
                   ) : (
                     <div className="space-y-2">
                        <p className="text-emerald-500 font-black uppercase italic text-xs flex items-center gap-2">
                            <ShieldCheck size={16} /> CARTÃO ONLINE ATIVO
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase italic">
                            Sua conta está configurada e pronta para receber pagamentos e repasses.
                        </p>
                     </div>
                   )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FOOTER INFO */}
      <div className="p-10 rounded-[40px] bg-emerald-50/20 border border-emerald-100 border-dashed text-center space-y-4">
         <ShieldCheck className="text-emerald-500 mx-auto" size={32} />
         <h4 className="font-black uppercase italic text-emerald-800 text-sm tracking-tight leading-none">Segurança Total Doce Gestão</h4>
         <p className="text-xs font-bold text-emerald-600/80 uppercase italic leading-relaxed px-4 max-w-2xl mx-auto">
            Todas as transações online são monitoradas com padrões bancários. 
            Seus dados e os de seus clientes são criptografados de ponta a ponta.
         </p>
      </div>

      {/* Modais / Drawers */}
      <ManagePaymentDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        method={selectedMethod}
        onSuccess={fetchData}
      />

      <TunaOnboardingModal 
        isOpen={isTunaModalOpen}
        onClose={() => setIsTunaModalOpen(false)}
        onSuccess={() => {
          fetchData()
          setIsTunaModalOpen(false)
        }}
        tenantId={profile?.tenant_id || ''}
      />
    </div>
  )
}
