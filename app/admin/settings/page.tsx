"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Save, 
    Settings as SettingsIcon, 
    Users, 
    CreditCard, 
    Layers, 
    Bell, 
    Shield, 
    Palette, 
    Coins, 
    Globe, 
    Activity,
    AlertTriangle,
    Database
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Components
import GeneralSettings from "./components/GeneralSettings"
import AffiliateSettings from "./components/AffiliateSettings"
import UserSettings from "./components/UserSettings"
import PaymentSettings from "./components/PaymentSettings"
import PlanSettings from "./components/PlanSettings"
import NotificationSettings from "./components/NotificationSettings"
import SecuritySettings from "./components/SecuritySettings"
import WhiteLabelSettings from "./components/WhiteLabelSettings"
import FinanceSettings from "./components/FinanceSettings"
import SystemLimits from "./components/SystemLimits"

export default function AdminSettings() {
    const [data, setData] = useState<any>({
        site_name: 'Doce Gestão',
        site_url: '',
        environment: 'production',
        maintenance_mode: false,
        affiliate_system_enabled: false,
        affiliate_commission_percent: 10,
        currency_default: 'BRL',
        notification_email_enabled: true,
        notification_sms_enabled: false,
        system_limits: { max_companies: 1000, max_users: 5000, max_orders: 10000, max_storage_gb: 100 }
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [needsMigration, setNeedsMigration] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        try {
            const res = await fetch('/api/admin/settings')
            const json = await res.json()
            
            if (json.needs_migration) {
                setNeedsMigration(true)
            } else if (json && json.id) {
                setData(json)
            }
        } catch (error) {
            toast.error("Erro ao sincronizar configurações")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            
            if (res.ok) {
                toast.success("Módulo de controle sincronizado!")
            } else {
                throw new Error()
            }
        } catch (error) {
            toast.error("Erro ao persistir dados")
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (field: string, value: any) => {
        setData((prev: any) => ({ ...prev, [field]: value }))
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="size-14 border-4 border-white/[0.05] border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] animate-pulse">Sincronizando Core...</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                        Configurações <span className="text-indigo-400">Globais</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">Painel de Controle Principal do Ecossistema SaaS.</p>
                </div>

                <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="h-11 px-8 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    <Save className={cn("size-4", saving && "animate-spin")} />
                    {saving ? 'Sincronizando...' : 'Salvar Alterações'}
                </Button>
            </div>

            {needsMigration && (
                <div className="p-8 bg-[#09090b] rounded-xl border border-amber-500/20 flex flex-col md:flex-row items-center gap-6">
                    <div className="size-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                        <AlertTriangle className="size-6" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">Migração Necessária</h4>
                        <p className="text-xs text-slate-500 mt-1">A tabela <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-amber-500">global_settings</code> precisa ser inicializada no banco de dados.</p>
                    </div>
                </div>
            )}

            <Tabs defaultValue="geral" className="space-y-10">
                <div className="overflow-x-auto pb-4 scrollbar-hide">
                    <TabsList className="bg-transparent h-auto p-0 flex gap-2 min-w-max">
                        {[
                            { id: 'geral', label: 'Geral', icon: Globe },
                            { id: 'afiliados', label: 'Afiliados', icon: Users },
                            { id: 'usuarios', label: 'Usuários', icon: UserCircle },
                            { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
                            { id: 'planos', label: 'Planos', icon: Layers },
                            { id: 'notificacoes', label: 'Notificações', icon: Bell },
                            { id: 'seguranca', label: 'Segurança', icon: Shield },
                            { id: 'personalizacao', label: 'Alpha Branding', icon: Palette },
                            { id: 'financeiro', label: 'Financeiro', icon: Coins },
                            { id: 'limites', label: 'Ecossistema', icon: Activity },
                        ].map((tab) => (
                            <TabsTrigger 
                                key={tab.id}
                                value={tab.id}
                                className="h-11 px-6 rounded-lg border border-white/[0.03] bg-white/[0.02] data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-500 font-bold uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 hover:bg-white/[0.05]"
                            >
                                <tab.icon className="size-3.5" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="bg-[#09090b] rounded-xl p-8 lg:p-12 border border-white/[0.05] shadow-sm relative overflow-hidden min-h-[600px]">
                    <AnimatePresence mode="wait">
                        <TabsContent key="geral" value="geral" className="mt-0 outline-none">
                            <GeneralSettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent key="afiliados" value="afiliados" className="mt-0 outline-none">
                            <AffiliateSettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent key="usuarios" value="usuarios" className="mt-0 outline-none">
                            <UserSettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent key="pagamentos" value="pagamentos" className="mt-0 outline-none">
                            <PaymentSettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent key="planos" value="planos" className="mt-0 outline-none">
                            <PlanSettings />
                        </TabsContent>
                        <TabsContent key="notificacoes" value="notificacoes" className="mt-0 outline-none">
                            <NotificationSettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent key="seguranca" value="seguranca" className="mt-0 outline-none">
                            <SecuritySettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent key="personalizacao" value="personalizacao" className="mt-0 outline-none">
                            <WhiteLabelSettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent key="financeiro" value="financeiro" className="mt-0 outline-none">
                            <FinanceSettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent key="limites" value="limites" className="mt-0 outline-none">
                            <SystemLimits data={data} onChange={handleChange} />
                        </TabsContent>
                    </AnimatePresence>
                </div>
            </Tabs>
        </div>
    )
}

function UserCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="10" r="3" />
            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
        </svg>
    )
}
