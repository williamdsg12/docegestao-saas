"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, CreditCard, Banknote, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaymentMethodCardProps {
  method: any
  onManage: (method: any) => void
}

export function PaymentMethodCard({ method, onManage }: PaymentMethodCardProps) {
  const isOnline = method.method_type === 'online'
  
  // Status check logic
  let statusText = "Inativo"
  let statusColor = "bg-rose-100 text-rose-500 border-rose-200"
  let isActive = false

  if (method.is_enabled) {
    isActive = true
    statusText = isOnline ? "Online" : "Ativo no Menu Digital e PDV"
    statusColor = "bg-emerald-100 text-emerald-600 border-emerald-200"
  } else if (method.status === 'pending') {
    statusText = "Aguardando validação..."
    statusColor = "bg-amber-100 text-amber-600 border-amber-200"
  }

  const Icon = method.method_key === 'dinheiro' ? Banknote : CreditCard

  return (
    <Card className="rounded-[24px] border-slate-100 shadow-sm hover:shadow-md transition-all group bg-white overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={cn(
              "size-14 rounded-2xl flex items-center justify-center transition-all",
              isActive ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
            )}>
              <Icon size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight leading-none">
                {method.method_name}
              </h3>
              <div className="flex items-center gap-2">
                <Badge className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border shrink-0 shadow-none", statusColor)}>
                  {statusText}
                </Badge>
                {isActive && !isOnline && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                     {method.fee_percentage > 0 ? `Taxa de ${method.fee_percentage}%` : "Sem taxas adicionais"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <Button 
                onClick={() => onManage(method)}
                variant="outline" 
                className="h-11 px-6 rounded-xl border-slate-200 text-slate-600 font-bold uppercase text-[10px] italic hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all"
             >
                Gerenciar
             </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
