"use client"

import { Database, Users, ShoppingCart, HardDrive, Info } from "lucide-react"

interface SystemLimitsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function SystemLimits({ data, onChange }: SystemLimitsProps) {
    const limits = data.system_limits || {
        max_companies: 1000,
        max_users: 5000,
        max_orders: 10000,
        max_storage_gb: 100
    }

    const handleLimitChange = (key: string, value: number) => {
        const newLimits = { ...limits }
        newLimits[key] = value
        onChange('system_limits', newLimits)
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Database className="size-3" /> Limite Global de Empresas
                    </label>
                    <input 
                        type="number" 
                        value={limits.max_companies}
                        onChange={(e) => handleLimitChange('max_companies', Number(e.target.value))}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Users className="size-3" /> Limite Global de Usuários
                    </label>
                    <input 
                        type="number" 
                        value={limits.max_users}
                        onChange={(e) => handleLimitChange('max_users', Number(e.target.value))}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <ShoppingCart className="size-3" /> Limite Global de Pedidos (Mensal)
                    </label>
                    <input 
                        type="number" 
                        value={limits.max_orders}
                        onChange={(e) => handleLimitChange('max_orders', Number(e.target.value))}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <HardDrive className="size-3" /> Armazenamento Total (GB)
                    </label>
                    <input 
                        type="number" 
                        value={limits.max_storage_gb}
                        onChange={(e) => handleLimitChange('max_storage_gb', Number(e.target.value))}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl flex gap-4">
                <Info className="size-6 text-indigo-600 shrink-0" />
                <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                    Estes limites referem-se à capacidade total da infraestrutura SaaS. O sistema monitora estes valores e enviará alertas quando o uso atingir 80% da capacidade global definida.
                </p>
            </div>
        </div>
    )
}
