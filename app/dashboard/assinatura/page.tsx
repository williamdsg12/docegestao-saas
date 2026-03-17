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
  AlertTriangle,
  Shield,
  Trophy,
  Star,
  ChevronRight,
  Sparkles,
  CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { AnimatePresence } from "framer-motion"

export default function AssinaturaPage() {
  const { profile } = useBusiness()
  const { subscription, loading: subLoading } = useSubscription()
  const { limits, loading: limitsLoading } = usePlanLimits()
  const [plans, setPlans] = useState<any[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("annually")

  const planIcons: Record<string, any> = {
    'iniciante': {
        icon: Zap,
        gradient: "from-amber-400 to-orange-500",
        lightColor: "bg-amber-50",
        textColor: "text-amber-600",
        features: [
            "Gestão de clientes",
            "Relatório de lucros básico",
            "Até 50 fichas técnicas",
            "100 pedidos por mês"
        ]
    },
    'profissional': {
        icon: Shield,
        gradient: "from-rose-500 to-pink-600",
        lightColor: "bg-rose-50",
        textColor: "text-rose-600",
        highlight: true,
        badge: "Melhor Escolha",
        features: [
            "Fichas técnicas ilimitadas",
            "Pedidos ilimitados",
            "Financeiro completo",
            "Controle de estoque",
            "Relatórios profissionais"
        ]
    },
    'premium': {
        icon: Trophy,
        gradient: "from-indigo-500 to-purple-600",
        lightColor: "bg-indigo-50",
        textColor: "text-indigo-600",
        features: [
            "Tudo do Profissional",
            "IA para Precificação",
            "Automação de Pedidos",
            "Suporte VIP prioritário"
        ]
    }
}

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .filter('is_active', 'eq', true)
          .order('price', { ascending: true })
        if (error) throw error

        // Deduplicate by NAME to ensure only one of each tier
        const uniquePlans = (data || [])
            .filter((p: any) => !p.price.toString().includes('29'))
            .reduce((acc: any[], current: any) => {
                const x = acc.find(item => item.name === current.name);
                if (!x) {
                    return acc.concat([current]);
                } else {
                    return acc;
                }
            }, []);

        setPlans(uniquePlans.slice(0, 3))
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingPlans(false)
      }
    }
    fetchPlans()
  }, [])

  const mappedPlans = plans.map((p: any) => {
    const iconData = planIcons[p.slug] || planIcons[p.name.toLowerCase()] || planIcons['iniciante']
    return {
        ...p,
        ...iconData,
        features: iconData.features,
        displayPrice: billingCycle === 'annually' ? Math.round(p.price * 0.8) : p.price,
        yearlyPrice: Math.round(p.price * 0.8 * 12)
    }
})

  const handleUpgrade = async (plan: any) => {
    setIsLoading(true)
    try {
        const { data: { session: authSession } } = await supabase.auth.getSession()

        if (!authSession) {
            toast.error("Sessão expirada. Faça login novamente.")
            return
        }

        const res = await fetch('/api/checkout/stripe', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authSession.access_token}`
            },
            body: JSON.stringify({ 
                planId: plan.id,
                billingCycle
            })
        })

        const data = await res.json()
        if (data.url) {
            toast.success("Redirecionando para o pagamento seguro...")
            setTimeout(() => {
                window.location.href = data.url
            }, 1000)
        } else {
            throw new Error(data.error || "Não foi possível gerar o link de pagamento.")
        }
    } catch (error: any) {
        toast.error(error.message || "Erro ao processar upgrade")
    } finally {
        setIsLoading(false)
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

      {/* Cycle Selector */}
      <div className="flex flex-col items-center gap-8 py-10">
          <div className="bg-slate-100/50 p-2 rounded-[30px] border border-slate-200 backdrop-blur-sm shadow-inner flex items-center relative gap-2">
              <div
                  className={cn(
                      "absolute top-2 bottom-2 w-[calc(50%-8px)] bg-white rounded-[22px] shadow-xl transition-all duration-500 ease-spring",
                      billingCycle === "annually" ? "translate-x-full left-1" : "translate-x-0 left-2"
                  )}
              />
              <button
                  onClick={() => setBillingCycle("monthly")}
                  className={cn(
                      "relative z-10 px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-colors duration-300",
                      billingCycle === "monthly" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                  )}
              >
                  Mensal
              </button>
              <button
                  onClick={() => setBillingCycle("annually")}
                  className={cn(
                      "relative z-10 px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-colors duration-300 flex items-center gap-2",
                      billingCycle === "annually" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                  )}
              >
                  Anual
                  <Badge className="bg-green-500 text-white border-2 border-white text-[8px] font-black italic whitespace-nowrap shadow-lg">
                      -20% OFF
                  </Badge>
              </button>
          </div>
      </div>

      {/* Plan Selection */}
      <div className="grid gap-10 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {mappedPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={cn(
                "flex flex-col rounded-[56px] border border-white/50 relative overflow-hidden transition-all duration-500 group",
                plan.highlight
                    ? "bg-white shadow-[0_50px_100px_-30px_rgba(255,47,129,0.2)] scale-105 z-20 border-primary/20"
                    : "bg-white/40 backdrop-blur-md shadow-xl border-slate-100 hover:bg-white hover:scale-[1.02] z-10"
              )}
            >
              <div className={cn("h-3 w-full bg-gradient-to-r", plan.gradient)} />

              {plan.badge && (
                  <div className="absolute top-8 right-8">
                      <div className="bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-xl shadow-primary/20 flex items-center gap-1.5 animate-pulse">
                          <Star className="size-3 fill-white" />
                          {plan.badge}
                      </div>
                  </div>
              )}

              <div className="p-10 pt-12 flex flex-col flex-1">
                <div className="flex items-center gap-4 mb-8">
                    <div className={cn(
                        "size-14 rounded-2xl flex items-center justify-center border-2 rotate-6 group-hover:rotate-0 transition-transform duration-500 shadow-inner",
                        plan.lightColor, plan.textColor
                    )}>
                        <plan.icon className="size-7" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase leading-none">{plan.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Confeitaria {plan.name}</p>
                    </div>
                </div>

                <div className="mb-8 p-6 rounded-3xl bg-slate-50/50 border border-slate-100 group-hover:bg-white transition-colors duration-500">
                    <div className="flex items-baseline gap-1">
                        <span className="text-sm font-black text-slate-400">R$</span>
                        <span className="text-6xl font-black text-slate-900 tracking-tighter italic leading-none">{plan.displayPrice}</span>
                        <span className="text-sm font-bold text-slate-400">/mês</span>
                    </div>
                    {billingCycle === "annually" && (
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Anual: R$ {plan.yearlyPrice}</span>
                            <Badge className="bg-green-100 text-green-600 border-none text-[9px] font-black italic">Mais Econômico</Badge>
                        </div>
                    )}
                </div>

                <div className="space-y-4 mb-10 flex-1">
                    {plan.features?.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 group/feat">
                            <div className={cn(
                                "size-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover/feat:scale-110",
                                plan.highlight ? "bg-primary text-white" : "bg-slate-200 text-white"
                            )}>
                                <CheckCircle2 className="size-3" />
                            </div>
                            <span className="text-sm font-bold text-slate-600 transition-colors group-hover/feat:text-slate-900">{feature}</span>
                        </div>
                    ))}
                </div>

                <Button 
                    onClick={() => handleUpgrade(plan)}
                    disabled={isCurrentPlan(plan.id)}
                    className={cn(
                        "w-full h-16 rounded-[28px] font-black uppercase italic tracking-tighter text-lg transition-all active:scale-95 group/btn overflow-hidden relative",
                        plan.highlight
                            ? "bg-gradient-to-r from-primary to-rose-600 text-white shadow-[0_20px_40px_-10px_rgba(255,47,129,0.4)]"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                    )}
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                  {isCurrentPlan(plan.id) ? (
                    "Seu Plano Atual"
                  ) : (
                    <span className="flex items-center gap-2 relative z-10">
                        Escolher Plano
                        <ChevronRight className="size-5 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
