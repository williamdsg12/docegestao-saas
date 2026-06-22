"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Crown, Zap, Phone, CheckCircle2, ChevronRight, BarChart3, SearchX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface VipLead {
    id: string
    user_id: string
    tenant_id: string
    current_plan_slug: string
    click_count: number
    page_origin: string
    status: string
    created_at: string
    updated_at: string
    profiles?: {
       full_name: string
       email: string
       phone?: string
       owner_name?: string
    }
}

export default function VipLeadsPage() {
    const [leads, setLeads] = useState<VipLead[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('pending_contact')

    useEffect(() => {
        fetchLeads()
    }, [statusFilter])

    const fetchLeads = async () => {
        setLoading(true)
        try {
            // Include profiles data through the user_id foreign key
            const { data, error } = await supabase
                .from('vip_interest_logs')
                .select(`
                    *,
                    profiles:user_id ( full_name, email, phone, owner_name )
                `)
                .eq('status', statusFilter)
                .order('updated_at', { ascending: false })
            
            if (error) throw error
            setLeads(data || [])
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar leads VIP")
        } finally {
            setLoading(false)
        }
    }

    const markAsContacted = async (id: string) => {
        try {
            const { error } = await supabase.from('vip_interest_logs').update({ status: 'contacted' }).eq('id', id)
            if (error) throw error
            toast.success("Lead marcado como Contactado.")
            setLeads(leads.filter(l => l.id !== id))
        } catch (error) {
            toast.error("Falha ao atualizar lead")
        }
    }

    return (
        <div className="space-y-12 pb-24">
            {/* Cabecalho */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-2 bg-rose-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] italic">CRM Comercial</span>
                    </div>
                    <h2 className="text-6xl font-black text-slate-900 italic uppercase tracking-tighter leading-[0.8]">
                        Pipeline <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-500">VIP</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">Monitoramento Quente de Upsell</p>
                </div>
                
                <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-slate-200/50 backdrop-blur-sm">
                   {[
                       { id: 'pending_contact', label: 'Pendentes' },
                       { id: 'contacted', label: 'Contactados' },
                       { id: 'converted', label: 'Convertidos' }
                   ].map((s) => (
                     <button
                        key={s.id}
                        onClick={() => setStatusFilter(s.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            statusFilter === s.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        }`}
                     >
                        {s.label}
                     </button>
                   ))}
                </div>
            </div>

            {/* Content Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {/* Mini Stats (Can be expanded later) */}
                 <div className="md:col-span-1 space-y-4">
                     <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10"><BarChart3 size={100} /></div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Fila Atual</p>
                        <h3 className="text-5xl font-black italic tracking-tighter">{leads.length}</h3>
                        <p className="text-xs font-bold text-rose-500 mt-2">Prontos p/ abordagem</p>
                     </div>
                 </div>

                 {/* Kanban / Lead List */}
                 <div className="md:col-span-3 space-y-4">
                     {loading ? (
                         <div className="h-40 bg-white/50 border border-slate-100 rounded-[32px] flex items-center justify-center animate-pulse text-slate-400 font-black italic uppercase">Buscando leads na nuvem...</div>
                     ) : leads.length > 0 ? (
                         <AnimatePresence>
                             {leads.map((lead) => (
                                 <motion.div
                                     key={lead.id}
                                     initial={{ opacity: 0, x: -20 }}
                                     animate={{ opacity: 1, x: 0 }}
                                     exit={{ opacity: 0, scale: 0.95 }}
                                     className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row gap-6 md:items-center justify-between group"
                                 >
                                     <div className="flex gap-4 items-center">
                                         <div className="size-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                                             <Crown size={24} />
                                         </div>
                                         <div>
                                             <h4 className="text-lg font-black uppercase italic text-slate-900 leading-none">{lead.profiles?.owner_name || lead.profiles?.full_name || 'Usuário'}</h4>
                                             <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                 <span>{lead.profiles?.email}</span>
                                                 {lead.profiles?.phone && (
                                                     <><span>•</span><span className="flex items-center gap-1 text-slate-500"><Phone size={10}/> {lead.profiles.phone}</span></>
                                                 )}
                                             </div>
                                         </div>
                                     </div>

                                     <div className="flex items-center gap-8">
                                         <div className="text-right flex flex-col items-end">
                                             <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] uppercase px-3 hover:bg-slate-200">
                                                 De: {lead.current_plan_slug}
                                             </Badge>
                                             <span className="text-[10px] font-black uppercase text-rose-500 mt-2 flex items-center gap-1 tracking-widest">
                                                 <Zap size={10} className="fill-current" /> {lead.click_count} interações
                                             </span>
                                             <span className="text-[9px] text-slate-300 font-bold mt-1">Última: {new Date(lead.updated_at).toLocaleDateString()}</span>
                                         </div>
                                         
                                         {statusFilter === 'pending_contact' && (
                                            <Button 
                                                onClick={() => markAsContacted(lead.id)}
                                                className="h-12 w-12 rounded-2xl bg-white text-slate-300 border-2 border-slate-100 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <CheckCircle2 size={24} />
                                            </Button>
                                         )}
                                     </div>
                                 </motion.div>
                             ))}
                         </AnimatePresence>
                     ) : (
                         <div className="h-64 bg-slate-50/50 border border-slate-100 rounded-[40px] flex gap-4 flex-col items-center justify-center text-center">
                             <div className="size-20 bg-white shadow-sm rounded-full flex items-center justify-center text-slate-300"><SearchX size={32} /></div>
                             <p className="text-slate-400 font-black uppercase tracking-widest italic">Nenhum evento neste estágio</p>
                         </div>
                     )}
                 </div>
            </div>
        </div>
    )
}
