"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ShieldCheck,
    ShieldAlert,
    AlertTriangle,
    Eye,
    Ban,
    Globe,
    Users,
    Activity,
    Lock,
    SearchX,
    Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SecurityAlert {
    id: string
    type: 'multiple_accounts' | 'suspicious_ip' | 'brute_force' | 'spam'
    severity: 'high' | 'medium' | 'low'
    target: string
    description: string
    date: string
    status: 'pending' | 'resolved'
}

export default function SecurityManagement() {
    const [alerts, setAlerts] = useState<SecurityAlert[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simulando fetch da API de Anti-Fraude
        setTimeout(() => {
            setAlerts([
                { id: '1', type: 'multiple_accounts', severity: 'high', target: 'williamdev36@gmail.com', description: '6 contas criadas com o mesmo dispositivo (Fingerprint ID: 8XF92V).', date: new Date().toISOString(), status: 'pending' },
                { id: '2', type: 'suspicious_ip', severity: 'medium', target: 'IP: 189.122.45.67', description: 'Tentativas de acesso de geolocalização incomum (Rússia) na conta Doces da Maria.', date: new Date(Date.now() - 3600000).toISOString(), status: 'pending' },
                { id: '3', type: 'brute_force', severity: 'high', target: 'Empresa: Bolo Master', description: 'Mais de 50 tentativas de login falhas nos últimos 10 minutos.', date: new Date(Date.now() - 7200000).toISOString(), status: 'resolved' },
            ])
            setLoading(false)
        }, 800)
    }, [])

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'bg-rose-50 text-rose-600 border-rose-100'
            case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100'
            case 'low': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
            default: return 'bg-slate-50 text-slate-400'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'multiple_accounts': return <Users className="size-5" />
            case 'suspicious_ip': return <Globe className="size-5" />
            case 'brute_force': return <Lock className="size-5" />
            default: return <ShieldAlert className="size-5" />
        }
    }

    const stats = [
        { label: "IPs Bloqueados", value: "142", icon: Ban, color: "text-rose-500", bg: "bg-rose-50" },
        { label: "Tentativas Falhas M/M", value: "3.4k", icon: Activity, color: "text-amber-500", bg: "bg-amber-50" },
        { label: "Contas Verificadas", value: "99.8%", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-50" }
    ]

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                        Sistema <span className="text-rose-500">Anti-Fraude</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">Monitoramento de riscos, abusos e proteção integrada do ecossistema.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-11 px-6 rounded-xl border-white/[0.05] bg-white/[0.02] text-xs font-semibold text-slate-400 hover:text-white transition-all flex items-center gap-2">
                        <Filter className="size-4" /> Relatório de Risco
                    </Button>
                </div>
            </div>

            {/* Security KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx} 
                        className="bg-[#09090b] border border-white/[0.05] p-6 rounded-xl shadow-sm flex items-center gap-6"
                    >
                        <div className={cn("size-12 rounded-lg flex items-center justify-center bg-white/[0.03] border border-white/[0.05]", stat.color)}>
                            <stat.icon className="size-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Active Threats */}
            <div className="bg-[#09090b] border border-white/[0.05] rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-white/[0.05] flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                        <AlertTriangle className="size-5" />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-white tracking-tight">Alerta de Ameaças</h4>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Incidentes detectados pela inteligência artificial</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risco / Nível</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alvo Detectado</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Diagnóstico (Motivo)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y border-white/[0.05]">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={4} className="px-8 py-8"><div className="h-12 bg-slate-50 rounded-2xl w-full" /></td>
                                        </tr>
                                    ))
                                ) : alerts.length > 0 ? (
                                    alerts.map((alert) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={alert.id}
                                            className={cn("hover:bg-white/[0.02] transition-colors group", alert.status === 'resolved' && "opacity-40")}
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("size-10 rounded-lg flex items-center justify-center border border-current/10", alert.severity === 'high' ? 'bg-rose-500/10 text-rose-500' : alert.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500')}>
                                                        {getTypeIcon(alert.type)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white text-xs tracking-tight leading-none mb-1">
                                                            {alert.type.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                                                            {new Date(alert.date).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-semibold text-slate-300 text-sm tracking-tight">{alert.target}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-xs text-slate-500 font-medium max-w-sm truncate">
                                                    {alert.description}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                {alert.status === 'pending' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button title="Bloquear" className="p-2.5 rounded-lg bg-black text-rose-500 border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all">
                                                            <Ban className="size-3.5" />
                                                        </button>
                                                        <button title="Investigar" className="p-2.5 rounded-lg bg-black text-indigo-400 border border-white/[0.05] hover:bg-indigo-500 hover:text-white transition-all">
                                                            <Eye className="size-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em] flex items-center justify-end gap-1.5 px-3 py-1 bg-emerald-500/5 rounded-full border border-emerald-500/10 h-8">
                                                        <ShieldCheck className="size-3" /> Mitigado
                                                    </span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="size-16 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                                                    <ShieldCheck className="size-8" />
                                                </div>
                                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Proteção ativa e estável</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
