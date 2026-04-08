"use client"

import { useState, useEffect } from "react"
import { CreditCard, Calendar, Lock, User, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface PaymentFormMPProps {
  amount: number;
  orderId: string;
  tenantId: string;
  customerEmail: string;
  onSuccess: (result: any) => void;
  onCancel: () => void;
}

export function PaymentFormMP({ amount, orderId, tenantId, customerEmail, onSuccess, onCancel }: PaymentFormMPProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
    identificationType: "CPF",
    identificationNumber: ""
  })

  // Initialize Mercado Pago
  const [mp, setMp] = useState<any>(null)

  useEffect(() => {
    if (window.MercadoPago) {
      const mpInstance = new window.MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || '', {
        locale: 'pt-BR'
      })
      setMp(mpInstance)
    } else {
      console.error("Mercado Pago SDK not loaded")
      toast.error("Erro ao carregar sistema de pagamentos")
    }
  }, [])

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 16)
    setFormData({ ...formData, cardNumber: value })
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4)
    }
    setFormData({ ...formData, expiryDate: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mp) return

    setLoading(true)
    try {
      const [expirationMonth, expirationYear] = formData.expiryDate.split('/')
      
      const cardTokenResponse = await mp.createCardToken({
        cardNumber: formData.cardNumber,
        cardholderName: formData.cardholderName,
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: "20" + expirationYear,
        securityCode: formData.cvv,
        identificationType: formData.identificationType,
        identificationNumber: formData.identificationNumber,
      })

      if (cardTokenResponse.id) {
        // Send token to backend
        const res = await fetch('/api/payments/card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: cardTokenResponse.id,
            transaction_amount: amount,
            installments: 1, 
            payment_method_id: cardTokenResponse.payment_method_id || 'visa', 
            payer: {
              email: customerEmail,
              identification: {
                type: formData.identificationType,
                number: formData.identificationNumber
              }
            },
            order_id: orderId,
            tenant_id: tenantId
          })
        })

        const paymentResult = await res.json()
        if (paymentResult.status === 'approved') {
          onSuccess(paymentResult)
        } else {
          toast.error(`Pagamento ${paymentResult.status}: ${paymentResult.status_detail}`)
        }
      } else {
        throw new Error("Não foi possível gerar o token do cartão")
      }
    } catch (err: any) {
      console.error("Payment Error:", err)
      toast.error(err.message || "Erro ao processar pagamento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl max-w-md mx-auto">
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-800">Dados do Cartão</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pagamento Seguro via Mercado Pago</p>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nome no Cartão</Label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
            <Input 
              required
              placeholder="Ex: JOÃO A SILVA"
              value={formData.cardholderName}
              onChange={e => setFormData({...formData, cardholderName: e.target.value.toUpperCase()})}
              className="pl-12 h-14 rounded-2xl border-slate-100 focus:border-primary font-bold"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Número do Cartão</Label>
          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
            <Input 
              required
              placeholder="0000 0000 0000 0000"
              value={formData.cardNumber}
              onChange={handleCardNumberChange}
              className="pl-12 h-14 rounded-2xl border-slate-100 focus:border-primary font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Validade</Label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
              <Input 
                required
                placeholder="MM/AA"
                value={formData.expiryDate}
                onChange={handleExpiryChange}
                className="pl-12 h-14 rounded-2xl border-slate-100 focus:border-primary font-bold"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">CVV</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
              <Input 
                required
                placeholder="123"
                value={formData.cvv}
                onChange={e => setFormData({...formData, cvv: e.target.value.substring(0, 4)})}
                className="pl-12 h-14 rounded-2xl border-slate-100 focus:border-primary font-bold"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">CPF do Titular</Label>
          <Input 
            required
            placeholder="000.000.000-00"
            value={formData.identificationNumber}
            onChange={e => setFormData({...formData, identificationNumber: e.target.value})}
            className="h-14 rounded-2xl border-slate-100 focus:border-primary font-bold"
          />
        </div>
      </div>

      <div className="pt-4 space-y-3">
        <Button 
          type="submit"
          disabled={loading}
          className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] shadow-lg transition-all"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            `PAGAR R$ ${amount.toFixed(2)}`
          )}
        </Button>
        <Button 
          type="button"
          variant="ghost" 
          onClick={onCancel}
          disabled={loading}
          className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400"
        >
          Cancelar e Voltar
        </Button>
      </div>
    </form>
  )
}
