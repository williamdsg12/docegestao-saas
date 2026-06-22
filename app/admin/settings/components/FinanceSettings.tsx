"use client"

import { Coins, TrendingUp, Receipt, Database } from "lucide-react"

interface FinanceSettingsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function FinanceSettings({ data, onChange }: FinanceSettingsProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Coins className="size-3 text-indigo-400" /> Moeda de Liquidação
                    </label>
                    <select 
                        value={data.currency_default || "BRL"}
                        onChange={(e) => onChange('currency_default', e.target.value)}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-xl text-sm font-medium text-white appearance-none outline-none"
                    >
                        <option value="BRL">Real Brasileiro (BRL)</option>
                        <option value="USD">Dólar Americano (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <TrendingUp className="size-3 text-indigo-400" /> Taxa da Plataforma (%)
                    </label>
                    <input 
                        type="number" 
                        value={data.platform_fee_percent || 0}
                        onChange={(e) => onChange('platform_fee_percent', Number(e.target.value))}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-xl text-sm font-medium text-white outline-none"
                    />
                </div>
            </div>

            <div className="p-6 bg-indigo-600/5 rounded-xl border border-indigo-600/10">
                <div className="flex items-center gap-4 mb-6">
                    <Receipt className="size-5 text-indigo-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest leading-none">Políticas de Faturamento</h4>
                </div>
                <div className="space-y-4">
                    <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-lg">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Regras de Impostos</p>
                        <textarea 
                            value={data.finance_invoice_rules || ""}
                            onChange={(e) => onChange('finance_invoice_rules', e.target.value)}
                            className="w-full bg-transparent border-none text-[11px] text-slate-400 placeholder-slate-700 outline-none resize-none h-20" 
                            placeholder="Descreva as retenções automáticas e regras de cobrança..."
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
