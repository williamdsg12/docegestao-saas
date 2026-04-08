"use client"

import { Coins, Percent, Landmark, BarChart3 } from "lucide-react"

interface FinanceSettingsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function FinanceSettings({ data, onChange }: FinanceSettingsProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Currency */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Coins className="size-3" /> Moeda Padrão do Sistema
                    </label>
                    <select 
                        value={data.currency_default || "BRL"}
                        onChange={(e) => onChange('currency_default', e.target.value)}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none"
                    >
                        <option value="BRL">Real Brasileiro (R$)</option>
                        <option value="USD">Dólar Americano (US$)</option>
                        <option value="EUR">Euro (€)</option>
                    </select>
                </div>

                {/* Platform Fee */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Percent className="size-3" /> Taxa de Plataforma (%)
                    </label>
                    <input 
                        type="number" 
                        value={data.platform_fee_percent || ""}
                        onChange={(e) => onChange('platform_fee_percent', Number(e.target.value))}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        placeholder="Ex: 5"
                    />
                </div>
            </div>

            <div className="p-10 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[40px] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <BarChart3 className="size-48" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <Landmark className="size-8 text-indigo-200" />
                        <h4 className="text-xl font-black italic uppercase tracking-tighter">Controle de <span className="text-indigo-200">Faturamento</span></h4>
                    </div>
                    <p className="text-indigo-100/70 text-sm mb-8 leading-relaxed max-w-xl">
                        A taxa de plataforma é aplicada sobre o valor bruto de cada transação processada. Este valor é retido como receita da operação SaaS e pode ser visualizado em tempo real no dashboard financeiro global.
                    </p>
                    <div className="flex gap-4">
                        <div className="px-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                            <span className="block text-[8px] text-indigo-300 uppercase font-black tracking-widest mb-1">Taxa Atual</span>
                            <span className="text-xl font-black italic">{data.platform_fee_percent || 0}%</span>
                        </div>
                        <div className="px-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                            <span className="block text-[8px] text-indigo-300 uppercase font-black tracking-widest mb-1">Moeda Ativa</span>
                            <span className="text-xl font-black italic">{data.currency_default || 'BRL'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
