"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Save, MessageCircle, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function OrderSettingsPage() {
  const { business } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    accept_orders: true,
    whatsapp_number: "",
    auto_confirm_message: "Olá {{cliente}}, recebemos seu pedido #{{pedido}}! No momento estamos preparando com muito carinho. Valor total: R$ {{total}}."
  })

  useEffect(() => {
    if (business?.id) {
      fetchSettings()
    }
  }, [business?.id])

  async function fetchSettings() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('configuracoes_delivery')
        .select('*')
        .eq('empresa_id', business!.id)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setSettings({
          accept_orders: data.accept_orders ?? true,
          whatsapp_number: data.whatsapp_number || "",
          auto_confirm_message: data.auto_confirm_message || ""
        })
      }
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('configuracoes_delivery')
        .upsert({
          empresa_id: business!.id,
          accept_orders: settings.accept_orders,
          whatsapp_number: settings.whatsapp_number,
          auto_confirm_message: settings.auto_confirm_message,
        }, { onConflict: 'empresa_id' })

      if (error) throw error
      toast.success("Configurações salvas com sucesso!", {
        icon: <CheckCircle2 className="size-4 text-emerald-500" />
      })
    } catch (error: any) {
      toast.error("Erro ao salvar configurações")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="size-8 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">
            Fluxo de <span className="text-pink-500">Pedidos</span>
          </h1>
          <p className="text-slate-500 font-medium italic uppercase text-[10px] tracking-widest">Configurações Gerais de Recebimento</p>
        </div>
        {!settings.accept_orders && (
          <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-2xl flex items-center gap-2 border border-rose-100 animate-pulse">
            <AlertCircle className="size-4" />
            <span className="text-xs font-black uppercase tracking-widest">Loja Pausada</span>
          </div>
        )}
      </div>

      <div className="max-w-3xl space-y-8">
        <Card className="rounded-[40px] border-none shadow-2xl shadow-pink-100/20 bg-white p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 size-64 bg-pink-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50" />
          
          <CardContent className="p-0 space-y-10 relative z-10">
            <div className="flex items-center justify-between p-8 bg-slate-50/50 rounded-[32px] border border-slate-100/50 transition-all hover:bg-slate-50">
              <div>
                <h3 className="font-black uppercase tracking-tighter italic text-slate-900 text-lg">Aceitar Novos Pedidos</h3>
                <p className="text-xs font-medium text-slate-500">Controle o recebimento de pedidos em tempo real</p>
              </div>
              <Switch 
                checked={settings.accept_orders}
                onCheckedChange={(checked) => setSettings({...settings, accept_orders: checked})}
                className="data-[state=checked]:bg-pink-500" 
              />
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">WhatsApp para Recebimento</Label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 size-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center transition-all group-focus-within:bg-emerald-500 group-focus-within:text-white">
                    <MessageCircle className="size-5" />
                  </div>
                  <Input 
                    placeholder="(00) 00000-0000" 
                    className="h-16 pl-20 rounded-2xl bg-slate-50 border-none font-bold text-lg focus-visible:ring-2 focus-visible:ring-pink-500/20" 
                    value={settings.whatsapp_number}
                    onChange={e => setSettings({...settings, whatsapp_number: e.target.value})}
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Este número será usado para o redirecionamento dos pedidos.</p>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Mensagem de Confirmação Automática</Label>
                <div className="relative">
                  <Textarea 
                    placeholder="Olá {{cliente}}, recebemos seu pedido..." 
                    className="min-h-40 rounded-[32px] bg-slate-50 border-none font-medium p-8 focus-visible:ring-2 focus-visible:ring-pink-500/20 resize-none"
                    value={settings.auto_confirm_message}
                    onChange={e => setSettings({...settings, auto_confirm_message: e.target.value})}
                  />
                  <div className="absolute bottom-6 left-8 flex gap-2">
                    {["cliente", "pedido", "total"].map(tag => (
                      <span key={tag} className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white border border-slate-100 text-slate-400 rounded-lg">
                        {"{{"}{tag}{"}}"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button 
              disabled={saving}
              onClick={handleSave}
              className="w-full h-18 rounded-[30px] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic tracking-[0.2em] shadow-2xl transition-all active:scale-95"
            >
               {saving ? (
                 <div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
               ) : (
                 <><Save className="mr-3 size-5" /> Salvar Configurações</>
               )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
