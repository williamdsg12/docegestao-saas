"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  User, 
  Store, 
  MapPin, 
  CreditCard, 
  Check, 
  Save, 
  Instagram, 
  Smartphone,
  Info,
  ChevronRight,
  ShieldCheck,
  Search,
  Globe,
  QrCode,
  Copy,
  Eye,
  Clock,
  MessageSquare,
  Zap
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { QRCodeSVG } from "qrcode.react"

const SEGMENTS = [
  "Confeitaria Gourmet", "Bolos Artesanais", "Doces de Festa", "Bolos de Casamento",
  "Sobremesas de Pote", "Pães e Massas", "Salgados e Cafés", "Gelateria", "Outro"
]

const SPECIALTIES = [
  "Bolos Decorados", "Doces Finos", "Confeitaria Vegana", "Pães Artesanais",
  "Chocolataria", "Bolos de Pote", "Kit Festa", "Sobremesas Gourmet"
]

const EXPERIENCE_LEVELS = [
  "Iniciante (menos de 1 ano)", "1 a 3 anos", "3 a 5 anos", "Mais de 5 anos (Expert)"
]

export function ProfileTabs() {
  const { user, updateProfile } = useAuth()
  const { profile } = useBusiness()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab ] = useState("perfil")
  const [copied, setCopied] = useState(false)

  // Real WhatsApp Hook
  const [waStatus, setWaStatus] = useState<'DISCONNECTED' | 'QR_READY' | 'AUTHENTICATING' | 'CONNECTED'>('DISCONNECTED')
  const [waQr, setWaQr] = useState<string | null>(null)

  useEffect(() => {
     const checkWa = async () => {
         try {
             const res = await fetch('/api/whatsapp/status')
             const data = await res.json()
             setWaStatus(data.status)
             setWaQr(data.qr)
         } catch(e) {}
     }
     checkWa()
     const interval = setInterval(checkWa, 3000)
     return () => clearInterval(interval)
  }, [])

  const handleStartWhatsApp = async () => {
      toast.info("Iniciando conexão...")
      await fetch('/api/whatsapp/start', { method: 'POST' })
  }

  const handleStopWhatsApp = async () => {
      await fetch('/api/whatsapp/stop', { method: 'POST' })
      toast.success("Desconectado!")
      setWaStatus('DISCONNECTED')
      setWaQr(null)
  }

  // States
  const [formData, setFormData] = useState({
    fullName: "",
    personalWhatsapp: "",
    personalPhone: "",
    personalCity: "",
    personalState: "",
    bio: "",
    specialty: "",
    experience: "",
    storeName: "",
    instagram: "",
    segment: "Confeitaria Gourmet",
    businessBio: "",
    cep: "",
    address: { street: "", number: "", complement: "", neighborhood: "", city: "", state: "" },
    deliveryRadius: "5",
    atendeDelivery: true,
    acceptPix: true,
    acceptCard: true,
    acceptCash: true,
    minOrderValue: "0,00",
    menuSlug: "",
    menuBannerText: "",
    menuEnabledFeatures: ["whatsapp", "delivery", "pix"] as string[],
    whatsappConnected: false,
    openingHours: "Seg-Sex: 09h-18h",
    logoUrl: ""
  })

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.user_metadata?.full_name || user.user_metadata?.owner_name || "",
        personalWhatsapp: user.user_metadata?.whatsapp || "",
        personalPhone: user.user_metadata?.phone || "",
        personalCity: user.user_metadata?.city || "",
        personalState: user.user_metadata?.state || "",
        bio: user.user_metadata?.bio || "",
        specialty: user.user_metadata?.specialty || "",
        experience: user.user_metadata?.experience_years || "",
        storeName: user.user_metadata?.store_name || ""
      }))
      
      const fetchBusinessData = async () => {
        if (!profile?.company_id) return
        const { data: companyData } = await supabase
          .from("companies")
          .select("*")
          .eq("id", profile.company_id)
          .maybeSingle()

        if (companyData) {
          setFormData(prev => ({
            ...prev,
            instagram: companyData.instagram || "",
            segment: companyData.segment || "Confeitaria Gourmet",
            businessBio: companyData.description || "",
            cep: companyData.address_zip || "",
            address: {
              street: companyData.address_street || "",
              number: companyData.address_number || "",
              complement: companyData.address_complement || "",
              neighborhood: companyData.address_neighborhood || "",
              city: companyData.address_city || "",
              state: companyData.address_state || ""
            },
            deliveryRadius: String(companyData.delivery_radius || "5"),
            atendeDelivery: !!companyData.delivery_radius,
            acceptPix: companyData.accept_pix,
            acceptCard: companyData.accept_card,
            acceptCash: companyData.accept_cash,
            minOrderValue: String(companyData.min_order_value || "0,00").replace(".", ","),
            menuSlug: companyData.menu_slug || "",
            menuBannerText: companyData.menu_banner_text || "",
            menuEnabledFeatures: companyData.menu_enabled_features || ["whatsapp", "delivery", "pix"],
            whatsappConnected: companyData.whatsapp_connected || false,
            openingHours: companyData.opening_hours?.description || "Seg-Sex: 09h-18h",
            logoUrl: companyData.logo_url || ""
          }))
        }
      }
      fetchBusinessData()
    }
  }, [user, profile])

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, logoUrl: publicUrl }))
      
      if (user && profile?.company_id) {
        await supabase.from("companies").update({ logo_url: publicUrl }).eq("id", profile.company_id)
        await updateProfile({ logo_url: publicUrl })
      }
      toast.success("Logo atualizada!")
    } catch (e: any) {
      toast.error("Erro no upload: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    const url = `docesgestao.netlify.app/menu/${formData.menuSlug || 'sua-loja'}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Link copiado!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      // 1. Update Auth User Metadata
      const { error: authError } = await updateProfile({
        full_name: formData.fullName,
        owner_name: formData.fullName,
        whatsapp: formData.personalWhatsapp,
        phone: formData.personalPhone,
        city: formData.personalCity,
        state: formData.personalState,
        bio: formData.bio,
        specialty: formData.specialty,
        experience_years: formData.experience,
        store_name: formData.storeName,
        instagram: formData.instagram
      })
      if (authError) throw authError

      // 2. Direct DB Sync to 'profiles'
      if (user?.id) {
        const { error: dbError } = await supabase.from("profiles").update({
          owner_name: formData.fullName,
          phone: formData.personalPhone,
          whatsapp: formData.personalWhatsapp,
          city: formData.personalCity,
          state: formData.personalState,
          bio: formData.bio,
          specialty: formData.specialty,
          experience_years: formData.experience
        }).eq("id", user.id)
        
        if (dbError) throw dbError
      }

      toast.success("Perfil atualizado!")
    } catch (e: any) {
      toast.error("Erro: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBusiness = async () => {
    setLoading(true)
    try {
      // Determine the filter to use (company_id is preferred, user.id is fallback)
      const companyFilter = profile?.company_id 
        ? { column: "id", value: profile.company_id } 
        : { column: "owner_id", value: user?.id };

      if (companyFilter.value) {
        // Update Database (Companies Table)
        const { error: dbError, data: dbData } = await supabase.from("companies").update({
          name: formData.storeName,
          instagram: formData.instagram,
          segment: formData.segment,
          description: formData.businessBio,
          address_zip: formData.cep,
          address_street: formData.address.street,
          address_number: formData.address.number,
          address_complement: formData.address.complement,
          address_neighborhood: formData.address.neighborhood,
          address_city: formData.address.city,
          address_state: formData.address.state,
          delivery_radius: parseFloat(formData.deliveryRadius),
          accept_pix: formData.acceptPix,
          accept_card: formData.acceptCard,
          accept_cash: formData.acceptCash,
          min_order_value: parseFloat(formData.minOrderValue.replace(",", ".")),
          menu_slug: formData.menuSlug,
          menu_banner_text: formData.menuBannerText,
          menu_enabled_features: formData.menuEnabledFeatures,
          opening_hours: { description: formData.openingHours }
        }).eq(companyFilter.column, companyFilter.value).select()

        if (dbError) throw dbError
        
        // Check if anything was actually updated
        if (!dbData || dbData.length === 0) {
          throw new Error("Nenhuma empresa encontrada para atualizar. Por favor, tente recarregar a página.")
        }

        // Update SaaS/Auth Metadata (Synchronization)
        const { error: authError } = await updateProfile({
          store_name: formData.storeName,
          instagram: formData.instagram
        })
        
        if (authError) throw authError

        toast.success("Alterações publicadas com sucesso!")
      } else {
        throw new Error("Não foi possível identificar sua empresa. Tente fazer login novamente.")
      }
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      menuEnabledFeatures: prev.menuEnabledFeatures.includes(feature)
        ? prev.menuEnabledFeatures.filter(f => f !== feature)
        : [...prev.menuEnabledFeatures, feature]
    }))
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="px-8 border-b border-slate-100 overflow-x-auto no-scrollbar">
        <TabsList className="bg-transparent h-24 gap-4 flex items-center min-w-max">
          {[
            { id: "perfil", label: "Perfil", icon: User },
            { id: "negocio", label: "Meu Negócio", icon: Store },
            { id: "menu", label: "Cardápio Digital", icon: Globe },
            { id: "whatsapp", label: "WhatsApp", icon: Smartphone },
            { id: "entrega", label: "Logística", icon: MapPin },
            { id: "financeiro", label: "Financeiro", icon: CreditCard },
          ].map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className={cn(
                "relative rounded-2xl h-14 px-6 flex items-center gap-3 font-black uppercase tracking-widest text-[10px] transition-all duration-300",
                "data-[state=active]:bg-[#FF2F81]/5 data-[state=active]:text-[#FF2F81] data-[state=active]:shadow-none",
                "hover:bg-slate-50 text-slate-400"
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 border-2 border-[#FF2F81] rounded-2xl pointer-events-none"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="p-10 lg:p-16">
        <AnimatePresence mode="wait">
          {/* PERFIL */}
          {activeTab === "perfil" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-12 gap-16">
               <div className="lg:col-span-8 space-y-12">
                  <div className="flex items-center gap-4">
                     <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><User className="size-5" /></div>
                     <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Configurações de Perfil</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Nome Completo</Label>
                       <Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100" />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">WhatsApp</Label>
                       <Input value={formData.personalWhatsapp} onChange={e => setFormData({...formData, personalWhatsapp: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100" />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Telefone (Opcional)</Label>
                       <Input value={formData.personalPhone} onChange={e => setFormData({...formData, personalPhone: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-3">
                          <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Cidade</Label>
                          <Input value={formData.personalCity} onChange={e => setFormData({...formData, personalCity: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100" />
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Estado</Label>
                          <Input value={formData.personalState} onChange={e => setFormData({...formData, personalState: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100" placeholder="UF" />
                       </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                       <Label className="text-[11px] font-black uppercase text-slate-400 ml-2 italic">Sua Especialidade Principal</Label>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         {SPECIALTIES.map(s => (
                           <button key={s} onClick={() => setFormData({...formData, specialty: s})} className={cn("p-4 rounded-2xl border-2 transition-all font-bold text-[10px] uppercase", formData.specialty === s ? "border-[#FF2F81] bg-[#FF2F81]/5 text-[#FF2F81]" : "border-slate-100 bg-slate-50 text-slate-500")}>
                             {s}
                           </button>
                         ))}
                       </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                       <Label className="text-[11px] font-black uppercase text-slate-400 ml-2 italic">Tempo de Experiência</Label>
                       <div className="grid md:grid-cols-2 gap-3">
                         {EXPERIENCE_LEVELS.map(exp => (
                           <button key={exp} onClick={() => setFormData({...formData, experience: exp})} className={cn("w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group", formData.experience === exp ? "border-[#FF2F81] bg-[#FF2F81]/5" : "border-slate-100 bg-slate-50")}>
                             <span className={cn("font-bold text-xs", formData.experience === exp ? "text-[#FF2F81]" : "text-slate-500")}>{exp}</span>
                             <div className={cn("size-4 rounded-full border-2", formData.experience === exp ? "border-[#FF2F81] bg-[#FF2F81]" : "border-slate-300")} />
                           </button>
                         ))}
                       </div>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                       <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Sobre Você (Bio)</Label>
                       <Textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="min-h-[120px] rounded-2xl border-2 border-slate-100 p-6" />
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile} disabled={loading} className="h-16 px-12 rounded-2xl bg-primary text-white font-black uppercase italic text-xs gap-3">
                     <Save className="size-5" /> {loading ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                  </Button>
               </div>
            </motion.div>
          )}

          {/* NEGÓCIO (BUSINESS) */}
          {activeTab === "negocio" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-12 gap-16">
               <div className="lg:col-span-8 space-y-12">
                  <div className="flex items-center gap-4">
                     <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Store className="size-5" /></div>
                     <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Identidade do Negócio</h4>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Nome da Confeitaria / Loja</Label>
                        <Input value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Instagram (@)</Label>
                        <Input value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} placeholder="@atelie_doce" className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary" />
                     </div>
                     <div className="md:col-span-2 space-y-3">
                        <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Descrição Curta (Slogan)</Label>
                        <Textarea value={formData.businessBio} onChange={e => setFormData({...formData, businessBio: e.target.value})} className="min-h-[100px] rounded-2xl border-2 border-slate-100 focus:border-primary p-6" />
                     </div>

                     <div className="md:col-span-2 space-y-6">
                        <Label className="text-[11px] font-black uppercase text-slate-400 ml-2 italic">Segmento de Atuação</Label>
                        <div className="flex flex-wrap gap-3">
                           {SEGMENTS.map(seg => (
                             <button 
                               key={seg} 
                               onClick={() => setFormData({...formData, segment: seg})} 
                               className={cn(
                                 "px-6 py-3 rounded-full border-2 transition-all font-black text-[9px] uppercase tracking-widest", 
                                 formData.segment === seg 
                                   ? "border-[#FF2F81] bg-[#FF2F81] text-white" 
                                   : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                               )}
                             >
                               {seg}
                             </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  <Button onClick={handleSaveBusiness} disabled={loading} className="h-16 px-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase italic text-xs gap-3">
                     <Save className="size-5" /> {loading ? "SALVANDO..." : "ATUALIZAR NEGÓCIO"}
                  </Button>
               </div>

               <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="p-10 rounded-[40px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                     {formData.logoUrl ? (
                        <div className="size-32 rounded-3xl overflow-hidden border-2 border-slate-100 shadow-sm">
                           <img src={formData.logoUrl} alt="Logo" className="size-full object-cover" />
                        </div>
                     ) : (
                        <div className="size-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border-2 border-slate-100"><Store className="size-10" /></div>
                     )}
                     <div className="space-y-1 text-center">
                        <span className="font-black italic uppercase text-[10px] text-slate-400 tracking-widest block">Logo da Empresa</span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase max-w-[150px]">Recomendado: 512x512px (PNG ou JPG)</p>
                     </div>
                     <Button 
                        variant="outline" 
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        disabled={loading}
                        className="h-10 rounded-xl border-slate-200 font-bold text-[10px] uppercase"
                     >
                        {loading ? "ENVIANDO..." : "Alterar Logo"}
                     </Button>
                     <input 
                        id="logo-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLogoUpload}
                        disabled={loading}
                     />
                  </div>

                  <div className="p-8 rounded-[32px] bg-slate-50 border-2 border-slate-100 space-y-4">
                     <div className="flex items-center gap-3 text-indigo-600 font-black uppercase italic text-[10px]">
                        <Check className="size-4" /> Branding Ativo
                     </div>
                     <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">Sua logo aparecerá em todos os seus pedidos, cardápio digital e recibos gerados pela plataforma.</p>
                  </div>
               </div>
            </motion.div>
          )}

          {/* CARDÁPIO DIGITAL (IMAGE-BASED UI) */}
          {activeTab === "menu" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
               {/* Header Section */}
               <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-slate-100">
                  <div className="flex items-center gap-6">
                     <div className="size-16 rounded-[24px] bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
                        <Globe className="size-8" />
                     </div>
                     <div>
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Meu <span className="text-[#FF2F81]">Cardápio Digital</span></h3>
                        <p className="text-slate-400 font-bold text-sm max-w-xl">Configure seu link exclusivo e comece a vender online. Seus clientes poderão fazer pedidos diretamente pelo navegador.</p>
                     </div>
                  </div>
                  <Button variant="outline" className="h-14 rounded-2xl border-2 border-slate-200 px-8 font-black uppercase italic text-[11px] hover:bg-slate-50 gap-3">
                     <Eye className="size-4" /> VISUALIZAR
                  </Button>
               </div>

               <div className="grid lg:grid-cols-2 gap-16 items-start">
                  <div className="space-y-10">
                     {/* URL Section */}
                     <div className="space-y-6">
                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">URL DO SEU CARDÁPIO</Label>
                        <div className="flex h-20 items-center rounded-[32px] border-2 border-slate-100 bg-slate-50/50 px-8 transition-all focus-within:border-[#FF2F81] focus-within:bg-white shadow-sm overflow-hidden">
                           <div className="flex items-center gap-2 shrink-0">
                              <span className="text-slate-300 font-bold text-lg select-none">docesgestao.netlify.app/menu/</span>
                           </div>
                           <input 
                             value={formData.menuSlug} 
                             onChange={e => setFormData({...formData, menuSlug: e.target.value.toLowerCase().replace(/\s/g, '-')})} 
                             placeholder="sua-loja" 
                             className="flex-1 h-full bg-transparent border-none focus:ring-0 font-black text-2xl text-slate-800 placeholder:text-slate-200" 
                           />
                           <button 
                             onClick={copyToClipboard} 
                             className="ml-4 shrink-0 size-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#FF2F81] hover:scale-105 active:scale-95 transition-all"
                           >
                              {copied ? <Check className="size-6 text-emerald-500" /> : <Copy className="size-6" />}
                           </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold italic uppercase tracking-wider ml-4">* ESTE SERÁ O ENDEREÇO QUE VOCÊ VAI COLOCAR NA SUA BIO DO INSTAGRAM.</p>
                     </div>

                     {/* Rules Section */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <Clock className="size-4 text-slate-400" />
                           <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 italic">FUNCIONAMENTO & REGRAS</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-3">
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-2">PEDIDO MÍNIMO (R$)</span>
                              <Input value={formData.minOrderValue} onChange={e => setFormData({...formData, minOrderValue: e.target.value})} placeholder="0.00" className="h-16 rounded-2xl border-2 border-slate-100 bg-slate-50/50 font-black text-xl px-6" />
                           </div>
                           <div className="space-y-3">
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-2">HORÁRIO DE ATENDIMENTO</span>
                              <Input value={formData.openingHours} onChange={e => setFormData({...formData, openingHours: e.target.value})} placeholder="Ex: Seg-Sex: 09h-18h" className="h-16 rounded-2xl border-2 border-slate-100 bg-slate-50/50 font-bold text-sm px-6" />
                           </div>
                        </div>
                        <div className="space-y-3">
                           <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-2">TEXTO DO BANNER PROMOCIONAL</span>
                           <Input value={formData.menuBannerText} onChange={e => setFormData({...formData, menuBannerText: e.target.value})} placeholder="Ex: Entrega grátis acima de R$ 100!" className="h-16 rounded-2xl border-2 border-slate-100 bg-slate-50/50 font-bold text-sm px-6" />
                        </div>
                     </div>

                     {/* Features Icons Section */}
                     <div className="space-y-6 pt-4">
                        <div className="flex items-center gap-3">
                           <div className="size-2 rounded-full bg-[#FF2F81]" />
                           <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 italic">RECURSOS ATIVADOS</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                           {[
                             { id: "whatsapp", label: "PEDIDOS VIA WHATSAPP" },
                             { id: "delivery", label: "CÁLCULO DE ENTREGA" },
                             { id: "pix", label: "PAGAMENTO ONLINE (PIX)" },
                             { id: "stock", label: "GESTÃO DE ESTOQUE" },
                             { id: "banners", label: "BANNERS PROMOCIONAIS" },
                             { id: "tables", label: "QR CODE DE MESA" }
                           ].map(feat => (
                             <div key={feat.id} onClick={() => toggleFeature(feat.id)} className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn("size-6 rounded-full border-2 flex items-center justify-center transition-all", formData.menuEnabledFeatures.includes(feat.id) ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 text-transparent")}>
                                   <Check className="size-3.5 stroke-[4px]" />
                                </div>
                                <span className={cn("text-[10px] font-black uppercase tracking-wider transition-all", formData.menuEnabledFeatures.includes(feat.id) ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600")}>{feat.label}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* QR Code Graphic Section */}
                  <div className="relative">
                     <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-[56px] p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 size-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                        <div className="bg-white p-6 rounded-[40px] shadow-2xl mb-10 transition-transform group-hover:scale-110 duration-500">
                           <QRCodeSVG value={`https://docesgestao.netlify.app/menu/${formData.menuSlug || 'sua-loja'}`} size={180} />
                        </div>
                        <h4 className="text-white font-black italic uppercase text-lg tracking-widest mb-2">QR CODE DE <span className="text-[#FF2F81]">BALCÃO</span></h4>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-relaxed mb-10">IMPRA E COLOQUE NA SUA LOJA<br/>PARA PEDIDOS RÁPIDOS.</p>
                        <Button className="h-16 px-10 rounded-2xl bg-white text-slate-900 font-black uppercase italic text-xs gap-3 shadow-xl hover:bg-slate-50">
                           <QrCode className="size-5" /> GERAR NOVO
                        </Button>
                     </div>
                  </div>
               </div>

               {/* Submit Section */}
               <Button onClick={handleSaveBusiness} disabled={loading} className="w-full h-24 rounded-[32px] bg-[#0F172A] hover:bg-slate-900 text-white font-black uppercase italic tracking-[0.3em] text-lg lg:text-xl gap-6 shadow-2xl transition-all active:scale-[0.98]">
                  {loading ? "PROCESSANDO..." : "PUBLICAR ALTERAÇÕES NO CARDÁPIO"}
                  <ChevronRight className="size-8" />
               </Button>
            </motion.div>
          )}

          {/* WHATSAPP TAB */}
          {activeTab === "whatsapp" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-2 gap-16">
               <div className="space-y-10">
                  <div className="flex items-center gap-6">
                     <div className="size-16 rounded-[24px] bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                        <Smartphone className="size-8" />
                     </div>
                     <div>
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Conexão <span className="text-emerald-500">WhatsApp</span></h3>
                        <p className="text-slate-400 font-bold text-sm">Receba pedidos, automatize mensagens e conecte-se com seus clientes.</p>
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="p-8 rounded-[32px] bg-slate-50 border-2 border-slate-100 space-y-6">
                        <div className="flex items-center gap-4">
                           <div className={cn("size-4 rounded-full animate-pulse", waStatus === 'CONNECTED' ? "bg-emerald-500" : "bg-red-500")} />
                           <span className="font-black italic uppercase text-sm">{waStatus === 'CONNECTED' ? "WHATSAPP CONECTADO" : "AGUARDANDO CONEXÃO..."}</span>
                        </div>
                        <ul className="space-y-4">
                           {[
                             "Receba pedidos direto no seu WhatsApp",
                             "Confirmação de entrega automática",
                             "Envio de status de produção",
                             "Aviso de novos produtos para clientes"
                           ].map((item, i) => (
                             <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                <div className="size-2 rounded-full bg-emerald-500" /> {item}
                             </li>
                           ))}
                        </ul>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col items-center justify-center text-center p-12 rounded-[56px] border-4 border-dashed border-slate-100 space-y-8 relative overflow-hidden group">
                  <div className="relative z-10 transition-all duration-500 group-hover:scale-105">
                     
                     {waStatus === 'DISCONNECTED' && (
                        <Button onClick={handleStartWhatsApp} className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest gap-2 shadow-xl shadow-emerald-200">
                            <QrCode className="size-5" /> Mostrar QR Code Oficial
                        </Button>
                     )}

                     {waStatus === 'QR_READY' && waQr && (
                         <div className="bg-white p-6 rounded-[32px] shadow-[0_30px_60px_-15px_rgba(16,185,129,0.3)] border border-emerald-50 relative">
                            <img src={waQr} alt="WhatsApp QR Code" className="w-[240px] h-[240px]" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white size-16 rounded-3xl shadow-xl flex items-center justify-center border-4 border-emerald-50">
                               <Zap className="size-8 text-emerald-500 fill-emerald-500" />
                            </div>
                         </div>
                     )}

                     {waStatus === 'AUTHENTICATING' && (
                         <div className="space-y-4">
                             <Zap className="size-16 text-emerald-500 fill-emerald-500 animate-pulse mx-auto" />
                             <p className="font-black italic uppercase tracking-widest text-[#FF2F81] text-xs">AUTENTICANDO...</p>
                         </div>
                     )}

                     {waStatus === 'CONNECTED' && (
                         <div className="space-y-4 text-emerald-600 font-bold flex flex-col items-center">
                             <Check className="size-16 bg-emerald-50 rounded-full p-4 mb-2" />
                             <p className="font-black italic uppercase tracking-widest">SESSÃO ATIVA!</p>
                             <Button variant="outline" onClick={handleStopWhatsApp} className="h-12 border-rose-200 text-rose-500 hover:bg-rose-50 rounded-2xl px-6 mt-4">DESCONECTAR</Button>
                         </div>
                     )}

                  </div>
                  
                  {waStatus === 'QR_READY' && (
                      <div className="space-y-2">
                         <p className="font-black italic uppercase tracking-widest text-[#FF2F81] text-xs">ESCANEIE O QR CODE ACIMA</p>
                         <p className="text-slate-400 font-bold text-[10px] uppercase max-w-xs mx-auto">USE O WHATSAPP DO SEU CELULAR EM 'APARELHOS CONECTADOS' PARA SINCRONIZAR.</p>
                      </div>
                  )}
               </div>
            </motion.div>
          )}

          {/* ENTREGA TAB */}
          {activeTab === "entrega" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-12 gap-16">
               <div className="lg:col-span-8 space-y-12">
                  <div className="flex items-center gap-4">
                     <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><MapPin className="size-5" /></div>
                     <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Logística & Endereço</h4>
                  </div>

                  <div className="p-8 rounded-[32px] bg-slate-50 border-2 border-slate-100 flex items-center justify-between">
                     <div>
                        <Label className="text-[14px] font-black uppercase text-slate-900">Atender Delivery</Label>
                        <p className="text-[10px] uppercase text-slate-500 font-bold mt-1">Ative para permitir entregas aos seus clientes.</p>
                     </div>
                     <Switch checked={formData.atendeDelivery} onCheckedChange={c => setFormData({...formData, atendeDelivery: c})} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">CEP</Label>
                        <Input value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100" placeholder="00000-000" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Raio de Entrega (KM)</Label>
                        <Input value={formData.deliveryRadius} onChange={e => setFormData({...formData, deliveryRadius: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100" placeholder="Ex: 5" disabled={!formData.atendeDelivery} />
                     </div>

                     <div className="md:col-span-2 space-y-3">
                        <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Rua / Avenida</Label>
                        <Input value={formData.address.street} onChange={e => setFormData({...formData, address: {...formData.address, street: e.target.value}})} className="h-14 rounded-2xl border-2 border-slate-100" />
                     </div>
                     
                     <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Número</Label>
                        <Input value={formData.address.number} onChange={e => setFormData({...formData, address: {...formData.address, number: e.target.value}})} className="h-14 rounded-2xl border-2 border-slate-100" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Complemento</Label>
                        <Input value={formData.address.complement} onChange={e => setFormData({...formData, address: {...formData.address, complement: e.target.value}})} className="h-14 rounded-2xl border-2 border-slate-100" placeholder="Ex: Apto 101, Bloco B" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Bairro</Label>
                        <Input value={formData.address.neighborhood} onChange={e => setFormData({...formData, address: {...formData.address, neighborhood: e.target.value}})} className="h-14 rounded-2xl border-2 border-slate-100" />
                     </div>

                     <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Cidade</Label>
                        <Input value={formData.address.city} onChange={e => setFormData({...formData, address: {...formData.address, city: e.target.value}})} className="h-14 rounded-2xl border-2 border-slate-100" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Estado</Label>
                        <Input value={formData.address.state} onChange={e => setFormData({...formData, address: {...formData.address, state: e.target.value}})} className="h-14 rounded-2xl border-2 border-slate-100" placeholder="Ex: SP" />
                     </div>
                  </div>

                  <Button onClick={handleSaveBusiness} disabled={loading} className="h-16 px-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase italic text-xs gap-3 mt-6">
                     <Save className="size-5" /> {loading ? "SALVANDO..." : "SALVAR LOGÍSTICA"}
                  </Button>
               </div>
            </motion.div>
          )}

          {/* FINANCEIRO TAB */}
          {activeTab === "financeiro" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-12 gap-16">
               <div className="lg:col-span-8 space-y-12">
                  <div className="flex items-center gap-4">
                     <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><CreditCard className="size-5" /></div>
                     <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Dados Financeiros</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3 md:col-span-2">
                        <Label className="text-[14px] font-black uppercase text-slate-900 ml-2">Formas de Pagamento Aceitas</Label>
                        <p className="text-[10px] uppercase text-slate-500 font-bold ml-2 mb-4">Selecione como os clientes do seu cardápio digital poderão pagar.</p>
                        
                        <div className="flex flex-col gap-4">
                           <div className="p-6 rounded-2xl border-2 border-slate-100 flex items-center justify-between">
                              <span className="text-sm font-bold uppercase tracking-wider text-slate-700">PIX</span>
                              <Switch checked={formData.acceptPix} onCheckedChange={c => setFormData({...formData, acceptPix: c})} />
                           </div>
                           <div className="p-6 rounded-2xl border-2 border-slate-100 flex items-center justify-between">
                              <span className="text-sm font-bold uppercase tracking-wider text-slate-700">Cartão Conta / Crédito (Na entrega)</span>
                              <Switch checked={formData.acceptCard} onCheckedChange={c => setFormData({...formData, acceptCard: c})} />
                           </div>
                           <div className="p-6 rounded-2xl border-2 border-slate-100 flex items-center justify-between">
                              <span className="text-sm font-bold uppercase tracking-wider text-slate-700">Dinheiro (Na entrega)</span>
                              <Switch checked={formData.acceptCash} onCheckedChange={c => setFormData({...formData, acceptCash: c})} />
                           </div>
                        </div>
                     </div>
                  </div>

                  <Button onClick={handleSaveBusiness} disabled={loading} className="h-16 px-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase italic text-xs gap-3">
                     <Save className="size-5" /> {loading ? "SALVANDO..." : "SALVAR FINANCEIRO"}
                  </Button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Tabs>
  )
}
