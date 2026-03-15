"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, MapPin, Navigation, Truck, Clock, CheckCircle2, Ruler, DollarSign } from "lucide-react"
import { toast } from "sonner"

export default function DeliverySettingsPage() {
  const { business } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [settings, setSettings] = useState({
    taxa_base: "5.00",
    km_maximo: "10",
    taxa_por_km: "1.50",
    tempo_medio: "45"
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
          taxa_base: data.taxa_base?.toString() || "5.00",
          km_maximo: data.km_maximo?.toString() || "10",
          taxa_por_km: data.taxa_por_km?.toString() || "1.50",
          tempo_medio: data.tempo_medio?.toString() || "45"
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
          taxa_base: parseFloat(settings.taxa_base),
          km_maximo: parseFloat(settings.km_maximo),
          taxa_por_km: parseFloat(settings.taxa_por_km),
          tempo_medio: parseInt(settings.tempo_medio),
        }, { onConflict: 'empresa_id' })

      if (error) throw error
      toast.success("Configurações de entrega salvas!", {
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
            Taxas & <span className="text-pink-500">Logística</span>
          </h1>
          <p className="text-slate-500 font-medium italic uppercase text-[10px] tracking-widest">Configuração do Cálculo de Frete Profissional</p>
        </div>
      </div>

      <div className="max-w-4xl grid lg:grid-cols-2 gap-8">
        <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 bg-white p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 size-64 bg-slate-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50" />
          
          <CardContent className="p-0 space-y-8 relative z-10">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                 <Truck className="size-6" />
               </div>
               <div>
                  <h3 className="font-black uppercase tracking-tighter text-slate-900">Base do Cálculo</h3>
                  <p className="text-xs font-medium text-slate-400 italic">Estrutura fixa de entrega</p>
               </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Taxa Base (R$)</Label>
                <div className="relative group">
                  <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-300" />
                  <Input 
                    placeholder="5.00" 
                    className="h-16 pl-14 rounded-2xl bg-slate-50 border-none font-bold text-lg" 
                    value={settings.taxa_base}
                    onChange={e => setSettings({...settings, taxa_base: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Tempo Médio (minutos)</Label>
                <div className="relative group">
                  <Clock className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-300" />
                  <Input 
                    placeholder="45" 
                    className="h-16 pl-14 rounded-2xl bg-slate-50 border-none font-bold text-lg" 
                    value={settings.tempo_medio}
                    onChange={e => setSettings({...settings, tempo_medio: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
           <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 bg-white p-10">
             <CardContent className="p-0 space-y-8">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                    <Ruler className="size-6" />
                  </div>
                  <div>
                     <h3 className="font-black uppercase tracking-tighter text-slate-900">Variáveis por Distância</h3>
                     <p className="text-xs font-medium text-slate-400 italic">Cálculo dinâmico (estilo iFood)</p>
                  </div>
               </div>

               <div className="space-y-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Taxa por KM Adicional (R$)</Label>
                    <Input 
                      placeholder="1.50" 
                      className="h-16 rounded-2xl bg-slate-50 border-none font-bold text-lg px-8" 
                      value={settings.taxa_por_km}
                      onChange={e => setSettings({...settings, taxa_por_km: e.target.value})}
                    />
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Raio Máximo (KM)</Label>
                    <Input 
                      placeholder="10" 
                      className="h-16 rounded-2xl bg-slate-50 border-none font-bold text-lg px-8" 
                      value={settings.km_maximo}
                      onChange={e => setSettings({...settings, km_maximo: e.target.value})}
                    />
                 </div>
               </div>
             </CardContent>
           </Card>

           <Button 
             disabled={saving}
             onClick={handleSave}
             className="w-full h-20 rounded-[35px] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic tracking-[0.2em] shadow-2xl transition-all active:scale-95 py-8"
           >
              {saving ? (
                <div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <><Save className="mr-3 size-5" /> Salvar Configurações</>
              )}
           </Button>
        </div>
      </div>
      
      <div className="max-w-4xl p-8 bg-blue-50 rounded-[40px] border border-blue-100 flex gap-6 items-center">
         <div className="size-16 bg-white rounded-3xl flex items-center justify-center text-blue-500 shadow-sm shrink-0">
            <Ruler className="size-8" />
         </div>
         <div className="space-y-1">
            <p className="font-black text-blue-900 uppercase italic tracking-tight">Fórmula de Cálculo Ativa</p>
            <p className="text-sm text-blue-700/80 font-medium">taxa = <span className="font-bold underline">R$ {settings.taxa_base}</span> + (distância * <span className="font-bold underline">R$ {settings.taxa_por_km}</span>)</p>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-2">O sistema usará o Google Maps para medir a distância real.</p>
         </div>
      </div>
    </div>
  )
}
