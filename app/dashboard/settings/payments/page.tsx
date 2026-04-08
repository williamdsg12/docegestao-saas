"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
    CreditCard, 
    QrCode, 
    Link as LinkIcon, 
    CheckCircle2, 
    AlertCircle,
    Power,
    ChevronRight,
    Trophy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function PaymentsSettingsPage() {
    const supabase = createClientComponentClient()
    const [loading, setLoading] = useState(true)
    const [tunaAccount, setTunaAccount] = useState<any>(null)
    const [toggles, setToggles] = useState({
        pix: false,
        card: false
    })

    useEffect(() => {
        fetchTunaAccount()
    }, [])

    const fetchTunaAccount = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Buscar tenant_id do perfil
            const { data: profile } = await supabase
                .from("profiles")
                .select("tenant_id")
                .eq("id", user.id)
                .single()

            if (profile?.tenant_id) {
                const { data } = await supabase
                    .from("tuna_accounts")
                    .select("*")
                    .eq("tenant_id", profile.tenant_id)
                    .single()

                if (data) {
                    setTunaAccount(data)
                    setToggles({
                        pix: data.pix_enabled || false,
                        card: data.card_enabled || false
                    })
                }
            }
        } catch (error) {
            console.error("Error fetching tuna account:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = () => {
        window.location.href = "/api/tuna/connect"
    }

    const toggleMethod = async (method: "pix" | "card", value: boolean) => {
        if (!tunaAccount) return

        const newToggles = { ...toggles, [method]: value }
        setToggles(newToggles)

        const { error } = await supabase
            .from("tuna_accounts")
            .update({
                [`${method}_enabled`]: value,
                updated_at: new Date().toISOString()
            })
            .eq("id", tunaAccount.id)

        if (error) {
            toast.error("Erro ao atualizar status")
            setToggles(toggles) // rollback
        } else {
            toast.success(`${method.toUpperCase()} ${value ? 'ativado' : 'desativado'}`)
        }
    }

    if (loading) {
        return <div className="h-screen flex items-center justify-center font-black italic uppercase text-rose-500 animate-pulse tracking-widest text-xl">Sincronizando gateways...</div>
    }

    return (
        <div className="space-y-10 pb-24 max-w-6xl mx-auto">
            <PageHeader 
                title="Configurações de" 
                highlight="Pagamento" 
                subtitle="Gerencie suas integrações e métodos de pagamento online"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Tuna Connection Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="md:col-span-2 bg-white rounded-[48px] border border-slate-100 shadow-sm p-10 space-y-8"
                >
                    <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                        <div className="flex items-center gap-6">
                            <div className={cn(
                                "size-16 rounded-[24px] flex items-center justify-center shadow-inner transition-colors",
                                tunaAccount?.connected ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-400"
                            )}>
                                <Trophy size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Tuna Pagamentos</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Gateway de Alta Conversão</p>
                            </div>
                        </div>
                        {tunaAccount?.connected ? (
                            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                                <CheckCircle2 size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Conectado</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                                <AlertCircle size={14} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Desconectado</span>
                            </div>
                        )}
                    </div>

                    {!tunaAccount?.connected ? (
                        <div className="space-y-6">
                            <p className="text-slate-500 font-medium italic">Conecte sua conta Tuna para aceitar PIX e Cartão de Crédito com as melhores taxas do mercado.</p>
                            <Button 
                                onClick={handleConnect}
                                className="h-16 px-10 rounded-[28px] bg-slate-900 text-white font-black uppercase text-xs shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-all active:scale-95 gap-3"
                            >
                                <LinkIcon size={18} /> Conectar com Tuna
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* PIX Toggle */}
                            <div className={cn(
                                "p-8 rounded-[36px] border-2 transition-all flex flex-col gap-6 group relative overflow-hidden",
                                toggles.pix ? "border-rose-500 bg-rose-50/20" : "border-slate-50 bg-slate-50 opacity-60"
                            )}>
                                <div className="flex items-center justify-between">
                                    <QrCode size={32} className={toggles.pix ? "text-rose-500" : "text-slate-400"} />
                                    <Switch 
                                        checked={toggles.pix}
                                        onCheckedChange={(v) => toggleMethod("pix", v)}
                                    />
                                </div>
                                <div>
                                    <h4 className="font-black uppercase italic tracking-tighter text-slate-900 text-lg">PIX Instantâneo</h4>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Liberação imediata do pedido</p>
                                </div>
                            </div>

                            {/* Card Toggle */}
                            <div className={cn(
                                "p-8 rounded-[36px] border-2 transition-all flex flex-col gap-6 group relative overflow-hidden",
                                toggles.card ? "border-indigo-500 bg-indigo-50/20" : "border-slate-50 bg-slate-50 opacity-60"
                            )}>
                                <div className="flex items-center justify-between">
                                    <CreditCard size={32} className={toggles.card ? "text-indigo-500" : "text-slate-400"} />
                                    <Switch 
                                        checked={toggles.card}
                                        onCheckedChange={(v) => toggleMethod("card", v)}
                                    />
                                </div>
                                <div>
                                    <h4 className="font-black uppercase italic tracking-tighter text-slate-900 text-lg">Cartão de Crédito</h4>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Checkout transparente via Tuna</p>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Info Card */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-900 rounded-[48px] p-10 text-white space-y-8 flex flex-col"
                >
                    <div className="size-16 rounded-[24px] bg-white/10 flex items-center justify-center border border-white/10">
                        <Power size={24} className="text-rose-500" />
                    </div>
                    <div className="space-y-4 flex-1">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">Por que a Tuna?</h3>
                        <p className="text-slate-400 text-sm font-bold leading-relaxed italic">
                            A Tuna utiliza roteamento inteligente para garantir a maior taxa de aprovação possível, reduzindo chargebacks e maximizando seu lucro.
                        </p>
                    </div>
                    <Button variant="link" className="text-white font-black uppercase text-[10px] tracking-widest p-0 h-auto justify-start gap-2 hover:text-rose-500 transition-colors">
                        Saber mais sobre taxas <ChevronRight size={14} />
                    </Button>
                </motion.div>
            </div>
        </div>
    )
}
