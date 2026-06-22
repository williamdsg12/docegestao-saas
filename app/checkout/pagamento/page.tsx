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
  const [timeLeft, setTimeLeft] = useState(600)

  // Countdown timer logic
  useEffect(() => {
    if (pixData?.payment_method === 'pix' && pixData?.status !== 'approved') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [pixData])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Audit Logs
  useEffect(() => {
    if (pixData) {
      if (pixData.payment_method === 'pix') {
        console.log('PIX gerado')
        if (pixData.qr_code_base64) {
          console.log('QR Code recebido')
        }
        if (pixData.qr_code) {
          console.log('PIX Copia e Cola recebido')
        }
      }
    }
  }, [pixData])
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
          customer_email: order.customer?.email || order.customer_email || `customer-${order.id}@docegestao.com.br`,
          customer_name: order.customer?.name || order.customer_name || 'Cliente'

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
           router.push(`/pedido/rastreamento/${orderId}?new=true`)
           return
        }
      } else {
        // 2. Buscar na tabela 'orders' para ter os dados base
        const { data: orderData } = await supabase
          .from('orders')
          .select('*, customer:customers(*)')
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
    // 1. Realtime listener for instant status updates
    const channel = supabase
      .channel(`payment-status-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'payments',
        filter: `order_id=eq.${orderId}`
      }, (payload: any) => {
        console.log('Realtime payment update received:', payload.new);
        if (payload.new.status === 'approved' || payload.new.status === 'paid') {
          toast.success("Pagamento aprovado! 🎉");
          router.push(`/pedido/rastreamento/${orderId}?new=true`);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload: any) => {
        console.log('Realtime order update received:', payload.new);
        if (payload.new.payment_status === 'paid') {
          toast.success("Pagamento aprovado! 🎉");
          router.push(`/pedido/rastreamento/${orderId}?new=true`);
        }
      })
      .subscribe();
    // 2. Polling de status (fallback)
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payment/status?id=${orderId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'approved' || data.status === 'paid') {
            clearInterval(pollInterval);
            toast.success("Pagamento aprovado! 🎉");
            setTimeout(() => {
              router.push(`/pedido/rastreamento/${orderId}?new=true`);
            }, 1500);
          }
        }
      } catch (e) {}
    }, 5000);
    pollIntervalRef.current = pollInterval;
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      supabase.removeChannel(channel);
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
                <Card className="rounded-[40px] overflow-hidden border-none shadow-2xl bg-white max-w-md mx-auto">
                    {/* Header */}
                    <div className="p-8 bg-slate-900 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 size-32 bg-red-600 rounded-full blur-[80px] opacity-20" />
                        <div className="relative z-10 space-y-4">
                            <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md">
                                <QrCode className="size-6 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-1">
                                    Pagamento via Pix
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Rápido, seguro e confirmado na hora
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        {/* Expiration Timer & Price */}
                        <div className="flex flex-col items-center gap-2 text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total a Pagar</span>
                            <span className="text-3xl font-black text-slate-900">
                              R$ {(Number(pixData.amount) || Number(pixData.total) || 0).toFixed(2)}
                            </span>
                            
                            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest mt-1">
                              <Loader2 className="size-3.5 animate-spin" />
                              <span>Expira em: {formatTime(timeLeft)}</span>
                            </div>
                        </div>

                        {/* QR Code Container */}
                        {pixData.qr_code_base64 && (
                        <div className="bg-slate-50 p-6 rounded-[32px] flex flex-col items-center justify-center border border-slate-100 shadow-inner group transition-all">
                            <img 
                              src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                              alt="QR Code PIX" 
                              className="object-contain group-hover:scale-[1.02] transition-transform w-[180px] h-[180px]"
                            />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                              Abra o app do seu banco para ler
                            </p>
                        </div>
                        )}
                        
                        {/* Copy Code Section */}
                        {pixData.qr_code && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 leading-none">
                              Pix Copia e Cola
                            </p>
                            <div className="relative">
                              <textarea 
                                value={pixData.qr_code} 
                                readOnly 
                                className="w-full text-[9px] p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-slate-500 resize-none h-16 focus:outline-none"
                              />
                            </div>
                            
                            <Button 
                              onClick={handleCopy}
                              className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-lg shadow-red-100 transition-all active:scale-[0.98]"
                            >
                              {hasCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                              <span>{hasCopied ? "Copiado!" : "Copiar Código Pix"}</span>
                            </Button>
                          </div>
                        )}
                        
                        {/* Real-time Status Tracker */}
                        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <Loader2 className="size-4 text-amber-500 animate-spin shrink-0" />
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-normal">
                              Aguardando confirmação bancária em tempo real...
                            </span>
                        </div>

                        {/* Back Link */}
                        <Button 
                          variant="ghost" 
                          onClick={() => router.back()}
                          className="w-full text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2"
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
                          customerEmail={pixData.customer?.email || pixData.customer_email || ""} 
                          onSuccess={() => {
                              toast.success("Pagamento aprovado! 🎉")
                              router.push(`/pedido/rastreamento/${orderId}?new=true`)
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