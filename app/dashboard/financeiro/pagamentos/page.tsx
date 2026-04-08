"use client"

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
          icon={<Wallet className="text-blue-500" size={32} />}
        />
        
        <div className="mt-8">
          <PaymentMethodsSettings />
        </div>
      </div>
    </FeatureGuard>
  )
}
