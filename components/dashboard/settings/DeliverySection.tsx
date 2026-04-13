"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bike, MapPin, ShoppingBag } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface DeliverySectionProps {
    data: any
    onChange: (updates: any) => void
}

export function DeliverySection({ data, onChange }: DeliverySectionProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6"
        >
            <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                <div className="size-10 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Bike size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Logística de Entrega</h3>
                    <p className="text-xs text-slate-500">Regras de frete e cobertura geográfica</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Delivery Fee */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Taxa de Entrega (R$)</Label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">R$</span>
                        <Input 
                            type="number"
                            min="0"
                            step="0.50"
                            value={data.delivery_fee || 0} 
                            onChange={e => onChange({ delivery_fee: parseFloat(e.target.value) })} 
                            className="h-10 pl-12 rounded-lg border-slate-200 focus:border-primary transition-all font-semibold text-slate-700 bg-slate-50/50" 
                        />
                    </div>
                </div>

                {/* Delivery Radius */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Raio de Entrega (KM)</Label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input 
                            type="number"
                            min="0"
                            step="1"
                            value={data.delivery_radius || 0} 
                            onChange={e => onChange({ delivery_radius: parseFloat(e.target.value) })} 
                            className="h-10 pl-11 rounded-lg border-slate-200 focus:border-primary transition-all font-semibold text-slate-700 bg-slate-50/50" 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-300 text-[10px] uppercase">Km</span>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-4">
                <div className="p-3 px-4 rounded-xl bg-slate-50 flex items-center justify-between border border-transparent hover:border-emerald-100 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-emerald-500">
                            <Bike size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-xs text-slate-700">Entrega</span>
                            <span className="text-[10px] text-slate-400 font-medium">Delivery a domicílio</span>
                        </div>
                    </div>
                    <Switch 
                        checked={data.delivery_enabled !== false}
                        onCheckedChange={checked => onChange({ delivery_enabled: checked })}
                        className="data-[state=checked]:bg-emerald-500 scale-90"
                    />
                </div>

                <div className="p-3 px-4 rounded-xl bg-slate-50 flex items-center justify-between border border-transparent hover:border-emerald-100 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-emerald-500">
                            <ShoppingBag size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-xs text-slate-700">Retirada</span>
                            <span className="text-[10px] text-slate-400 font-medium tracking-tight">Balcão</span>
                        </div>
                    </div>
                    <Switch 
                        checked={data.pickup_enabled !== false}
                        onCheckedChange={checked => onChange({ pickup_enabled: checked })}
                        className="data-[state=checked]:bg-emerald-500 scale-90"
                    />
                </div>
            </div>
        </motion.div>
    )
}
