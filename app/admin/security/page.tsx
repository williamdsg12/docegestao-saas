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
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter flex items-center gap-4">
                        Sistema <span className="text-rose-500">Anti-Fraude</span>
                    </h2>
                    <p className="text-slate-500 font-medium">Monitoramento de riscos, abusos e proteção do SaaS</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 font-black uppercase italic text-xs tracking-widest gap-2 bg-white">
                        <Filter className="size-5" /> Relatório de Risco
                    </Button>
                </div>
            </div>

            {/* Security KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center gap-6"
                    >
                        <div className={cn("size-16 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                            <stat.icon className="size-8" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">{stat.value}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Active Threats */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
                        <AlertTriangle className="size-6" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-900 italic uppercase">Alerta de Ameaças</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Incidentes detectados pela inteligência artificial</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/50">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risco</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alvo Detectado</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnóstico (Motivo)</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação Rápida</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
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
                                            className={cn("hover:bg-slate-50/50 transition-colors group", alert.status === 'resolved' && "opacity-50")}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("size-12 rounded-2xl flex items-center justify-center shadow-inner", getSeverityColor(alert.severity))}>
                                                        {getTypeIcon(alert.type)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 italic uppercase tracking-tighter leading-none mb-1 text-sm bg-rose-100 w-fit px-2 py-1 rounded-md text-rose-700">
                                                            Nível {alert.severity}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                                                            {new Date(alert.date).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="font-bold text-slate-700 text-sm tracking-tight">{alert.target}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs text-slate-500 font-medium max-w-sm">
                                                    {alert.description}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {alert.status === 'pending' ? (
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button title="Bloquear IP / Usuário" className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-xl shadow-slate-900/20">
                                                            <Ban className="size-4" />
                                                        </button>
                                                        <button title="Investigar" className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                            <Eye className="size-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic flex items-center justify-end gap-1">
                                                        <ShieldCheck className="size-3" /> Mitigado
                                                    </span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="size-20 rounded-[32px] bg-emerald-50 flex items-center justify-center text-emerald-500">
                                                    <ShieldCheck className="size-10" />
                                                </div>
                                                <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs italic">Nenhuma ameaça ativa no momento</p>
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
