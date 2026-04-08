"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    User,
    Mail,
    CheckCircle2,
    XCircle,
    Calendar,
    SearchX,
    UserCircle,
    UserPlus,
    Clock,
    Award
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface AffiliateRequest {
    id: string
    owner_name: string
    email: string
    affiliate_status: string
    affiliate_requested_at: string
    affiliate_approved_at: string
    affiliate_code: string
}

export default function AffiliateManagement() {
    const [requests, setRequests] = useState<AffiliateRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("pendente")

    useEffect(() => {
        fetchRequests()
    }, [filter])

    async function fetchRequests() {
        setLoading(true)
        try {
            let query = supabase
                .from('profiles')
                .select('id, owner_name, email, affiliate_status, affiliate_requested_at, affiliate_approved_at, affiliate_code')
            
            if (filter !== 'all') {
                query = query.eq('affiliate_status', filter)
            } else {
                query = query.neq('affiliate_status', 'nenhum')
            }

            const { data, error } = await query.order('affiliate_requested_at', { ascending: false })

            if (error) throw error
            setRequests(data || [])
        } catch (error: any) {
            console.error("error fetching affiliate requests:", error)
            toast.error("Erro ao carregar solicitações")
        } finally {
            setLoading(false)
        }
    }

    async function handleApprove(userId: string, userName: string) {
        try {
            // 1. Generate unique code
            const cleanName = (userName || 'USER').split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase()
            const randomSuffix = Math.floor(100 + Math.random() * 900)
            const affCode = `${cleanName}${randomSuffix}`

            // 2. Update profile
            const { error: profError } = await supabase
                .from('profiles')
                .update({ 
                    affiliate_status: 'ativo',
                    affiliate_code: affCode,
                    affiliate_approved_at: new Date().toISOString()
                })
                .eq('id', userId)

            if (profError) throw profError

            // 3. Create entry in affiliates table for tracking compatibility
            const { error: affError } = await supabase
                .from('affiliates')
                .insert({
                    user_id: userId,
                    code: affCode,
                    status: 'active'
                })
            
            if (affError) throw affError

            toast.success(`Afiliado ${userName} aprovado! Código: ${affCode}`)
            fetchRequests()
        } catch (error : any) {
            console.error("Error approving affiliate:", error)
            toast.error("Erro ao aprovar afiliado")
        }
    }

    async function handleReject(userId: string) {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ affiliate_status: 'rejeitado' })
                .eq('id', userId)

            if (error) throw error
            toast.info("Solicitação rejeitada")
            fetchRequests()
        } catch (error) {
            toast.error("Erro ao rejeitar solicitação")
        }
    }

    const handleCopy = (code: string) => {
        const link = `${window.location.origin}/cadastro?ref=${code}`
        navigator.clipboard.writeText(link)
        toast.success("Link copiado para área de transferência!")
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] italic">Partnership Kernel</span>
                    </div>
                    <h2 className="text-6xl font-black text-slate-900 italic uppercase tracking-tighter leading-[0.8]">
                        Gestão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">Afiliados</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">Access Management // Verificação de Parceiros</p>
                </div>
                
                <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-slate-200/50 backdrop-blur-sm">
                   {['pendente', 'ativo', 'rejeitado', 'all'].map((s) => (
                     <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            filter === s ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        )}
                     >
                        {s === 'all' ? 'Ver Todos' : s}
                     </button>
                   ))}
                </div>
            </div>

            {/* Main Table Area */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[48px] border border-white/40 shadow-2xl shadow-emerald-500/5 overflow-hidden bg-white/60 backdrop-blur-md"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Candidato / Identidade</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Status Interno</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Linha do Tempo</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">Ações de Kernel</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={4} className="px-10 py-12 text-center opacity-50">Sincronizando Banco...</td>
                                        </tr>
                                    ))
                                ) : requests.length > 0 ? (
                                    requests.map((req) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={req.id}
                                            className="hover:bg-emerald-50/30 transition-all group"
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "size-16 rounded-full flex items-center justify-center text-slate-900 transition-all duration-500",
                                                        req.affiliate_status === 'ativo' ? "bg-emerald-600 text-white" : "bg-slate-100"
                                                    )}>
                                                        <span className="font-black italic text-xl">{req.owner_name?.charAt(0) || req.email?.charAt(0)}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 italic uppercase tracking-tighter text-lg">{req.owner_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-black flex items-center gap-1 uppercase tracking-[0.2em] mt-1 italic">
                                                            <Mail className="size-3" />
                                                            {req.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <Badge className={cn(
                                                    "px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border-none",
                                                    req.affiliate_status === 'pendente' && "bg-amber-100 text-amber-600",
                                                    req.affiliate_status === 'ativo' && "bg-emerald-100 text-emerald-600",
                                                    req.affiliate_status === 'rejeitado' && "bg-rose-100 text-rose-600"
                                                )}>
                                                    {req.affiliate_status === 'ativo' ? 'Verified Partner' : req.affiliate_status}
                                                </Badge>
                                            </td>
                                            <td className="px-10 py-8 space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                                    <Clock className="size-3" /> Solicitação: {req.affiliate_requested_at ? new Date(req.affiliate_requested_at).toLocaleDateString() : 'N/A'}
                                                </div>
                                                {req.affiliate_approved_at && (
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">
                                                        <Award className="size-3" /> Ativação: {new Date(req.affiliate_approved_at).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                {req.affiliate_status === 'pendente' ? (
                                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                                        <Button 
                                                            onClick={() => handleApprove(req.id, req.owner_name)}
                                                            className="h-12 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20"
                                                        >
                                                            Aprovar <CheckCircle2 className="ml-2 size-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="outline"
                                                            onClick={() => handleReject(req.id)}
                                                            className="h-12 px-6 rounded-2xl border-slate-100 text-rose-500 hover:bg-rose-500 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all"
                                                        >
                                                            Rejeitar <XCircle className="ml-2 size-4" />
                                                        </Button>
                                                    </div>
                                                ) : req.affiliate_status === 'ativo' ? (
                                                    <div className="flex items-center justify-end gap-3">
                                                       <div className="text-right mr-4">
                                                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none mb-1">Affiliate Code</p>
                                                           <p className="text-sm font-black text-emerald-600 uppercase italic tracking-tighter">{req.affiliate_code}</p>
                                                       </div>
                                                       <Button 
                                                         onClick={() => handleCopy(req.affiliate_code)}
                                                         className="size-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:scale-110 transition-transform"
                                                       >
                                                          <LinkIcon className="size-4" />
                                                       </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Acesso Restrito</span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-10 py-32 text-center bg-slate-50/10">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="size-24 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-100 shadow-xl shadow-emerald-500/5">
                                                    <SearchX className="size-12" />
                                                </div>
                                                <p className="text-slate-900 font-black uppercase tracking-widest text-sm italic">Nenhum registro encontrado</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    )
}

import { Link as LinkIcon } from "lucide-react"
