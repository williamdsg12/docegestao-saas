"use client"

import { UserPlus, Shield, UserX, Lock } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface UserSettingsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function UserSettings({ data, onChange }: UserSettingsProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <UserPlus className="size-5 text-indigo-500" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-xs uppercase tracking-tight">Registro Público</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Permitir novos cadastros via site</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.allow_public_registration || false}
                        onCheckedChange={(checked) => onChange('allow_public_registration', checked)}
                    />
                </div>

                <div className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Shield className="size-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-xs uppercase tracking-tight">Aprovação Manual</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Admin deve aprovar cada conta</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.require_manual_approval || false}
                        onCheckedChange={(checked) => onChange('require_manual_approval', checked)}
                    />
                </div>

                <div className="flex items-center justify-between p-5 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                            <UserX className="size-5 text-rose-500" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-xs uppercase tracking-tight">Auto-Bloqueio</p>
                            <p className="text-[9px] text-rose-500/70 font-bold uppercase tracking-widest mt-1">Bloquear em caso de inadimplência</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.auto_block_inadimplencia || false}
                        onCheckedChange={(checked) => onChange('auto_block_inadimplencia', checked)}
                    />
                </div>
            </div>

            <div className="p-6 bg-indigo-600/5 rounded-xl border border-indigo-600/10">
                <div className="flex items-center gap-4 mb-4">
                    <Lock className="size-4 text-indigo-400" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acesso & Permissões</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Administrador', 'Gestor Público', 'Suporte Técnico'].map((level) => (
                        <div key={level} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-lg text-center group cursor-pointer hover:border-indigo-500/30 transition-all">
                            <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{level}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
