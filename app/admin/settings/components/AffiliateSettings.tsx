"use client"

import { Percent, Target, Clock, Wallet } from "lucide-react"

interface AffiliateSettingsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function AffiliateSettings({ data, onChange }: AffiliateSettingsProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Percent className="size-3" /> Comissão Padrão (%)
                    </label>
                    <input 
                        type="number" 
                        value={data.affiliate_commission_percent || ""}
                        onChange={(e) => onChange('affiliate_commission_percent', Number(e.target.value))}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        placeholder="Ex: 10"
                    />
                </div>
                
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Target className="size-3" /> Tipo de Comissão
                    </label>
                    <select 
                        value={data.affiliate_commission_type || "first_sale"}
                        onChange={(e) => onChange('affiliate_commission_type', e.target.value)}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none"
                    >
                        <option value="first_sale">Primeira Venda Apenas</option>
                        <option value="recurring">Recorrente (Sempre que renovar)</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Clock className="size-3" /> Duração do Cookie (Dias)
                    </label>
                    <input 
                        type="number" 
                        value={data.affiliate_cookie_duration_days || ""}
                        onChange={(e) => onChange('affiliate_cookie_duration_days', Number(e.target.value))}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        placeholder="Ex: 30"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Wallet className="size-3" /> Valor Mínimo de Saque (R$)
                    </label>
                    <input 
                        type="number" 
                        value={data.affiliate_min_payout || ""}
                        onChange={(e) => onChange('affiliate_min_payout', Number(e.target.value))}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        placeholder="Ex: 100"
                    />
                </div>
            </div>
            
            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100/50">
                <p className="text-amber-800 text-xs font-bold leading-relaxed">
                    <span className="font-black italic uppercase mr-2 text-[10px] tracking-widest border-b border-amber-100 pb-1 mb-2 block">Nota do Sistema</span>
                    Estas configurações são globais e afetam todos os novos afiliados cadastrados. Alterações na comissão recorrente impactarão pagamentos futuros de assinaturas já ativas.
                </p>
            </div>
        </div>
    )
}
