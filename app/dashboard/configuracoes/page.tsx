"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useStoreSettings } from "@/hooks/useStoreSettings"
import { motion } from "framer-motion"
import { Save, RotateCw, Sparkles, ShieldCheck, Store } from "lucide-react"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { GeneralSection } from "@/components/dashboard/settings/GeneralSection"
import { ScheduleSection } from "@/components/dashboard/settings/ScheduleSection"
import { StoreStatus } from "@/components/dashboard/settings/StoreStatus"
import { DeliverySection } from "@/components/dashboard/settings/DeliverySection"
import { PaymentSection } from "@/components/dashboard/settings/PaymentSection"
import { NotificationSection } from "@/components/dashboard/settings/NotificationSection"
import { IntegrationSection } from "@/components/dashboard/settings/IntegrationSection"
import { LoadingScreen } from "@/components/ui/LoadingScreen"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
    const { profile } = useAuth()
    const { settings, loading, updateSettings } = useStoreSettings()
    const [isSaving, setIsSaving] = useState(false)
    const [localData, setLocalData] = useState<any>(null)

    useEffect(() => {
        if (settings) {
            setLocalData(settings)
        }
    }, [settings])

    const handleLocalChange = (updates: any) => {
        setLocalData((prev: any) => ({ ...prev, ...updates }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const { success } = await updateSettings(localData)
            if (success) {
                toast.success("Cérebro da Loja atualizado com sucesso! 🧠🔥")
            }
        } finally {
            setIsSaving(false)
        }
    }

    if (loading || !localData) return <LoadingScreen />

    return (
        <div className="space-y-10 pb-24 max-w-7xl mx-auto">
            <PageHeader 
                title="Configurações da" 
                highlight="Loja" 
                subtitle="O centro de controle total da sua operação. Configure horários, entregas e pagamentos em um só lugar."
                actions={(
                    <Button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-10 px-8 rounded-lg bg-slate-900 text-white font-medium text-sm transition-all active:scale-95 gap-2"
                    >
                        {isSaving ? <RotateCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                        {isSaving ? "Salvando..." : "Salvar Configurações"}
                    </Button>
                )}
            />

            <div className="grid lg:grid-cols-[1fr_320px] gap-8">
                {/* Left Column: Form Sections (Main Content) */}
                <div className="space-y-8">
                    <GeneralSection data={localData} onChange={handleLocalChange} />
                    <ScheduleSection data={localData} onChange={handleLocalChange} />
                    <StoreStatus data={localData} onChange={handleLocalChange} />
                    <DeliverySection data={localData} onChange={handleLocalChange} />
                    <PaymentSection data={localData} onChange={handleLocalChange} />
                    <NotificationSection data={localData} onChange={handleLocalChange} />
                    <IntegrationSection data={localData} onChange={handleLocalChange} />
                </div>

                {/* Right Column: Live Preview & System Info (Sidebar Card) */}
                <div className="space-y-8 h-fit lg:sticky lg:top-8">
                    {/* Live Preview Card */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 p-6">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse">
                                <div className="size-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Live Preview</span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="size-20 rounded-2xl overflow-hidden border-4 border-slate-50 shadow-md bg-slate-50 flex items-center justify-center">
                                    {localData.logo_url ? (
                                        <img src={localData.logo_url} className="size-full object-cover" alt="Preview Logo" />
                                    ) : (
                                        <Store size={32} className="text-slate-300" />
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="text-lg font-bold text-slate-900 leading-tight">
                                        {localData.name || "Sua Loja"}
                                    </h4>
                                    <p className="text-[11px] font-medium text-slate-400">
                                        {localData.instagram ? `@${localData.instagram}` : "Sem instagram"}
                                    </p>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100" />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500 font-medium">Status da Operação</span>
                                    {(() => {
                                        const { getStoreStatus } = require("@/lib/storeStatus")
                                        const status = getStoreStatus(localData)
                                        return (
                                            <div className={cn(
                                                "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                                                status.isOpen ? "bg-emerald-100 text-emerald-600" : (status.isPaused ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600")
                                            )}>
                                                {status.message}
                                            </div>
                                        )
                                    })()}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500 font-medium">Controle</span>
                                    <span className="text-[10px] font-bold text-slate-900 uppercase">
                                        {localData.is_manual_override ? `Manual (${localData.manual_status})` : "Automático"}
                                    </span>
                                </div>
                            </div>

                            <Button 
                                className="w-full h-10 rounded-lg font-bold text-xs"
                                style={{ backgroundColor: localData.primary_color || "#FF2F81", color: '#fff' }}
                            >
                                <Sparkles size={14} className="mr-2" /> Confirmar Pedido
                            </Button>
                        </div>
                    </motion.div>

                    {/* System Badge */}
                    <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4">
                         <div className="flex items-center gap-2">
                            <ShieldCheck className="size-5 text-blue-400" />
                            <span className="font-bold tracking-tight text-xs uppercase">Operação Ativa</span>
                         </div>
                         <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Suas configurações são sincronizadas em tempo real com o aplicativo do cliente e painel de pedidos.
                         </p>
                         <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase">
                            <span>Tenant ID</span>
                            <span className="select-all opacity-50">{profile?.tenant_id || profile?.company_id || "..."}</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
