"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import { 
  Plus, 
  CreditCard, 
  ShieldCheck,
  Loader2,
  ChevronUp,
  ChevronDown,
  QrCode
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ManagePaymentDrawer } from "./ManagePaymentDrawer"
import { AddPaymentMethodDrawer } from "./AddPaymentMethodDrawer"
import { TunaOnboardingModal } from "./TunaOnboardingModal"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function PaymentMethodsSettings() {
  const { profile } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [methods, setMethods] = useState<any[]>([])
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [isTunaModalOpen, setIsTunaModalOpen] = useState(false)
  
  const [stripeSettings, setStripeSettings] = useState<any>(null)
  const [tunaAccount, setTunaAccount] = useState<any>(null)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchData()
    }
  }, [profile])

  useEffect(() => {
    const success = searchParams.get("stripe_success")
    const refresh = searchParams.get("stripe_refresh")

    if (success === "true") {
      toast.success("Dados enviados para a Stripe com sucesso! Aguarde a validação.")
      router.replace("/dashboard/financeiro/pagamentos")
    } else if (refresh === "true") {
      toast.info("Você retornou do cadastro Stripe. Algumas informações podem estar pendentes.")
      router.replace("/dashboard/financeiro/pagamentos")
    }
  }, [searchParams, router])

  async function fetchData() {
    try {
      setLoading(true)
      
      const { data: methodsData, error: methodsError } = await supabase
        .from('company_payment_methods')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .order('sort_order', { ascending: true })

      if (methodsError) throw methodsError
      setMethods(methodsData || [])

      const { data: tunaData } = await supabase
        .from('tuna_accounts')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .single()
      setTunaAccount(tunaData)

      const stripeRes = await fetch('/api/stripe/connect/sync-status', { method: 'POST' })
      const stripeData = await stripeRes.json()
      setStripeSettings(stripeData)
      
    } catch (e) {
      console.error(e)
      toast.error("Erro ao carregar métodos de pagamento")
    } finally {
      setLoading(false)
    }
  }

  const handleStripeOnboarding = async () => {
    try {
      setStripeLoading(true)
      const res = await fetch('/api/stripe/connect/onboarding', { method: 'POST' })
      const data = await res.json()
      
      if (data.url) {
        window.open(data.url, '_blank', 'noreferrer')
      } else {
        throw new Error(data.error || "Erro ao configurar Stripe")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setStripeLoading(false)
    }
  }

  const handleResetStripe = async () => {
    try {
      setIsResetLoading(true)
      const res = await fetch('/api/stripe/connect/reset', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        toast.success("Configurações Stripe resetadas com sucesso!")
        fetchData()
      } else {
        throw new Error(data.error || "Erro ao resetar")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsResetLoading(false)
      setIsResetDialogOpen(false)
    }
  }

  const handleMove = async (method: any, direction: 'up' | 'down') => {
    const currentIndex = methods.findIndex(m => m.id === method.id)
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === methods.length - 1) return

    const newMethods = [...methods];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    [newMethods[currentIndex], newMethods[targetIndex]] = [newMethods[targetIndex], newMethods[currentIndex]];
    
    setMethods(newMethods);

    try {
      const updates = newMethods.map((m, idx) => ({
        id: m.id,
        tenant_id: profile?.tenant_id,
        method_key: m.method_key,
        method_name: m.method_name,
        method_type: m.method_type,
        sort_order: idx
      }))

      const { error } = await supabase
        .from('company_payment_methods')
        .upsert(updates)

      if (error) throw error
    } catch (e) {
      toast.error("Erro ao salvar ordenação")
      fetchData()
    }
  }

  const manualMethods = methods.filter(m => m.method_type === 'manual')
  const tunaStatus = tunaAccount?.status || 'off'; // off, pending, active
  const stripeStatus = stripeSettings?.status === 'ativo' ? 'active' : (stripeSettings?.account_id ? 'pending' : 'off');

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse max-w-5xl mx-auto italic">
        <div className="h-10 w-48 bg-slate-100 rounded-full" />
        <div className="h-64 bg-slate-50 rounded-[40px]" />
        <div className="h-10 w-48 bg-slate-100 rounded-full" />
        <div className="h-64 bg-slate-50 rounded-[40px]" />
      </div>
    )
  }

  return (
    <div className="space-y-16 pb-32 max-w-5xl mx-auto italic">
      {/* BLOCO A: PAGAMENTOS MANUAIS */}
      <section className="space-y-8">
        <div className="flex items-end justify-between px-2">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
              <span className="text-blue-600">A.</span> Pagamentos Manuais
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Gestão de recebimentos offline no local ou entrega</p>
          </div>
          <Badge className="bg-slate-900 text-white font-black italic uppercase text-[10px] px-4 py-1 rounded-full border-none">
            {manualMethods.length} Métodos
          </Badge>
        </div>

        <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden">
          <div className="divide-y divide-slate-100">
            {manualMethods.map((method: any, idx: number) => (
              <div key={method.id} className="p-8 md:p-10 flex items-center justify-between group hover:bg-slate-50/50 transition-all duration-300">
                <div className="flex items-center gap-6">
                   <div className="size-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                      {method.method_key === 'money' ? <Plus size={24} /> : <CreditCard size={24} />}
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tight leading-none">{method.method_name}</h3>
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-bold text-slate-400 uppercase italic">Ordem #{idx + 1}</span>
                         <div className="h-1 w-1 rounded-full bg-slate-200" />
                         <span className="text-[10px] font-bold text-blue-600 uppercase italic">Taxa: {method.fee_percentage || 0}%</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button 
                      onClick={() => handleMove(method, 'up')}
                      disabled={idx === 0}
                      className="size-8 flex items-center justify-center border border-slate-200 rounded-full hover:bg-slate-900 hover:text-white disabled:opacity-20 transition-all"
                    >
                      <ChevronUp size={14} strokeWidth={3} />
                    </button>
                    <button 
                      onClick={() => handleMove(method, 'down')}
                      disabled={idx === manualMethods.length - 1}
                      className="size-8 flex items-center justify-center border border-slate-200 rounded-full hover:bg-slate-900 hover:text-white disabled:opacity-20 transition-all"
                    >
                      <ChevronDown size={14} strokeWidth={3} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest shrink-0 transition-all",
                      method.is_enabled ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-50" : "bg-slate-50 text-slate-400 border-slate-200"
                    )}>
                      <div className={cn("size-2 rounded-full", method.is_enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                      {method.is_enabled ? "Ativo" : "Inativo"}
                    </div>
                    
                    <Button 
                      onClick={() => {
                        setSelectedMethod(method)
                        setIsDrawerOpen(true)
                      }}
                      className="h-12 px-8 bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] italic rounded-2xl shadow-xl shadow-slate-100 transition-all hover:scale-105 active:scale-95"
                    >
                      Configurar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => setIsAddDrawerOpen(true)}
              className="w-full p-10 text-left flex items-center gap-6 text-blue-600 hover:bg-blue-50/50 transition-all group bg-slate-50/30"
            >
              <div className="size-12 rounded-full bg-white border-2 border-dashed border-blue-200 flex items-center justify-center text-blue-400 group-hover:border-blue-500 group-hover:text-blue-600 transition-all">
                 <Plus size={24} className="group-hover:rotate-90 transition-transform" />
              </div>
              <div className="space-y-1">
                 <span className="text-sm font-black uppercase italic tracking-tight block">Novo Método de Pagamento</span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase italic">Adicione Dinheiro, Cartão na Entrega, Vale Refeição, etc.</span>
              </div>
            </button>
          </div>
        </Card>
      </section>

      {/* BLOCO B: PAGAMENTO ONLINE */}
      <section className="space-y-8">
        <div className="flex items-end justify-between px-2">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
              <span className="text-blue-600">B.</span> Pagamento Online
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Receba via PIX e Cartão diretamente pelo Menu Digital</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* TUNA / PIX */}
           <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden p-10 flex flex-col justify-between space-y-8 relative group">
              <div className="absolute top-0 right-0 p-8">
                 <Badge className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none transition-all duration-500",
                    tunaStatus === 'active' ? "bg-emerald-500 text-white animate-pulse" : (tunaStatus === 'pending' ? "bg-amber-500 text-white animate-pulse" : "bg-slate-200 text-slate-500")
                 )}>
                    {tunaStatus === 'active' ? 'ATIVO' : (tunaStatus === 'pending' ? 'PENDENTE' : 'OFF')}
                 </Badge>
              </div>

              <div className="space-y-6">
                 <div className="size-20 rounded-[30px] bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-500">
                    <QrCode size={40} strokeWidth={2.5} />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Gateway PIX <span className="text-blue-600">(Tuna)</span></h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase italic leading-relaxed">
                       Taxa de R$0,50 por transação. Recebimento em D+1 diretamente na sua conta bancária.
                    </p>
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                 {tunaStatus === 'active' ? (
                    <Button 
                       onClick={() => setIsTunaModalOpen(true)}
                       className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black uppercase italic tracking-widest text-[11px] rounded-[20px]"
                    >
                       Gerenciar Integração
                    </Button>
                 ) : tunaStatus === 'pending' ? (
                    <Button 
                       onClick={() => setIsTunaModalOpen(true)}
                       className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase italic tracking-widest text-[11px] rounded-[20px] shadow-lg shadow-amber-100"
                    >
                       Continuar Cadastro
                    </Button>
                 ) : (
                    <Button 
                       onClick={() => setIsTunaModalOpen(true)}
                       className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic tracking-widest text-[11px] rounded-[20px] shadow-lg shadow-blue-100"
                    >
                       Ativar Pagamento Online
                    </Button>
                 )}
              </div>
           </Card>

           {/* STRIPE / CARD */}
           <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden p-10 flex flex-col justify-between space-y-8 relative group">
              <div className="absolute top-0 right-0 p-8">
                 <Badge className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none transition-all duration-500",
                    stripeStatus === 'active' ? "bg-emerald-500 text-white animate-pulse" : (stripeStatus === 'pending' ? "bg-amber-500 text-white animate-pulse" : "bg-slate-200 text-slate-500")
                 )}>
                    {stripeStatus === 'active' ? 'ATIVO' : (stripeStatus === 'pending' ? 'PENDENTE' : 'OFF')}
                 </Badge>
              </div>

              <div className="space-y-6">
                 <div className="size-20 rounded-[30px] bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-500">
                    <CreditCard size={40} strokeWidth={2.5} />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Gateway Cartão <span className="text-blue-600">(Stripe)</span></h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase italic leading-relaxed">
                       Aceite todas as bandeiras. Taxas competitivas com repasse automático. 1% de taxa extra Doce Gestão.
                    </p>
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                 {stripeStatus === 'active' ? (
                    <Button 
                       onClick={handleStripeOnboarding}
                       disabled={stripeLoading}
                       className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black uppercase italic tracking-widest text-[11px] rounded-[20px]"
                    >
                       {stripeLoading ? <Loader2 className="animate-spin" /> : "Gerenciar Gateway"}
                    </Button>
                 ) : stripeStatus === 'pending' ? (
                    <div className="flex gap-2">
                       <Button 
                          onClick={handleStripeOnboarding}
                          disabled={stripeLoading}
                          className="flex-1 h-14 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase italic tracking-widest text-[11px] rounded-[20px] shadow-lg shadow-amber-100"
                       >
                          {stripeLoading ? <Loader2 className="animate-spin" /> : "Terminar Registro"}
                       </Button>
                       <Button 
                          variant="ghost" 
                          onClick={() => setIsResetDialogOpen(true)}
                          className="size-14 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-[20px] p-0"
                       >
                          <Plus className="rotate-45" size={20} />
                       </Button>
                    </div>
                 ) : (
                    <Button 
                       onClick={handleStripeOnboarding}
                       disabled={stripeLoading}
                       className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic tracking-widest text-[11px] rounded-[20px] shadow-lg shadow-blue-100"
                    >
                       {stripeLoading ? <Loader2 className="animate-spin" /> : "Ativar Cartão de Crédito"}
                    </Button>
                 )}
              </div>
           </Card>
        </div>

        {/* SEGURANÇA */}
        <div className="p-16 rounded-[60px] bg-slate-900 text-white text-center space-y-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
              <ShieldCheck size={120} />
           </div>
           <ShieldCheck className="text-blue-400 mx-auto" size={48} />
           <div className="space-y-2">
              <h4 className="font-black uppercase italic text-3xl tracking-tighter leading-none">Segurança Total <span className="text-blue-400">Doce Gestão</span></h4>
              <p className="text-xs font-bold text-slate-400 uppercase italic tracking-widest max-w-2xl mx-auto">
                 Todas as transações online são criptografadas e monitoradas 24/7. Seus dados e repasses estão protegidos pelos maiores gateways do mundo.
              </p>
           </div>
        </div>
      </section>

      <ManagePaymentDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        method={selectedMethod}
        onSuccess={fetchData}
      />

      <AddPaymentMethodDrawer 
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        tenantId={profile?.tenant_id || profile?.company_id || ''}
        existingMethods={methods.map(m => m.method_key)}
        onSuccess={fetchData}
      />

      <TunaOnboardingModal 
        isOpen={isTunaModalOpen}
        onClose={() => setIsTunaModalOpen(false)}
        onSuccess={() => {
          fetchData()
          setIsTunaModalOpen(false)
        }}
        tenantId={profile?.tenant_id || profile?.company_id || ''}
      />

      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent className="rounded-[32px] border-slate-100 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase italic tracking-tight text-slate-900">
              Resetar Conta Stripe?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold text-slate-500 uppercase italic leading-relaxed">
              Tem certeza que deseja resetar sua conta Stripe? Todo o progresso será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-black uppercase text-[10px] italic border-slate-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleResetStripe(); }}
              className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] italic"
            >
              Sim, Resetar Conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
