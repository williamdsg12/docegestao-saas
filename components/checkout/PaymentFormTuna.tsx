"use client"

import { useState, useEffect } from "react"
import { CreditCard, Calendar, Lock, User, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

declare global {
  interface Window {
    Tuna: any;
  }
}

interface PaymentFormTunaProps {
  amount: number;
  orderId: string;
  tenantId: string;
  customerEmail: string;
  customerName: string;
  onSuccess: (result: any) => void;
  onCancel: () => void;
}

export function PaymentFormTuna({ amount, orderId, tenantId, customerEmail, customerName, onSuccess, onCancel }: PaymentFormTunaProps) {
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardholderName: customerName.toUpperCase(),
    expiryDate: "",
    cvv: ""
  })

  useEffect(() => {
    const loadTuna = async () => {
      try {
        if (!window.Tuna) {
          const script = document.createElement("script")
          script.src = "https://js.tuna.com.br/tuna.js"
          script.async = true
          document.body.appendChild(script)
          await new Promise((resolve) => (script.onload = resolve))
        }
        setInitializing(false)
      } catch (err) {
        console.error("Tuna SDK load error:", err)
        toast.error("Erro ao carregar sistema de pagamentos")
      }
    }
    loadTuna()
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
    if (!window.Tuna) return

    setLoading(true)
    try {
      // 1. Get Session ID
      const sessionRes = await fetch(`/api/payments/tuna/session?tenant_id=${tenantId}`)
      const { session_id } = await sessionRes.json()

      if (!session_id) throw new Error("Não foi possível iniciar a sessão de pagamento")

      // 2. Tokenize with Tuna
      const [expMonth, expYear] = formData.expiryDate.split('/')
      
      const tuna = new window.Tuna()
      const cardToken = await tuna.createToken({
        sessionId: session_id,
        card: {
          number: formData.cardNumber,
          name: formData.cardholderName,
          expiryMonth: expMonth,
          expiryYear: "20" + expYear,
          cvv: formData.cvv
        }
      })

      if (!cardToken || !cardToken.token) {
        throw new Error("Erro ao gerar token do cartão")
      }

      // 3. Process Payment
      const res = await fetch('/api/payments/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: cardToken.token,
          amount: amount,
          order_id: orderId,
          tenant_id: tenantId,
          customer_email: customerEmail,
          customer_name: formData.cardholderName,
          installments: 1
        })
      })

      const result = await res.json()
      if (result.status === 'approved' || result.status === 'pending') {
        onSuccess(result)
      } else {
        toast.error(result.error || "Pagamento recusado")
      }
    } catch (err: any) {
      console.error("Payment Error:", err)
      toast.error(err.message || "Erro ao processar pagamento")
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="size-8 animate-spin text-slate-400" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Iniciando Checkout Seguro...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl max-w-md mx-auto">
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-800">Dados do Cartão</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Pagamento Seguro via Tuna Gateway</p>
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
              className="pl-12 h-14 rounded-2xl border-slate-100 focus:border-red-500 font-bold"
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
              className="pl-12 h-14 rounded-2xl border-slate-100 focus:border-red-500 font-bold"
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
                className="pl-12 h-14 rounded-2xl border-slate-100 focus:border-red-500 font-bold"
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
                className="pl-12 h-14 rounded-2xl border-slate-100 focus:border-red-500 font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-3">
        <Button 
          type="submit"
          disabled={loading}
          className="w-full h-16 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase italic tracking-[0.2em] shadow-lg transition-all"
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
