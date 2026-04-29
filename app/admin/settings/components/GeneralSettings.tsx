"use client"

import { Globe, Link2, Server, Power, AlertCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface GeneralSettingsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function GeneralSettings({ data, onChange }: GeneralSettingsProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Globe className="size-3 text-indigo-400" /> Nome do Sistema
                    </label>
                    <input 
                        type="text" 
                        value={data.site_name || ""}
                        onChange={(e) => onChange('site_name', e.target.value)}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm font-medium text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all outline-none"
                        placeholder="Ex: Doce Gestão"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Link2 className="size-3 text-indigo-400" /> URL da Plataforma
                    </label>
                    <input 
                        type="text" 
                        value={data.site_url || ""}
                        onChange={(e) => onChange('site_url', e.target.value)}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[11px] font-mono text-slate-300 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                        placeholder="Ex: app.docegestao.com"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Server className="size-3 text-indigo-400" /> Ambiente
                    </label>
                    <select 
                        value={data.environment || "production"}
                        onChange={(e) => onChange('environment', e.target.value)}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm font-medium text-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none appearance-none"
                    >
                        <option value="production">Produção (Live)</option>
                        <option value="staging">Staging (Simulação)</option>
                    </select>
                </div>

                <div className="flex items-center justify-between p-5 bg-rose-500/5 rounded-xl border border-rose-500/10">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                            <Power className="size-5 text-rose-500" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-xs uppercase tracking-tight">Manutenção</p>
                            <p className="text-[9px] text-rose-500/70 font-semibold uppercase tracking-widest">Bloquear acesso público</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.maintenance_mode || false}
                        onCheckedChange={(checked) => onChange('maintenance_mode', checked)}
                        className="data-[state=checked]:bg-rose-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/[0.05]">
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Idioma Padrão</label>
                    <select 
                        value={data.site_language || "pt-BR"}
                        onChange={(e) => onChange('site_language', e.target.value)}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm font-medium text-white appearance-none"
                    >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en">English (US)</option>
                        <option value="es">Español</option>
                    </select>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fuso Horário (Timezone)</label>
                    <select 
                        value={data.site_timezone || "America/Sao_Paulo"}
                        onChange={(e) => onChange('site_timezone', e.target.value)}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm font-medium text-white appearance-none"
                    >
                        <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                        <option value="UTC">UTC (Universal)</option>
                    </select>
                </div>
            </div>

            {data.maintenance_mode && (
                <div className="p-4 bg-rose-500/10 rounded-lg border border-rose-500/20 text-rose-500 flex items-center gap-3">
                    <AlertCircle className="size-4 shrink-0" />
                    <p className="text-[11px] font-bold uppercase tracking-tight">Atenção: Apenas administradores podem acessar o sistema enquanto em modo manutenção.</p>
                </div>
            )}
        </div>
    )
}
