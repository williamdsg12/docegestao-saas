"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Activity,
    Search,
    UserCircle,
    Building2,
    Calendar,
    Clock,
    Terminal,
    SearchX,
    Filter,
    ArrowUpRight,
    RefreshCw,
    Database
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface SystemLog {
    id: string
    user_name: string
    company_name: string
    action: string
    entity: string
    description: string
    created_at: string
}

export default function LogsManagement() {
    const [logs, setLogs] = useState<SystemLog[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchLogs()
    }, [])

    async function fetchLogs() {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/logs')
            if (!response.ok) throw new Error('API Error')
            const data = await response.json()

            if (!data || data.length === 0) {
                setLogs([])
                return
            }

            const formatted: SystemLog[] = data.map((l: any) => ({
                id: l.id,
                user_name: l.profiles?.owner_name || 'Sistema',
                company_name: l.companies?.name || 'Vários',
                action: l.action,
                entity: l.entity,
                description: l.description,
                created_at: l.created_at
            }))

            setLogs(formatted)
        } catch (error: any) {
            console.error("error fetching logs:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredLogs = logs.filter(l => 
        l.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.entity.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getActionStyle = (action: string) => {
        if (action.includes('CREATED') || action.includes('SUCCESS')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        if (action.includes('UPDATE')) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
        if (action.includes('DELETE') || action.includes('FAIL')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    }

    return (
        <div className="space-y-12 pb-24 relative overflow-hidden">
            {/* Background Grain/Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] invert" />
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10 px-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="size-2 bg-rose-500 rounded-full animate-ping" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] italic">System Audit Pulse</span>
                    </div>
                    <h2 className="text-7xl font-black text-slate-900 italic uppercase tracking-tighter leading-[0.8]">
                        Logs de <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 underline decoration-indigo-500/30">Sistema</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] italic">Forensic Traceability // Administrative Oversight</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex flex-col text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Trace Log</p>
                        <p className="text-xs font-black text-indigo-600 italic mt-1 uppercase">● LIVE_FEED ACTIVE</p>
                    </div>
                    <Button 
                        variant="outline"
                        onClick={fetchLogs}
                        className="h-14 px-8 rounded-full border-slate-200 bg-white/50 backdrop-blur-xl font-black uppercase italic text-[10px] tracking-[0.2em] gap-3 shadow-xl hover:shadow-indigo-500/10 transition-all hover:-translate-y-1"
                    >
                        <RefreshCw className={cn("size-5", loading && "animate-spin")} /> 
                        Refresh Kernels
                    </Button>
                </div>
            </div>

            {/* Forensic Search Engine */}
            <div className="px-6 relative z-10">
                <div className="relative group max-w-4xl">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 size-6 text-slate-300 group-focus-within:text-indigo-500 transition-all duration-500" />
                    <input
                        type="text"
                        placeholder="EXECUTE FORENSIC SCAN (USER, ACTION, ENTITY)..."
                        className="w-full h-20 pl-20 pr-8 bg-white border border-slate-100 rounded-[32px] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/5 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-200 italic"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Audit Ledger */}
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 glass-card rounded-[60px] border border-white/60 shadow-2xl overflow-hidden bg-white/40 backdrop-blur-2xl relative"
            >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30" />
                
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/[0.02]">
                                <th className="px-12 py-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Origin / Timestamp</th>
                                <th className="px-12 py-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Operation / Sector</th>
                                <th className="px-12 py-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Payload Describer</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={3} className="px-12 py-10"><div className="h-12 bg-slate-100 rounded-[20px] w-full" /></td>
                                        </tr>
                                    ))
                                ) : filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={log.id}
                                            className="hover:bg-indigo-500/[0.04] transition-all group relative border-l-4 border-transparent hover:border-indigo-500"
                                        >
                                            <td className="px-12 py-10 align-top">
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-900/20 group-hover:scale-110 transition-all duration-500 shrink-0">
                                                            <UserCircle className="size-5" />
                                                        </div>
                                                        <span className="font-black text-slate-900 italic uppercase tracking-tighter text-lg leading-tight">{log.user_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 pl-13">
                                                        <div className="w-[1px] h-4 bg-slate-100" />
                                                        <Clock className="size-4 text-slate-300" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic pt-0.5">
                                                            {new Date(log.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 align-top">
                                                <div className="flex flex-col gap-4">
                                                    <span className={cn(
                                                        "inline-flex w-fit px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.3em] italic border transition-all duration-500 shadow-xl",
                                                        getActionStyle(log.action)
                                                    )}>
                                                        {log.action}
                                                    </span>
                                                    <div className="flex items-center gap-3 opacity-60">
                                                        <Database className="size-4 text-slate-400" />
                                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] italic underline decoration-slate-200 decoration-2 underline-offset-4">
                                                            {log.entity}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10">
                                                <div className="p-8 rounded-[32px] bg-slate-900 border border-slate-800 shadow-3xl text-slate-400 relative overflow-hidden group-hover:bg-slate-950 transition-all duration-700">
                                                    {/* Console aesthetic */}
                                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                                        <Terminal className="size-20" />
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <span className="text-indigo-500 font-black select-none tracking-widest shrink-0 mt-1">PROMPT_&gt;</span>
                                                        <p className="text-xs font-bold leading-relaxed tracking-wider font-mono">
                                                            {log.description}
                                                        </p>
                                                    </div>
                                                    <div className="mt-6 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="size-3 text-slate-500" />
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                                                                Network: {log.company_name}
                                                            </span>
                                                        </div>
                                                        <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 opacity-40">
                                                <div className="size-32 rounded-[48px] bg-white border border-slate-100 flex items-center justify-center text-slate-100 shadow-inner">
                                                    <SearchX className="size-16" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-slate-900 font-black uppercase tracking-[0.3em] text-sm italic">Omit Silence - No Data</p>
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">The auditory core returned no records for this query vector</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Audit Footer Insight */}
                <div className="px-12 py-12 border-t border-slate-100/50 flex flex-col sm:flex-row items-center justify-between bg-white/60 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.3em] italic text-slate-400 gap-8">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="size-3 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            Security Integrity Active
                        </div>
                        <div className="w-[1px] h-4 bg-slate-200" />
                        Platform Auditor V4.2
                    </div>
                    <div className="flex items-center gap-8">
                        <span className="text-slate-900 border-b-2 border-slate-900 pb-1 cursor-not-allowed opacity-30">Archive Deep Scan</span>
                        <span className="text-indigo-600 border-b-2 border-indigo-600 pb-1 cursor-pointer hover:text-indigo-700 transition-colors">Generate Compliance PDF</span>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
