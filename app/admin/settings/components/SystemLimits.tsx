"use client"

import { Activity, Database } from "lucide-react"

interface SystemLimitsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function SystemLimits({ data, onChange }: SystemLimitsProps) {
    const limits = data.system_limits || { max_companies: 1000, max_users: 5000, max_orders: 10000, max_storage_gb: 100 }

    const updateLimit = (key: string, value: number) => {
        onChange('system_limits', { ...limits, [key]: value })
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Activity className="size-3 text-indigo-400" /> Limite de Empresas
                    </label>
                    <input 
                        type="number" 
                        value={limits.max_companies}
                        onChange={(e) => updateLimit('max_companies', Number(e.target.value))}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-xl text-sm font-medium text-white outline-none"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Activity className="size-3 text-indigo-400" /> Limite de Usuários Total
                    </label>
                    <input 
                        type="number" 
                        value={limits.max_users}
                        onChange={(e) => updateLimit('max_users', Number(e.target.value))}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-xl text-sm font-medium text-white outline-none"
                    />
                </div>
            </div>

            <div className="p-6 bg-indigo-600/5 rounded-xl border border-indigo-600/10">
                <div className="flex items-center gap-4 mb-6 text-indigo-400">
                    <Database className="size-5" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest leading-none">Cota de Infraestrutura</h4>
                </div>
                <div className="space-y-4">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Armazenamento (GB)</label>
                        <input 
                            type="number" 
                            value={limits.max_storage_gb}
                            onChange={(e) => updateLimit('max_storage_gb', Number(e.target.value))}
                            className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm font-medium text-white outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
