"use client"

import { Shield, Lock, Clock, Ban, Globe, AlertTriangle } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface SecuritySettingsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function SecuritySettings({ data, onChange }: SecuritySettingsProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 2FA Section */}
            <div className="flex items-center justify-between p-6 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Lock className="size-5 text-indigo-500" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-xs uppercase tracking-tight">2FA Obrigatório</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Exigir autenticação para admins</p>
                    </div>
                </div>
                <Switch 
                    checked={data.security_2fa_required || false}
                    onCheckedChange={(checked) => onChange('security_2fa_required', checked)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Clock className="size-3 text-indigo-400" /> Tempo de Sessão (Min)
                    </label>
                    <input 
                        type="number" 
                        value={data.session_timeout_minutes || ""}
                        onChange={(e) => onChange('session_timeout_minutes', Number(e.target.value))}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm font-medium text-white outline-none"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Ban className="size-3 text-indigo-400" /> Max Tentativas Login
                    </label>
                    <input 
                        type="number" 
                        value={data.max_login_attempts || ""}
                        onChange={(e) => onChange('max_login_attempts', Number(e.target.value))}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm font-medium text-white outline-none"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Globe className="size-3 text-indigo-400" /> IPs Permitidos
                </label>
                <textarea 
                    value={data.allowed_ips?.join(', ') || ""}
                    onChange={(e) => onChange('allowed_ips', e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip !== ''))}
                    className="w-full h-24 p-4 bg-white/[0.03] border border-white/[0.05] rounded-xl text-[10px] font-mono text-slate-400 outline-none resize-none focus:border-indigo-500/30 transition-all"
                    placeholder="Separe por vírgula (Ex: 192.168.1.1, ...)"
                />
                <div className="flex items-center gap-2 text-[9px] text-amber-500 font-bold uppercase tracking-widest ml-1">
                    <AlertTriangle className="size-3" />
                    <span>Deixe em branco para permitir qualquer origem</span>
                </div>
            </div>
        </div>
    )
}
