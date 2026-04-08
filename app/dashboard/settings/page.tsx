"use client"

import { useState, useEffect } from "react"
import { useUserSettings } from "@/hooks/useUserSettings"
import { motion } from "framer-motion"
import { 
    Settings, 
    Globe, 
    Coins, 
    Clock, 
    Smartphone, 
    Save, 
    Home,
    Moon,
    Sun,
    Monitor,
    ShieldCheck
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/dashboard/PageHeader"

export default function SettingsPage() {
    const { settings, loading, updateSettings } = useUserSettings()
    const { theme, setTheme } = useTheme()
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        language: "pt-BR",
        currency: "BRL",
        timezone: "America/Sao_Paulo",
        whatsapp_default: ""
    })

    useEffect(() => {
        if (settings) {
            setFormData({
                language: settings.language || "pt-BR",
                currency: settings.currency || "BRL",
                timezone: settings.timezone || "America/Sao_Paulo",
                whatsapp_default: settings.whatsapp_default || ""
            })
        }
    }, [settings])

    const handleSave = async () => {
        setSaving(true)
        const { error } = await updateSettings(formData)
        if (error) {
            toast.error("Erro ao salvar configurações")
        } else {
            toast.success("Configurações salvas com sucesso!")
        }
        setSaving(false)
    }

    if (loading && !settings) {
        return <div className="h-screen flex items-center justify-center font-black italic uppercase text-rose-500 animate-pulse tracking-widest text-xl">Sincronizando sistema...</div>
    }

    return (
        <div className="space-y-10 pb-24 max-w-6xl mx-auto">
            <PageHeader 
                title="Ajustes do" 
                highlight="Sistema" 
                subtitle="Personalize sua experiência global e defina padrões de localização e interface"
                actions={(
                    <Button 
                        onClick={handleSave}
                        disabled={saving}
                        className="h-11 px-8 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] shadow-lg shadow-slate-900/10 transition-all hover:scale-105 active:scale-95 gap-2"
                    >
                        <Save size={16} /> {saving ? "Salvando..." : "Salvar Globais"}
                    </Button>
                )}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Visual Preference */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[48px] border border-slate-100 shadow-sm p-10 space-y-8">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                        <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-inner"><Monitor size={24} /></div>
                        <div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Aparência</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Tema e Modo de Visualização</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setTheme("light")}
                            className={cn(
                                "p-8 rounded-[32px] border-2 transition-all flex flex-col items-center gap-4 group relative overflow-hidden",
                                theme === "light" ? "border-rose-500 bg-rose-50/20 text-rose-500" : "border-slate-50 bg-slate-50 text-slate-300 hover:border-slate-100 hover:bg-white"
                            )}
                        >
                            <Sun className={cn("size-8", theme === "light" && "animate-spin-slow")} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">MODO CLARO</span>
                        </button>
                        <button 
                            onClick={() => setTheme("dark")}
                            className={cn(
                                "p-8 rounded-[32px] border-2 transition-all flex flex-col items-center gap-4 group relative overflow-hidden",
                                theme === "dark" ? "border-rose-500 bg-rose-50/20 text-rose-500" : "border-slate-50 bg-slate-50 text-slate-300 hover:border-slate-100 hover:bg-white"
                            )}
                        >
                            <Moon className={cn("size-8", theme === "dark" && "animate-pulse")} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">MODO ESCURO</span>
                        </button>
                    </div>
                </motion.div>

                {/* Localization */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[48px] border border-slate-100 shadow-sm p-10 space-y-8">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                        <div className="size-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner"><Globe size={24} /></div>
                        <div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Localização</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Idioma e Padrões Monetários</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-2">Idioma Padrão</Label>
                            <Select value={formData.language} onValueChange={(v) => setFormData({...formData, language: v})}>
                                <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold px-6 shadow-sm">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 italic font-medium shadow-2xl">
                                    <SelectItem value="pt-BR">Português (Brasil) 🇧🇷</SelectItem>
                                    <SelectItem value="en">English (US) 🇺🇸</SelectItem>
                                    <SelectItem value="es">Español 🇪🇸</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-2">Moeda</Label>
                                <Select value={formData.currency} onValueChange={(v) => setFormData({...formData, currency: v})}>
                                    <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold px-6 shadow-sm">
                                        <SelectValue placeholder="Moeda" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl italic font-medium shadow-2xl">
                                        <SelectItem value="BRL">Real (R$)</SelectItem>
                                        <SelectItem value="USD">Dollar ($)</SelectItem>
                                        <SelectItem value="EUR">Euro (€)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-2">Fuso</Label>
                                <Select value={formData.timezone} onValueChange={(v) => setFormData({...formData, timezone: v})}>
                                    <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold px-6 shadow-sm">
                                        <SelectValue placeholder="Fuso" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl italic font-medium shadow-2xl">
                                        <SelectItem value="America/Sao_Paulo">Brasília (BR)</SelectItem>
                                        <SelectItem value="UTC">UTC (Standard)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Communication */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-slate-900 rounded-[56px] p-12 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/40">
                    <div className="absolute top-0 right-0 p-16 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Smartphone size={200} /></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 space-y-6 text-center md:text-left">
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter">Conectividade <span className="text-rose-500">Global</span></h3>
                            <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[10px] max-w-sm">Defina o número mestre para notificações de pedidos via WhatsApp Engine 2.0.</p>
                            <Input 
                                value={formData.whatsapp_default}
                                onChange={(e) => setFormData({...formData, whatsapp_default: e.target.value})}
                                placeholder="(00) 00000-0000"
                                className="h-16 rounded-[28px] border-white/10 bg-white/5 text-white font-black text-xl px-10 placeholder:text-slate-700 focus:ring-rose-500"
                            />
                        </div>
                        <div className="size-48 bg-white/5 rounded-[48px] border border-white/5 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
                            <ShieldCheck size={64} className="text-rose-500 mb-4 animate-bounce" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 text-center italic">API SECURE SYNC</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
