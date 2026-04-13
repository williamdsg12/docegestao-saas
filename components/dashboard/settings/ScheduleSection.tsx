"use client"

import { Switch } from "@/components/ui/switch"
import { Clock, Calendar } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ScheduleSectionProps {
    data: any
    onChange: (updates: any) => void
}

const dayLabels: Record<string, string> = {
    monday: "Segunda",
    tuesday: "Terça",
    wednesday: "Quarta",
    thursday: "Quinta",
    friday: "Sexta",
    saturday: "Sábado",
    sunday: "Domingo"
}

export function ScheduleSection({ data, onChange }: ScheduleSectionProps) {
    const hours = data.opening_hours || {}

    const handleDayToggle = (day: string, enabled: boolean) => {
        const newHours = { ...hours }
        if (enabled) {
            newHours[day] = { open: "08:00", close: "18:00" }
        } else {
            newHours[day] = null
        }
        onChange({ opening_hours: newHours })
    }

    const handleTimeChange = (day: string, type: 'open' | 'close', value: string) => {
        const newHours = { ...hours }
        if (!newHours[day]) newHours[day] = { open: "08:00", close: "18:00" }
        newHours[day][type] = value
        onChange({ opening_hours: newHours })
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6"
        >
            <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                <div className="size-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                    <Clock size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Horários de Operação</h3>
                    <p className="text-xs text-slate-500">Quando sua loja está aberta para pedidos</p>
                </div>
            </div>

            <div className="space-y-2">
                {Object.keys(dayLabels).map((day) => (
                    <div key={day} className="flex flex-wrap items-center gap-4 p-3 px-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-all group">
                        <div className="w-28 flex items-center gap-2">
                            <Calendar className="size-3.5 text-slate-400 group-hover:text-blue-500" />
                            <span className="font-semibold text-sm text-slate-700">{dayLabels[day]}</span>
                        </div>

                        <div className="flex items-center gap-3 flex-1">
                            <input 
                                type="time" 
                                disabled={!hours[day]}
                                value={hours[day]?.open || "00:00"}
                                onChange={e => handleTimeChange(day, 'open', e.target.value)}
                                className="h-9 px-3 rounded-lg bg-slate-50 border border-transparent focus:border-blue-500 font-medium text-sm text-slate-700 disabled:opacity-30"
                            />
                            <span className="text-slate-400 text-xs">até</span>
                            <input 
                                type="time" 
                                disabled={!hours[day]}
                                value={hours[day]?.close || "00:00"}
                                onChange={e => handleTimeChange(day, 'close', e.target.value)}
                                className="h-9 px-3 rounded-lg bg-slate-50 border border-transparent focus:border-blue-500 font-medium text-sm text-slate-700 disabled:opacity-30"
                            />
                        </div>

                        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg min-w-[120px] justify-center">
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                hours[day] ? "text-emerald-500" : "text-slate-400"
                            )}>
                                {hours[day] ? "Aberto" : "Fechado"}
                            </span>
                            <Switch 
                                checked={!!hours[day]} 
                                onCheckedChange={checked => handleDayToggle(day, checked)}
                                className="data-[state=checked]:bg-emerald-500 scale-90"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}
