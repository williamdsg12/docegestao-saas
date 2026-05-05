"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, 
  MessageCircle, 
  Truck, 
  Clock, 
  Check, 
  X, 
  ShoppingBag, 
  User, 
  Home, 
  RefreshCcw,
  MapPin,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

// Dynamic import for Leaflet
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false })

import "leaflet/dist/leaflet.css"

interface TrackingContentProps {
  orderId: string
}

export default function TrackingContent({ orderId }: TrackingContentProps) {
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(30)
  const [isResumoExpanded, setIsResumoExpanded] = useState(false)
  const [coords, setCoords] = useState<[number, number] | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/tracking/${orderId}`)
      if (!res.ok) throw new Error("Erro ao buscar status")
      const data = await res.json()
      setOrder(data)
      
      // Geocoding if map is not set
      if (!coords && data.endereco) {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.endereco)}&format=json&limit=1`)
        const geoData = await geoRes.json()
        if (geoData && geoData.length > 0) {
          setCoords([parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)])
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [orderId, coords])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // 🔄 POLLING LOGIC
  useEffect(() => {
    if (loading || !order) return

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchStatus()
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [loading, order, fetchStatus])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <RefreshCcw className="size-10 text-[#1a56db] animate-spin" />
    </div>
  )

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-xl font-bold">Pedido não encontrado</h1>
      <Button onClick={() => router.push('/')} className="mt-4 bg-[#1a56db]">Voltar ao início</Button>
    </div>
  )

  const statusMap: Record<string, number> = {
    'recebido': 1,
    'novo': 1,
    'pendente': 1,
    'accepted': 2,
    'confirmado': 2,
    'preparo': 3,
    'em_preparacao': 3,
    'pronto': 4,
    'no_caminho': 5,
    'shipped': 5,
    'chegou': 5,
    'entregue': 6,
    'completed': 6
  }

  const currentStep = statusMap[order.status] || 1

  const steps = [
    { id: 1, icon: Check, label: "Recebido" },
    { id: 2, icon: X, label: "Confirmado" },
    { id: 3, icon: ShoppingBag, label: "Em preparo" },
    { id: 4, icon: User, label: "Pronto para retirada" },
    { id: 5, icon: Home, label: "No caminho" },
    { id: 6, icon: Check, label: "Entregue" },
  ]

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'recebido':
      case 'novo':
      case 'pendente':
        return { icon: <Check />, text: "Recebemos seu pedido", color: "bg-[#1a1a1a]" }
      case 'em_preparacao':
      case 'preparo':
        return { icon: <span>✏️</span>, text: "Em preparação", color: "bg-[#1a1a1a]" }
      case 'pronto':
        return { icon: <span>📦</span>, text: "Pronto", color: "bg-[#1a1a1a]" }
      case 'no_caminho':
      case 'shipped':
        return { icon: <Truck />, text: "No caminho", color: "bg-[#1a1a1a]" }
      case 'chegou':
        return { icon: <MapPin />, text: "Chegou", color: "bg-[#1a1a1a]" }
      case 'entregue':
      case 'completed':
        return { icon: <Check />, text: "Entregue", color: "bg-[#16a34a]" }
      default:
        return { icon: <Check />, text: "Recebemos seu pedido", color: "bg-[#1a1a1a]" }
    }
  }

  const statusInfo = getStatusInfo(order.status)

  return (
    <div className="min-h-screen bg-white font-sans pb-24 relative">
      <meta name="robots" content="noindex" />

      {/* 🔝 1. HEADER FIXO NO TOPO */}
      <header className="fixed top-0 left-0 right-0 h-[52px] bg-white border-b border-slate-100 flex items-center justify-between px-4 z-[100]">
        <button onClick={() => router.back()} className="p-2">
          <ChevronLeft className="size-6 text-slate-400" />
        </button>
        <div className="flex items-center gap-2 flex-1 justify-center -ml-8">
          <Truck className="size-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-800 uppercase tracking-tight">Delivery</span>
        </div>
        <a 
          href={`https://api.whatsapp.com/send?phone=${order.loja?.whatsapp}`} 
          target="_blank"
          className="bg-[#16a34a] text-white text-[10px] font-bold uppercase py-1.5 px-3 rounded-full flex items-center gap-1.5"
        >
          <MessageCircle className="size-3 fill-white" />
          Contate-nos
        </a>
      </header>

      <div className="pt-[52px]">
        {/* 🔵 2. BANNER AZUL DE FIDELIDADE */}
        {order.pontos > 0 && (
          <div className="bg-[#1a56db] text-white py-3 px-4 text-center">
            <p className="text-xs font-bold tracking-tight">
              Ao completar este pedido, você ganhará {order.pontos} pontos.
            </p>
          </div>
        )}

        {/* 🗺️ 3. MAPA INTERATIVO */}
        <div className="h-[320px] w-full bg-slate-100 relative z-10">
          {coords && (
            <MapContainer center={coords} zoom={14} className="size-full" zoomControl={true}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={coords}>
                <Popup>
                  <div className="text-[10px] font-bold">{order.endereco}</div>
                </Popup>
              </Marker>
            </MapContainer>
          )}
        </div>

        {/* ✅ 4. ÍCONE DE STATUS DO PEDIDO */}
        <div className="py-10 text-center">
          <div className={cn(
            "w-[52px] h-[52px] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg",
            statusInfo.color
          )}>
            <div className="text-white text-xl">
              {statusInfo.icon}
            </div>
          </div>
          <h2 className="text-[28px] font-black text-[#1a1a1a] leading-none mb-1">#{order.numero_pedido}</h2>
          <p className="text-xl font-bold text-[#1a1a1a]">{statusInfo.text}</p>
        </div>

        {/* 📊 5. BARRA DE PROGRESSO — 6 ETAPAS */}
        <div className="px-6 mb-10">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                  step.id < currentStep ? "bg-[#16a34a] text-white" : 
                  step.id === currentStep ? "bg-[#1a1a1a] text-white" : "bg-[#e5e7eb] text-slate-400"
                )}>
                  <step.icon size={14} />
                </div>
                {i < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-[2px] mx-1",
                    step.id < currentStep ? "bg-[#16a34a]" : "border-t-2 border-dashed border-[#d1d5db]"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 🔄 6. BOTÃO "VERIFICAR STATUS" / CONTADOR */}
        <div className="flex justify-center mb-10 px-6">
          <button 
            onClick={() => fetchStatus()}
            disabled={countdown > 0}
            className={cn(
              "w-full max-w-[300px] h-11 rounded-lg flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all",
              countdown > 0 
                ? "bg-[#e5e7eb] text-[#6b7280] cursor-not-allowed" 
                : "bg-[#1a56db] text-white shadow-lg active:scale-95"
            )}
          >
            <RefreshCcw size={16} className={cn(countdown === 0 && "animate-spin")} />
            {countdown > 0 ? `0:${countdown.toString().padStart(2, '0')}` : "Verificar status"}
          </button>
        </div>

        {/* 👤 7. DADOS DO CLIENTE (mascarados) */}
        <div className="px-6 space-y-1 mb-8">
          <p className="text-[13px] text-[#4b5563]">{order.cliente?.nome_mascarado} {order.cliente?.telefone_mascarado}</p>
          <p className="text-[13px] text-[#4b5563] uppercase font-bold tracking-tight">{order.endereco}</p>
          <p className="text-[13px] text-[#4b5563]">{order.codigo_br}</p>
        </div>

        {/* 📋 8. RESUMO DA CONTA (colapsável) */}
        <div className="border-t border-b border-slate-100">
          <button 
            onClick={() => setIsResumoExpanded(!isResumoExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-black uppercase">Resumo da conta</span>
              <span className="text-[13px] text-slate-400 font-medium">{order.produtos?.length} produto(s)</span>
            </div>
            {isResumoExpanded ? <ChevronUp className="size-5 text-slate-400" /> : <ChevronDown className="size-5 text-slate-400" />}
          </button>
          
          {isResumoExpanded && (
            <div className="px-6 pb-4 space-y-3">
              <div className="h-px bg-slate-50 mb-3" />
              {order.produtos?.map((p: any, i: number) => (
                <div key={i} className="flex justify-between text-sm font-medium">
                  <span className="text-slate-600">{p.qtd}x {p.nome}</span>
                  <span className="text-slate-900">R$ {p.valor.toFixed(2)}</span>
                </div>
              ))}
              <div className="h-px bg-slate-50 my-3" />
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500 font-bold uppercase">Subtotal</span>
                <span className="text-slate-900 font-bold">R$ {order.pagamento?.valor.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500 font-bold uppercase">Entrega</span>
                <span className="text-slate-900 font-bold">R$ 0,00</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-slate-900 font-black uppercase">Total</span>
                <span className="text-[#1a56db] font-black">R$ {order.pagamento?.valor.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* 💳 9. STATUS DO PAGAMENTO */}
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] font-black uppercase">Status do pagamento</span>
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
              order.pagamento?.status === 'pago' ? "bg-green-100 text-[#16a34a]" : "bg-[#fff3e0] text-[#f57c00]"
            )}>
              {order.pagamento?.status === 'pago' ? "Pago" : "Não pago"}
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium italic capitalize">
            {order.pagamento?.forma} R$ {order.pagamento?.valor.toFixed(2)} {order.pagamento?.troco > 0 && `| troco R$ ${order.pagamento?.troco.toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* 📱 10. BOTÃO RODAPÉ FIXO — WHATSAPP */}
      <footer className="fixed bottom-0 left-0 right-0 h-[52px] bg-[#16a34a] flex items-center justify-center z-[100]">
        <a 
          href={`https://api.whatsapp.com/send?phone=${order.loja?.whatsapp}`}
          target="_blank"
          className="flex items-center gap-3 text-white font-black uppercase italic text-sm tracking-widest"
        >
          <MessageCircle className="size-5 fill-white" />
          Informe-se sobre seu pedido
        </a>
      </footer>
    </div>
  )
}
