"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import {
    CreditCard,
    CheckCircle2,
    Zap,
    Shield,
    Trophy,
    ArrowRight,
    Clock,
    AlertCircle,
    Receipt,
    Sparkles,
    Star,
    ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { format, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function BillingPage() {
    const { user, subscription, loadingSubscription } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("annually")
    const [plansFromDb, setPlansFromDb] = useState<any[]>([])
    const [payments, setPayments] = useState<any[]>([])
    const [loadingPayments, setLoadingPayments] = useState(false)
    const [invoicesOpen, setInvoicesOpen] = useState(false)

    const scrollToPlans = () => {
        const section = document.getElementById('pricing-plans')
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const fetchPayments = async () => {
        if (!user) return
        setLoadingPayments(true)
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*, subscription:subscriptions(*, plans(*))')
                .order('created_at', { ascending: false })

            if (error) throw error
            setPayments(data || [])
        } catch (error: any) {
            console.error("Error fetching payments:", error.message || error)
        } finally {
            setLoadingPayments(false)
        }
    }

    const daysLeft = (() => {
        if (subscription?.trial_end) {
            return differenceInDays(new Date(subscription.trial_end), new Date())
        }
        if (user?.created_at) {
            const signupDate = new Date(user.created_at)
            const trialEndDate = new Date(signupDate.getTime() + 14 * 24 * 60 * 60 * 1000)
            return differenceInDays(trialEndDate, new Date())
        }
        return 14
    })()

    // Effect to fetch real plans from DB
    useEffect(() => {
        async function fetchPlans() {
            const { data } = await supabase.from('plans').select('*').order('price', { ascending: true })
            if (data) {
                // Deduplicate by NAME to ensure only one of each tier
                const uniquePlans = data
                    .filter((p: any) => !p.price.toString().includes('29'))
                    .reduce((acc: any[], current: any) => {
                        const x = acc.find(item => item.name === current.name);
                        if (!x) {
                            return acc.concat([current]);
                        } else {
                            // Keep the one with the slug we expect or higher price if duplicate name
                            return acc;
                        }
                    }, []);

                // Sort by price
                uniquePlans.sort((a: any, b: any) => a.price - b.price);
                setPlansFromDb(uniquePlans.slice(0, 3)) // Stick to 3 plans
            }
        }
        fetchPlans()
    }, [])

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

    const mappedPlans = plansFromDb.map((p: any) => {
        const iconData = planIcons[p.slug] || planIcons[p.name.toLowerCase()] || planIcons['iniciante']
        return {
            ...p,
            ...iconData,
            features: iconData.features, // Override with our standard features for consistency
            displayPrice: billingCycle === 'annually' ? Math.round(p.price * 0.8) : p.price,
            yearlyPrice: Math.round(p.price * 0.8 * 12)
        }
    })

    const handleSubscribe = async (plan: any) => {
        if (!user) {
            toast.error("Você precisa estar logado")
            return
        }

        setIsLoading(true)
        try {
            const { data: { session: authSession } } = await supabase.auth.getSession()

            if (!authSession) {
                toast.error("Sessão expirada. Faça login novamente.")
                return
            }

            // Call our Stripe Checkout API
            const response = await fetch('/api/checkout/stripe', {
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

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Erro ao gerar checkout")
            }

            // Redirect to Stripe Checkout
            toast.success("Redirecionando para o pagamento seguro...")

            setTimeout(() => {
                window.location.href = data.url
            }, 1000)

        } catch (error: any) {
            console.error("Stripe error:", error)
            toast.error(error.message || "Erro ao processar assinatura")
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "Não disponível"
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) return "Não disponível"
            return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        } catch (e) {
            return "Não disponível"
        }
    }

    if (loadingSubscription) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Star className="size-6 text-primary animate-pulse" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-16 pb-32">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-amber-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Header Section */}
            <div className="text-center space-y-4 pt-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest italic"
                >
                    <Sparkles className="size-4" />
                    Escolha sua Jornada de Sucesso
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 italic uppercase"
                >
                    Plano & <span className="text-primary">Cobrança</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-500 font-medium text-lg max-w-2xl mx-auto"
                >
                    Libere o potencial máximo do seu ateliê com ferramentas desenhadas para o crescimento real.
                </motion.p>
            </div>

            {/* Status Info (Modern Glassmorphism) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative group lg:mx-10"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-400 rounded-[50px] blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
                <div className="relative bg-white/70 backdrop-blur-xl rounded-[48px] border border-white shadow-2xl p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-8">
                        <div className="relative shrink-0">
                            <div className="size-24 rounded-3xl bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center text-white shadow-2xl shadow-primary/30 rotate-3">
                                <CreditCard className="size-12" />
                            </div>
                            {(subscription?.status === 'trial' || !subscription) && (
                                <Badge className="absolute -top-3 -right-3 bg-slate-900 border-2 border-white text-[10px] font-black italic px-3 py-1 scale-110">
                                    TRIAL
                                </Badge>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">
                                    {subscription?.status === 'active' ? subscription?.plans?.name : 'Acesso Trial'}
                                </h2>
                                <Badge className={cn(
                                    "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2",
                                    subscription?.status === 'active'
                                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                                        : "bg-primary/10 text-primary border-primary/20"
                                )}>
                                    {subscription?.status === 'active' ? 'Assinatura Ativa' : 'Aguardando Upgrade'}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-500 font-bold text-sm">
                                <span className="flex items-center gap-2">
                                    <Clock className="size-4 text-primary" />
                                    {subscription?.status === 'active' ? (
                                        <>Próxima renovação: <span className="text-slate-900">{formatDate(subscription?.current_period_end)}</span></>
                                    ) : (
                                        <>Válido até: <span className="text-slate-900">{formatDate(subscription?.trial_end || new Date(new Date(user?.created_at || Date.now()).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString())}</span></>
                                    )}
                                </span>
                                {(subscription?.status === 'trial' || !subscription) && (
                                    <span className="text-primary font-black uppercase italic tracking-tighter">
                                        Faltam {Math.max(0, daysLeft)} dias para acabar o teste grátis
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-5 w-full lg:w-auto">
                        <Dialog open={invoicesOpen} onOpenChange={(open) => {
                            setInvoicesOpen(open);
                            if (open) fetchPayments();
                        }}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1 lg:flex-none h-16 rounded-2xl font-black uppercase italic border-2 border-slate-100 hover:bg-slate-50 text-slate-600 px-8 transition-all active:scale-95">
                                    <Receipt className="size-5 mr-3" />
                                    Faturas
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl bg-white rounded-[32px] p-8">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black italic uppercase italic">Histórico de <span className="text-primary">Faturas</span></DialogTitle>
                                </DialogHeader>
                                <div className="mt-6 space-y-4">
                                    {loadingPayments ? (
                                        <div className="flex justify-center p-10">
                                            <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        </div>
                                    ) : payments.length > 0 ? (
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {payments.map((payment) => (
                                                <div key={payment.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                                            <Receipt className="size-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 uppercase italic leading-none mb-1">Assinatura {payment.subscription?.plans?.name}</p>
                                                            <p className="text-xs font-bold text-slate-400">{formatDate(payment.created_at)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-lg text-slate-900 tracking-tighter italic">R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[9px] font-black uppercase border-none px-2 py-0.5",
                                                            payment.status === 'CONFIRMED' || payment.status === 'RECEIVED' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                                                        )}>
                                                            {payment.status === 'RECEIVED' ? 'Pago' : payment.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <Receipt className="size-12 text-slate-200 mx-auto mb-4" />
                                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma fatura encontrada</p>
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button 
                            onClick={scrollToPlans}
                            className="flex-1 lg:flex-none h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 shadow-2xl shadow-slate-900/10 text-white font-black uppercase italic px-10 transition-all active:scale-95 flex items-center gap-2"
                        >
                            Alterar Plano
                            <ArrowRight className="size-5" />
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Cycle Selector (Premium Feel) */}
            <div className="flex flex-col items-center gap-8">
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
                            -30% OFF
                        </Badge>
                    </button>
                </div>
                <div className="bg-green-50 px-6 py-2 rounded-full border border-green-100 flex items-center gap-3 animate-bounce">
                    <Star className="size-4 text-green-500 fill-green-500" />
                    <p className="text-xs font-black text-green-600 uppercase italic">Recomendado: Economize até R$ 360 no plano anual</p>
                </div>
            </div>

            {/* Pricing Tiers */}
            <div id="pricing-plans" className="grid lg:grid-cols-3 gap-10 items-stretch">
                <AnimatePresence mode="popLayout">
                    {mappedPlans.map((plan: any, i: number) => (
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
                            {/* Gradient Accent Bar */}
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
                                        <span className="text-6xl font-black text-slate-900 tracking-tighter italic leading-none">{plan.price}</span>
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
                                    onClick={() => handleSubscribe(plan)}
                                    disabled={isLoading || subscription?.plans?.name === plan.name}
                                    className={cn(
                                        "w-full h-16 rounded-[28px] font-black uppercase italic tracking-tighter text-lg transition-all active:scale-95 group/btn overflow-hidden relative",
                                        plan.highlight
                                            ? "bg-gradient-to-r from-primary to-rose-600 text-white shadow-[0_20px_40px_-10px_rgba(255,47,129,0.4)]"
                                            : "bg-slate-900 hover:bg-slate-800 text-white"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                                    {subscription?.plans?.name === plan.name ? (
                                        "Seu Plano Atual"
                                    ) : (
                                        <span className="flex items-center gap-2 relative z-10">
                                            Assinar Agora
                                            <ChevronRight className="size-5 group-hover/btn:translate-x-1 transition-transform" />
                                        </span>
                                    )}
                                </Button>
                                <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Cancele quando quiser • Sem multas
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Confidence Footer */}
            <div className="flex flex-col items-center gap-12 pt-20">
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2">
                            <CreditCard className="size-5 text-indigo-600" />
                            <span className="text-xl font-black text-indigo-600 italic uppercase">Stripe</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Transação Segura</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <Shield className="size-8 text-slate-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Privacidade SSL</span>
                    </div>
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="flex gap-1 text-primary">
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} className="size-3 fill-current" />)}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Nota 4.9/5 no G2</span>
                    </div>
                </div>

                <p className="text-slate-400 text-xs font-medium text-center max-w-lg leading-relaxed">
                    Pagamento processado de forma criptografada. Aceitamos Pix, Cartão de Crédito e Boleto Bancário.
                    Ao assinar, você concorda com nossos <span className="underline cursor-pointer hover:text-slate-600">Termos de Uso</span>.
                </p>
            </div>
        </div>
    )
}
