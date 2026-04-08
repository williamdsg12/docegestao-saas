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
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Globe className="size-3" /> Nome do Sistema
                    </label>
                    <input 
                        type="text" 
                        value={data.site_name || ""}
                        onChange={(e) => onChange('site_name', e.target.value)}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        placeholder="Ex: Doce Gestão"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Link2 className="size-3" /> URL Base da Plataforma
                    </label>
                    <input 
                        type="text" 
                        value={data.site_url || ""}
                        onChange={(e) => onChange('site_url', e.target.value)}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-xs font-mono focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        placeholder="Ex: app.docegestao.com"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Server className="size-3" /> Ambiente Principal
                    </label>
                    <select 
                        value={data.environment || "production"}
                        onChange={(e) => onChange('environment', e.target.value)}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none"
                    >
                        <option value="production">Produção (Live)</option>
                        <option value="staging">Staging (Homonologação)</option>
                        <option value="development">Desenvolvimento (Local)</option>
                    </select>
                </div>

                <div className="flex items-center justify-between p-6 bg-rose-50 rounded-3xl border border-rose-100/50">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                            <Power className="size-6 text-rose-600" />
                        </div>
                        <div>
                            <p className="font-black text-rose-900 text-sm uppercase italic tracking-tight">Modo Manutenção</p>
                            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mt-1">Bloquear acesso público ao sistema</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.maintenance_mode || false}
                        onCheckedChange={(checked) => onChange('maintenance_mode', checked)}
                        className="data-[state=checked]:bg-rose-600"
                    />
                </div>
            </div>

            {data.maintenance_mode && (
                <div className="p-6 bg-rose-600 rounded-3xl text-white flex items-start gap-4 animate-bounce">
                    <AlertCircle className="size-6 shrink-0 mt-1" />
                    <div>
                        <p className="font-black uppercase italic text-sm">Atenção: Sistema em Manutenção</p>
                        <p className="text-xs opacity-80 font-medium">Apenas administradores podem acessar as páginas internas. Visitantes verão uma tela de aviso.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
