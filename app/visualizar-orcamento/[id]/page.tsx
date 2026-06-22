"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { 
    CheckCircle2, 
    Calendar, 
    Smartphone, 
    MessageSquare, 
    FileText, 
    Clock, 
    Package,
    ShieldCheck,
    Star,
    Sparkles,
    ChevronRight,
    Loader2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { cn } from "@/lib/utils"

export default function PublicQuotePage() {
    const { id } = useParams()
    const [quote, setQuote] = useState<any>(null)
    const [company, setCompany] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isApproving, setIsApproving] = useState(false)
    const [approved, setApproved] = useState(false)

    useEffect(() => {
        fetchData()
    }, [id])

    async function fetchData() {
        try {
            // 1. Fetch Quote
            const { data: quoteData, error: quoteError } = await supabase
                .from('quotes')
                .select('*, customers(name), quote_costs(*)')
                .eq('id', id)
                .single()

            if (quoteError) throw quoteError
            setQuote(quoteData)

            if (quoteData.status === 'approved' || quoteData.status === 'converted') {
                setApproved(true)
            }

            // 2. Fetch Company Details
            const { data: companyData } = await supabase
                .from('companies')
                .select('*')
                .eq('id', quoteData.company_id)
                .single()
            setCompany(companyData)

            // 3. Tracking: Update opened_at if null
            if (!quoteData.opened_at) {
                await supabase.from('quotes').update({ opened_at: new Date().toISOString() }).eq('id', id)
            }

        } catch (e) {
            console.error(e)
            toast.error("Orçamento não encontrado ou expirado")
        } finally {
            setLoading(false)
        }
    }

    async function handleApprove() {
        setIsApproving(true)
        try {
            const { error } = await supabase
                .from('quotes')
                .update({ status: 'approved' })
                .eq('id', id)

            if (error) throw error

            setApproved(true)
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FF2F81', '#FF8EBD', '#FFFFFF']
            })
            toast.success("Orçamento aprovado com sucesso! Entraremos em contato em breve.")
        } catch (e) {
            toast.error("Erro ao aprovar")
        } finally {
            setIsApproving(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
            <Loader2 className="size-12 animate-spin text-pink-500" />
            <p className="font-black uppercase text-[10px] tracking-widest text-slate-400">Carregando sua proposta premium...</p>
        </div>
    )

    if (!quote) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-10 text-center">
            <XCircle className="size-20 text-slate-100 mb-6" />
            <h1 className="text-2xl font-black italic uppercase text-slate-900">Orçamento não encontrado</h1>
            <p className="text-slate-400 font-bold max-w-xs mt-2">O link pode ter expirado ou o orçamento foi removido.</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-pink-100 selection:text-pink-600">
            {/* Top Bar / Logo */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                            <Star size={20} fill="white" />
                        </div>
                        <h3 className="font-black italic uppercase text-xl leading-none tracking-tighter">
                            {company?.name || "Doce Gestão"}
                        </h3>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full">
                        Proposta Oficinal
                    </Badge>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
                {/* Hero / Greeting */}
                <section className="text-center space-y-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="text-[10px] font-black uppercase text-pink-500 tracking-[0.2em] mb-2">Olá, {quote.customers?.name || "Cliente"}!</p>
                        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                            Temos algo <span className="text-pink-500">doce</span> para você
                        </h1>
                        <p className="text-slate-400 font-medium max-w-xl mx-auto text-sm md:text-base">
                            Analisamos seu pedido com muito carinho. Confira abaixo os detalhes da nossa proposta profissional para o seu evento.
                        </p>
                    </motion.div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Summary Card */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[48px] p-10 shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                            
                            <div className="flex flex-wrap gap-8 justify-between items-start mb-12">
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Descrição do Pedido</h4>
                                    <p className="text-lg font-bold text-slate-700 leading-relaxed italic border-l-4 border-pink-500 pl-6 py-2 bg-slate-50/50 rounded-r-3xl pr-6">
                                        {quote.description || "Nossa sugestão especial para o seu evento."}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pb-10 border-b border-slate-100">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-pink-500">
                                        <Calendar size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Data do Evento</span>
                                    </div>
                                    <p className="text-sm font-black text-slate-900">{quote.event_date ? new Date(quote.event_date).toLocaleDateString() : "A definir"}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-amber-500">
                                        <Clock size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Validade</span>
                                    </div>
                                    <p className="text-sm font-black text-slate-900">{new Date(quote.valid_until).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-2 hidden md:block">
                                    <div className="flex items-center gap-2 text-indigo-500">
                                        <ShieldCheck size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Garantia</span>
                                    </div>
                                    <p className="text-sm font-black text-slate-900">Qualidade Doce Gestão</p>
                                </div>
                            </div>

                            {/* Detailed Items if shared */}
                            {quote.display_options?.showDetails && (
                                <div className="py-10 space-y-6">
                                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Itens da Proposta</h5>
                                    <div className="space-y-3">
                                        {quote.quote_costs?.filter((c: any) => c.show_to_client).map((item: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm">
                                                        <Package size={14} />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{item.description}</span>
                                                </div>
                                                <span className="text-sm font-black text-slate-900 italic">R$ {Number(item.value).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {quote.observations && (
                                <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100/50 mt-6">
                                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                                        <MessageSquare size={14} className="text-pink-500" /> Observações do Confeiteiro
                                    </h5>
                                    <p className="text-xs font-bold text-slate-600 leading-relaxed italic">"{quote.observations}"</p>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Right Column: CTA / Price */}
                    <div className="space-y-8">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-pink-500/30 transition-all duration-700" />
                            
                            <p className="text-[10px] font-black uppercase text-pink-500 tracking-[0.2em] mb-4">Investimento Total</p>
                            <h4 className="text-5xl font-black italic tracking-tighter mb-2">
                                <span className="text-2xl not-italic mr-1">R$</span>
                                {Number(quote.total_final).toFixed(2)}
                            </h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Parcelamento disponível no fechamento</p>

                            <div className="mt-10 space-y-4">
                                {!approved ? (
                                    <Button 
                                        onClick={handleApprove}
                                        disabled={isApproving}
                                        className="w-full h-16 rounded-[24px] bg-white text-slate-900 hover:bg-slate-100 font-black uppercase text-xs italic tracking-widest transition-all scale-100 hover:scale-[1.02] active:scale-[0.98] shadow-xl group/btn"
                                    >
                                        {isApproving ? <Loader2 className="animate-spin" /> : (
                                            <span className="flex items-center gap-3">
                                                APROVAR PEDIDO <ChevronRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </span>
                                        )}
                                    </Button>
                                ) : (
                                    <div className="w-full h-16 rounded-[24px] bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-400 flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest italic">
                                        <CheckCircle2 size={20} /> PEDIDO APROVADO!
                                    </div>
                                )}

                                <Button 
                                    variant="outline"
                                    onClick={() => window.open(`https://wa.me/${company?.whatsapp?.replace(/\D/g, '')}`, '_blank')}
                                    className="w-full h-16 rounded-[24px] border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-xs tracking-widest transition-all"
                                >
                                    DÚVIDAS? WHATSAPP
                                </Button>
                            </div>
                        </motion.div>

                        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 text-emerald-500">
                                <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center"><ShieldCheck size={20} /></div>
                                <h6 className="font-black italic uppercase text-xs text-slate-900 leading-none">Ambiente Seguro</h6>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                Seus dados estão protegidos por criptografia de ponta a ponta. A aprovação deste orçamento inicia o processo de produção.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-slate-200 text-center space-y-4 opacity-40">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none">Powered by</p>
                <div className="flex items-center justify-center gap-2 grayscale group-hover:grayscale-0 transition-all">
                    <Sparkles className="size-4 text-pink-500" />
                    <span className="text-sm font-black italic uppercase text-slate-900 tracking-tighter">Doce <span className="text-pink-500">Gestão</span></span>
                </div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">© 2026 Confeitaria Profissional</p>
            </footer>
        </div>
    )
}

function XCircle({ className, size }: { className?: string, size?: number }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    )
}
