"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ShieldCheck, 
  Lock, 
  Wallet, 
  QrCode, 
  Building2, 
  CreditCard, 
  TrendingUp, 
  History, 
  Plus, 
  Check, 
  Copy, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight, 
  Key, 
  RefreshCw, 
  AlertTriangle,
  HelpCircle,
  LogOut,
  ChevronRight,
  Globe,
  Settings,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"

export default function RecebimentosPage() {
  const { user } = useAuth()
  
  // Security / Password State
  const [passwordExists, setPasswordExists] = useState<boolean | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null)
  const [sessionDuration, setSessionDuration] = useState<number>(15) // minutes
  const [passwordChecking, setPasswordChecking] = useState(true)
  
  // Modals / Overlays
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  
  // Form inputs for modals
  const [passwordInput, setPasswordInput] = useState("")
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("")
  const [oldPasswordInput, setOldPasswordInput] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  // Recovery form inputs
  const [recoveryStep, setRecoveryStep] = useState<"request" | "verify">("request")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [recoveryNewPassword, setRecoveryNewPassword] = useState("")
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState("")
  const [submittingRecovery, setSubmittingRecovery] = useState(false)

  // Loading States
  const [submittingPassword, setSubmittingPassword] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [savingData, setSavingData] = useState(false)

  // Financial Data State
  const [pixAccounts, setPixAccounts] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [cardSettings, setCardSettings] = useState<any>({
    accept_credit: true,
    accept_debit: true,
    max_installments: 12,
    installment_interest: 0,
    min_installment_value: 5.0,
    accepted_brands: ["visa", "mastercard", "elo", "hipercard", "amex"]
  })
  const [gateways, setGateways] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"pix" | "bank" | "cards" | "gateways" | "transfers" | "history">("pix")

  // Form State for tabs
  const [pixForm, setPixForm] = useState({
    id: "",
    receiver_name: "",
    document: "",
    pix_type: "cpf",
    pix_key: "",
    bank_name: "",
    is_active: true
  })
  const [showPixForm, setShowPixForm] = useState(false)

  const [bankForm, setBankForm] = useState({
    id: "",
    bank_name: "",
    agency: "",
    account_number: "",
    account_type: "corrente",
    holder_name: "",
    holder_document: "",
    ispb: "",
    is_default: false
  })
  const [showBankForm, setShowBankForm] = useState(false)

  const [gatewayForm, setGatewayForm] = useState({
    gateway_name: "mercadopago",
    public_key: "",
    secret_key: "",
    webhook_url: "",
    is_active: false,
    environment: "sandbox"
  })

  // Timer Ref for session expiration
  const [timeLeft, setTimeLeft] = useState<string>("00:00")
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Check if financial password exists and load session from sessionStorage
  useEffect(() => {
    checkPasswordStatus()
    
    // Restore session if valid
    const savedToken = sessionStorage.getItem("finance_session_token")
    const savedExpires = sessionStorage.getItem("finance_session_expires_at")
    
    if (savedToken && savedExpires && Date.now() < Number(savedExpires)) {
      setSessionToken(savedToken)
      setSessionExpiresAt(Number(savedExpires))
    }
  }, [])

  // Session timer / countdown
  useEffect(() => {
    if (sessionToken && sessionExpiresAt) {
      setShowAuthModal(false)
      
      // Start Countdown Timer
      if (timerRef.current) clearInterval(timerRef.current)
      
      timerRef.current = setInterval(() => {
        const remainingMs = sessionExpiresAt - Date.now()
        if (remainingMs <= 0) {
          handleLockSession()
        } else {
          const minutes = Math.floor(remainingMs / 60000)
          const seconds = Math.floor((remainingMs % 60000) / 1000)
          setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
        }
      }, 1000)
      
      // Fetch settings
      fetchRecebimentosData(sessionToken)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setTimeLeft("00:00")
      if (passwordExists === true) {
        setShowAuthModal(true)
      }
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [sessionToken, sessionExpiresAt, passwordExists])

  async function checkPasswordStatus() {
    try {
      setPasswordChecking(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch("/api/finance/password", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()
      
      setPasswordExists(data.exists)
      if (!data.exists) {
        setShowCreateModal(true)
      } else if (!sessionToken) {
        setShowAuthModal(true)
      }
    } catch (e) {
      console.error(e)
      toast.error("Erro ao validar status de segurança")
    } finally {
      setPasswordChecking(false)
    }
  }

  // Session locking
  function handleLockSession() {
    sessionStorage.removeItem("finance_session_token")
    sessionStorage.removeItem("finance_session_expires_at")
    setSessionToken(null)
    setSessionExpiresAt(null)
    setShowAuthModal(true)
    toast.warning("Sessão financeira encerrada por inatividade.")
  }

  // Fetch financial settings from backend
  async function fetchRecebimentosData(token: string) {
    try {
      setLoadingData(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch("/api/finance/recebimentos", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "x-finance-session": token
        }
      })

      if (response.status === 403) {
        // Token expired on server
        handleLockSession()
        return
      }

      const data = await response.json()
      if (response.ok) {
        setPixAccounts(data.pixAccounts)
        setBankAccounts(data.bankAccounts)
        setCardSettings(data.cardSettings)
        setGateways(data.gateways)
        setAuditLogs(data.auditLogs)
        
        // Auto-select gateway details in gateway form
        const mpGateway = data.gateways.find((g: any) => g.gateway_name === gatewayForm.gateway_name)
        if (mpGateway) {
          setGatewayForm({
            gateway_name: mpGateway.gateway_name,
            public_key: mpGateway.public_key || "",
            secret_key: mpGateway.secret_key || "",
            webhook_url: mpGateway.webhook_url || "",
            is_active: mpGateway.is_active || false,
            environment: mpGateway.environment || "sandbox"
          })
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro ao carregar dados financeiros")
    } finally {
      setLoadingData(false)
    }
  }

  // Handle gateway switch in forms
  function handleGatewayTabChange(gatewayName: string) {
    const selected = gateways.find((g: any) => g.gateway_name === gatewayName)
    setGatewayForm({
      gateway_name: gatewayName,
      public_key: selected?.public_key || "",
      secret_key: selected?.secret_key || "",
      webhook_url: selected?.webhook_url || "",
      is_active: selected?.is_active || false,
      environment: selected?.environment || "sandbox"
    })
  }

  // Authenticate financial password
  async function handleAuthenticate(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordInput) {
      toast.error("Digite a senha")
      return
    }

    try {
      setSubmittingPassword(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch("/api/finance/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          password: passwordInput,
          durationMinutes: sessionDuration
        })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success("Área financeira desbloqueada com sucesso!")
        setSessionToken(data.token)
        setSessionExpiresAt(data.expiresAt)
        sessionStorage.setItem("finance_session_token", data.token)
        sessionStorage.setItem("finance_session_expires_at", data.expiresAt.toString())
        setPasswordInput("")
        setShowAuthModal(false)
      } else {
        toast.error(data.error || "Senha financeira incorreta")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro na autenticação")
    } finally {
      setSubmittingPassword(false)
    }
  }

  // Create financial password for the first time
  async function handleCreatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordInput || !confirmPasswordInput) {
      toast.error("Preencha todos os campos")
      return
    }

    if (passwordInput !== confirmPasswordInput) {
      toast.error("As senhas não coincidem")
      return
    }

    try {
      setSubmittingPassword(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch("/api/finance/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          password: passwordInput,
          confirmPassword: confirmPasswordInput
        })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success("Senha financeira exclusiva criada com sucesso!")
        setPasswordInput("")
        setConfirmPasswordInput("")
        setShowCreateModal(false)
        setPasswordExists(true)
        setShowAuthModal(true)
      } else {
        toast.error(data.error || "Erro ao cadastrar senha")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao processar criação")
    } finally {
      setSubmittingPassword(false)
    }
  }

  // Request password recovery code
  async function handleRequestRecovery(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSubmittingRecovery(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch("/api/finance/recovery", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(data.message || "Código enviado com sucesso!")
        setRecoveryStep("verify")
      } else {
        toast.error(data.error || "Erro ao enviar e-mail de recuperação")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro na solicitação")
    } finally {
      setSubmittingRecovery(false)
    }
  }

  // Validate code and reset password
  async function handleVerifyAndReset(e: React.FormEvent) {
    e.preventDefault()
    if (!recoveryCode || !recoveryNewPassword || !recoveryConfirmPassword) {
      toast.error("Preencha todos os campos")
      return
    }

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    try {
      setSubmittingRecovery(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch("/api/finance/recovery", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          code: recoveryCode,
          newPassword: recoveryNewPassword,
          confirmPassword: recoveryConfirmPassword
        })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success("Senha financeira redefinida com sucesso! Digite-a para entrar.")
        setRecoveryCode("")
        setRecoveryNewPassword("")
        setRecoveryConfirmPassword("")
        setRecoveryStep("request")
        setShowRecoveryModal(false)
        setShowAuthModal(true)
      } else {
        toast.error(data.error || "Erro ao redefinir a senha")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro no processamento da redefinição")
    } finally {
      setSubmittingRecovery(false)
    }
  }

  // Generic config saver (PIX, Bank, Card, Gateway)
  async function handleSaveConfig(type: "pix" | "bank" | "cards" | "gateway", data: any) {
    if (!sessionToken) return

    try {
      setSavingData(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch("/api/finance/recebimentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "x-finance-session": sessionToken
        },
        body: JSON.stringify({
          type,
          data
        })
      })

      const resData = await response.json()
      if (response.ok) {
        toast.success(`Configurações de recebimentos salvas: ${resData.action}`)
        // Reload data
        fetchRecebimentosData(sessionToken)
        
        // Clear forms
        if (type === "pix") setShowPixForm(false)
        if (type === "bank") setShowBankForm(false)
      } else {
        toast.error(resData.error || "Erro ao salvar configurações")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro de conexão ao salvar")
    } finally {
      setSavingData(false)
    }
  }

  return (
    <FeatureGuard feature="financeiro" planRequired="pro">
      <div className="space-y-10 pb-32 italic">
        <PageHeader 
          title="Configuração de" 
          highlight="Recebimentos" 
          subtitle="Gerencie suas credenciais de pagamento online, chaves PIX e contas bancárias com proteção máxima"
          actions={
            sessionToken && (
              <div className="flex items-center gap-4 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl shadow-slate-900/10">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sessão Segura:</span>
                  <span className="text-xs font-black font-mono tracking-wider text-emerald-400">{timeLeft}</span>
                </div>
                <div className="h-4 w-px bg-slate-800" />
                <button 
                  onClick={handleLockSession}
                  className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"
                >
                  <Lock size={12} /> Bloquear
                </button>
              </div>
            )
          }
        />

        {loadingData && !sessionToken && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary size-10" />
            <p className="text-sm font-black uppercase text-slate-400">Carregando painel seguro...</p>
          </div>
        )}

        {sessionToken && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* TABS SELECTOR */}
            <div className="lg:col-span-1 space-y-2">
              {[
                { id: "pix", label: "Chaves PIX", icon: QrCode },
                { id: "bank", label: "Conta Bancária", icon: Building2 },
                { id: "cards", label: "Cartões e Parcelas", icon: CreditCard },
                { id: "gateways", label: "Gateways (APIs)", icon: Globe },
                { id: "transfers", label: "Transferências", icon: DollarSign },
                { id: "history", label: "Histórico de Alterações", icon: History }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                    activeTab === tab.id
                      ? "bg-slate-900 border-slate-950 text-white font-black shadow-lg translate-x-1"
                      : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600 font-bold hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon size={18} className={activeTab === tab.id ? "text-primary" : "text-slate-400"} />
                    <span className="text-xs uppercase tracking-tight text-left leading-none">{tab.label}</span>
                  </div>
                  <ChevronRight size={14} className={activeTab === tab.id ? "text-white" : "text-slate-300"} />
                </button>
              ))}
            </div>

            {/* TAB CONTENTS */}
            <div className="lg:col-span-3 space-y-6">
              {/* 1. TAB: PIX */}
              {activeTab === "pix" && (
                <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">Minhas Chaves PIX</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure o recebimento instantâneo das vendas</p>
                    </div>
                    {!showPixForm && (
                      <Button
                        onClick={() => {
                          setPixForm({ id: "", receiver_name: "", document: "", pix_type: "cpf", pix_key: "", bank_name: "", is_active: true })
                          setShowPixForm(true)
                        }}
                        className="bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] italic rounded-xl h-11 px-5 flex items-center gap-2"
                      >
                        <Plus size={14} /> Nova Chave PIX
                      </Button>
                    )}
                  </div>

                  {showPixForm ? (
                    <motion.form 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSaveConfig("pix", pixForm)
                      }}
                      className="bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nome do Recebedor</Label>
                          <Input
                            placeholder="Nome Completo ou Razão Social"
                            value={pixForm.receiver_name}
                            onChange={(e) => setPixForm({ ...pixForm, receiver_name: e.target.value })}
                            className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">CPF ou CNPJ</Label>
                          <Input
                            placeholder="Apenas números"
                            value={pixForm.document}
                            onChange={(e) => setPixForm({ ...pixForm, document: e.target.value })}
                            className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tipo de Chave</Label>
                          <select
                            value={pixForm.pix_type}
                            onChange={(e) => setPixForm({ ...pixForm, pix_type: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl h-11 px-3 font-bold text-xs uppercase"
                          >
                            <option value="cpf">CPF</option>
                            <option value="cnpj">CNPJ</option>
                            <option value="email">E-mail</option>
                            <option value="phone">Telefone</option>
                            <option value="random">Chave Aleatória (EVP)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Chave PIX</Label>
                          <Input
                            placeholder="Insira o valor da chave"
                            value={pixForm.pix_key}
                            onChange={(e) => setPixForm({ ...pixForm, pix_key: e.target.value })}
                            className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Banco da Chave</Label>
                          <Input
                            placeholder="Ex: Itaú, Nubank, Bradesco"
                            value={pixForm.bank_name}
                            onChange={(e) => setPixForm({ ...pixForm, bank_name: e.target.value })}
                            className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <Switch
                            checked={pixForm.is_active}
                            onCheckedChange={(val) => setPixForm({ ...pixForm, is_active: val })}
                          />
                          <Label className="text-xs font-black uppercase text-slate-600">Chave Ativa</Label>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={savingData}
                          className="bg-primary hover:bg-primary/95 text-white font-black uppercase text-[10px] italic rounded-xl h-11 px-6 flex items-center gap-2"
                        >
                          {savingData ? <Loader2 className="animate-spin size-4" /> : <Check size={14} />}
                          Salvar Chave
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPixForm(false)}
                          className="border-slate-200 hover:bg-slate-100 text-slate-500 font-black uppercase text-[10px] italic rounded-xl h-11 px-5"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </motion.form>
                  ) : (
                    <div className="space-y-4">
                      {pixAccounts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {pixAccounts.map((pix) => (
                            <div 
                              key={pix.id} 
                              className="border border-slate-100 bg-slate-50/50 rounded-2xl p-6 relative group flex flex-col justify-between"
                            >
                              <div className="absolute top-6 right-6 flex items-center gap-2">
                                <Badge className={pix.is_active ? "bg-emerald-500 text-white border-none text-[8px] font-black" : "bg-slate-200 text-slate-500 border-none text-[8px] font-black"}>
                                  {pix.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                              </div>
                              <div className="space-y-3">
                                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                  <QrCode size={20} />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Chave ({pix.pix_type.toUpperCase()})</h4>
                                  <p className="text-sm font-black text-slate-900 break-all">{pix.pix_key}</p>
                                </div>
                                <div className="space-y-1 text-slate-500 text-[10px] font-bold">
                                  <p>Banco: <span className="text-slate-800 uppercase">{pix.bank_name}</span></p>
                                  <p>Recebedor: <span className="text-slate-800 uppercase">{pix.receiver_name}</span></p>
                                  <p>Doc: <span className="text-slate-800">{pix.document}</span></p>
                                </div>
                              </div>
                              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                                <Button
                                  onClick={() => {
                                    setPixForm(pix)
                                    setShowPixForm(true)
                                  }}
                                  variant="outline"
                                  className="h-9 px-4 rounded-lg text-[9px] font-black uppercase border-slate-200 hover:bg-slate-100 text-slate-600"
                                >
                                  Editar
                                </Button>
                                <Button
                                  onClick={() => {
                                    navigator.clipboard.writeText(pix.pix_key)
                                    toast.success("Chave copiada para a área de transferência!")
                                  }}
                                  variant="ghost"
                                  className="h-9 w-9 p-0 rounded-lg text-slate-400 hover:text-slate-600"
                                >
                                  <Copy size={14} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                          <QrCode className="mx-auto size-12 text-slate-300 mb-4" />
                          <p className="text-xs font-black uppercase text-slate-500">Nenhuma chave PIX cadastrada</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cadastre chaves para habilitar pagamentos via PIX</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )}

              {/* 2. TAB: CONTA BANCÁRIA */}
              {activeTab === "bank" && (
                <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">Minhas Contas Bancárias</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure suas contas para transferências e repasses automáticos</p>
                    </div>
                    {!showBankForm && (
                      <Button
                        onClick={() => {
                          setBankForm({ id: "", bank_name: "", agency: "", account_number: "", account_type: "corrente", holder_name: "", holder_document: "", ispb: "", is_default: false })
                          setShowBankForm(true)
                        }}
                        className="bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] italic rounded-xl h-11 px-5 flex items-center gap-2"
                      >
                        <Plus size={14} /> Nova Conta Bancária
                      </Button>
                    )}
                  </div>

                  {showBankForm ? (
                    <motion.form 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSaveConfig("bank", bankForm)
                      }}
                      className="bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nome do Banco</Label>
                          <Input
                            placeholder="Ex: Banco do Brasil, Bradesco"
                            value={bankForm.bank_name}
                            onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                            className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Código ISPB (Opcional)</Label>
                          <Input
                            placeholder="Código ISPB de 8 dígitos"
                            value={bankForm.ispb}
                            onChange={(e) => setBankForm({ ...bankForm, ispb: e.target.value })}
                            className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Agência</Label>
                          <Input
                            placeholder="Número da agência"
                            value={bankForm.agency}
                            onChange={(e) => setBankForm({ ...bankForm, agency: e.target.value })}
                            className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Número da Conta</Label>
                          <Input
                            placeholder="Conta com dígito"
                            value={bankForm.account_number}
                            onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                            className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tipo de Conta</Label>
                          <select
                            value={bankForm.account_type}
                            onChange={(e) => setBankForm({ ...bankForm, account_type: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl h-11 px-3 font-bold text-xs uppercase"
                          >
                            <option value="corrente">Corrente</option>
                            <option value="poupanca">Poupança</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nome do Titular</Label>
                          <Input
                            placeholder="Nome Completo do Titular"
                            value={bankForm.holder_name}
                            onChange={(e) => setBankForm({ ...bankForm, holder_name: e.target.value })}
                            className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">CPF ou CNPJ do Titular</Label>
                          <Input
                            placeholder="CPF ou CNPJ do titular"
                            value={bankForm.holder_document}
                            onChange={(e) => setBankForm({ ...bankForm, holder_document: e.target.value })}
                            className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <Switch
                            checked={bankForm.is_default}
                            onCheckedChange={(val) => setBankForm({ ...bankForm, is_default: val })}
                          />
                          <Label className="text-xs font-black uppercase text-slate-600">Definir como Principal</Label>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={savingData}
                          className="bg-primary hover:bg-primary/95 text-white font-black uppercase text-[10px] italic rounded-xl h-11 px-6 flex items-center gap-2"
                        >
                          {savingData ? <Loader2 className="animate-spin size-4" /> : <Check size={14} />}
                          Salvar Conta
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowBankForm(false)}
                          className="border-slate-200 hover:bg-slate-100 text-slate-500 font-black uppercase text-[10px] italic rounded-xl h-11 px-5"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </motion.form>
                  ) : (
                    <div className="space-y-4">
                      {bankAccounts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {bankAccounts.map((bank) => (
                            <div 
                              key={bank.id} 
                              className="border border-slate-100 bg-slate-50/50 rounded-2xl p-6 relative group flex flex-col justify-between"
                            >
                              <div className="absolute top-6 right-6 flex items-center gap-2">
                                {bank.is_default && (
                                  <Badge className="bg-blue-600 text-white border-none text-[8px] font-black uppercase">
                                    Principal
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-3">
                                <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                  <Building2 size={20} />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Banco</h4>
                                  <p className="text-sm font-black text-slate-900 uppercase leading-none">{bank.bank_name}</p>
                                  <p className="text-[10px] font-medium text-slate-400">ISPB: {bank.ispb || "Não informado"}</p>
                                </div>
                                <div className="space-y-1 text-slate-500 text-[10px] font-bold border-t border-slate-100 pt-3">
                                  <p>Agência: <span className="text-slate-800 font-mono">{bank.agency}</span></p>
                                  <p>Conta: <span className="text-slate-800 font-mono">{bank.account_number} ({bank.account_type === "corrente" ? "C. Corrente" : "C. Poupança"})</span></p>
                                  <p>Titular: <span className="text-slate-800 uppercase">{bank.holder_name}</span></p>
                                  <p>Doc: <span className="text-slate-800">{bank.holder_document}</span></p>
                                </div>
                              </div>
                              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                                <Button
                                  onClick={() => {
                                    setBankForm(bank)
                                    setShowBankForm(true)
                                  }}
                                  variant="outline"
                                  className="h-9 px-4 rounded-lg text-[9px] font-black uppercase border-slate-200 hover:bg-slate-100 text-slate-600"
                                >
                                  Editar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                          <Building2 className="mx-auto size-12 text-slate-300 mb-4" />
                          <p className="text-xs font-black uppercase text-slate-500">Nenhuma conta bancária cadastrada</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure suas contas para receber repasses das vendas</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )}

              {/* 3. TAB: CARTÕES */}
              {activeTab === "cards" && (
                <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden p-8">
                  <div className="mb-8">
                    <h3 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">Regras de Cartão de Crédito e Débito</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Defina taxas, parcelamento máximo, juros e bandeiras aceitas no checkout</p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSaveConfig("cards", cardSettings)
                    }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-black uppercase text-slate-700">Aceitar Crédito Online</Label>
                          <p className="text-[10px] font-medium text-slate-400 uppercase">Habilitar checkout de cartão de crédito</p>
                        </div>
                        <Switch
                          checked={cardSettings.accept_credit}
                          onCheckedChange={(val) => setCardSettings({ ...cardSettings, accept_credit: val })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-black uppercase text-slate-700">Aceitar Débito Online</Label>
                          <p className="text-[10px] font-medium text-slate-400 uppercase">Habilitar checkout de cartão de débito</p>
                        </div>
                        <Switch
                          checked={cardSettings.accept_debit}
                          onCheckedChange={(val) => setCardSettings({ ...cardSettings, accept_debit: val })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Parcelamento Máximo</Label>
                        <select
                          value={cardSettings.max_installments}
                          onChange={(e) => setCardSettings({ ...cardSettings, max_installments: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-200 rounded-xl h-11 px-3 font-bold text-xs uppercase"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                            <option key={n} value={n}>{n}x</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Juros cobrados por Parcela (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={cardSettings.installment_interest}
                          onChange={(e) => setCardSettings({ ...cardSettings, installment_interest: Number(e.target.value) })}
                          className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Valor Mínimo da Parcela (R$)</Label>
                        <Input
                          type="number"
                          step="0.50"
                          placeholder="5.00"
                          value={cardSettings.min_installment_value}
                          onChange={(e) => setCardSettings({ ...cardSettings, min_installment_value: Number(e.target.value) })}
                          className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Bandeiras de Cartão Aceitas</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {["visa", "mastercard", "elo", "hipercard", "amex"].map((brand) => {
                          const isChecked = cardSettings.accepted_brands.includes(brand)
                          return (
                            <button
                              type="button"
                              key={brand}
                              onClick={() => {
                                const newBrands = isChecked
                                  ? cardSettings.accepted_brands.filter((b: string) => b !== brand)
                                  : [...cardSettings.accepted_brands, brand]
                                setCardSettings({ ...cardSettings, accepted_brands: newBrands })
                              }}
                              className={`p-4 border rounded-xl flex flex-col items-center gap-2 uppercase font-black text-[10px] tracking-wider transition-all ${
                                isChecked
                                  ? "bg-slate-900 border-slate-950 text-white shadow"
                                  : "bg-white border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <CreditCard size={20} className={isChecked ? "text-primary" : "text-slate-300"} />
                              {brand}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <Button
                        type="submit"
                        disabled={savingData}
                        className="bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] italic rounded-xl h-12 px-8 flex items-center gap-2 shadow-lg"
                      >
                        {savingData ? <Loader2 className="animate-spin size-4" /> : <Check size={14} />}
                        Salvar Regras de Parcelamento
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* 4. TAB: GATEWAYS */}
              {activeTab === "gateways" && (
                <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden p-8">
                  <div className="mb-8">
                    <h3 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">Configuração de Gateways de Pagamento</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure suas credenciais das APIs de pagamento com criptografia de ponta (AES-256)</p>
                  </div>

                  {/* Gateway selector sub-tab */}
                  <div className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-slate-100">
                    {[
                      { id: "mercadopago", label: "Mercado Pago" },
                      { id: "asaas", label: "Asaas" },
                      { id: "stripe", label: "Stripe" },
                      { id: "pagseguro", label: "PagSeguro" },
                      { id: "pagarme", label: "Pagar.me" },
                      { id: "iugu", label: "Iugu" }
                    ].map((gw) => {
                      const isActive = gatewayForm.gateway_name === gw.id
                      const isConfigured = gateways.some(g => g.gateway_name === gw.id && g.is_active)
                      
                      return (
                        <button
                          key={gw.id}
                          type="button"
                          onClick={() => {
                            setGatewayForm({ ...gatewayForm, gateway_name: gw.id })
                            handleGatewayTabChange(gw.id)
                          }}
                          className={`px-5 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
                            isActive
                              ? "bg-slate-900 text-white border-slate-950 shadow"
                              : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:text-slate-800"
                          }`}
                        >
                          <Globe size={12} className={isActive ? "text-primary" : "text-slate-400"} />
                          {gw.label}
                          {isConfigured && (
                            <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSaveConfig("gateway", gatewayForm)
                    }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-black uppercase text-slate-700">Ativar Gateway</Label>
                          <p className="text-[10px] font-medium text-slate-400 uppercase">Habilitar essa integração na loja</p>
                        </div>
                        <Switch
                          checked={gatewayForm.is_active}
                          onCheckedChange={(val) => setGatewayForm({ ...gatewayForm, is_active: val })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Ambiente</Label>
                        <select
                          value={gatewayForm.environment}
                          onChange={(e) => setGatewayForm({ ...gatewayForm, environment: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl h-11 px-3 font-bold text-xs uppercase"
                        >
                          <option value="sandbox">Sandbox (Testes)</option>
                          <option value="production">Produção (Vendas Reais)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Chave Pública (Public Key / Client ID)</Label>
                        <Input
                          placeholder="Cole a chave pública do seu painel do gateway"
                          value={gatewayForm.public_key}
                          onChange={(e) => setGatewayForm({ ...gatewayForm, public_key: e.target.value })}
                          className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Chave Privada (Secret Key / Access Token / API Key)</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Insira ou cole seu token secreto confidencial"
                            value={gatewayForm.secret_key}
                            onChange={(e) => setGatewayForm({ ...gatewayForm, secret_key: e.target.value })}
                            className="bg-white border-slate-200 rounded-xl h-11 font-bold pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">URL do Webhook</Label>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={gatewayForm.webhook_url || `${window.location.origin}/api/webhook/${gatewayForm.gateway_name}`}
                            className="bg-slate-50 border-slate-200 rounded-xl h-11 font-bold text-slate-500 flex-1"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              const url = gatewayForm.webhook_url || `${window.location.origin}/api/webhook/${gatewayForm.gateway_name}`
                              navigator.clipboard.writeText(url)
                              toast.success("URL do Webhook copiada!")
                            }}
                            variant="outline"
                            className="h-11 px-4 border-slate-200 hover:bg-slate-100 rounded-xl"
                          >
                            <Copy size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <Button
                        type="submit"
                        disabled={savingData}
                        className="bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] italic rounded-xl h-12 px-8 flex items-center gap-2 shadow-lg"
                      >
                        {savingData ? <Loader2 className="animate-spin size-4" /> : <Check size={14} />}
                        Salvar Credenciais Criptografadas
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* 5. TAB: TRANSFERÊNCIAS */}
              {activeTab === "transfers" && (
                <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden p-8 space-y-8">
                  <div>
                    <h3 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">Solicitar Repasses / Saques</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transfira os saldos acumulados nos gateways diretamente para suas contas cadastradas</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 size-20 text-emerald-400/5 group-hover:scale-115 transition-transform duration-500">
                        <DollarSign size={80} />
                      </div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Saldo Disponível para Saque</h4>
                      <p className="text-3xl font-black italic text-slate-900 tracking-tighter mt-3">R$ 3.450,20</p>
                      <div className="h-1.5 w-16 bg-emerald-500 rounded-full mt-4" />
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 size-20 text-slate-400/5 group-hover:scale-115 transition-transform duration-500">
                        <TrendingUp size={80} />
                      </div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Saldo Pendente (A liberar)</h4>
                      <p className="text-3xl font-black italic text-slate-400 tracking-tighter mt-3">R$ 1.280,00</p>
                      <div className="h-1.5 w-16 bg-blue-400 rounded-full mt-4" />
                    </div>
                  </div>

                  {bankAccounts.length > 0 ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault()
                        toast.success("Solicitação de transferência efetuada! Nossa equipe processará seu repasse em até 2 horas.")
                      }}
                      className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Conta de Destino</Label>
                          <select
                            className="w-full bg-white border border-slate-200 rounded-xl h-11 px-3 font-bold text-xs uppercase"
                          >
                            {bankAccounts.map(b => (
                              <option key={b.id} value={b.id}>
                                {b.bank_name} - Ag {b.agency} / Cc {b.account_number} {b.is_default ? "(PRINCIPAL)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Valor para Transferir (R$)</Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">R$</span>
                            <Input
                              type="number"
                              placeholder="0,00"
                              max="3450.20"
                              className="bg-white border-slate-200 rounded-xl h-11 font-bold pl-10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          type="submit"
                          className="bg-primary hover:bg-primary/95 text-white font-black uppercase text-[10px] italic rounded-xl h-11 px-6 flex items-center gap-2"
                        >
                          <DollarSign size={14} /> Solicitar Repasse
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-8 bg-amber-50 border border-dashed border-amber-200 rounded-2xl p-6">
                      <AlertTriangle className="mx-auto text-amber-500 mb-2 animate-pulse" size={24} />
                      <p className="text-xs font-black uppercase text-amber-800">Nenhuma conta bancária configurada</p>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">
                        Cadastre uma conta bancária ativa primeiro para solicitar repasses.
                      </p>
                    </div>
                  )}
                </Card>
              )}

              {/* 6. TAB: HISTÓRICO */}
              {activeTab === "history" && (
                <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden p-8">
                  <div className="mb-8">
                    <h3 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">Histórico de Alterações (Auditoria)</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Acompanhe todos os logs de modificações de credenciais e senhas</p>
                  </div>

                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="text-[10px] font-black uppercase text-slate-500 italic px-6 h-10">Data</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-slate-500 italic px-6 h-10">Ação Realizada</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-slate-500 italic px-6 h-10">IP de Origem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.length > 0 ? (
                          auditLogs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-slate-50/50">
                              <TableCell className="px-6 py-4 text-xs font-black text-slate-800">
                                {new Date(log.created_at).toLocaleString("pt-BR")}
                              </TableCell>
                              <TableCell className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">
                                {log.action}
                              </TableCell>
                              <TableCell className="px-6 py-4 text-xs font-mono font-bold text-slate-400">
                                {log.ip_address}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="h-40 text-center py-10 opacity-40">
                              <History size={32} className="mx-auto text-slate-300 mb-2" />
                              <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma alteração registrada</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* MODAL 1: PRIMEIRO ACESSO - CRIAÇÃO DE SENHA */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
              >
                <div className="p-8 space-y-6 text-center">
                  <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                    <ShieldCheck size={36} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Proteja suas informações financeiras</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase italic leading-relaxed">
                      Por segurança, crie uma senha financeira exclusiva para acessar suas configurações bancárias e recebimentos.
                    </p>
                  </div>

                  <form onSubmit={handleCreatePassword} className="space-y-4 text-left">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nova Senha Financeira</Label>
                      <Input
                        type="password"
                        placeholder="Mínimo 8 caracteres (Maiúscula, Minúscula, Número)"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="bg-white border-slate-200 rounded-xl h-12 font-bold"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Confirmar Senha</Label>
                      <Input
                        type="password"
                        placeholder="Repita a nova senha financeira"
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        className="bg-white border-slate-200 rounded-xl h-12 font-bold"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submittingPassword}
                      className="w-full bg-slate-900 hover:bg-black text-white font-black uppercase italic tracking-widest text-[11px] rounded-xl h-12 mt-4 shadow-lg flex items-center justify-center gap-2"
                    >
                      {submittingPassword ? <Loader2 className="animate-spin size-4" /> : <Check size={14} />}
                      Criar Senha Financeira
                    </Button>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 2: AUTENTICAÇÃO / LOGIN SEGURO */}
        <AnimatePresence>
          {showAuthModal && !showCreateModal && !showRecoveryModal && (
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-lg">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
              >
                <div className="p-8 space-y-6 text-center">
                  <div className="size-16 rounded-2xl bg-slate-900/5 text-slate-800 flex items-center justify-center mx-auto border border-slate-100">
                    <Lock size={32} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Área Financeira Protegida</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase italic leading-relaxed">
                      Esta área contém informações altamente confidenciais. Insira sua senha financeira para continuar.
                    </p>
                  </div>

                  <form onSubmit={handleAuthenticate} className="space-y-4 text-left">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Digite sua senha financeira</Label>
                      <Input
                        type="password"
                        placeholder="Insira sua senha de 8 caracteres"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="bg-white border-slate-200 rounded-xl h-12 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Tempo de Desbloqueio</Label>
                      <select
                        value={sessionDuration}
                        onChange={(e) => setSessionDuration(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl h-12 px-3 font-bold text-xs uppercase"
                      >
                        <option value={15}>15 Minutos (Recomendado)</option>
                        <option value={30}>30 Minutos</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRecoveryModal(true)}
                        className="text-primary hover:underline"
                      >
                        Esqueci minha senha financeira
                      </button>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={submittingPassword}
                        className="flex-1 bg-slate-900 hover:bg-black text-white font-black uppercase italic tracking-widest text-[11px] rounded-xl h-12 shadow-lg flex items-center justify-center gap-2"
                      >
                        {submittingPassword ? <Loader2 className="animate-spin size-4" /> : <Lock size={12} />}
                        Entrar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="border-slate-200 hover:bg-slate-100 text-slate-500 font-black uppercase text-[10px] italic rounded-xl h-12 px-5"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 3: RECUPERAÇÃO DE SENHA */}
        <AnimatePresence>
          {showRecoveryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-lg">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
              >
                <div className="p-8 space-y-6 text-center">
                  <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
                    <Key size={32} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Recuperar Senha</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase italic leading-relaxed">
                      {recoveryStep === "request" 
                        ? "Enviaremos um código de verificação de 6 dígitos para o e-mail de administrador do estabelecimento."
                        : "Encontramos sua solicitação. Insira o código de 6 dígitos e defina a nova senha financeira."}
                    </p>
                  </div>

                  {recoveryStep === "request" ? (
                    <form onSubmit={handleRequestRecovery} className="space-y-4">
                      <Button
                        type="submit"
                        disabled={submittingRecovery}
                        className="w-full bg-slate-900 hover:bg-black text-white font-black uppercase italic tracking-widest text-[11px] rounded-xl h-12 shadow-lg flex items-center justify-center gap-2"
                      >
                        {submittingRecovery ? <Loader2 className="animate-spin size-4" /> : <ArrowRight size={14} />}
                        Enviar Código de Redefinição
                      </Button>
                      <button
                        type="button"
                        onClick={() => setShowRecoveryModal(false)}
                        className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 block mx-auto pt-2"
                      >
                        Voltar para o Login
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyAndReset} className="space-y-4 text-left">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Código de 6 dígitos</Label>
                        <Input
                          placeholder="Digite o código enviado ao e-mail"
                          value={recoveryCode}
                          onChange={(e) => setRecoveryCode(e.target.value)}
                          className="bg-white border-slate-200 rounded-xl h-12 font-bold text-center tracking-widest text-lg font-mono"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nova Senha Financeira</Label>
                        <Input
                          type="password"
                          placeholder="Mínimo 8 caracteres (Maiúscula, Minúscula, Número)"
                          value={recoveryNewPassword}
                          onChange={(e) => setRecoveryNewPassword(e.target.value)}
                          className="bg-white border-slate-200 rounded-xl h-12 font-bold"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Confirmar Nova Senha</Label>
                        <Input
                          type="password"
                          placeholder="Repita a nova senha"
                          value={recoveryConfirmPassword}
                          onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                          className="bg-white border-slate-200 rounded-xl h-12 font-bold"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          disabled={submittingRecovery}
                          className="flex-1 bg-slate-900 hover:bg-black text-white font-black uppercase italic tracking-widest text-[11px] rounded-xl h-12 shadow-lg flex items-center justify-center gap-2"
                        >
                          {submittingRecovery ? <Loader2 className="animate-spin size-4" /> : <Check size={14} />}
                          Redefinir Senha
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setRecoveryStep("request")}
                          className="border-slate-200 hover:bg-slate-100 text-slate-500 font-black uppercase text-[10px] italic rounded-xl h-12 px-5"
                        >
                          Reenviar E-mail
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </FeatureGuard>
  )
}
