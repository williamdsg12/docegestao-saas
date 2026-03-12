"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { useSubscription } from "@/hooks/useSubscription"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { 
  Check, 
  Zap, 
  Crown, 
  Rocket, 
  CreditCard, 
  Calendar, 
  ArrowUpRight, 
  XCircle,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function AssinaturaPage() {
  const { profile } = useBusiness()
  const { subscription, loading: subLoading } = useSubscription()
  const { limits, loading: limitsLoading } = usePlanLimits()
  const [plans, setPlans] = useState<any[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .filter('is_active', 'eq', true)
          .order('price', { ascending: true })
        if (error) throw error
        setPlans(data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingPlans(false)
      }
    }
    fetchPlans()
  }, [])

  const handleUpgrade = async (planId: string) => {
    toast.info("Iniciando checkout... Redirecionando para o pagamento.")
    // Here we would call our API to create a Stripe or Mercado Pago session
    try {
        const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                planId,
                companyId: profile?.company_id,
                gateway: 'stripe' // or 'mercado_pago'
            })
        })
        const data = await res.json()
        if (data.url) {
            window.location.href = data.url
        } else {
            throw new Error("Não foi possível gerar o link de pagamento.")
        }
    } catch (error: any) {
        toast.error(error.message || "Erro ao processar upgrade")
    }
  }

  const isCurrentPlan = (planId: string) => subscription?.plan_id === planId

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500 text-white border-none">Ativa</Badge>
      case 'trial': return <Badge className="bg-amber-500 text-white border-none">Degustação</Badge>
      case 'past_due': return <Badge className="bg-rose-500 text-white border-none">Pagamento Pendente</Badge>
      case 'canceled': return <Badge className="bg-slate-500 text-white border-none">Cancelada</Badge>
      default: return <Badge className="bg-slate-400 text-white border-none">Inativo</Badge>
    }
  }

  if (subLoading || limitsLoading || loadingPlans) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-12 pb-20">
      <header>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 italic uppercase">Plano e <span className="text-primary font-black">Assinatura</span></h1>
        <p className="text-slate-500 font-medium tracking-tight">Gerencie seu plano, veja suas cotas de uso e escolha a melhor opção para seu negócio escalar.</p>
      </header>

      {/* Current Subscription Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-8 lg:grid-cols-3"
      >
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8">
            {subscription && getStatusBadge(subscription.status)}
          </div>
          
          <div className="flex items-start gap-8 mb-10">
            <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
              <Zap className="size-10 fill-current" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Seu plano atual</p>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{subscription?.plans?.name || 'Trial'}</h2>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Calendar className="size-4" />
                  Renova em: {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <CreditCard className="size-4" />
                  Gateway: Stripe / MP
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedidos</span>
                <span className="text-xs font-black text-slate-900">{limits.current_orders}/{limits.max_orders}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(limits.current_orders / limits.max_orders) * 100}%` }}
                  className={cn("h-full transition-all", limits.current_orders >= limits.max_orders ? "bg-rose-500" : "bg-primary")}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produtos</span>
                <span className="text-xs font-black text-slate-900">{limits.current_products}/{limits.max_products}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(limits.current_products / limits.max_products) * 100}%` }}
                  className={cn("h-full transition-all", limits.current_products >= limits.max_products ? "bg-rose-500" : "bg-primary")}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clientes</span>
                <span className="text-xs font-black text-slate-900">{limits.current_clients}/{limits.max_clients}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(limits.current_clients / limits.max_clients) * 100}%` }}
                  className={cn("h-full transition-all", limits.current_clients >= limits.max_clients ? "bg-rose-500" : "bg-primary")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[40px] p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 size-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Precisa de <span className="text-primary italic">Mais?</span></h3>
            <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">Nossos planos Premium oferecem suporte prioritário, integração total com WhatsApp e inteligência de dados avançada.</p>
            <ul className="space-y-4">
               {[
                "Atendimentos ilimitados",
                "Relatórios Avançados",
                "Multi-usuários",
                "Suporte 24/7"
               ].map(f => (
                <li key={f} className="flex items-center gap-3 text-xs font-bold text-slate-300">
                  <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Check className="size-3" />
                  </div>
                  {f}
                </li>
               ))}
            </ul>
          </div>
          <Button className="mt-10 h-14 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest text-xs relative z-10">
            Falar com Especialista
          </Button>
        </div>
      </motion.div>

      {/* Plan Selection */}
      <div className="grid gap-8 lg:grid-cols-3 pt-10">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "relative flex flex-col rounded-[40px] border p-10 transition-all duration-500",
              plan.name === 'Profissional' || plan.name === 'Pro' 
                ? "bg-white border-primary/20 shadow-xl shadow-primary/5 scale-105" 
                : "bg-white border-slate-200"
            )}
          >
            {plan.name === 'Profissional' && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg italic">
                Melhor Escolha
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <div className={cn("size-14 rounded-2xl flex items-center justify-center", plan.name === 'Pro' ? "bg-amber-100 text-amber-600" : "bg-rose-50 text-primary")}>
                {plan.name === 'Iniciante' && <Rocket className="size-7" />}
                {plan.name === 'Profissional' && <Crown className="size-7" />}
                {plan.name === 'Pro' && <Zap className="size-7" />}
              </div>
            </div>

            <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-10">
              <span className="text-4xl font-black text-slate-900 tracking-tighter italic">R$ {plan.price.toLocaleString()}</span>
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">/ mês</span>
            </div>

            <ul className="space-y-5 mb-12 flex-1">
              <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <div className="size-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Check className="size-3" />
                </div>
                {plan.max_orders === 99999 ? 'Pedidos ilimitados' : `Até ${plan.max_orders} pedidos/mês`}
              </li>
              <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <div className="size-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Check className="size-3" />
                </div>
                {plan.max_products === 99999 ? 'Produtos ilimitados' : `Até ${plan.max_products} produtos`}
              </li>
              <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <div className="size-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Check className="size-3" />
                </div>
                {plan.max_clients === 99999 ? 'Clientes ilimitados' : `Até ${plan.max_clients} clientes`}
              </li>
              {plan.features?.map((f: string) => (
                <li key={f} className="flex items-center gap-3 text-sm font-bold text-slate-900 italic uppercase">
                  <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Check className="size-3" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <Button 
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrentPlan(plan.id)}
                className={cn(
                    "h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
                    isCurrentPlan(plan.id) 
                        ? "bg-slate-100 text-slate-400 border-none" 
                        : "bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
                )}
            >
              {isCurrentPlan(plan.id) ? "Plano Atual" : "Escolher Plano ✨"}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
