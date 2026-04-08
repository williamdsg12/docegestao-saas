"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import { 
  CreditCard, 
  QrCode, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Zap,
  Layout,
  Rocket,
  ChevronRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TunaOnboardingModal } from "./TunaOnboardingModal"

export function TunaSettings() {
  const { user } = useAuth()
  const { profile } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [account, setAccount] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchAccount()
    }
  }, [profile])

  async function fetchAccount() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tuna_accounts')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .single()

      if (!error && data) {
        setAccount(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(field: string, value: boolean) {
    if (!account) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('tuna_accounts')
        .update({ [field]: value })
        .eq('tenant_id', profile?.tenant_id)

      if (error) throw error
      setAccount({ ...account, [field]: value })
      toast.success("Configuração atualizada!")
    } catch (e) {
      toast.error("Erro ao atualizar")
    } finally {
      setIsSaving(false)
    }
  }

  const handleConnect = () => {
    if (!profile?.tenant_id) return
    window.location.href = `/api/tuna/connect?tenantId=${profile.tenant_id}`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        <div className="h-64 bg-slate-50 rounded-3xl" />
        <div className="h-64 bg-slate-50 rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Stat Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden bg-white group hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "size-12 rounded-2xl flex items-center justify-center transition-colors",
                account?.connected ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-400"
              )}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Status Tuna</p>
                <p className={cn("text-xl font-black italic tracking-tight", account?.connected ? "text-emerald-500" : "text-slate-400")}>
                  {account?.connected ? "CONECTADO" : "DESCONECTADO"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden bg-white group hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Zap size={24} />
              </div>
              <div>
                <p className="text-xl font-black italic tracking-tight text-slate-900 leading-none">
                  {(account?.pix_enabled || account?.card_enabled) ? "ONLINE" : "OFFLINE"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden bg-white group hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-slate-50 text-slate-900 flex items-center justify-center">
                <Layout size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Análise de Conta</p>
                <p className={cn(
                  "text-xl font-black italic tracking-tight uppercase",
                  account?.status === 'approved' ? "text-emerald-500" : (account?.status === 'pending' ? "text-amber-500" : "text-slate-400")
                )}>
                  {account?.status === 'approved' ? "APROVADO" : (account?.status === 'pending' ? "EM ANÁLISE" : "NÃO INICIADO")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Main Connection Card */}
        <Card className="rounded-[40px] border-slate-100 shadow-xl overflow-hidden bg-white flex flex-col justify-between">
          <div className="p-10">
            <div className="flex items-start justify-between mb-8">
              <div>
                <Badge className="bg-rose-500/10 text-rose-500 border-none font-black text-[10px] uppercase px-3 py-1 mb-4">Parceria Oficial</Badge>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                   Tuna <span className="text-rose-500">Pagamentos</span>
                </h2>
                <p className="text-slate-500 font-medium mt-4 max-w-sm">
                  Processe pagamentos com taxas competitivas e liberação rápida diretamente na sua conta Tuna.
                </p>
              </div>
              <div className="size-16 rounded-[24px] bg-slate-50 flex items-center justify-center shadow-inner border border-slate-100">
                <img src="https://tunapagamentos.com.br/wp-content/uploads/2021/08/logo-tuna-red.svg" alt="Tuna" className="w-10 opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')} />
                <CreditCard className="text-slate-200" size={32} />
              </div>
            </div>

            {account?.connected ? (
              <div className="space-y-6">
                <div className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Merchant ID</span>
                    <span className="text-sm font-mono font-black text-slate-900">{account.tuna_account_id ? `${account.tuna_account_id.slice(0, 8)}...` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Data de Conexão</span>
                    <span className="text-sm font-black text-slate-600 italic uppercase underline decoration-rose-500/30 underline-offset-4 decoration-2">
                       {account.created_at ? new Date(account.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-50/50 p-4 rounded-2xl justify-center text-xs uppercase italic tracking-wider">
                  <CheckCircle2 size={16} /> 
                  {account?.status === 'approved' ? "Pagamentos ativados com sucesso" : "Sua conta está em análise"}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 border-dashed text-center space-y-4">
                <div className="size-16 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm">
                   <Rocket className="text-rose-500" size={24} />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase italic">Comece a vender com Doce Gestão</p>
                <Button onClick={() => setIsModalOpen(true)} className="h-14 w-full rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[12px] shadow-lg shadow-rose-200 transition-all hover:-translate-y-1">
                  Ativar pagamentos com Doce Gestão <ChevronRight size={16} className="ml-2" />
                </Button>
                <p className="text-[10px] font-bold text-slate-400 uppercase italic">Ou se já possuir conta Tuna:</p>
                <Button variant="ghost" onClick={handleConnect} className="h-10 w-full rounded-xl text-slate-500 font-bold uppercase text-[10px] hover:bg-slate-100">
                  Conectar conta existente <ExternalLink size={12} className="ml-2" />
                </Button>
              </div>
            )}
          </div>
          
          {account?.connected && (
            <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex justify-center">
               <button onClick={() => handleToggle('connected', false)} className="text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors tracking-widest italic">Remover Integração</button>
            </div>
          )}
        </Card>

        {/* Configuration Toggles */}
        <div className="space-y-6">
          <Card className={cn(
            "rounded-[40px] border-slate-100 shadow-sm overflow-hidden bg-white transition-opacity",
            !account?.connected && "opacity-50 pointer-events-none grayscale"
          )}>
            <CardHeader className="p-8 pb-4">
               <CardTitle className="text-xl font-black uppercase italic text-slate-900 tracking-tight">Métodos de <span className="text-rose-500">Pagamento</span></CardTitle>
               <CardDescription className="text-xs font-bold uppercase text-slate-400 italic">Ative as opções que deseja oferecer no seu cardápio</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <div className="flex items-center justify-between p-6 rounded-[28px] bg-slate-50 border border-slate-100 hover:border-emerald-500 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <QrCode size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase italic text-slate-900">PIX Dinâmico</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase italic mt-1 tracking-wider">Confirmação instantânea</p>
                  </div>
                </div>
                <Switch 
                  checked={account?.pix_enabled || false} 
                  onCheckedChange={(val) => handleToggle('pix_enabled', val)}
                  disabled={isSaving}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between p-6 rounded-[28px] bg-slate-50 border border-slate-100 hover:border-rose-500 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase italic text-slate-900">Cartão de Crédito</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase italic mt-1 tracking-wider">Checkout transparente</p>
                  </div>
                </div>
                <Switch 
                  checked={account?.card_enabled || false} 
                  onCheckedChange={(val) => handleToggle('card_enabled', val)}
                  disabled={isSaving}
                  className="data-[state=checked]:bg-rose-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[40px] border-emerald-100 shadow-sm overflow-hidden bg-emerald-50/20 border-dashed">
            <CardContent className="p-10 text-center space-y-4">
               <ShieldCheck className="text-emerald-500 mx-auto" size={32} />
               <h4 className="font-black uppercase italic text-emerald-800 text-sm tracking-tight">Segurança Total</h4>
               <p className="text-xs font-medium text-emerald-600/80 leading-relaxed px-4">
                  Todas as transações são monitoradas pela Tuna. Seus dados e os de seus clientes são criptografados de ponta a ponta.
               </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <TunaOnboardingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(data) => {
          fetchAccount()
          setIsModalOpen(false)
        }}
        tenantId={profile?.tenant_id || ''}
      />
    </div>
  )
}
