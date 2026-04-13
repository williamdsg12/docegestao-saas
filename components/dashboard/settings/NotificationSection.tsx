"use client"

import { Switch } from "@/components/ui/switch"
import { Bell, Volume2, UserCheck, Smartphone } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface NotificationSectionProps {
    data: any
    onChange: (updates: any) => void
}

export function NotificationSection({ data, onChange }: NotificationSectionProps) {
    const configs = [
        { 
            id: 'sound_enabled', 
            label: 'Alertas Sonoros', 
            desc: 'Tocar som ao receber novos pedidos',
            icon: Volume2,
            color: 'text-blue-500',
            bg: 'bg-blue-50'
        },
        { 
            id: 'auto_accept', 
            label: 'Auto Aceitar Pedidos', 
            desc: 'Aceitar pedidos automaticamente assim que chegarem',
            icon: UserCheck,
            color: 'text-purple-500',
            bg: 'bg-purple-50'
        },
    ]

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6"
        >
            <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                <div className="size-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <Bell size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Alertas & Notificações</h3>
                    <p className="text-xs text-slate-500">Como você será avisado sobre novas vendas</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {configs.map((config) => {
                    const Icon = config.icon
                    const isChecked = data[config.id] !== false
 
                    return (
                        <div 
                            key={config.id} 
                            className={cn(
                                "p-4 rounded-xl border transition-all flex items-center justify-between group",
                                isChecked 
                                    ? "border-indigo-500 bg-indigo-50/20" 
                                    : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("size-9 rounded-lg flex items-center justify-center", config.bg, config.color)}>
                                    <Icon size={18} />
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="font-bold text-sm text-slate-900">{config.label}</h4>
                                    <p className="text-[11px] text-slate-400 font-medium leading-tight">{config.desc}</p>
                                </div>
                            </div>
                            <Switch 
                                checked={isChecked}
                                onCheckedChange={(checked) => onChange({ [config.id]: checked })}
                                className="data-[state=checked]:bg-indigo-500 scale-90"
                            />
                        </div>
                    )
                })}
            </div>
        </motion.div>
    )
}
