"use client"

import { Mail, Smartphone, CheckSquare } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface NotificationSettingsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function NotificationSettings({ data, onChange }: NotificationSettingsProps) {
    const handleEventToggle = (event: string, enabled: boolean) => {
        const currentEvents = data.notification_events || {}
        onChange('notification_events', { ...currentEvents, [event]: enabled })
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-6 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Mail className="size-5" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-xs uppercase tracking-tight">E-mail Corporativo</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Notificações via SMTP/API</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.notification_email_enabled || false}
                        onCheckedChange={(checked) => onChange('notification_email_enabled', checked)}
                    />
                </div>

                <div className="flex items-center justify-between p-6 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Smartphone className="size-5" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-xs uppercase tracking-tight">SMS & WhatsApp</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Notificações móveis diretas</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.notification_sms_enabled || false}
                        onCheckedChange={(checked) => onChange('notification_sms_enabled', checked)}
                    />
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <CheckSquare className="size-4 text-indigo-400" />
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Triggers de Automação</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { id: 'new_user', label: 'Novo Cadastro', desc: 'Alertar quando um novo usuário se registrar' },
                        { id: 'new_payment', label: 'Pagamento Confirmado', desc: 'Notificar receitas e conversões' },
                        { id: 'cancellation', label: 'Cancelamento', desc: 'Churn e encerramento de conta' },
                        { id: 'ticket_low', label: 'Suporte Prioritário', desc: 'Tickets marcados como urgentes' },
                        { id: 'system_alert', label: 'Alertas de Sistema', desc: 'Erros e instabilidades críticas' },
                    ].map((event) => (
                        <div key={event.id} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-lg hover:border-indigo-500/20 transition-all group">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{event.label}</span>
                                <Switch 
                                    checked={data.notification_events?.[event.id] || false}
                                    onCheckedChange={(checked) => handleEventToggle(event.id, checked)}
                                />
                            </div>
                            <p className="text-[9px] text-slate-600 font-medium leading-relaxed">{event.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
