"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
    Bell, 
    Send, 
    Users, 
    Building2, 
    AlertCircle, 
    CheckCircle2, 
    Info, 
    Home,
    Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function AdminNotificationsPage() {
    const [loading, setLoading] = useState(false)
    const [companies, setCompanies] = useState<any[]>([])
    const [targetType, setTargetType] = useState<'all' | 'company'>('all')
    const [targetCompany, setTargetCompany] = useState('')
    
    const [notification, setNotification] = useState({
        title: "",
        message: "",
        type: "info" as 'info' | 'success' | 'warning' | 'error'
    })

    useEffect(() => {
        fetchCompanies()
    }, [])

    const fetchCompanies = async () => {
        const { data } = await supabase.from('companies').select('id, name')
        if (data) setCompanies(data)
    }

    const handleSendNotification = async () => {
        if (!notification.title || !notification.message) {
            toast.error("Preencha o título e a mensagem")
            return
        }

        setLoading(true)
        try {
            if (targetType === 'all') {
                // Fetch all users to notify
                const { data: profiles } = await supabase.from('profiles').select('id')
                if (profiles) {
                    const notices = profiles.map(p => ({
                        user_id: p.id,
                        title: notification.title,
                        message: notification.message,
                        type: notification.type,
                        read: false
                    }))
                    
                    const { error } = await supabase.from('notifications').insert(notices)
                    if (error) throw error
                }
            } else {
                // Notify specific company users
                const { data: profiles } = await supabase.from('profiles').select('id').eq('company_id', targetCompany)
                if (profiles) {
                    const notices = profiles.map(p => ({
                        user_id: p.id,
                        company_id: targetCompany,
                        title: notification.title,
                        message: notification.message,
                        type: notification.type,
                        read: false
                    }))
                    const { error } = await supabase.from('notifications').insert(notices)
                    if (error) throw error
                }
            }
            
            toast.success("Notificações enviadas com sucesso!")
            setNotification({ title: "", message: "", type: "info" })
        } catch (error: any) {
            toast.error("Erro ao enviar: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Breadcrumb */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/admin" className="flex items-center gap-2">
                                <Home className="size-4" />
                                <span>Painel Admin</span>
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="font-bold text-slate-900">Broadcast Sistema</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Header Area */}
            <div className="space-y-1">
                <div className="flex items-center gap-3 mb-2">
                    <div className="size-2 bg-indigo-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] italic">System Alerts Kernel</span>
                </div>
                <h2 className="text-6xl font-black text-slate-900 italic uppercase tracking-tighter leading-[0.8]">
                    Broadcast <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Global</span>
                </h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">Notificações em Massa // Comunicação Direta</p>
            </div>

            <div className="grid lg:grid-cols-12 gap-12">
                {/* Notification Editor */}
                <Card className="lg:col-span-8 border-none shadow-2xl shadow-slate-200/50 rounded-[48px] bg-white overflow-hidden">
                    <CardHeader className="p-10 pb-0">
                        <CardTitle className="text-2xl font-black italic uppercase italic tracking-tight flex items-center gap-3">
                            <Send className="size-6 text-indigo-500" />
                            Nova Notificação
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8">
                        {/* Target Selection */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Público Alvo</Label>
                                <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                                    <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">TODOS OS USUÁRIOS</SelectItem>
                                        <SelectItem value="company">ESTABELECIMENTO ESPECÍFICO</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {targetType === 'company' && (
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Selecionar Empresa</Label>
                                    <Select value={targetCompany} onValueChange={setTargetCompany}>
                                        <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold">
                                            <SelectValue placeholder="Buscar empresa..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Título da Mensagem</Label>
                                <Input 
                                    value={notification.title}
                                    onChange={e => setNotification({...notification, title: e.target.value})}
                                    placeholder="Ex: Atualização do Sistema Amanhã"
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Conteúdo da Notificação</Label>
                                <Textarea 
                                    value={notification.message}
                                    onChange={e => setNotification({...notification, message: e.target.value})}
                                    placeholder="Descreva detalhadamente o alerta..."
                                    className="min-h-[150px] rounded-3xl border-slate-100 bg-slate-50/50 font-medium p-6"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Tipo de Alerta</Label>
                                <div className="flex flex-wrap gap-4">
                                    {[
                                        { id: 'info', icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
                                        { id: 'success', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                                        { id: 'warning', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
                                        { id: 'error', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setNotification({...notification, type: t.id as any})}
                                            className={cn(
                                                "px-6 py-3 rounded-2xl border-2 transition-all flex items-center gap-3 font-black uppercase tracking-widest text-[10px] italic",
                                                notification.type === t.id ? cn(t.bg, t.color, t.border) : "bg-white border-slate-100 text-slate-400"
                                            )}
                                        >
                                            <t.icon className="size-4" />
                                            {t.id}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button 
                            onClick={handleSendNotification}
                            disabled={loading}
                            className="w-full h-20 rounded-[32px] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase italic tracking-[0.2em] shadow-xl shadow-indigo-200 transition-all flex items-center gap-4"
                        >
                            {loading ? "Processando Terminal..." : "DISPARAR BROADCAST AGORA"}
                            <Send className="size-6" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview & Stats */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[48px] bg-slate-900 text-white overflow-hidden p-10">
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <Bell className="size-6 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Preview UI</span>
                                    <span className="font-black italic uppercase text-lg">Visualização</span>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        {notification.type === 'success' ? <CheckCircle2 className="size-4" /> : <Info className="size-4" />}
                                    </div>
                                    <h4 className="font-black text-xs uppercase italic truncate">
                                        {notification.title || "Título do Alerta"}
                                    </h4>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                    {notification.message || "O conteúdo da sua notificação aparecerá aqui para o usuário final..."}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Usuários Afetados</span>
                                    <span className="font-black italic text-[#FF2F81]">{targetType === 'all' ? 'TODOS' : 'FILTRADO'}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
