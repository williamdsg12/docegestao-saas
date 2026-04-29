"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { useSubscription } from "@/hooks/useSubscription"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
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
  CheckCircle2,
  TrendingUp,
  Layout,
  Cpu,
  ShoppingBag,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { VipConsultationModal } from "@/components/dashboard/assinatura/VipConsultationModal"

export default function AssinaturaPage() {
  const { profile } = useBusiness()
  const { subscription, loading: subLoading } = useSubscription()
  const { limits, loading: limitsLoading } = usePlanLimits()
  const [plans, setPlans] = useState<any[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("annually")
  const [isVipModalOpen, setIsVipModalOpen] = useState(false)

  const planIcons: Record<string, any> = {
    'iniciante': {
        icon: Zap,
        gradient: "from-amber-400 to-orange-500",
        lightColor: "bg-amber-50",
        textColor: "text-amber-600",
        features: ["Gestão de clientes", "Relatório básico", "Até 50 fichas", "100 pedidos/mês"]
    },
    'profissional': {
        icon: Shield,
        gradient: "from-rose-500 to-pink-600",
        lightColor: "bg-rose-50",
        textColor: "text-rose-600",
        highlight: true,
        badge: "Mais Popular",
        features: ["Fichas ilimitadas", "Pedidos ilimitados", "Financeiro total", "Estoque real", "Relatórios pro"]
    },
    'premium': {
        icon: Trophy,
        gradient: "from-indigo-500 to-purple-600",
        lightColor: "bg-indigo-50",
        textColor: "text-indigo-600",
        features: ["Tudo do Profissional", "IA de Precificação", "Automação total", "Suporte VIP 24h"]
    }
  }

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error } = await supabase.from('plans').select('*').eq('is_active', true).order('price', { ascending: true })
        if (error) throw error
        const uniquePlans = (data || []).filter((p: any) => !p.price.toString().includes('29')).reduce((acc: any[], current: any) => {
            const x = acc.find(item => item.name === current.name);
            if (!x) return acc.concat([current]);
            return acc;
        }, []);
        setPlans(uniquePlans.slice(0, 3))
      } catch (e) { console.error(e) } finally { setLoadingPlans(false) }
    }
    fetchPlans()
  }, [])

  const mappedPlans = plans.map((p: any) => {
    const iconData = planIcons[p.slug] || planIcons[p.name.toLowerCase()] || planIcons['iniciante']
    return { ...p, ...iconData, displayPrice: billingCycle === 'annually' ? Math.round(p.price * 0.8) : p.price, yearlyPrice: Math.round(p.price * 0.8 * 12) }
  })

  const handleUpgrade = async (plan: any) => {
    setIsLoading(true)
    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return toast.error("Sessão expirada")
        const res = await fetch('/api/checkout/stripe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({ planId: plan.id, billingCycle })
        })
        const data = await res.json()
        if (data.url) {
            toast.success("Redirecionando...")
            window.location.href = data.url
        } else throw new Error(data.error)
    } catch (error: any) { toast.error(error.message || "Erro no checkout") } finally { setIsLoading(false) }
  }

  if (subLoading || limitsLoading || loadingPlans) {
    return <div className="h-screen flex items-center justify-center font-black italic uppercase text-rose-500 animate-pulse">Sincronizando sua assinatura...</div>
  }

  return (
    <div className="space-y-12 pb-24 max-w-[1200px] mx-auto">
      <PageHeader 
        title="Plano e" 
        highlight="Assinatura" 
        subtitle="Gerencie seu crescimento e desbloqueie o potencial máximo da sua confeitaria"
        actions={<Badge variant="outline" className="h-10 px-6 rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest text-slate-500">Gateway Seguro Stripe</Badge>}
      />

      {/* Hero Section - Current Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[48px] border border-slate-100 p-10 shadow-sm relative overflow-hidden group">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
              <div className="flex items-center gap-6">
                 <div className="size-20 rounded-[32px] bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <Zap size={32} className="fill-current" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 italic">Plano Ativo</p>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{subscription?.plans?.name || 'Experimental'}</h2>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[9px] uppercase px-4 py-2 rounded-full">Ativo</Badge>
                 <span className="text-[10px] font-black uppercase text-slate-300 italic">ID: {subscription?.id?.slice(0, 8) || '---'}</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: "Pedidos", current: limits.current_orders, max: limits.max_orders, icon: ShoppingBag },
                { label: "Produtos", current: limits.current_products || 0, max: limits.max_products, icon: Layout },
                { label: "Clientes", current: limits.current_clients, max: limits.max_clients, icon: Users },
              ].map((item, idx) => (
                <div key={idx} className="space-y-3">
                   <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                         <item.icon size={12} className="text-slate-400" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                      </div>
                      <span className="text-xs font-black text-slate-900 italic">{item.current}/{item.max}</span>
                   </div>
                   <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((item.current / item.max) * 100, 100)}%` }} className="h-full bg-rose-500" />
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-slate-900 rounded-[48px] p-10 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-slate-900/40">
           <div className="absolute top-0 right-0 p-10 opacity-10"><Crown size={120} /></div>
           <div className="relative z-10">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-4">Precisa de <span className="text-rose-500">Mais?</span></h3>
              <p className="text-slate-400 text-sm font-bold italic leading-relaxed mb-8">Desbloqueie limites ilimitados, IA avançada e suporte prioritário 24/7.</p>
              <ul className="space-y-4">
                 {["Pedidos Ilimitados", "Suporte WhatsApp VIP", "IA de Precificação", "Multi-usuários"].map(f => (
                    <li key={f} className="flex items-center gap-3 text-[10px] font-black uppercase italic text-slate-300">
                       <CheckCircle2 size={14} className="text-rose-500" /> {f}
                    </li>
                 ))}
              </ul>
           </div>
           {subscription?.plans?.slug === 'premium' ? (
              <Button disabled className="mt-10 h-14 rounded-2xl bg-white/10 text-white/50 font-black uppercase tracking-widest text-[10px] border border-white/10">
                 Você já possui acesso VIP
              </Button>
           ) : (
              <Button 
                onClick={() => setIsVipModalOpen(true)}
                className="mt-10 h-14 rounded-2xl bg-white text-slate-900 hover:bg-rose-500 hover:text-white font-black uppercase tracking-widest text-[10px] shadow-xl transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden relative"
              >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
                  Consultar Consultor VIP
              </Button>
           )}
        </div>
      </motion.div>

      <VipConsultationModal 
         isOpen={isVipModalOpen} 
         onClose={() => setIsVipModalOpen(false)} 
         currentPlan={subscription?.plans?.slug || 'free'} 
         userId={profile?.id} 
         tenantId={profile?.tenant_id || profile?.company_id} 
      />

      {/* Billing Switcher */}
      <div className="flex justify-center py-10">
         <div className="bg-slate-100 p-1.5 rounded-[32px] flex items-center relative gap-2 border border-slate-200">
            <button onClick={() => setBillingCycle("monthly")} className={cn("relative z-10 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", billingCycle === "monthly" ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-600")}>Mensal</button>
            <button onClick={() => setBillingCycle("annually")} className={cn("relative z-10 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center", billingCycle === "annually" ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-600")}>
               Anual <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black italic">-20% OFF</Badge>
            </button>
         </div>
      </div>

      {/* Plans Selection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <AnimatePresence mode="popLayout">
          {mappedPlans.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={cn("rounded-[56px] border bg-white p-10 flex flex-col relative group transition-all duration-700", plan.highlight ? "border-rose-500 shadow-[0_40px_80px_-20px_rgba(244,114,182,0.15)] scale-105 z-20" : "border-slate-100 shadow-sm z-10 hover:shadow-2xl")}>
              {plan.badge && <div className="absolute top-8 right-8"><Badge className="bg-rose-500 text-white border-none font-black text-[9px] uppercase italic px-4 py-2 rounded-full animate-bounce">{plan.badge}</Badge></div>}
              
              <div className="space-y-8 mb-10">
                 <div className="flex items-center gap-4">
                    <div className={cn("size-14 rounded-2xl flex items-center justify-center shadow-inner", plan.lightColor, plan.textColor)}><plan.icon size={28} /></div>
                    <div>
                       <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{plan.name}</h4>
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Confeitaria {plan.name}</p>
                    </div>
                 </div>

                 <div className="flex items-baseline gap-1">
                    <span className="text-sm font-black text-slate-400">R$</span>
                    <span className="text-6xl font-black text-slate-900 tracking-tighter italic leading-none">{plan.displayPrice}</span>
                    <span className="text-sm font-black text-slate-400 uppercase italic">/mês</span>
                 </div>

                 <div className="space-y-4 pt-6 border-t border-slate-50 flex-1">
                    {plan.features?.map((f: string) => (
                       <div key={f} className="flex items-center gap-3"><CheckCircle2 size={16} className={cn(plan.highlight ? "text-rose-500" : "text-slate-300")} /><span className="text-xs font-black text-slate-600 uppercase italic tracking-tight">{f}</span></div>
                    ))}
                 </div>
              </div>

              <Button 
                onClick={() => handleUpgrade(plan)}
                disabled={subscription?.plan_id === plan.id || isLoading}
                className={cn("w-full h-16 rounded-[28px] font-black uppercase italic tracking-widest text-xs shadow-xl active:scale-95 transition-all", plan.highlight ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200" : "bg-slate-900 hover:bg-slate-800 text-white")}
              >
                {subscription?.plan_id === plan.id ? "Seu Plano Atual" : `Assinar ${plan.name} 🚀`}
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
