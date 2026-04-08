"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Building2, 
  MapPin, 
  Truck, 
  Palette, 
  Clock, 
  Save, 
  Globe,
  Instagram,
  Phone,
  DollarSign,
  Maximize2,
  Calendar,
  Settings,
  Store
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBusiness } from "@/hooks/useBusiness"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { cn } from "@/lib/utils"

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const { profile, business, refreshBusiness } = useBusiness()
  const [loading, setLoading] = useState(false)
  
  const [settings, setSettings] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    menu_slug: "",
    primary_color: "#f43f5e",
    delivery_fee: 0,
    min_order_value: 0,
    delivery_radius: 5,
    rate_per_km: 2,
    instagram: "",
    accept_pix: true,
    receipt_header: "",
    receipt_footer: "Obrigado pela preferência! ✨",
    delivery_zones: [] as any[],
    operating_hours: {
      seg: { open: "09:00", close: "22:00", closed: false },
      ter: { open: "09:00", close: "22:00", closed: false },
      qua: { open: "09:00", close: "22:00", closed: false },
      qui: { open: "09:00", close: "22:00", closed: false },
      sex: { open: "09:00", close: "23:00", closed: false },
      sab: { open: "10:00", close: "23:00", closed: false },
      dom: { open: "10:00", close: "22:00", closed: false },
    }
  })

  useEffect(() => {
    if (business) {
      setSettings(prev => ({
        ...prev,
        nome: business.nome || "",
        telefone: business.whatsapp || business.telefone || "",
        endereco: business.endereco || "",
        menu_slug: business.slug || "",
        delivery_fee: business.delivery_fee || 0,
        min_order_value: business.min_order_value || 0,
        delivery_radius: business.delivery_radius || 5,
        rate_per_km: business.config?.rate_per_km || 0,
        primary_color: business.config?.primary_color || "#f43f5e",
        instagram: business.config?.instagram || "",
        receipt_header: business.config?.receipt_header || "",
        receipt_footer: business.config?.receipt_footer || "Obrigado pela preferência! ✨",
        delivery_zones: business.config?.delivery_zones || [],
        operating_hours: business.config?.operating_hours || prev.operating_hours
      }))
    }
  }, [business])

  const handleSave = async () => {
    const businessId = profile?.tenant_id || profile?.company_id || (user as any)?.user_metadata?.company_id
    if (!businessId) return toast.error("Identificação da empresa não encontrada.")
    setLoading(true)
    try {
      const payloadEmpresas = {
        nome: settings.nome,
        telefone: settings.telefone,
        endereco: settings.endereco,
        delivery_fee: Number(settings.delivery_fee) || 0,
        min_order_value: Number(settings.min_order_value) || 0,
        delivery_radius: Number(settings.delivery_radius) || 0,
        config: {
           ...business?.config,
           primary_color: settings.primary_color,
           rate_per_km: Number(settings.rate_per_km) || 0,
           instagram: settings.instagram,
           receipt_header: settings.receipt_header,
           receipt_footer: settings.receipt_footer,
           delivery_zones: settings.delivery_zones,
           operating_hours: settings.operating_hours
        }
      }

      await Promise.all([
        supabase.from('empresas').update(payloadEmpresas).eq('id', businessId),
        supabase.from('tenants').update({ slug: settings.menu_slug, name: settings.nome }).eq('id', businessId),
        supabase.from('digital_menu_settings').upsert({ company_id: businessId, store_name: settings.nome, primary_color: settings.primary_color, button_color: settings.primary_color, instagram: settings.instagram, whatsapp: settings.telefone, updated_at: new Date().toISOString() }),
        supabase.from('delivery_settings').upsert({ tenant_id: businessId, base_fee: Number(settings.delivery_fee) || 0, fee_per_km: Number(settings.rate_per_km) || 0, max_km: Number(settings.delivery_radius) || 0, whatsapp_number: settings.telefone })
      ])

      toast.success("Configurações sincronizadas! ✨")
      refreshBusiness()
    } catch (e: any) { toast.error(`Erro ao salvar: ${e.message}`) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-10 pb-24 max-w-6xl mx-auto">
      <PageHeader 
        title="Gestão da" 
        highlight="Empresa" 
        subtitle="Personalize sua marca, logística, horários e identidade visual"
        actions={(
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="h-11 px-8 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] shadow-lg shadow-slate-900/10 transition-all hover:scale-105 active:scale-95 gap-2"
          >
            <Save size={16} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        )}
      />

      <Tabs defaultValue="perfil" className="space-y-8">
        <TabsList className="bg-slate-100/50 p-1.5 rounded-[32px] border border-slate-100 flex items-center h-auto w-full md:w-fit overflow-x-auto no-scrollbar">
          {[
            { value: "perfil", label: "Perfil", icon: Building2 },
            { value: "logistica", label: "Logística", icon: Truck },
            { value: "visual", label: "Branding", icon: Palette },
            { value: "horarios", label: "Horários", icon: Clock },
            { value: "operacional", label: "Sistema", icon: Maximize2 },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="rounded-2xl px-6 py-2.5 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-rose-500 data-[state=active]:shadow-sm transition-all flex items-center gap-2">
               <tab.icon size={14} /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="perfil" className="space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid md:grid-cols-2 gap-8 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
             <div className="space-y-6">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Nome da Empresa</Label><Input value={settings.nome} onChange={e => setSettings({...settings, nome: e.target.value})} className="h-14 border-slate-100 bg-slate-50 flex items-center justify-center rounded-[20px] px-6 font-bold" /></div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Link do Cardápio (Slug)</Label>
                   <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">/menu/</div>
                      <Input 
                        value={settings.menu_slug} 
                        onChange={e => setSettings({...settings, menu_slug: slugify(e.target.value)})} 
                        className="h-14 border-slate-100 bg-slate-50 rounded-[20px] pl-20 font-bold" 
                        placeholder="seu-link-aqui"
                      />
                   </div>
                </div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">WhatsApp</Label><div className="relative"><Phone className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400" /><Input value={settings.telefone} onChange={e => setSettings({...settings, telefone: e.target.value})} className="h-14 border-slate-100 bg-slate-50 rounded-[20px] pl-14 font-bold" /></div></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Endereço Principal</Label><div className="relative"><MapPin className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400" /><Input value={settings.endereco} onChange={e => setSettings({...settings, endereco: e.target.value})} className="h-14 border-slate-100 bg-slate-50 rounded-[20px] pl-14 font-bold" /></div></div>
             </div>
             <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[32px] p-10 bg-slate-50/50">
                <div className="size-28 bg-white rounded-[40px] shadow-sm flex items-center justify-center text-slate-200 mb-6 border border-slate-100"><Store size={48} /></div>
                <Button variant="outline" className="h-11 rounded-xl border-slate-200 bg-white font-black uppercase text-[10px]">Alterar Identidade Visual</Button>
                <p className="text-[9px] text-slate-400 mt-4 uppercase font-bold tracking-widest">SVG, PNG ou JPG (Máx. 2MB)</p>
             </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="logistica" className="space-y-8">
           <div className="grid md:grid-cols-3 gap-8">
              {[
                { label: "Taxa Fixa", value: settings.delivery_fee, onChange: (v: any) => setSettings({...settings, delivery_fee: v}), icon: DollarSign, color: "text-rose-500", bg: "bg-rose-50" },
                { label: "Raio (KM)", value: settings.delivery_radius, onChange: (v: any) => setSettings({...settings, delivery_radius: v}), icon: Maximize2, color: "text-amber-500", bg: "bg-amber-50" },
                { label: "Valor/KM", value: settings.rate_per_km, onChange: (v: any) => setSettings({...settings, rate_per_km: v}), icon: Truck, color: "text-indigo-500", bg: "bg-indigo-50" },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4">
                   <div className={cn("size-12 rounded-2xl flex items-center justify-center mb-4", kpi.bg, kpi.color)}><kpi.icon size={24} /></div>
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">{kpi.label}</Label>
                   <Input type="number" value={kpi.value} onChange={e => kpi.onChange(parseFloat(e.target.value))} className="h-14 border-slate-100 bg-slate-50 rounded-2xl px-6 font-bold" />
                </div>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="visual" className="space-y-6">
           <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Cor Primária</Label>
                    <div className="flex items-center gap-6">
                       <input type="color" value={settings.primary_color} onChange={e => setSettings({...settings, primary_color: e.target.value})} className="size-20 rounded-[24px] border-none cursor-pointer p-0 bg-transparent" />
                       <p className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">{settings.primary_color}</p>
                    </div>
                 </div>
                 <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">User Instagram</Label><div className="relative"><Instagram className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400" /><Input value={settings.instagram} onChange={e => setSettings({...settings, instagram: e.target.value})} className="h-14 border-slate-100 bg-slate-50 rounded-2xl pl-14 font-bold" /></div></div>
              </div>
              <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
                 <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 italic border-b border-slate-50 pb-4">Personalização de Recibos</h4>
                 <div className="space-y-4">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Cabeçalho</Label><Input value={settings.receipt_header} onChange={e => setSettings({...settings, receipt_header: e.target.value})} className="h-14 border-slate-100 bg-slate-50 rounded-2xl px-6 font-bold" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Rodapé</Label><Input value={settings.receipt_footer} onChange={e => setSettings({...settings, receipt_footer: e.target.value})} className="h-14 border-slate-100 bg-slate-50 rounded-2xl px-6 font-bold" /></div>
                 </div>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="horarios">
           <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm grid gap-4">
              {Object.entries(settings.operating_hours).map(([day, hours]: [string, any]) => (
                <div key={day} className="flex items-center justify-between p-4 rounded-[28px] hover:bg-slate-50 transition-all">
                   <Label className="text-xs font-black uppercase italic text-slate-900 w-32">{day === 'seg' ? 'Segunda' : day === 'ter' ? 'Terça' : day === 'qua' ? 'Quarta' : day === 'qui' ? 'Quinta' : day === 'sex' ? 'Sexta' : day === 'sab' ? 'Sábado' : 'Domingo'}</Label>
                   <div className="flex items-center gap-4"><Input type="time" disabled={hours.closed} value={hours.open} onChange={e => { const n = {...settings.operating_hours}; (n as any)[day].open = e.target.value; setSettings({...settings, operating_hours: n}); }} className="h-12 w-32 border-slate-100 rounded-xl font-bold" /><span className="text-slate-300">até</span><Input type="time" disabled={hours.closed} value={hours.close} onChange={e => { const n = {...settings.operating_hours}; (n as any)[day].close = e.target.value; setSettings({...settings, operating_hours: n}); }} className="h-12 w-32 border-slate-100 rounded-xl font-bold" /></div>
                   <Switch checked={hours.closed} onCheckedChange={v => { const n = {...settings.operating_hours}; (n as any)[day].closed = v; setSettings({...settings, operating_hours: n}); }} />
                </div>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="operacional">
           <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-slate-900 rounded-[56px] p-12 text-white flex flex-col justify-between">
                 <div><p className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic mb-1">Status da Cluster</p><h4 className="text-3xl font-black italic uppercase tracking-tighter">SaaS High Performance</h4></div>
                 <div className="flex items-center gap-4 mt-12 bg-white/5 p-6 rounded-[32px] border border-white/5"><Globe className="size-8 text-rose-500" /><p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Sua empresa está operando com latência otimizada via Google Cloud.</p></div>
              </div>
              <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                 <div className="size-20 bg-rose-50 rounded-[32px] flex items-center justify-center text-rose-500 mb-6 shadow-inner"><Settings size={40} className="animate-spin-slow" /></div>
                 <h4 className="text-xl font-black uppercase italic tracking-tighter">Recursos Avançados</h4>
                 <p className="text-xs text-slate-400 font-bold italic uppercase tracking-widest mt-2">Personalização detalhada de comportamento do sistema.</p>
              </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
