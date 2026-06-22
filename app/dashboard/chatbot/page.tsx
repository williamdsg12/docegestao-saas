"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  Smartphone, Wifi, WifiOff, QrCode, CheckCircle2, 
  ChevronRight, RefreshCw, Settings, Zap, MessageSquare,
  Clock, Star, ShoppingBag, AlertCircle, Gift, HelpCircle,
  Edit3, RotateCcw, Save, Eye, Check, X, Info, Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { QRCodeSVG } from "qrcode.react"

// =============================================
// TIPOS
// =============================================
type MessageKey =
  | "welcome"
  | "absence"
  | "make_order"
  | "promotions"
  | "request_info"
  | "business_hours"
  | "order_received"
  | "order_ready"
  | "order_out_delivery"
  | "order_cancelled"
  | "sales_recovery"
  | "loyalty"

type ConnectionStatus = "disconnected" | "qr_pending" | "connected"

interface MessageConfig {
  key: MessageKey
  label: string
  icon: React.ReactNode
  category: "resolve" | "recover" | "orders" | "evaluate"
  enabled: boolean
  text: string
  variables: string[]
  previewText: string  // texto que aparece no mockup do celular
}

// =============================================
// MENSAGENS PADRÃO PRÉ-PREENCHIDAS
// =============================================
const DEFAULT_MESSAGES: Record<MessageKey, string> = {
  welcome: `Olá, {client.name}! 👋\nSeja muito bem-vindo(a) à {company.name}! 🧁\n\nAqui você encontra opções deliciosas que conquistam já na primeira mordida! 😋\n\n🛒 Aproveite e já garanta o seu pedido — tenho certeza que você vai amar!\n\n🍩 *O que você gostaria de experimentar hoje?*\n👉 {menu.link}`,

  absence: `Olá, {client.name}! 😊\n\nObrigado pelo contato com {company.name}!\nNo momento estamos fora do horário de atendimento. 🕐\n\n⏰ *Nosso horário de funcionamento:*\n{business.hours}\n\nMas você já pode fazer seu pedido pelo nosso cardápio digital e preparamos assim que abrirmos:\n🛒 {menu.link}\n\nAté logo! 💕`,

  make_order: `Olá, {client.name}! 🍰\n\nPara fazer seu pedido é super simples!\n\n👉 Acesse nosso cardápio digital:\n🛒 {menu.link}\n\nLá você encontra todos os nossos produtos com fotos, preços e opções de personalização. Escolha o que quiser e finalize o pedido diretamente pelo site!\n\nQualquer dúvida, é só chamar aqui! 😊`,

  promotions: `🎉 *Promoções especiais da {company.name}!*\n\nOlá, {client.name}! Temos novidades imperdíveis para você:\n\n🔥 Confira todas as promoções no cardápio:\n🛒 {menu.link}\n\nAproveite enquanto durar! ⏰`,

  request_info: `Olá, {client.name}! 📋\n\nAqui estão as informações da {company.name}:\n\n📍 *Endereço:* {company.address}\n📞 *Telefone:* {company.phone}  \n⏰ *Horários:* {business.hours}\n🛵 *Delivery:* Disponível na sua região\n\n🛒 *Faça seu pedido:* {menu.link}\n\nAlguma outra dúvida? Estamos aqui! 💬`,

  business_hours: `⏰ *Horários de atendimento da {company.name}*\n\n{business.hours}\n\n🛒 Você pode fazer seu pedido a qualquer hora pelo nosso cardápio digital e processamos quando abrirmos:\n{menu.link}\n\nAté logo! 👋`,

  order_received: `✅ *Pedido #{order.code} confirmado!*\n\nOlá, {client.name}! Recebemos seu pedido com sucesso! 🎉\n\n📋 *Resumo:*\n{order.items}\n\n💰 *Total:* R$ {order.total}\n⏱ *Previsão:* {order.time} minutos\n\nVamos preparar tudo com muito carinho! 🧁\nAvisaremos assim que estiver pronto!`,

  order_ready: `🎉 *Seu pedido está pronto, {client.name}!*\n\nPedido *#{order.code}* prontinho esperando por você! ✨\n\n{delivery.type_message}\n\nObrigado por escolher a {company.name}! 💕`,

  order_out_delivery: `🛵 *Pedido #{order.code} saiu para entrega!*\n\n{client.name}, seu pedido está a caminho! 🎉\n\n📍 *Endereço de entrega:* {delivery.address}\n⏱ *Previsão de chegada:* {order.time} minutos\n\nAguarde na porta, já chegamos! 😊`,

  order_cancelled: `😔 *Pedido #{order.code} cancelado*\n\nOlá, {client.name}, infelizmente precisamos cancelar seu pedido.\n\n*Motivo:* {cancel.reason}\n\nSe tiver dúvidas ou quiser fazer um novo pedido:\n🛒 {menu.link}\n\nPedimos desculpas pelo inconveniente! 💙`,

  sales_recovery: `Ei, {client.name}! 😊 Sentimos muito a sua falta!\n\nFaz um tempinho que você não vem até a {company.name}...\n\n🍰 Temos muitas novidades deliciosas esperando por você!\n\n🎁 *Presente especial:* Use o cupom *{discount.code}* e ganhe {discount.value}% de desconto no seu próximo pedido!\n\n🛒 Veja o cardápio: {menu.link}\n\nVálido por {discount.expiry} dias! Corre! ⏰`,

  loyalty: `🌟 *Parabéns, {client.name}!*\n\nVocê acabou de ganhar *{loyalty.points} pontos* no programa de fidelidade da {company.name}! \n\n🏆 *Seu saldo atual:* {loyalty.total} pontos\n{loyalty.reward_message}\n\nContinue pedindo e desbloqueie recompensas incríveis! 🎁\n🛒 {menu.link}`,
}

// =============================================
// CATEGORIAS E ESTRUTURA DAS MENSAGENS
// =============================================
const MESSAGE_CONFIGS: MessageConfig[] = [
  // Categoria: Recuperador de Vendas
  {
    key: "sales_recovery",
    label: "Recuperador de Vendas",
    icon: <Zap size={16} />,
    category: "recover",
    enabled: false,
    text: DEFAULT_MESSAGES.sales_recovery,
    variables: ["{client.name}", "{company.name}", "{discount.code}", "{discount.value}", "{discount.expiry}", "{menu.link}"],
    previewText: "Ei, Maria! 😊 Sentimos sua falta!\n\nTemos novidades deliciosas esperando...\n\n🎁 Use o cupom VOLTEI10 e ganhe 10% OFF!\n\n🛒 Ver cardápio →",
  },
  {
    key: "promotions",
    label: "Desconto para novos clientes",
    icon: <Gift size={16} />,
    category: "recover",
    enabled: false,
    text: DEFAULT_MESSAGES.promotions,
    variables: ["{client.name}", "{company.name}", "{menu.link}"],
    previewText: "🎉 Promoções especiais!\n\nOlá! Temos novidades imperdíveis...\n\n🛒 Ver cardápio →",
  },
  // Categoria: Resolve perguntas
  {
    key: "welcome",
    label: "Mensagem de boas-vindas",
    icon: <MessageSquare size={16} />,
    category: "resolve",
    enabled: true,
    text: DEFAULT_MESSAGES.welcome,
    variables: ["{client.name}", "{company.name}", "{menu.link}"],
    previewText: "Olá, João! 👋\nSeja bem-vindo(a) à Doce Gestão! 🧁\n\nAqui você encontra opções deliciosas...\n\n🍩 O que você gostaria de experimentar hoje?\n👉 Ver cardápio",
  },
  {
    key: "absence",
    label: "Mensagem de ausência",
    icon: <Clock size={16} />,
    category: "resolve",
    enabled: true,
    text: DEFAULT_MESSAGES.absence,
    variables: ["{client.name}", "{company.name}", "{business.hours}", "{menu.link}"],
    previewText: "Olá! 😊\n\nObrigado pelo contato!\nNo momento estamos fechados. 🕐\n\n⏰ Seg–Sex: 08h às 18h\nSáb: 08h às 14h\n\n🛒 Mas já pode pedir aqui →",
  },
  {
    key: "make_order",
    label: "Mensagem para fazer um pedido",
    icon: <ShoppingBag size={16} />,
    category: "resolve",
    enabled: true,
    text: DEFAULT_MESSAGES.make_order,
    variables: ["{client.name}", "{company.name}", "{menu.link}"],
    previewText: "Olá! 🍰\n\nPara fazer seu pedido é simples!\n\n👉 Acesse nosso cardápio:\n🛒 cardapio.docegestao.com\n\nEscolha e finalize direto pelo site!",
  },
  {
    key: "request_info",
    label: "Mensagem para solicitar informações",
    icon: <Info size={16} />,
    category: "resolve",
    enabled: false,
    text: DEFAULT_MESSAGES.request_info,
    variables: ["{client.name}", "{company.name}", "{company.address}", "{company.phone}", "{business.hours}", "{menu.link}"],
    previewText: "Olá! 📋\n\nInformações da nossa loja:\n\n📍 Rua das Flores, 123\n📞 (44) 99999-0000\n⏰ Seg–Sex: 08h–18h\n\n🛒 Cardápio digital →",
  },
  {
    key: "business_hours",
    label: "Mensagem de horários de atendimento",
    icon: <Clock size={16} />,
    category: "resolve",
    enabled: false,
    text: DEFAULT_MESSAGES.business_hours,
    variables: ["{company.name}", "{business.hours}", "{menu.link}"],
    previewText: "⏰ Horários de atendimento:\n\nSeg–Sex: 08h às 18h\nSábado: 08h às 14h\nDomingo: Fechado\n\n🛒 Pedidos online →",
  },
  // Categoria: Status do Pedido
  {
    key: "order_received",
    label: "Pedido recebido",
    icon: <CheckCircle2 size={16} />,
    category: "orders",
    enabled: true,
    text: DEFAULT_MESSAGES.order_received,
    variables: ["{client.name}", "{order.code}", "{order.items}", "{order.total}", "{order.time}", "{company.name}"],
    previewText: "✅ Pedido #A1B2 confirmado!\n\nOlá, João! Recebemos seu pedido! 🎉\n\n📋 1x Bolo de Limão — R$ 45,00\n\n💰 Total: R$ 56,99\n⏱ Previsão: 40 minutos",
  },
  {
    key: "order_ready",
    label: "Pedido pronto",
    icon: <CheckCircle2 size={16} />,
    category: "orders",
    enabled: true,
    text: DEFAULT_MESSAGES.order_ready,
    variables: ["{client.name}", "{order.code}", "{delivery.type_message}", "{company.name}"],
    previewText: "🎉 Seu pedido está pronto, João!\n\nPedido #A1B2 prontinho! ✨\n\n🏠 Retire no balcão quando quiser!\n\nObrigado por escolher a Doce Gestão! 💕",
  },
  {
    key: "order_out_delivery",
    label: "Pedido saiu para entrega",
    icon: <Smartphone size={16} />,
    category: "orders",
    enabled: true,
    text: DEFAULT_MESSAGES.order_out_delivery,
    variables: ["{client.name}", "{order.code}", "{delivery.address}", "{order.time}"],
    previewText: "🛵 Pedido #A1B2 saiu para entrega!\n\nJoão, seu pedido está a caminho! 🎉\n\n📍 Rua Turim, 765 — Cascavel Velho\n⏱ Previsão: 25 minutos\n\nAguarde, já chegamos! 😊",
  },
  {
    key: "order_cancelled",
    label: "Pedido cancelado",
    icon: <X size={16} />,
    category: "orders",
    enabled: true,
    text: DEFAULT_MESSAGES.order_cancelled,
    variables: ["{client.name}", "{order.code}", "{cancel.reason}", "{menu.link}"],
    previewText: "😔 Pedido #A1B2 cancelado\n\nOlá, João, precisamos cancelar seu pedido.\n\nMotivo: Item indisponível no momento.\n\n🛒 Fazer novo pedido →\n\nPedimos desculpas! 💙",
  },
  // Categoria: Fidelidade
  {
    key: "loyalty",
    label: "Programa de fidelidade",
    icon: <Star size={16} />,
    category: "evaluate",
    enabled: false,
    text: DEFAULT_MESSAGES.loyalty,
    variables: ["{client.name}", "{company.name}", "{loyalty.points}", "{loyalty.total}", "{loyalty.reward_message}", "{menu.link}"],
    previewText: "🌟 Parabéns, João!\n\nVocê ganhou 50 pontos de fidelidade! 🎉\n\n🏆 Saldo atual: 150 pontos\n\n🎁 Faltam 50 pontos para ganhar um doce grátis!\n\n🛒 Continuar pedindo →",
  },
]

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function ChatbotPage() {
  const { profile } = useBusiness()
  const tenantId = profile?.tenant_id || profile?.company_id

  const [status, setStatus]         = useState<ConnectionStatus>('disconnected')
  const [qrCode, setQrCode]         = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [qrAttempts, setQrAttempts] = useState(0)
  const [messages, setMessages] = useState<MessageConfig[]>(MESSAGE_CONFIGS)
  const [selected, setSelected] = useState<MessageKey>("welcome")
  const [editText, setEditText] = useState(DEFAULT_MESSAGES.welcome)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const maxAttempts = 40 // 40 × 3s = 2 minutos de tentativas

  const selectedMsg = messages.find(m => m.key === selected)!

  // ─── Verifica status ──────────────────────────────
  const checkConnectionStatus = useCallback(async () => {
    if (!tenantId) return

    try {
      const res = await fetch(
        `/api/chatbot/session?tenantId=${tenantId}&t=${Date.now()}`, // cache bust
        { cache: 'no-store' }
      )
      if (!res.ok) return

      const data = await res.json()
      console.log('[Chatbot] Status check:', data) // debug — remova depois

      if (data.status === 'connected') {
        setStatus('connected')
        setPhoneNumber(data.phone_number)
        setQrCode(null)
        stopPolling()
        return
      }

      if (data.qr_code && data.qr_code.length > 10) {
        setQrCode(data.qr_code)
        setStatus('qr_pending')
      }

      setQrAttempts(prev => {
        const next = prev + 1
        if (next >= maxAttempts) {
          stopPolling()
          setStatus('disconnected')
          setIsConnecting(false)
          toast.error('Tempo esgotado. Tente conectar novamente.')
        }
        return next
      })

    } catch (err) {
      console.error('[Chatbot] Erro no polling:', err)
    }
  }, [tenantId])

  // ─── Inicia/para polling ───────────────────────────
  const startPolling = useCallback(() => {
    stopPolling()
    setQrAttempts(0)
    pollingRef.current = setInterval(checkConnectionStatus, 3000)
    // Primeira checagem imediata após 1.5s (dá tempo do service gerar o QR)
    setTimeout(checkConnectionStatus, 1500)
  }, [checkConnectionStatus])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  useEffect(() => () => stopPolling(), [stopPolling]) // cleanup

  // ─── Conectar ─────────────────────────────────────
  const handleConnect = async () => {
    if (!tenantId) return
    setIsConnecting(true)
    setQrCode(null)
    setStatus('qr_pending')

    try {
      const res = await fetch('/api/chatbot/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, action: 'start' }),
      })
      const data = await res.json()
      console.log('[Chatbot] Start response:', data)
    } catch (err) {
      console.error('[Chatbot] Erro ao iniciar:', err)
      toast.error('Erro ao conectar com o serviço WhatsApp. Verifique se está rodando.')
      setStatus('disconnected')
      setIsConnecting(false)
      return
    }

    // Inicia polling para detectar o QR e depois a conexão
    startPolling()
    setIsConnecting(false)
  }

  // ─── Carregar configurações do banco ──────────────
  useEffect(() => {
    if (!tenantId) return
    loadSettings()
    checkConnectionStatus()
  }, [tenantId, checkConnectionStatus])

  const loadSettings = async () => {
    const { data } = await supabase
      .from("chatbot_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()

    if (data) {
      setMessages(prev => prev.map(m => ({
        ...m,
        enabled: data[`${m.key}_enabled`] ?? m.enabled,
        text: data[`msg_${m.key}`] ?? m.text,
      })))
    }
  }

  const handleDisconnect = async () => {
    if (!tenantId) return
    await fetch("/api/chatbot/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, action: "disconnect" }),
    })
    setStatus("disconnected")
    setQrCode(null)
    setPhoneNumber(null)
    toast.success("WhatsApp desconectado")
  }

  const handleSelectMessage = (key: MessageKey) => {
    setSelected(key)
    const msg = messages.find(m => m.key === key)
    setEditText(msg?.text || DEFAULT_MESSAGES[key])
  }

  const handleToggleMessage = async (key: MessageKey, enabled: boolean) => {
    setMessages(prev => prev.map(m => m.key === key ? { ...m, enabled } : m))
    if (!tenantId) return
    await supabase.from("chatbot_settings")
      .upsert({ tenant_id: tenantId, [`${key}_enabled`]: enabled }, { onConflict: "tenant_id" })
  }

  const handleSaveMessage = async () => {
    if (!tenantId) return
    setIsSaving(true)
    setMessages(prev => prev.map(m => m.key === selected ? { ...m, text: editText } : m))
    const { error } = await supabase.from("chatbot_settings")
      .upsert(
        { tenant_id: tenantId, [`msg_${selected}`]: editText },
        { onConflict: "tenant_id" }
      )
    setIsSaving(false)
    if (error) toast.error("Erro ao salvar")
    else toast.success("Mensagem salva com sucesso!")
  }

  const handleRestoreDefault = () => {
    setEditText(DEFAULT_MESSAGES[selected])
    toast.info("Texto restaurado para o padrão")
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("msg-editor") as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = editText.slice(0, start) + variable + editText.slice(end)
    setEditText(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }

  const handleAIRewrite = async () => {
    if (!editText.trim()) {
      toast.error('O texto não pode estar vazio para usar a IA.')
      return
    }
    setIsGeneratingAI(true)
    const toastId = toast.loading('A IA está reescrevendo sua mensagem...')
    try {
      const res = await fetch('/api/chatbot/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: editText, 
          type: selectedMsg.label,
          companyName: (profile as any)?.name || (profile as any)?.company_name || (profile as any)?.business_name || ''
        }),
      })
      if (!res.ok) throw new Error('Falha ao reescrever')
      const data = await res.json()
      if (data.result) {
        setEditText(data.result)
        toast.success('Mensagem aprimorada com sucesso!', { id: toastId })
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err: any) {
      toast.error('Erro ao aprimorar com IA: ' + err.message, { id: toastId })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const categoryLabels = {
    recover: "Recuperador de Vendas",
    resolve: "Resolva as perguntas dos seus clientes",
    orders:  "Atualizações de Pedidos",
    evaluate:"Obtenha avaliações dos seus clientes",
  }
  const categories = ["recover", "resolve", "orders", "evaluate"] as const
  const uniqueMessages = messages.filter(
    (m, i, arr) => arr.findIndex(x => x.key === m.key && x.category === m.category) === i
  )

  return (
    <div className="chatbot-layout bg-white rounded-xl shadow-sm border border-gray-100">
      {/* ── HEADER DE CONEXÃO ── */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full",
            status === "connected" ? "bg-green-500 animate-pulse" :
            status === "qr_pending" ? "bg-yellow-400 animate-pulse" :
            "bg-gray-300"
          )} />
          <div>
            <p className="font-semibold text-gray-800 text-sm">
              {status === "connected"
                ? `WhatsApp conectado${phoneNumber ? ` — ${phoneNumber}` : ""}`
                : status === "qr_pending"
                ? "Aguardando leitura do QR Code..."
                : "WhatsApp não conectado"}
            </p>
            <p className="text-xs text-gray-400">
              {status === "connected"
                ? "Chatbot ativo e respondendo automaticamente"
                : "Conecte seu WhatsApp para ativar o chatbot"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === "connected" ? (
            <>
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs shadow-none">
                <Check size={10} className="mr-1" /> Ativo
              </Badge>
              <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-red-500 border-red-200 hover:bg-red-50">
                <WifiOff size={14} className="mr-1.5" /> Desconectar
              </Button>
            </>
          ) : status === "qr_pending" ? (
            <Button variant="outline" size="sm" onClick={checkConnectionStatus}>
              <RefreshCw size={14} className="mr-1.5" /> Verificar conexão
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
              size="sm"
            >
              <QrCode size={14} className="mr-1.5" />
              {isConnecting ? "Iniciando..." : "Conectar WhatsApp"}
            </Button>
          )}
        </div>
      </div>

      {/* ── MODAL QR CODE ── */}
      {status === "qr_pending" && (
        <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-5 shadow-sm">
          <div className="bg-white rounded-xl p-3 shadow-sm border flex-shrink-0">
            {qrCode ? (
              <QRCodeSVG value={qrCode} size={160} level="M" />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center">
                <RefreshCw size={32} className="animate-spin text-amber-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 mb-1">
              📱 Escaneie o QR Code com seu WhatsApp
            </h3>
            <ol className="text-sm text-amber-700 space-y-1.5 list-decimal list-inside font-medium">
              <li>Abra o WhatsApp no seu celular</li>
              <li>Toque em <strong>Configurações</strong> (ícone de engrenagem)</li>
              <li>Toque em <strong>Aparelhos conectados</strong></li>
              <li>Toque em <strong>Conectar um aparelho</strong></li>
              <li>Aponte a câmera para este QR Code</li>
            </ol>
            <p className="text-xs text-amber-500 mt-3 flex items-center gap-1 font-semibold">
              <RefreshCw size={11} className="animate-spin" />
              QR Code atualiza automaticamente a cada 20 segundos
            </p>
          </div>
        </div>
      )}

      {/* ── CORPO PRINCIPAL: 2 COLUNAS ── */}
      <div className="flex flex-1 overflow-hidden h-full">

        {/* ── COLUNA ESQUERDA: LISTA DE MENSAGENS ── */}
        <div className="w-[340px] flex-shrink-0 border-r border-gray-200 bg-gray-50/50 overflow-y-auto">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
              Mensagens automáticas
            </h2>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">
              Personalize os textos do robô.
            </p>
          </div>

          {categories.map(cat => {
            const catMessages = uniqueMessages.filter(m => m.category === cat)
            if (catMessages.length === 0) return null
            return (
              <div key={cat} className="mb-4">
                <div className="px-5 py-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {categoryLabels[cat]}
                  </p>
                </div>

                <div className="mx-3 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  {catMessages.map((msg, idx) => (
                    <button
                      key={`${msg.category}-${msg.key}`}
                      onClick={() => handleSelectMessage(msg.key)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3.5 text-left transition-all",
                        idx !== catMessages.length - 1 ? "border-b border-gray-50" : "",
                        selected === msg.key
                          ? "bg-blue-50/50"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={cn(
                          "flex-shrink-0 size-8 rounded-lg flex items-center justify-center",
                          selected === msg.key ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                        )}>
                          {msg.icon}
                        </span>
                        <div className="min-w-0">
                          <span className={cn(
                            "text-xs truncate block font-semibold",
                            selected === msg.key ? "text-blue-700" : "text-gray-700"
                          )}>
                            {msg.label}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium truncate block mt-0.5">
                            {msg.enabled ? '🟢 Ativo' : '⚪ Desativado'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className={cn(
                          "flex-shrink-0 ml-2 transition-transform duration-300",
                          selected === msg.key ? "text-blue-500 rotate-90" : "text-gray-300"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          <div className="h-10" />
        </div>

        {/* ── COLUNA DIREITA: EDITOR + PREVIEW ── */}
        <div className="flex-1 overflow-y-auto bg-white/50">
          <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
            <div className="mb-6">
              <h3 className="text-blue-600 font-bold text-lg flex items-center gap-2">
                {selectedMsg?.icon}
                {selectedMsg?.label}
              </h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                {getMessageDescription(selected)}
              </p>
            </div>

            <div className="flex gap-8 flex-1">
              {/* Editor */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-5 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-gray-800">Ativar esta mensagem</p>
                    <p className="text-xs text-gray-500 font-medium">O bot enviará automaticamente quando necessário</p>
                  </div>
                  <Switch
                    checked={selectedMsg?.enabled ?? false}
                    onCheckedChange={(v) => handleToggleMessage(selected, v)}
                  />
                </div>

                <div className="mb-3">
                  <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">
                    Variáveis dinâmicas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMsg?.variables.map(v => (
                      <button
                        key={v}
                        onClick={() => insertVariable(v)}
                        className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-lg px-3 py-1.5 hover:bg-blue-100 hover:border-blue-200 font-mono font-medium transition-colors shadow-sm"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  id="msg-editor"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="flex-1 min-h-[300px] font-mono text-sm resize-none border-gray-200 focus:border-blue-400 focus:ring-blue-100 rounded-xl p-4 shadow-sm"
                  placeholder="Digite a mensagem..."
                />

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRestoreDefault}
                      className="text-gray-500 hover:text-gray-700 font-bold"
                    >
                      <RotateCcw size={14} className="mr-2" />
                      Restaurar Padrão
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAIRewrite}
                      disabled={isGeneratingAI}
                      className="text-purple-600 border-purple-200 hover:bg-purple-50 font-bold shadow-sm"
                    >
                      <Sparkles size={14} className={cn("mr-2", isGeneratingAI ? "animate-pulse" : "")} />
                      {isGeneratingAI ? "Gerando..." : "Melhorar com IA"}
                    </Button>
                  </div>
                  <Button
                    onClick={handleSaveMessage}
                    disabled={isSaving}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-bold shadow-md shadow-blue-500/20 rounded-xl h-10"
                  >
                    <Save size={16} className="mr-2" />
                    {isSaving ? "Salvando..." : "Salvar Configuração"}
                  </Button>
                </div>
              </div>

              {/* Preview mockup de celular */}
              <div className="w-[300px] flex-shrink-0">
                <p className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-1">
                  <Eye size={12} /> Preview da Mensagem
                </p>

                <div className="relative mx-auto w-[280px]">
                  <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl border-4 border-gray-800">
                    <div className="bg-[#e5ddd5] rounded-[1.8rem] overflow-hidden flex flex-col h-[500px]">
                      
                      {/* Status bar */}
                      <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm z-10">
                        <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-sm font-bold text-green-800 shadow-inner">
                          {profile?.business_name?.[0] || "D"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-bold truncate">
                            {profile?.business_name || "Doce Gestão"}
                          </p>
                          <p className="text-green-100 text-[10px] font-medium mt-0.5 tracking-wide">online</p>
                        </div>
                        <Wifi size={14} className="text-white opacity-80" />
                      </div>

                      {/* Chat area */}
                      <div
                        className="flex-1 p-3 space-y-3 overflow-y-auto"
                        style={{
                          background: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%23e5ddd5'/%3E%3C/svg%3E\")",
                        }}
                      >
                        <div className="flex justify-center mb-4">
                           <span className="bg-[#e1f3fb] text-[#556976] text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-sm">Hoje</span>
                        </div>

                        {/* Mensagem do cliente */}
                        <div className="flex justify-end">
                          <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%] shadow-sm relative">
                            <p className="text-xs text-gray-800 font-medium">Olá, bom dia</p>
                            <p className="text-[9px] text-gray-500 text-right mt-1 font-bold">12:44 ✓✓</p>
                          </div>
                        </div>

                        {/* Resposta do bot */}
                        <div className="flex justify-start">
                          <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2.5 max-w-[90%] shadow-sm relative">
                            <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                              {editText || selectedMsg?.previewText || "..."}
                            </p>
                            <p className="text-[9px] text-gray-400 text-right mt-1.5 font-bold">12:45</p>
                          </div>
                        </div>
                      </div>

                      {/* Input bar */}
                      <div className="bg-[#f0f0f0] px-3 py-2.5 flex items-center gap-2 shrink-0">
                        <div className="flex-1 bg-white rounded-full px-4 py-2 shadow-sm">
                          <p className="text-[11px] text-gray-400 font-medium">Mensagem</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center shadow-sm">
                          <span className="text-white text-[12px] font-black">▶</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getMessageDescription(key: MessageKey): string {
  const descriptions: Record<MessageKey, string> = {
    welcome: "Responda automaticamente aos clientes que iniciam uma conversa no WhatsApp.",
    absence: "Enviada automaticamente fora do horário de funcionamento.",
    make_order: "Enviada quando o cliente perguntar como fazer um pedido.",
    promotions: "Enviada para divulgar promoções e novidades.",
    request_info: "Enviada quando o cliente pedir informações sobre a loja.",
    business_hours: "Enviada quando o cliente perguntar sobre horários de funcionamento.",
    order_received: "Enviada automaticamente assim que um novo pedido é aceito.",
    order_ready: "Enviada quando o pedido é marcado como pronto.",
    order_out_delivery: "Enviada quando o pedido sai para entrega.",
    order_cancelled: "Enviada quando um pedido é cancelado.",
    sales_recovery: "Enviada automaticamente para clientes que não pedem há vários dias.",
    loyalty: "Enviada após o cliente acumular pontos no programa de fidelidade.",
  }
  return descriptions[key] || ""
}
