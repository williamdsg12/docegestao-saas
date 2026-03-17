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
  Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBusiness } from "@/hooks/useBusiness"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function ConfiguracoesPage() {
  const { profile, business, refreshBusiness } = useBusiness()
  const [loading, setLoading] = useState(false)
  
  const [settings, setSettings] = useState({
    nome: "",
    telefone: "",
    endereco: "",
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
        telefone: business.telefone || "",
        endereco: business.endereco || "",
        delivery_fee: business.delivery_fee || 0,
        min_order_value: business.min_order_value || 0,
        delivery_radius: business.delivery_radius || 5,
        rate_per_km: business.config?.rate_per_km || 2,
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
    if (!profile?.company_id) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('empresas')
        .update({
          nome: settings.nome,
          telefone: settings.telefone,
          endereco: settings.endereco,
          delivery_fee: settings.delivery_fee,
          min_order_value: settings.min_order_value,
          delivery_radius: settings.delivery_radius,
          config: {
             ...business?.config,
             primary_color: settings.primary_color,
             rate_per_km: settings.rate_per_km,
             instagram: settings.instagram,
             receipt_header: settings.receipt_header,
             receipt_footer: settings.receipt_footer,
             delivery_zones: settings.delivery_zones,
             operating_hours: settings.operating_hours
          }
        })
        .eq('id', profile.company_id)
      
      if (error) throw error
      
      toast.success("Configurações salvas com sucesso! ✨")
      refreshBusiness()
    } catch (e) {
      toast.error("Erro ao salvar configurações")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none mb-2">
            Configurações da <span className="text-primary italic">Empresa</span>
          </h1>
          <p className="text-slate-500 font-medium">Personalize sua marca, logística e horários de funcionamento.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-3"
        >
          <Save className="size-5" /> {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <Tabs defaultValue="perfil" className="space-y-8">
        <TabsList className="bg-slate-100/50 p-2 rounded-[28px] border border-slate-200/50 backdrop-blur-sm h-16 inline-flex w-full md:w-auto overflow-x-auto scrollbar-hide">
          <TabsTrigger value="perfil" className="rounded-[22px] px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
             <Building2 className="mr-2 size-4" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="logistica" className="rounded-[22px] px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
             <Truck className="mr-2 size-4" /> Logística
          </TabsTrigger>
          <TabsTrigger value="visual" className="rounded-[22px] px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
             <Palette className="mr-2 size-4" /> Branding
          </TabsTrigger>
          <TabsTrigger value="horarios" className="rounded-[22px] px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
             <Clock className="mr-2 size-4" /> Horários
          </TabsTrigger>
          <TabsTrigger value="operacional" className="rounded-[22px] px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
             <Maximize2 className="mr-2 size-4" /> Operacional
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-8 bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
             <div className="space-y-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome da Empresa</Label>
                   <Input 
                     value={settings.nome}
                     onChange={e => setSettings({...settings, nome: e.target.value})}
                     className="h-14 border-slate-100 bg-slate-50 rounded-2xl px-6 font-bold"
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Telefone WhatsApp</Label>
                   <div className="relative">
                     <Phone className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                     <Input 
                       value={settings.telefone}
                       onChange={e => setSettings({...settings, telefone: e.target.value})}
                       className="h-14 border-slate-100 bg-slate-50 rounded-2xl pl-14 font-bold"
                     />
                   </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Endereço Principal</Label>
                   <div className="relative">
                     <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                     <Input 
                       value={settings.endereco}
                       onChange={e => setSettings({...settings, endereco: e.target.value})}
                       className="h-14 border-slate-100 bg-slate-50 rounded-2xl pl-14 font-bold"
                     />
                   </div>
                </div>
             </div>
             
             <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px] p-10 bg-slate-50/30">
                <div className="size-32 bg-white rounded-[40px] shadow-xl flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                   <Building2 className="size-16" />
                </div>
                <Button variant="outline" className="h-12 rounded-2xl border-slate-200 bg-white font-black uppercase tracking-widest text-[10px] shadow-sm">Alterar Logo</Button>
                <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">SVG, PNG ou JPG (Máx. 2MB)</p>
             </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="logistica" className="space-y-8">
           <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4">
                 <div className="size-12 bg-rose-50 rounded-2xl flex items-center justify-center text-primary mb-4">
                    <DollarSign className="size-6" />
                 </div>
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taxa de Entrega Fixa</Label>
                 <Input 
                   type="number"
                   value={settings.delivery_fee}
                   onChange={e => setSettings({...settings, delivery_fee: parseFloat(e.target.value)})}
                   className="h-14 border-slate-100 bg-slate-50 rounded-2xl px-6 font-bold"
                 />
                 <p className="text-[10px] text-slate-400 font-medium italic">Usada se o cálculo por KM estiver desativado.</p>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4">
                 <div className="size-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4">
                    <Maximize2 className="size-6" />
                 </div>
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Raio de Entrega (KM)</Label>
                 <Input 
                   type="number"
                   value={settings.delivery_radius}
                   onChange={e => setSettings({...settings, delivery_radius: parseFloat(e.target.value)})}
                   className="h-14 border-slate-100 bg-slate-50 rounded-2xl px-6 font-bold"
                 />
                 <p className="text-[10px] text-slate-400 font-medium italic">Limite máximo de distância para pedidos.</p>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4">
                 <div className="size-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mb-4">
                    <Truck className="size-6" />
                 </div>
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor por KM</Label>
                 <Input 
                   type="number"
                   value={settings.rate_per_km}
                   onChange={e => setSettings({...settings, rate_per_km: parseFloat(e.target.value)})}
                   className="h-14 border-slate-100 bg-slate-50 rounded-2xl px-6 font-bold"
                 />
                 <p className="text-[10px] text-slate-400 font-medium italic">Usado para cálculo dinâmico no Checkout.</p>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="visual" className="space-y-6">
           <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cor Primária da Marca</Label>
                    <div className="flex items-center gap-6">
                       <input 
                         type="color"
                         value={settings.primary_color}
                         onChange={e => setSettings({...settings, primary_color: e.target.value})}
                         className="size-20 rounded-2xl border-none cursor-pointer p-0 bg-transparent"
                       />
                       <div>
                          <p className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">{settings.primary_color}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Identidade Visual</p>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">User Instagram</Label>
                    <div className="relative">
                      <Instagram className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                      <Input 
                        placeholder="@seuusuario"
                        value={settings.instagram}
                        onChange={e => setSettings({...settings, instagram: e.target.value})}
                        className="h-14 border-slate-100 bg-slate-50 rounded-2xl pl-14 font-bold"
                      />
                    </div>
                 </div>
                 
                 <div className="bg-slate-50 rounded-[32px] p-8 space-y-6">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Preview do Checkout</p>
                    <div className="bg-white rounded-[24px] shadow-lg p-6 space-y-4">
                       <div className="h-4 w-2/3 bg-slate-100 rounded-lg" />
                       <div className="h-12 w-full rounded-xl" style={{ backgroundColor: settings.primary_color }} />
                       <div className="flex gap-2">
                          <div className="h-10 w-10 rounded-lg bg-slate-50" />
                          <div className="h-10 flex-1 rounded-lg bg-slate-50" />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                 <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Personalização do Recibo</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Textos que aparecem na impressão dos pedidos.</p>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cabeçalho do Recibo</Label>
                       <Input 
                          placeholder="Ex: Doce Gestão - Confeitaria Artesanal"
                          value={settings.receipt_header}
                          onChange={e => setSettings({...settings, receipt_header: e.target.value})}
                          className="h-14 border-slate-100 bg-slate-50 rounded-2xl px-6 font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rodapé do Recibo</Label>
                       <Input 
                          placeholder="Ex: Siga-nos no Instagram @..."
                          value={settings.receipt_footer}
                          onChange={e => setSettings({...settings, receipt_footer: e.target.value})}
                          className="h-14 border-slate-100 bg-slate-50 rounded-2xl px-6 font-bold"
                       />
                    </div>
                 </div>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="horarios" className="space-y-6">
           <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <div className="grid gap-6">
                 {Object.entries(settings.operating_hours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                       <div className="flex items-center gap-6 w-32">
                          <Label className="text-sm font-black uppercase italic tracking-tighter text-slate-900">{day === 'seg' ? 'Segunda' : day === 'ter' ? 'Terça' : day === 'qua' ? 'Quarta' : day === 'qui' ? 'Quinta' : day === 'sex' ? 'Sexta' : day === 'sab' ? 'Sábado' : 'Domingo'}</Label>
                       </div>
                       
                       <div className="flex items-center gap-4">
                          <Input 
                             type="time" 
                             disabled={hours.closed}
                             value={hours.open}
                             onChange={e => {
                                const newHours = {...settings.operating_hours}
                                newHours[day as keyof typeof settings.operating_hours].open = e.target.value
                                setSettings({...settings, operating_hours: newHours})
                             }}
                             className="h-12 w-32 border-slate-100 bg-white rounded-xl font-bold"
                          />
                          <span className="text-slate-300">até</span>
                          <Input 
                             type="time"
                             disabled={hours.closed}
                             value={hours.close}
                             onChange={e => {
                                const newHours = {...settings.operating_hours}
                                newHours[day as keyof typeof settings.operating_hours].close = e.target.value
                                setSettings({...settings, operating_hours: newHours})
                             }}
                             className="h-12 w-32 border-slate-100 bg-white rounded-xl font-bold"
                          />
                       </div>

                       <div className="flex items-center gap-3">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fechado</Label>
                          <Switch 
                            checked={hours.closed}
                            onCheckedChange={val => {
                               const newHours = {...settings.operating_hours}
                               newHours[day as keyof typeof settings.operating_hours].closed = val
                               setSettings({...settings, operating_hours: newHours})
                            }}
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </TabsContent>

        <TabsContent value="operacional" className="space-y-8">
           <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                 <h3 className="text-xl font-black uppercase italic tracking-tighter">Zonas de Entrega</h3>
                 <div className="p-8 bg-slate-900 rounded-[32px] text-white">
                    <div className="flex items-center justify-between mb-8">
                       <div>
                          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Raio Ativo</p>
                          <p className="text-3xl font-black italic">{settings.delivery_radius} KM</p>
                       </div>
                       <div className="size-12 bg-primary rounded-2xl flex items-center justify-center">
                          <Maximize2 className="size-6 shadow-xl" />
                       </div>
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-relaxed">
                       Pedidos fora deste raio serão bloqueados automaticamente no checkout para garantir a qualidade da logística.
                    </p>
                 </div>
              </div>

              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8 flex flex-col justify-center items-center text-center">
                 <div className="size-20 bg-pink-50 rounded-3xl flex items-center justify-center text-primary mb-2">
                    <Globe className="size-10" />
                 </div>
                 <h4 className="text-lg font-black uppercase italic tracking-tighter">Multi-Tenant Logistics</h4>
                 <p className="text-xs text-slate-400 font-medium max-w-[250px]">
                    Sua empresa está operando no cluster SaaS-V4. Todas as rotas são otimizadas via Google Intelligence.
                 </p>
              </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
