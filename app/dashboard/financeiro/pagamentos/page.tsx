"use client"

import { Suspense } from "react"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { PaymentMethodsSettings } from "@/components/dashboard/payments/PaymentMethodsSettings"
import { Wallet } from "lucide-react"

export default function MetodosPagamentoPage() {
  return (
    <FeatureGuard feature="financeiro" planRequired="pro">
      <div className="space-y-8 pb-20">
        <PageHeader 
          title="Métodos de" 
          highlight="Pagamento" 
          subtitle="Gerencie como seus clientes pagam: dinheiro, cartão ou pagamentos online com PIX"
        />
        
        <div className="mt-8">
          <Suspense fallback={<div className="h-40 bg-slate-50 animate-pulse rounded-[40px]" />}>
            <PaymentMethodsSettings />
          </Suspense>
        </div>
      </div>
    </FeatureGuard>
  )
}
