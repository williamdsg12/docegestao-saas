"use client"

import { Bell, Mail, Monitor, UserPlus, CreditCard, XCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface NotificationSettingsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function NotificationSettings({ data, onChange }: NotificationSettingsProps) {
    const handleEventToggle = (event: string, enabled: boolean) => {
        const events = { ...(data.notification_events || {}) }
        events[event] = enabled
        onChange('notification_events', events)
    }

    const events = data.notification_events || {
        new_user: true,
        new_payment: true,
        cancellation: true
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Delivery Channels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                            <Mail className="size-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 text-sm uppercase italic tracking-tight">Notificações por E-mail</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Enviar alertas para o admin principal</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.notification_email_enabled || false}
                        onCheckedChange={(checked) => onChange('notification_email_enabled', checked)}
                    />
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                            <Monitor className="size-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 text-sm uppercase italic tracking-tight">Notificações Internas</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Exibir balões de alerta no painel admin</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.notification_internal_enabled || false}
                        onCheckedChange={(checked) => onChange('notification_internal_enabled', checked)}
                    />
                </div>
            </div>

            {/* Event Triggers */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="size-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black italic">!</div>
                    <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-wider">Gatilhos de <span className="text-primary italic">Evento</span></h4>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                        <div className="flex items-center gap-4">
                            <UserPlus className="size-5 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Novo Usuário Cadastrado</span>
                        </div>
                        <Switch 
                            checked={events.new_user}
                            onCheckedChange={(checked) => handleEventToggle('new_user', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                        <div className="flex items-center gap-4">
                            <CreditCard className="size-5 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Confirmação de Pagamento</span>
                        </div>
                        <Switch 
                            checked={events.new_payment}
                            onCheckedChange={(checked) => handleEventToggle('new_payment', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                        <div className="flex items-center gap-4">
                            <XCircle className="size-5 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Cancelamento de Assinatura</span>
                        </div>
                        <Switch 
                            checked={events.cancellation}
                            onCheckedChange={(checked) => handleEventToggle('cancellation', checked)}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
