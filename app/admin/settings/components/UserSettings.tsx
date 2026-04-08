"use client"

import { UserPlus, ShieldCheck, Ban, Users } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface UserSettingsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function UserSettings({ data, onChange }: UserSettingsProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary/20 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <UserPlus className="size-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 text-sm uppercase italic tracking-tight">Permitir Cadastro Público</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Habilita o formulário de registro para novos usuários</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.allow_public_registration || false}
                        onCheckedChange={(checked) => onChange('allow_public_registration', checked)}
                    />
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary/20 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <ShieldCheck className="size-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 text-sm uppercase italic tracking-tight">Aprovação Manual</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Novos cadastros precisam de liberação do admin</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.require_manual_approval || false}
                        onCheckedChange={(checked) => onChange('require_manual_approval', checked)}
                    />
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary/20 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Ban className="size-6 text-rose-600" />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 text-sm uppercase italic tracking-tight">Bloqueio por Inadimplência</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Suspender acesso automaticamente em caso de atraso</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.auto_block_inadimplencia || false}
                        onCheckedChange={(checked) => onChange('auto_block_inadimplencia', checked)}
                    />
                </div>
            </div>

            <div className="p-10 bg-slate-900 rounded-[40px] text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <Users className="size-8 text-primary" />
                        <h4 className="text-xl font-black italic uppercase tracking-tighter">Limites de <span className="text-primary">Plano</span></h4>
                    </div>
                    <p className="text-slate-400 text-sm mb-8 leading-relaxed">Os limites de usuários individuais são definidos diretamente na configuração de cada plano. Verifique a aba <span className="text-white font-bold italic underline">Planos</span> para gerenciar cotas específicas.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 5, 10, 'Ilimitado'].map((val, i) => (
                            <div key={i} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 text-center">
                                <span className="block text-white font-black text-lg italic">{val}</span>
                                <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Usuários</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
