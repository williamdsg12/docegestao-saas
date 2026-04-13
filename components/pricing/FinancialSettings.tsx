"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  Calculator, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Save, 
  Loader2,
  AlertCircle,
  HelpCircle
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

export function FinancialSettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [settings, setSettings] = useState({
    salario_alvo: 3000,
    dias_trabalhados_semana: 5,
    horas_trabalhadas_dia: 8,
    custo_fixo_total: 0,
    taxa_ifood: 0.27,
    taxa_revenda: 0.20
  })

  // Calculation variables
  const totalHorasMes = (settings.dias_trabalhados_semana * 4) * settings.horas_trabalhadas_dia
  const taxaHoraria = totalHorasMes > 0 ? (Number(settings.salario_alvo) + Number(settings.custo_fixo_total)) / totalHorasMes : 0

  useEffect(() => {
    if (user) fetchSettings()
  }, [user])

  async function fetchSettings() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("financial_settings")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle()
      
      if (error) throw error
      if (data) {
        setSettings({
          salario_alvo: data.salario_alvo,
          dias_trabalhados_semana: data.dias_trabalhados_semana,
          horas_trabalhadas_dia: data.horas_trabalhadas_dia,
          custo_fixo_total: data.custo_fixo_total,
          taxa_ifood: data.taxa_ifood,
          taxa_revenda: data.taxa_revenda
        })
      }
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!user) return
    try {
      setSaving(true)
      const { error } = await supabase
        .from("financial_settings")
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      toast.success("Configurações financeiras salvas!")
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center p-20">
      <Loader2 className="animate-spin text-blue-600 size-12" />
    </div>
  )

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Input Side */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-premium rounded-[32px] overflow-hidden bg-white p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="size-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                <Calculator size={20} />
              </div>
              <div>
                <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                  Assistente de Custo Operacional
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 italic">
                  Defina suas despesas e metas para calcular sua taxa horária
                </CardDescription>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                  Pró-Labore Desejado (R$)
                  <HelpCircle size={12} className="text-slate-300" />
                </Label>
                <Input 
                  type="number"
                  value={settings.salario_alvo}
                  onChange={e => setSettings({ ...settings, salario_alvo: parseFloat(e.target.value) || 0 })}
                  className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-extrabold italic text-sm text-slate-900"
                  placeholder="Ex: 3000"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                  Custos Fixos Mensais (R$)
                  <HelpCircle size={12} className="text-slate-300" />
                </Label>
                <Input 
                  type="number"
                  value={settings.custo_fixo_total}
                  onChange={e => setSettings({ ...settings, custo_fixo_total: parseFloat(e.target.value) || 0 })}
                  className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-extrabold italic text-sm text-slate-900"
                  placeholder="Ex: 800 (Luz, MEI, Aluguel)"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Dias de Trabalho / Semana</Label>
                <Input 
                  type="number"
                  value={settings.dias_trabalhados_semana}
                  onChange={e => setSettings({ ...settings, dias_trabalhados_semana: parseInt(e.target.value) || 0 })}
                  className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-extrabold italic text-sm text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Horas de Trabalho / Dia</Label>
                <Input 
                  type="number"
                  value={settings.horas_trabalhadas_dia}
                  onChange={e => setSettings({ ...settings, horas_trabalhadas_dia: parseInt(e.target.value) || 0 })}
                  className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-extrabold italic text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2 italic">
                 <TrendingUp size={14} className="text-blue-500" /> Taxas de Canais de Venda (%)
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Taxa iFood (Médio: 27%)</Label>
                    <div className="relative">
                      <Input 
                        type="number"
                        value={settings.taxa_ifood * 100}
                        onChange={e => setSettings({ ...settings, taxa_ifood: (parseFloat(e.target.value) || 0) / 100 })}
                        className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-extrabold italic text-sm text-slate-900 pr-10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Margem de Revenda / Atacado (%)</Label>
                    <div className="relative">
                      <Input 
                        type="number"
                        value={settings.taxa_revenda * 100}
                        onChange={e => setSettings({ ...settings, taxa_revenda: (parseFloat(e.target.value) || 0) / 100 })}
                        className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-extrabold italic text-sm text-slate-900 pr-10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</span>
                    </div>
                  </div>
               </div>
            </div>
          </Card>
        </div>

        {/* Summary Card Side */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[40px] border-none bg-indigo-950 text-white overflow-hidden shadow-2xl relative p-8">
            <div className="absolute -top-10 -right-10 size-40 bg-blue-500/10 rounded-full blur-3xl" />
            
            <div className="space-y-8 relative z-10">
              <div className="text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 italic mb-1">Valor da sua hora de Trabalho</p>
                 <div className="text-5xl font-black italic tracking-tighter text-white">
                   R$ {taxaHoraria.toFixed(2)}
                 </div>
                 <Badge variant="outline" className="mt-4 border-indigo-400/30 text-indigo-300 font-black text-[9px] uppercase tracking-widest h-6 px-4">Calculado Automaticamente</Badge>
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-indigo-300/60 italic">Carga Horária Mensal</span>
                  <span className="font-black italic text-sm">{totalHorasMes}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-indigo-300/60 italic">Total Operacional</span>
                  <span className="font-black italic text-sm">R$ {(Number(settings.salario_alvo) + Number(settings.custo_fixo_total)).toFixed(2)}</span>
                </div>
              </div>

              <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                <div className="flex gap-3">
                  <div className="size-8 rounded-xl bg-indigo-600/50 flex items-center justify-center shrink-0">
                    <AlertCircle size={16} className="text-indigo-200" />
                  </div>
                  <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-tight leading-tight">
                    Este valor será usado automaticamente para calcular a mão de obra em cada ficha técnica baseando-se no tempo de preparo.
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleSave}
                disabled={saving}
                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic tracking-tighter shadow-xl shadow-blue-500/20"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save className="mr-2" size={18} />}
                Salvar Configurações
              </Button>
            </div>
          </Card>

          <div className="p-6 rounded-[32px] bg-slate-900/5 border border-slate-100">
             <h5 className="text-[10px] font-black text-slate-800 uppercase italic mb-3">Dica de Especialista 💡</h5>
             <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase tracking-tight">
               Ao cadastrar receitas, nunca esqueça de incluir o tempo de lavagem de louça e limpeza da bancada. Isso faz parte do custo do seu negócio!
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
