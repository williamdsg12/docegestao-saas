"use client"

import { Coins, Award, History, ShieldCheck, Users } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface AffiliateSettingsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function AffiliateSettings({ data, onChange }: AffiliateSettingsProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between p-6 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Users className="size-5 text-indigo-500" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-xs uppercase tracking-tight">Sistema de Afiliados</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Habilitar rede de parceiros</p>
                    </div>
                </div>
                <Switch 
                    checked={data.affiliate_system_enabled || false}
                    onCheckedChange={(checked) => onChange('affiliate_system_enabled', checked)}
                />
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8 transition-opacity duration-500", !data.affiliate_system_enabled && "opacity-40 pointer-events-none")}>
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Coins className="size-3 text-indigo-400" /> Comissão Padrão (%)
                    </label>
                    <input 
                        type="number" 
                        value={data.affiliate_commission_percent || 0}
                        onChange={(e) => onChange('affiliate_commission_percent', Number(e.target.value))}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm font-bold text-white outline-none"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Award className="size-3 text-indigo-400" /> Regra de Atribuição
                    </label>
                    <select 
                        value={data.affiliate_commission_type || "first_sale"}
                        onChange={(e) => onChange('affiliate_commission_type', e.target.value)}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm font-bold text-white outline-none appearance-none"
                    >
                        <option value="first_sale">Primeira Venda (First Click)</option>
                        <option value="last_sale">Última Venda (Last Click)</option>
                        <option value="recurring">Recorrente (Life-time)</option>
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <History className="size-3 text-indigo-400" /> Duração do Cookie (Dias)
                    </label>
                    <input 
                        type="number" 
                        value={data.affiliate_cookie_duration_days || 30}
                        onChange={(e) => onChange('affiliate_cookie_duration_days', Number(e.target.value))}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm font-bold text-white outline-none"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <ShieldCheck className="size-3 text-indigo-400" /> Saque Mínimo (R$)
                    </label>
                    <input 
                        type="number" 
                        value={data.affiliate_min_payout || 100}
                        onChange={(e) => onChange('affiliate_min_payout', Number(e.target.value))}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm font-bold text-white outline-none"
                    />
                </div>
            </div>
        </div>
    )
}
