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
    const [data, setData] = useState<any>(null)
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
                setData({})
            } else {
                setData(json)
            }
        } catch (error) {
            toast.error("Erro ao carregar configurações")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (needsMigration) {
            toast.error("A migração SQL ainda não foi aplicada ao banco de dados.")
            return
        }
        
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            
            if (res.ok) {
                toast.success("Configurações salvas com sucesso!")
            } else {
                throw new Error()
            }
        } catch (error) {
            toast.error("Erro ao salvar configurações")
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (field: string, value: any) => {
        setData((prev: any) => ({ ...prev, [field]: value }))
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-slate-400 font-black uppercase italic tracking-widest text-xs">Sincronizando Ecossistema...</p>
            </div>
        )
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">System Core // Config</span>
                    </div>
                    <h2 className="text-6xl font-black text-slate-900 italic uppercase tracking-tighter leading-[0.8]">
                        Configurações <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-400">Globais</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">SaaS Master Control Panel</p>
                </div>

                <Button 
                    onClick={handleSave}
                    disabled={saving || needsMigration}
                    className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black uppercase italic shadow-2xl shadow-slate-900/20 hover:scale-105 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                >
                    <Save className={cn("size-6", saving && "animate-spin")} />
                    {saving ? 'Sincronizando...' : 'Salvar Alterações'}
                </Button>
            </div>

            {needsMigration && (
                <div className="p-8 bg-amber-50 rounded-[40px] border border-amber-200 flex flex-col md:flex-row items-center gap-6 animate-in zoom-in duration-500">
                    <div className="size-16 rounded-2xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
                        <AlertTriangle className="size-8" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h4 className="text-lg font-black text-amber-900 italic uppercase tracking-tight">Migração Necessária</h4>
                        <p className="text-sm text-amber-700 font-medium">A tabela <code className="bg-amber-100 px-2 py-0.5 rounded font-mono">global_settings</code> não foi encontrada no seu banco de dados Supabase.</p>
                        <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-2 italic">Por favor, execute o arquivo <span className="underline">create_global_settings.sql</span> no SQL Editor do seu painel Supabase.</p>
                    </div>
                </div>
            )}

            <Tabs defaultValue="geral" className="space-y-10">
                <div className="overflow-x-auto pb-4 scrollbar-hide">
                    <TabsList className="bg-transparent h-auto p-0 flex gap-2 min-w-max">
                        {[
                            { id: 'geral', label: 'Geral', icon: Globe },
                            { id: 'afiliados', label: 'Afiliados', icon: Users },
                            { id: 'usuarios', label: 'Usuários', icon: UserPlus },
                            { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
                            { id: 'planos', label: 'Planos', icon: Layers },
                            { id: 'notificacoes', label: 'Notificações', icon: Bell },
                            { id: 'seguranca', label: 'Segurança', icon: Shield },
                            { id: 'personalizacao', label: 'Personalização', icon: Palette },
                            { id: 'financeiro', label: 'Financeiro', icon: Coins },
                            { id: 'limites', label: 'Limites', icon: Activity },
                        ].map((tab) => (
                            <TabsTrigger 
                                key={tab.id}
                                value={tab.id}
                                className="h-12 px-6 rounded-xl border-none data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary text-slate-400 font-black uppercase italic text-[10px] tracking-widest transition-all flex items-center gap-2"
                            >
                                <tab.icon className="size-3.5" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm relative overflow-hidden min-h-[500px]">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-slate-100/50 to-transparent" />
                    
                    <AnimatePresence mode="wait">
                        <TabsContent value="geral" className="mt-0 outline-none">
                            <GeneralSettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent value="afiliados" className="mt-0 outline-none">
                            <AffiliateSettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent value="usuarios" className="mt-0 outline-none">
                            <UserSettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent value="pagamentos" className="mt-0 outline-none">
                            <PaymentSettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent value="planos" className="mt-0 outline-none">
                            <PlanSettings />
                        </TabsContent>
                        <TabsContent value="notificacoes" className="mt-0 outline-none">
                            <NotificationSettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent value="seguranca" className="mt-0 outline-none">
                            <SecuritySettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent value="personalizacao" className="mt-0 outline-none">
                            <WhiteLabelSettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent value="financeiro" className="mt-0 outline-none">
                            <FinanceSettings data={data} onChange={handleChange} />
                        </TabsContent>
                        <TabsContent value="limites" className="mt-0 outline-none">
                            <SystemLimits data={data} onChange={handleChange} />
                        </TabsContent>
                    </AnimatePresence>
                </div>
            </Tabs>
        </div>
    )
}

function UserPlus(props: any) {
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" x2="19" y1="8" y2="14" />
            <line x1="22" x2="16" y1="11" y2="11" />
        </svg>
    )
}
