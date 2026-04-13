"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Wallet, CreditCard, Banknote, QrCode } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PaymentSectionProps {
    data: any
    onChange: (updates: any) => void
}

export function PaymentSection({ data, onChange }: PaymentSectionProps) {
    const methods = [
        { id: 'accept_pix', label: 'PIX', icon: QrCode, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 'accept_card', label: 'Cartão', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'accept_cash', label: 'Dinheiro', icon: Banknote, color: 'text-amber-500', bg: 'bg-amber-50' },
    ]

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6"
        >
            <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                <div className="size-10 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Wallet size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Métodos de Pagamento</h3>
                    <p className="text-xs text-slate-500">Formas de pagamento aceitas na mtrega</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                {methods.map((method) => {
                    const Icon = method.icon
                    const isChecked = data[method.id] !== false

                    return (
                        <div 
                            key={method.id} 
                            onClick={() => onChange({ [method.id]: !isChecked })}
                            className={cn(
                                "p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-3 text-center group",
                                isChecked 
                                    ? "border-emerald-500 bg-emerald-50/50" 
                                    : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                            )}
                        >
                            <div className={cn("size-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", method.bg, method.color)}>
                                <Icon size={20} />
                            </div>
                            <span className={cn("text-xs font-bold leading-tight", isChecked ? "text-slate-900" : "text-slate-400")}>
                                {method.label}
                            </span>
                            <Checkbox 
                                id={method.id}
                                checked={isChecked}
                                onCheckedChange={(checked) => onChange({ [method.id]: !!checked })}
                                className="size-4 rounded data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                        </div>
                    )
                })}
            </div>
        </motion.div>
    )
}
