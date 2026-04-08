"use client"

import { useState, useEffect, Suspense, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, QrCode, Copy, Check, ArrowLeft, CreditCard as CardIcon, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { PaymentFormMP } from "@/components/checkout/PaymentFormMP"

function PaymentStatusContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  
  const [pixData, setPixData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 🧪 PASSO 8 — GERAR PIX CASO NÃO EXISTA
  const generatePix = useCallback(async (order: any) => {
    if (generating) return;
    setGenerating(true);
    setError(null);
    try {
      console.log('Solicitando geração de PIX para order:', order.id);
      const res = await fetch('/api/payment/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          tenant_id: order.tenant_id,
          amount: order.total || order.amount,
          customer_email: order.customer_email || `customer-${order.id}@docegestao.com.br`,
          customer_name: order.customer_name || 'Cliente'
        })
      });

      const data = await res.json();
      console.log('RESPOSTA GERAÇÃO PIX:', data);

      if (!res.ok) throw new Error(data.error || 'Erro ao gerar cobrança PIX');

      if (data.qr_code && data.qr_code_base64) {
        setPixData((prev: any) => ({
          ...prev,
          ...data,
          payment_method: 'pix'
        }));
        toast.success("QR Code gerado com sucesso!");
      } else {
        throw new Error("API retornou dados de PIX incompletos.");
      }
    } catch (err: any) {
      console.error('Erro no generatePix:', err);
      setError(err.message);
      toast.error("Erro ao gerar PIX. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }, [generating]);

  const fetchData = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      console.log('Buscando dados do pedido:', orderId);
      
      // 1. Buscar na tabela 'payments'
      const { data: payData } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle()
      
      console.log('PAGAMENTO DO SUPABASE:', payData);

      if (payData && payData.qr_code_base64) {
        setPixData(payData);
        if (payData.status === 'approved' || payData.status === 'paid') {
           router.push(`/pedido-confirmado?orderId=${orderId}`)
           return
        }
      } else {
        // 2. Buscar na tabela 'orders' para ter os dados base
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();
        
        console.log('PEDIDO DO SUPABASE:', orderData);
        
        if (orderData) {
          const baseData = {
            ...orderData,
            amount: orderData.total,
            payment_method: orderData.payment_method || 'pix'
          };
          setPixData(baseData);

          // Se for PIX mas não tiver QR code ainda, gera agora!
          if (baseData.payment_method === 'pix') {
             await generatePix(orderData);
          }
        } else {
          setError("Pedido não encontrado.");
        }
      }
    } catch (err: any) {
      console.error('Erro no fetchData:', err);
      setError("Erro ao carregar dados do pagamento.");
    } finally {
      setLoading(false);
    }
  }, [orderId, router, generatePix]);

  useEffect(() => {
    if (!orderId) {
      router.push('/')
      return
    }
    fetchData();

    // Polling de status
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payment/status?id=${orderId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'approved' || data.status === 'paid') {
            clearInterval(pollInterval);
            toast.success("Pagamento aprovado! 🎉");
            setTimeout(() => {
              router.push(`/pedido-confirmado?orderId=${orderId}`);
            }, 1500);
          }
        }
      } catch (e) {}
    }, 5000);
    pollIntervalRef.current = pollInterval;

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  }, [orderId, router, fetchData]);

  const handleCopy = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code)
      setHasCopied(true)
      toast.success("Código copiado!")
      setTimeout(() => setHasCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF5F8] p-6 text-center">
        <Loader2 className="size-12 animate-spin text-pink-500 mb-4" />
        <h2 className="text-xl font-black uppercase italic text-slate-800 tracking-tighter">Sincronizando...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF5F8] p-6 text-center">
        <div className="size-16 bg-red-100 rounded-3xl flex items-center justify-center mb-4">
           <RefreshCw className="size-8 text-red-500" />
        </div>
        <h2 className="text-xl font-black uppercase italic text-slate-800 tracking-tighter">Ops! Algo deu errado</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-xs">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-6 bg-slate-900 rounded-2xl">
           Tentar Novamente
        </Button>
      </div>
    )
  }

  // 🚨 PASSO 6 — EVITAR ERRO COM undefined
  if (pixData?.payment_method === 'pix' && !pixData?.qr_code_base64) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF5F8] p-6 text-center">
        <Loader2 className="size-12 animate-spin text-pink-500 mb-4" />
        <h2 className="text-xl font-black uppercase italic text-slate-800 tracking-tighter">Gerando QR Code...</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 max-w-[200px]">
           Aguarde um instante enquanto preparamos sua cobrança segura.
        </p>
        {generating && <p className="text-[10px] text-pink-500 font-bold mt-4 animate-pulse uppercase">Conectando ao Mercado Pago...</p>}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF5F8] py-12 px-4 flex items-center justify-center font-sans selection:bg-pink-100">
      <div className="max-w-md w-full">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            {pixData.payment_method === 'pix' ? (
                <Card className="rounded-[50px] overflow-hidden border-none shadow-2xl shadow-pink-100">
                    <div className="p-10 bg-slate-900 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 size-40 bg-pink-500 rounded-full blur-[100px] opacity-20" />
                        <div className="relative z-10 text-center">
                            <div className="size-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                                {pixData.status === 'approved' ? <CheckCircle2 className="size-8 text-emerald-400" /> : <QrCode className="size-8 text-pink-400" />}
                            </div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 leading-none">
                                {pixData.status === 'approved' ? "PAGO!" : "QUASE LÁ!"}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                {pixData.status === 'approved' ? "Redirecionando..." : "Finalize seu pagamento PIX"}
                            </p>
                        </div>
                    </div>

                    <div className="p-10 bg-white space-y-8">
                        {pixData.qr_code_base64 && (
                        <div className="bg-slate-50 p-6 rounded-[40px] flex items-center justify-center border-2 border-slate-100 shadow-inner group transition-all">
                            <img 
                            src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                            alt="QR Code PIX" 
                            className="object-contain group-hover:scale-105 transition-transform"
                            style={{ width: 200 }}
                            />
                        </div>
                        )}
                        
                        <div className="space-y-4">
                        {pixData.qr_code && (
                          <div className="space-y-4">
                            <div className="relative group">
                              <textarea 
                                value={pixData.qr_code} 
                                readOnly 
                                className="w-full text-[10px] p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-mono text-slate-400 resize-none h-20 focus:outline-none focus:border-pink-200"
                              />
                            </div>
                            
                            <Button 
                                onClick={handleCopy}
                                className="w-full h-16 rounded-2xl bg-[#FF2F81] text-white font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-lg shadow-pink-100 hover:scale-[1.02] active:scale-100"
                            >
                                {hasCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                                {hasCopied ? "Copiado!" : "Copiar Código PIX"}
                            </Button>
                          </div>
                        )}
                        
                        <p className="text-[10px] text-center font-bold text-slate-300 uppercase italic leading-loose">
                            O pedido será confirmado automaticamente<br/>após o pagamento ser identificado em tempo real.
                        </p>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <Loader2 className="size-4 text-amber-500 animate-spin shrink-0" />
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-none">Aguardando confirmação bancária...</span>
                        </div>

                        <Button 
                        variant="ghost" 
                        onClick={() => router.back()}
                        className="w-full text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"
                        >
                            <ArrowLeft className="size-3" /> Alterar forma de pagamento
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                     <div className="text-center mb-8">
                        <div className="size-16 bg-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-200">
                            <CardIcon className="size-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Cartão de Crédito</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Insira os dados para finalizar</p>
                    </div>

                    <div className="bg-white rounded-[40px] p-2 shadow-2xl shadow-pink-100 overflow-hidden">
                      <PaymentFormMP 
                          amount={pixData.amount}
                          orderId={orderId!}
                          tenantId={pixData.tenant_id}
                          customerEmail={pixData.customer_email || ""} 
                          onSuccess={() => {
                              toast.success("Pagamento aprovado! 🎉")
                              router.push(`/pedido-confirmado?orderId=${orderId}`)
                          }}
                          onCancel={() => router.back()}
                      />
                    </div>
                </div>
            )}
        </motion.div>
      </div>
    </div>
  )
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Carregando...</div>}>
      <PaymentStatusContent />
    </Suspense>
  )
}
