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
    Monitor
} from "lucide-react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
import Link from "next/link"
import { cn } from "@/lib/utils"

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
        return <div className="p-8 animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs italic">Carregando configurações...</div>
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Breadcrumb */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <Home className="size-4" />
                                <span>Home</span>
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="font-bold text-slate-900">Configurações</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Page Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                    CONFIGURAÇÕES <span className="text-primary">DO SISTEMA</span>
                </h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                    <Settings className="size-3 text-primary" />
                    Personalize sua experiência na plataforma e defina padrões globais.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Visual Preference */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white/70 backdrop-blur-xl">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-lg font-black uppercase italic tracking-tight flex items-center gap-3">
                            <Monitor className="size-5 text-indigo-500" />
                            Aparência e Tema
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Escolha como você quer ver o sistema</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setTheme("light")}
                                className={cn(
                                    "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                                    theme === "light" ? "border-primary bg-primary/5 text-primary" : "border-slate-50 bg-slate-50 text-slate-400"
                                )}
                            >
                                <Sun className="size-6" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Modo Claro</span>
                            </button>
                            <button 
                                onClick={() => setTheme("dark")}
                                className={cn(
                                    "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                                    theme === "dark" ? "border-primary bg-primary/5 text-primary" : "border-slate-50 bg-slate-50 text-slate-400"
                                )}
                            >
                                <Moon className="size-6" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Modo Escuro</span>
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Localization */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white/70 backdrop-blur-xl">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-lg font-black uppercase italic tracking-tight flex items-center gap-3">
                            <Globe className="size-5 text-blue-500" />
                            Localização e Padrões
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Defina idioma e formato de valores</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Idioma do Sistema</Label>
                                <Select value={formData.language} onValueChange={(v) => setFormData({...formData, language: v})}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50">
                                        <SelectValue placeholder="Selecione o idioma" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="es">Español</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Moeda</Label>
                                    <Select value={formData.currency} onValueChange={(v) => setFormData({...formData, currency: v})}>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50">
                                            <SelectValue placeholder="Moeda" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BRL">Real (R$)</SelectItem>
                                            <SelectItem value="USD">Dollar ($)</SelectItem>
                                            <SelectItem value="EUR">Euro (€)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Fuso Horário</Label>
                                    <Select value={formData.timezone} onValueChange={(v) => setFormData({...formData, timezone: v})}>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50">
                                            <SelectValue placeholder="Fuso" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                                            <SelectItem value="UTC">UTC (Padrão)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Communication */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white/70 backdrop-blur-xl md:col-span-2">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-lg font-black uppercase italic tracking-tight flex items-center gap-3">
                            <Smartphone className="size-5 text-emerald-500" />
                            Comunicação e WhatsApp
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Configurações de integração direta</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">WhatsApp Padrão para Pedidos</Label>
                            <Input 
                                value={formData.whatsapp_default}
                                onChange={(e) => setFormData({...formData, whatsapp_default: e.target.value})}
                                placeholder="(00) 00000-0000"
                                className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold"
                            />
                            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tight ml-4 italic">* Este número será usado por padrão no seu cardápio digital.</p>
                        </div>

                        <div className="pt-6">
                            <Button 
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full h-16 rounded-3xl bg-[#0F172A] hover:bg-slate-900 text-white font-black uppercase italic tracking-[0.2em] shadow-xl transition-all group"
                            >
                                <Save className="size-5 mr-3 group-hover:scale-110 transition-transform" />
                                {saving ? "Salvando..." : "Salvar Configurações Globais"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
