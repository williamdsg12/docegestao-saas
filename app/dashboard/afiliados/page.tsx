"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Link as LinkIcon, 
  Copy, 
  Check,
  ExternalLink,
  Award,
  Zap,
  Rocket,
  BarChart3,
  Headset,
  RefreshCw,
  UserPlus,
  Share2,
  HandCoins,
  ArrowRight,
  TrendingUp as TrendingUpIcon,
  MousePointer2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { AffiliateLinkCard } from "@/components/dashboard/afiliados/AffiliateLinkCard"

// --- Sub-component: Affiliate Landing (For non-affiliates) ---
function AffiliateLanding({ onSolicitar }: { onSolicitar: () => void }) {
  const benefits = [
    {
      title: "Comissão Recorrente",
      desc: "Ganhe 30% de comissão todos os meses enquanto seu indicado for cliente.",
      icon: DollarSign,
      color: "bg-green-500",
      lightColor: "bg-green-50"
    },
    {
      title: "Ganhos Automáticos",
      desc: "Receba seus pagamentos via PIX de forma automatizada todo mês.",
      icon: RefreshCw,
      color: "bg-blue-500",
      lightColor: "bg-blue-50"
    },
    {
      title: "Painel Exclusivo",
      desc: "Acompanhe cliques, cadastros e suas comissões em tempo real.",
      icon: BarChart3,
      color: "bg-purple-500",
      lightColor: "bg-purple-50"
    },
    {
      title: "Produto Validado",
      desc: "Sistema líder no mercado de confeitarias com alta taxa de retenção.",
      icon: Rocket,
      color: "bg-orange-500",
      lightColor: "bg-orange-50"
    },
    {
      title: "Suporte VIP",
      desc: "Canal direto com nossa equipe para ajudar você a vender mais.",
      icon: Headset,
      color: "bg-pink-500",
      lightColor: "bg-pink-50"
    }
  ]

  const steps = [
    { title: "Cadastre-se", desc: "Entre em contato para ativar sua conta de parceiro.", icon: UserPlus },
    { title: "Link Exclusivo", desc: "Receba seu identificador único para rastrear vendas.", icon: LinkIcon },
    { title: "Compartilhe", desc: "Divulgue nas suas redes, grupos ou para contatos.", icon: Share2 },
    { title: "Receba 💰", desc: "Ganhe comissões sobre cada assinatura confirmada.", icon: HandCoins }
  ]

  return (
    <div className="space-y-24 py-10 max-w-[1200px] mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[48px] bg-slate-900 p-12 lg:p-20 text-white">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary rounded-full blur-[150px] opacity-20 -mr-48 -mt-48" />
        <div className="relative z-10 grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3 space-y-8">
            <Badge className="bg-white/10 text-primary hover:bg-white/20 border-none px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest">
              Programa de Parcerias 2024
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-[0.9]">
              Ganhe dinheiro <br /> 
              <span className="text-primary italic">indicando</span> nosso sistema
            </h1>
            <p className="text-lg text-slate-400 font-medium max-w-xl">
              Se torne um parceiro estratégico e receba comissões recorrentes por cada confeitaria que se tornar cliente através da sua recomendação.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={onSolicitar}
                className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              >
                Quero ser afiliado
                <Zap className="ml-2 size-5 fill-white" />
              </Button>
              <Button 
                variant="outline"
                className="h-16 px-10 rounded-2xl border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 font-black uppercase tracking-widest text-sm"
              >
                Falar com suporte
              </Button>
            </div>
          </div>
          <div className="lg:col-span-2 hidden lg:flex justify-center">
            <div className="relative">
               <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
               <Award className="size-64 text-white/10 relative z-10 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="space-y-12 text-center">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase text-slate-900">
            Benefícios <span className="text-primary">Incríveis</span>
          </h2>
          <p className="text-slate-500 font-medium">Por que mais de 500 parceiros escolheram a DocesGestão?</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {benefits.map((b, i) => (
            <motion.div 
              key={b.title} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="rounded-[32px] border-none shadow-xl shadow-slate-100 bg-white p-8 h-full flex flex-col items-center group hover:scale-105 transition-transform">
                <div className={cn("size-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg", b.color)}>
                  <b.icon className="size-8" />
                </div>
                <h3 className="text-base font-black uppercase italic tracking-tighter text-slate-900 mb-3 leading-tight">{b.title}</h3>
                <p className="text-[11px] font-medium text-slate-400 leading-relaxed text-center">{b.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="rounded-[48px] bg-slate-50 p-12 lg:p-20 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase text-slate-900">
            Como <span className="text-primary">Funciona?</span>
          </h2>
          <p className="text-slate-500 font-medium text-sm">Quatro passos simples para você começar a faturar hoje mesmo.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          {steps.map((s, i) => (
            <div key={s.title} className="relative z-10 flex flex-col items-center text-center space-y-6">
               <div className="size-20 rounded-[28px] bg-white shadow-xl flex items-center justify-center text-primary group hover:bg-primary hover:text-white transition-all duration-300">
                  <s.icon className="size-8" />
                  <div className="absolute -top-3 -right-3 size-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black italic">0{i+1}</div>
               </div>
               <div className="space-y-2">
                 <h4 className="text-lg font-black uppercase italic tracking-tight text-slate-900">{s.title}</h4>
                 <p className="text-xs font-medium text-slate-400">{s.desc}</p>
               </div>
            </div>
          ))}
          {/* Connector Line (hidden on mobile) */}
          <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-0.5 bg-slate-200 -z-0" />
        </div>
      </section>

      {/* Stats & Simulation */}
      <section className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase text-slate-900 leading-[0.9]">
            Simule seus <br />
            <span className="text-primary">Ganhos Mensais</span>
          </h2>
          <p className="text-slate-500 font-medium">Veja o poder da recorrência. Quanto mais você indica, mais sua renda passiva cresce.</p>
          
          <div className="space-y-6 bg-white p-8 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-50">
            <div className="flex justify-between items-end">
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Indicando 10 clientes/mês</p>
                 <h3 className="text-4xl font-black italic tracking-tighter text-slate-900 leading-none">R$ 1.500,00</h3>
               </div>
               <Badge className="bg-green-100 text-green-600 border-none px-3 py-1 font-black text-[10px] uppercase">Renda Recorrente</Badge>
            </div>
            <div className="flex justify-between items-end border-t border-slate-50 pt-6">
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Indicando 50 clientes/mês</p>
                 <h3 className="text-4xl font-black italic tracking-tighter text-primary leading-none">R$ 7.500,00</h3>
               </div>
               <Badge className="bg-primary/10 text-primary border-none px-3 py-1 font-black text-[10px] uppercase italic">Poder de Escala</Badge>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-[48px] p-12 text-white relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
          <div className="space-y-8 relative z-10">
            <div className="size-16 rounded-2xl bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
              <TrendingUpIcon className="size-8 text-primary" />
            </div>
            <h3 className="text-3xl font-black uppercase italic tracking-tighter">O Mercado Está em <span className="text-primary italic">Alta!</span></h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-2 bg-primary rounded-full" />
                <p className="text-sm font-medium text-slate-400">+5.000 lojas em crescimento</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-2 bg-primary rounded-full" />
                <p className="text-sm font-medium text-slate-400">Baixa taxa de desistência (Churn)</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-2 bg-primary rounded-full" />
                <p className="text-sm font-medium text-slate-400">Plataforma mais desejada por doceiras</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center py-20 bg-primary/5 rounded-[64px] border border-primary/10 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary rounded-full blur-[150px] opacity-10 -mb-48" />
        <div className="relative z-10 space-y-8 max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-slate-900">
            Preparado para <span className="text-primary">começar?</span>
          </h2>
          <p className="text-slate-500 font-medium">Faça parte da nossa história e construa sua renda recorrente agora mesmo.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
                onClick={onSolicitar}
                className="h-16 px-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-base shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              Solicitar Ativação ✨
            </Button>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativação imediata para contas selecionadas</p>
        </div>
      </section>
    </div>
  )
}

// --- Sub-component: Affiliate Dashboard (For active affiliates) ---
function AffiliateDashboardView({ stats, referrals, onCopy }: { stats: any, referrals: any[], onCopy: () => void }) {
  const [hasCopied, setHasCopied] = useState(false)

  const handleCopy = () => {
    onCopy()
    setHasCopied(true)
    setTimeout(() => setHasCopied(false), 2000)
  }

  const kpis = [
    { label: "Vendas Totais", value: stats.totalSales, icon: HandCoins, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Ganhos Pendentes", value: `R$ ${stats.pendingCommissions.toFixed(2)}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-50" },
    { label: "Cliques no Link", value: "324", icon: MousePointer2, color: "text-purple-500", bg: "bg-purple-50" }, // Mocked clicks
    { label: "Conversão", value: "12.4%", icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-50" }, // Mocked conv
  ]

  return (
    <div className="space-y-12 pb-24">
      {/* Dashboard Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-2 uppercase italic leading-none">
            Central do <span className="text-primary italic">Parceiro</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Acompanhe seu desempenho e gerencie seus lucros recorrentes.</p>
        </div>
      </div>

      <AffiliateLinkCard affiliateCode={stats.affiliateCode} affiliateSlug={stats.affiliateSlug} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div 
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 bg-white p-8 h-full flex flex-col justify-between group hover:shadow-2xl hover:scale-[1.02] transition-all">
               <div className="flex items-center justify-between mb-8">
                  <div className={cn("size-14 rounded-2xl flex items-center justify-center text-white shadow-lg transform group-hover:rotate-6 transition-transform", kpi.bg.replace('light', '').replace('50', '500'), kpi.color.replace('text', 'bg'))}>
                    <kpi.icon className="size-7" />
                  </div>
                  <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[9px] uppercase tracking-widest">Este Mês</Badge>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                 <h3 className="text-3xl font-black italic tracking-tighter text-slate-900 leading-none">{kpi.value}</h3>
               </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Referrals Table */}
      <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
             <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Crescimento da Rede</h2>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Clientes que entraram pelo seu convite</p>
          </div>
          <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-primary hover:border-primary transition-all">
            Exportar Dados
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Início</th>
                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Comissão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {referrals.length > 0 ? referrals.map((ref) => (
                <tr key={ref.id} className="hover:bg-slate-50/40 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold group-hover:scale-110 transition-transform shadow-sm">
                        {ref.tenants?.name?.charAt(0) || 'L'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 uppercase italic tracking-tighter leading-tight">{ref.tenants?.name || 'Nova Loja'}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ref.tenant_id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-xs font-bold text-slate-500">
                    {new Date(ref.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-10 py-8">
                    <Badge className="bg-green-50 text-green-500 border-none px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest">
                      Ativo
                    </Badge>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <span className="text-xl font-black text-slate-900 italic tracking-tighter">R$ {Number(ref.commission).toFixed(2)}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Rocket className="size-16 stroke-1 mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Seu link ainda não gerou vendas.</p>
                      <p className="text-xs font-bold text-slate-400 max-w-xs mx-auto">Compartilhe seu link exclusivo para começar a ver os dados aqui!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Support Footer Card */}
      <Card className="rounded-[40px] bg-slate-900 p-10 lg:p-14 text-white relative overflow-hidden group border-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] -mr-48 -mt-48 transition-all group-hover:opacity-40" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="space-y-4 max-w-xl text-center lg:text-left">
             <h3 className="text-3xl lg:text-4xl font-black uppercase italic tracking-tighter">Precisa de Ajuda Estratégica?</h3>
             <p className="text-slate-400 font-medium">Nossa equipe de parcerias está pronta para te enviar materiais de divulgação e dicas de como vender mais.</p>
          </div>
          <Button className="h-16 px-12 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-sm shadow-xl transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
            Falar com Suporte VIP
            <ArrowRight className="ml-2 size-5" />
          </Button>
        </div>
      </Card>
    </div>
  )
}

// --- Main Page Component ---
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"

export default function AffiliatePage() {
  return (
    <FeatureGuard feature="afiliados" planRequired="pro">
      <AffiliateContent />
    </FeatureGuard>
  )
}

function AffiliateContent() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingCommissions: 0,
    totalReferrals: 0,
    affiliateCode: "",
    affiliateSlug: ""
  })
  const [referrals, setReferrals] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchAffiliateData()
    }
  }, [user])

  const fetchAffiliateData = async () => {
    try {
      setLoading(true)
      
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()
      
      setProfile(profData)

      if (profData?.affiliate_status === 'ativo') {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('*')
          .eq('user_id', user?.id)
          .single()
        
        if (affiliate) {
          const { data: sales } = await supabase
            .from('affiliate_sales')
            .select('*, tenants(name)')
            .eq('affiliate_id', affiliate.id)
          
          const totalCommissions = sales?.reduce((acc, sale) => acc + Number(sale.commission), 0) || 0
          
          setStats({
            totalSales: sales?.length || 0,
            pendingCommissions: totalCommissions,
            totalReferrals: sales?.length || 0,
            affiliateCode: affiliate.code || profData?.affiliate_code,
            affiliateSlug: affiliate.slug
          })
          
          setReferrals(sales || [])
        } else {
          // Fallback if the user is active but doesn't have an affiliate record yet
          setStats(prev => ({
            ...prev,
            affiliateCode: profData?.affiliate_code || ""
          }))
        }
      }

    } catch (error) {
      console.error("Error fetching affiliate data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSolicitar = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          affiliate_status: 'pendente',
          affiliate_requested_at: new Date().toISOString()
        })
        .eq('id', user?.id)
      
      if (error) throw error
      
      toast.success("Solicitação enviada! Aguarde a análise.")
      fetchAffiliateData()
    } catch (error) {
      toast.error("Erro ao enviar solicitação")
    }
  }

  const handleCopy = () => {
    const link = `${window.location.origin}/cadastro?ref=${stats.affiliateCode}`
    navigator.clipboard.writeText(link)
    toast.success("Link de indicação copiado!")
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preparando seu painel...</p>
      </div>
    )
  }

  // Handle different statuses
  const status = profile?.affiliate_status || 'nenhum'

  if (status === 'pendente') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 animate-in fade-in zoom-in duration-500">
         <div className="size-24 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 animate-pulse">
            <RefreshCw className="size-12" />
         </div>
         <div className="space-y-2">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Solicitação em <span className="text-amber-500 italic">Análise</span></h2>
            <p className="text-slate-500 font-medium max-w-md">Nossa equipe está revisando seu perfil. Você será notificado assim que sua conta de parceiro for ativada.</p>
         </div>
         <Button variant="outline" className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs border-slate-200">
            Falar com Suporte
         </Button>
      </div>
    )
  }

  if (status === 'rejeitado') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 animate-in fade-in zoom-in duration-500">
         <div className="size-24 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <Rocket className="size-12 rotate-180" />
         </div>
         <div className="space-y-2">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Pedido <span className="text-red-500 italic">Não Aprovado</span></h2>
            <p className="text-slate-500 font-medium max-w-md">Infelizmente seu perfil não atende aos requisitos atuais do nosso programa de parceiros.</p>
         </div>
         <Button 
           onClick={() => window.open("https://wa.me/5544998607693", "_blank")}
           className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs bg-slate-900 text-white"
         >
            Contestar Decisão
         </Button>
      </div>
    )
  }

  return (
    <div>
      {status === 'ativo' ? (
        <AffiliateDashboardView 
          stats={stats} 
          referrals={referrals} 
          onCopy={handleCopy} 
        />
      ) : (
        <AffiliateLanding 
          onSolicitar={handleSolicitar} 
        />
      )}
    </div>
  )
}
