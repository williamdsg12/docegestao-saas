"use client"

import { Shield, Lock, Clock, Ban, Globe, AlertTriangle } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface SecuritySettingsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function SecuritySettings({ data, onChange }: SecuritySettingsProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 2FA Section */}
            <div className="flex items-center justify-between p-8 bg-slate-900 rounded-[32px] text-white relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Shield className="size-32 text-primary" />
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="size-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-xl">
                        <Lock className="size-8 text-primary" />
                    </div>
                    <div>
                        <p className="font-black text-white text-xl uppercase italic tracking-tight">2FA Obrigatório</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Exigir autenticação de dois fatores para todos os admins</p>
                    </div>
                </div>
                <Switch 
                    checked={data.security_2fa_required || false}
                    onCheckedChange={(checked) => onChange('security_2fa_required', checked)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Clock className="size-3" /> Tempo de Sessão (Minutos)
                    </label>
                    <input 
                        type="number" 
                        value={data.session_timeout_minutes || ""}
                        onChange={(e) => onChange('session_timeout_minutes', Number(e.target.value))}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        placeholder="Ex: 60"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Ban className="size-3" /> Limite de Tentativas de Login
                    </label>
                    <input 
                        type="number" 
                        value={data.max_login_attempts || ""}
                        onChange={(e) => onChange('max_login_attempts', Number(e.target.value))}
                        className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        placeholder="Ex: 5"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Globe className="size-3" /> Lista de IPs Permitidos (Admin)
                </label>
                <textarea 
                    value={data.allowed_ips?.join(', ') || ""}
                    onChange={(e) => onChange('allowed_ips', e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip !== ''))}
                    className="w-full h-32 p-6 bg-slate-50 border-none rounded-3xl text-xs font-mono focus:ring-4 focus:ring-primary/5 transition-all outline-none resize-none"
                    placeholder="Separe os IPs por vírgula (Ex: 192.168.1.1, 201.24.58.12)"
                />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1 mt-1 italic flex items-center gap-1">
                    <AlertTriangle className="size-3 text-amber-500" /> Cuidado: Deixe em branco para permitir qualquer IP.
                </p>
            </div>
        </div>
    )
}
