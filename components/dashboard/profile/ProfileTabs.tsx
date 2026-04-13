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
  Zap,
  Sparkles,
  RotateCw,
  Camera,
  ExternalLink,
  Palette,
  Receipt,
  DollarSign,
  Monitor
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { usePaymentSettings } from "@/hooks/usePaymentSettings"
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

import { useSearchParams } from "next/navigation"

export function ProfileTabs() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  
  const { user, updateProfile } = useAuth()
  const { profile, business, refreshBusiness } = useBusiness()
  const { settings: paymentSettings, loading: loadingPayments, saving: savingPayments, connectTuna, updateTunaSettings } = usePaymentSettings()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab ] = useState(tabParam || "perfil")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])
  
  // Helper to get the correct base URL for menu links
  const getMenuBaseUrl = () => {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_APP_URL || ""
    
    // Prioriza o domínio customizado se definido no env
    const envUrl = process.env.NEXT_PUBLIC_APP_URL
    if (envUrl && !envUrl.includes('localhost')) return envUrl

    // Se estiver em produção (Netlify ou domínio customizado), usa a origin atual
    return window.location.origin
  }

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
    monthlyGoal: "10000",
    logoUrl: "",
    primaryColor: "#FF2F81",
    receiptHeader: "",
    receiptFooter: "Obrigado pela preferência! ✨",
    detailedHours: {
      seg: { open: "09:00", close: "18:00", closed: false },
      ter: { open: "09:00", close: "18:00", closed: false },
      qua: { open: "09:00", close: "18:00", closed: false },
      qui: { open: "09:00", close: "18:00", closed: false },
      sex: { open: "09:00", close: "18:00", closed: false },
      sab: { open: "09:00", close: "13:00", closed: false },
      dom: { open: "00:00", close: "00:00", closed: true },
    }
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
            personalWhatsapp: profile?.whatsapp || companyData.phone || prev.personalWhatsapp, // Priorizar profile
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
            monthlyGoal: String(business?.config?.monthly_goal || "10000"),
            logoUrl: companyData.logo_url || "",
            primaryColor: business?.config?.primary_color || "#FF2F81",
            receiptHeader: business?.config?.receipt_header || "",
            receiptFooter: business?.config?.receipt_footer || "Obrigado pela preferência! ✨",
            detailedHours: business?.config?.operating_hours || prev.detailedHours
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
    const url = `${getMenuBaseUrl()}/menu/${formData.menuSlug || 'sua-loja'}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Link copiado!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCEPLookup = async () => {
    const cleanCEP = formData.cep.replace(/\D/g, "")
    if (cleanCEP.length !== 8) {
      toast.error("CEP inválido")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast.error("CEP não encontrado")
      } else {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }
        }))
        toast.success("Endereço preenchido!")
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP")
    } finally {
      setLoading(false)
    }
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
      const companyFilter = profile?.company_id 
        ? { column: "id", value: profile.company_id } 
        : { column: "owner_id", value: user?.id };

      if (companyFilter.value) {
        const businessId = companyFilter.value

        const payloadCompanies = {
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
        }

        const payloadEmpresas = {
          nome: formData.storeName,
          telefone: formData.personalWhatsapp,
          endereco: `${formData.address.street}, ${formData.address.number}`,
          delivery_fee: business?.delivery_fee || 0,
          min_order_value: parseFloat(formData.minOrderValue.replace(",", ".")),
          delivery_radius: parseFloat(formData.deliveryRadius),
          opening_hours: {
            ...formData.detailedHours,
            is_open_manual: business?.opening_hours?.is_open_manual !== false,
            receipt_header: formData.receiptHeader,
            receipt_footer: formData.receiptFooter,
            monthly_goal: parseFloat(formData.monthlyGoal) || 10000
          }
        }

        const payloadDigitalMenu = {
          company_id: businessId,
          store_name: formData.storeName,
          primary_color: formData.primaryColor,
          button_color: formData.primaryColor,
          instagram: formData.instagram,
          whatsapp: formData.personalWhatsapp,
          updated_at: new Date().toISOString()
        }

        const payloadDelivery = {
          tenant_id: businessId,
          base_fee: business?.delivery_fee || 0,
          max_km: parseFloat(formData.deliveryRadius),
          whatsapp_number: formData.personalWhatsapp
        }

        const [resCompanies] = await Promise.all([
          supabase.from("companies").update(payloadCompanies).eq("id", businessId).select(),
          supabase.from("empresas").update(payloadEmpresas).eq("id", businessId),
          supabase.from('tenants').update({ slug: formData.menuSlug, name: formData.storeName }).eq('id', businessId),
          supabase.from('digital_menu_settings').upsert(payloadDigitalMenu),
          supabase.from('delivery_settings').upsert(payloadDelivery)
        ])

        if (resCompanies.error) throw resCompanies.error

        const { error: authError } = await updateProfile({
          store_name: formData.storeName,
          instagram: formData.instagram,
          menu_slug: formData.menuSlug,
          whatsapp: formData.personalWhatsapp
        })
        
        if (authError) throw authError

        await refreshBusiness()
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
        <TabsList className="bg-slate-50/50 p-2 rounded-[28px] h-20 gap-2 flex items-center min-w-max border border-slate-100">
          {[
            { id: "perfil", label: "Perfil", icon: User },
            { id: "negocio", label: "Meu Negócio", icon: Store },
            { id: "menu", label: "Cardápio Digital", icon: Globe },
            { id: "whatsapp", label: "WhatsApp", icon: Smartphone },
            { id: "entrega", label: "Logística", icon: MapPin },
            { id: "financeiro", label: "Financeiro", icon: CreditCard },
            { id: "sistema", label: "Sistema", icon: Monitor },
          ].map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className={cn(
                "relative rounded-2xl h-12 px-6 flex items-center gap-3 font-black uppercase tracking-widest text-[10px] transition-all duration-300",
                "data-[state=active]:bg-white data-[state=active]:text-[#FF2F81] data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/50",
                "hover:bg-white/50 text-slate-400"
              )}
            >
              <tab.icon className={cn("size-4", activeTab === tab.id ? "text-[#FF2F81]" : "text-slate-400")} />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="p-10 lg:p-16">
        <AnimatePresence mode="wait">
          {/* PERFIL */}
          {activeTab === "perfil" && (
            <motion.div key="perfil" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-16">
               <div className="grid lg:grid-cols-12 gap-16">
                  <div className="lg:col-span-8 space-y-12">
                     <div className="space-y-8">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                           <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm"><User className="size-5" /></div>
                           <div>
                              <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Dados Pessoais</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informações básicas de contato</p>
                           </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Nome Completo</Label>
                              <Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700" />
                           </div>
                           <div className="space-y-3">
                              <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">WhatsApp</Label>
                              <Input value={formData.personalWhatsapp} onChange={e => setFormData({...formData, personalWhatsapp: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700" />
                           </div>
                           <div className="space-y-3">
                              <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Telefone (Opcional)</Label>
                              <Input value={formData.personalPhone} onChange={e => setFormData({...formData, personalPhone: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700" />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-3">
                                 <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Cidade</Label>
                                 <Input value={formData.personalCity} onChange={e => setFormData({...formData, personalCity: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700" />
                              </div>
                              <div className="space-y-3">
                                 <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Estado</Label>
                                 <Input value={formData.personalState} onChange={e => setFormData({...formData, personalState: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700 uppercase" placeholder="UF" />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-8">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                           <div className="size-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 shadow-sm"><Zap className="size-5" /></div>
                           <div>
                              <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Perfil Profissional</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sua experiência e especialidades</p>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <Label className="text-[11px] font-black uppercase text-slate-400 ml-2 italic">Qual sua especialidade principal?</Label>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {SPECIALTIES.map(s => (
                               <button 
                                 key={s} 
                                 onClick={() => setFormData({...formData, specialty: s})} 
                                 className={cn(
                                   "p-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-tighter italic h-16 flex items-center justify-center text-center leading-tight shadow-sm hover:translate-y-[-2px]", 
                                   formData.specialty === s 
                                     ? "border-[#FF2F81] bg-[#FF2F81] text-white shadow-lg shadow-pink-100" 
                                     : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                                 )}
                               >
                                 {s}
                               </button>
                             ))}
                           </div>
                        </div>

                        <div className="space-y-6">
                           <Label className="text-[11px] font-black uppercase text-slate-400 ml-2 italic">Tempo de estrada na confeitaria?</Label>
                           <div className="grid md:grid-cols-2 gap-4">
                             {EXPERIENCE_LEVELS.map(exp => (
                               <button 
                                 key={exp} 
                                 onClick={() => setFormData({...formData, experience: exp})} 
                                 className={cn(
                                   "w-full p-5 rounded-[24px] border-2 transition-all flex items-center justify-between group shadow-sm hover:translate-x-1", 
                                   formData.experience === exp 
                                     ? "border-[#FF2F81] bg-[#FF2F81]/5" 
                                     : "border-slate-100 bg-white hover:border-slate-200"
                                 )}
                               >
                                 <span className={cn("font-black text-[11px] uppercase italic tracking-tight", formData.experience === exp ? "text-[#FF2F81]" : "text-slate-500")}>{exp}</span>
                                 <div className={cn("size-6 rounded-full border-4 flex items-center justify-center transition-all", formData.experience === exp ? "border-[#FF2F81] bg-white" : "border-slate-100 bg-slate-50")}>
                                   {formData.experience === exp && <div className="size-2 rounded-full bg-[#FF2F81]" />}
                                 </div>
                               </button>
                             ))}
                           </div>
                        </div>

                        <div className="space-y-3">
                           <Label className="text-[11px] font-black uppercase text-slate-400 ml-2 italic">Conte um pouco sua história (Bio)</Label>
                           <Textarea 
                             value={formData.bio} 
                             onChange={e => setFormData({...formData, bio: e.target.value})} 
                             className="min-h-[150px] rounded-[32px] border-2 border-slate-100 p-8 focus:border-primary transition-all font-bold text-slate-700 leading-relaxed shadow-sm" 
                             placeholder="Ex: Comecei fazendo bolos para família e hoje transformo sonhos em açúcar..."
                           />
                        </div>
                     </div>

                     <div className="pt-6">
                        <Button 
                          onClick={handleSaveProfile} 
                          disabled={loading} 
                          className="h-20 px-16 rounded-[28px] bg-slate-900 hover:bg-black text-white font-black uppercase italic text-sm gap-4 shadow-xl shadow-slate-200 transition-all active:scale-95 border-b-4 border-slate-700 active:border-b-0"
                        >
                           {loading ? <RotateCw className="size-6 animate-spin" /> : <Save className="size-6" />}
                           {loading ? "SALVANDO..." : "SALVAR ALTERAÇÕES DO PERFIL"}
                        </Button>
                     </div>
                  </div>
                  
                  <div className="lg:col-span-4 space-y-6">
                     <div className="bg-indigo-900 rounded-[40px] p-10 text-white relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 size-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 space-y-6">
                           <div className="size-16 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                              <Sparkles className="size-8 text-amber-400" />
                           </div>
                           <div className="space-y-2">
                              <h5 className="text-xl font-black uppercase italic leading-none">Dica de Ouro</h5>
                              <p className="text-xs font-bold text-indigo-200 leading-relaxed uppercase">
                                Um perfil completo gera até <span className="text-white">85% mais confiança</span> para novos clientes no seu cardápio digital.
                              </p>
                           </div>
                           <div className="bg-white/10 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest text-indigo-100 italic border border-white/5">
                              * Capriche na sua Bio e escolha bem suas especialidades.
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* MEU NEGÓCIO */}
          {activeTab === "negocio" && (
            <motion.div key="negocio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-16">
               <div className="grid lg:grid-cols-12 gap-16">
                  <div className="lg:col-span-8 space-y-12">
                     <div className="space-y-8">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                           <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm"><Store className="size-5" /></div>
                           <div>
                              <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Identidade Visual</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Como sua marca aparece no mercado</p>
                           </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Nome da Confeitaria / Loja</Label>
                              <Input value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700" />
                           </div>
                           <div className="space-y-3">
                              <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Instagram (@)</Label>
                              <Input value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} placeholder="@atelie_doce" className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700" />
                           </div>
                           <div className="md:col-span-2 space-y-3">
                              <Label className="text-[11px] font-black uppercase text-slate-400 ml-2 italic">Slogan ou Descrição Curta</Label>
                              <Textarea value={formData.businessBio} onChange={e => setFormData({...formData, businessBio: e.target.value})} className="min-h-[100px] rounded-2xl border-2 border-slate-100 focus:border-primary p-6 transition-all font-bold text-slate-700" />
                           </div>

                           <div className="md:col-span-2 space-y-6">
                              <Label className="text-[11px] font-black uppercase text-slate-400 ml-2 italic">Seu Segmento Principal</Label>
                              <div className="flex flex-wrap gap-3">
                                 {SEGMENTS.map(seg => (
                                   <button 
                                     key={seg} 
                                     onClick={() => setFormData({...formData, segment: seg})} 
                                     className={cn(
                                       "px-6 py-3 rounded-full border-2 transition-all font-black text-[9px] uppercase tracking-widest italic shadow-sm", 
                                       formData.segment === seg 
                                         ? "border-[#FF2F81] bg-[#FF2F81] text-white shadow-lg shadow-pink-100" 
                                         : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                                     )}
                                   >
                                     {seg}
                                   </button>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="pt-6">
                        <Button 
                          onClick={handleSaveBusiness} 
                          disabled={loading} 
                          className="h-20 px-16 rounded-[28px] bg-slate-900 hover:bg-black text-white font-black uppercase italic text-sm gap-4 shadow-xl shadow-slate-200 transition-all active:scale-95 border-b-4 border-slate-700 active:border-b-0"
                        >
                           {loading ? <RotateCw className="size-6 animate-spin" /> : <Save className="size-6" />}
                           {loading ? "ATUALIZANDO..." : "SALVAR DADOS DO NEGÓCIO"}
                        </Button>
                     </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col gap-6">
                     <div className="p-10 rounded-[40px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-6 bg-slate-50/50 group hover:border-indigo-200 transition-all duration-500">
                        <div className="relative">
                           {formData.logoUrl ? (
                              <div className="size-32 rounded-[32px] overflow-hidden border-4 border-white shadow-2xl transition-transform group-hover:scale-105">
                                 <img src={formData.logoUrl} alt="Logo" className="size-full object-cover" />
                              </div>
                           ) : (
                              <div className="size-32 rounded-[32px] bg-white flex items-center justify-center text-slate-200 border-4 border-slate-100 shadow-xl"><Store className="size-12" /></div>
                           )}
                           <div className="absolute -bottom-2 -right-2 size-10 rounded-xl bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                              <Camera className="size-5" />
                           </div>
                        </div>
                        <div className="space-y-1">
                           <span className="font-black italic uppercase text-[10px] text-slate-500 tracking-widest block">Logo da Empresa</span>
                           <p className="text-[9px] text-slate-400 font-bold uppercase max-w-[150px] leading-relaxed">Formatos: PNG ou JPG<br/>Mín: 512x512px</p>
                        </div>
                        <Button 
                           variant="outline" 
                           onClick={() => document.getElementById('logo-upload')?.click()}
                           disabled={loading}
                           className="h-12 rounded-2xl border-2 border-slate-200 bg-white font-black text-[10px] uppercase italic px-8 hover:bg-slate-50 shadow-sm"
                        >
                           {loading ? "ENVIANDO..." : "ALTERAR LOGO"}
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

                     <div className="p-8 rounded-[32px] bg-indigo-50 border-2 border-indigo-100/50 space-y-4">
                        <div className="flex items-center gap-3 text-indigo-600 font-black uppercase italic text-[11px] tracking-tight">
                           <div className="size-2 rounded-full bg-indigo-600 animate-pulse" /> Marca Profissional
                        </div>
                        <p className="text-[10px] text-indigo-900/60 font-black leading-relaxed uppercase italic">Sua logo é a cara do seu negócio. Ela aparecerá nos pedidos, cardápio e recibos.</p>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* CARDÁPIO DIGITAL */}
          {activeTab === "menu" && (
            <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
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
                  <Button 
                    onClick={() => {
                        if (!formData.menuSlug) {
                          toast.error("Por favor, defina um nome para o link do seu cardápio primeiro.")
                          return
                        }
                        window.open(`${getMenuBaseUrl()}/menu/${formData.menuSlug}`, '_blank')
                    }}
                    variant="outline" 
                    className="h-14 rounded-2xl border-2 border-slate-200 px-8 font-black uppercase italic text-[11px] hover:bg-slate-50 gap-3"
                  >
                     <Eye className="size-4" /> VISUALIZAR
                  </Button>
               </div>

               <div className="grid lg:grid-cols-2 gap-16 items-start">
                  <div className="space-y-10">
                     {/* URL Section */}
                     <div className="space-y-6">
                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">URL DO SEU CARDÁPIO</Label>
                        <div className="h-20 bg-slate-50 rounded-3xl border-2 border-slate-100 flex items-center px-8 relative focus-within:border-emerald-500/30 transition-all">
                           <div className="flex items-center gap-2 shrink-0 border-r border-slate-200 pr-4 mr-4">
                              <Globe className="size-4 text-emerald-500" />
                              <span className="text-slate-300 font-bold text-sm select-none">/menu/</span>
                           </div>
                           <input 
                              value={formData.menuSlug} 
                              onChange={e => setFormData({...formData, menuSlug: e.target.value.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-]/g, '')})} 
                              placeholder="sua-loja" 
                              className="flex-1 h-full bg-transparent border-none focus:ring-0 font-black text-xl text-slate-800 placeholder:text-slate-200" 
                           />
                           <div className="flex items-center gap-2">
                              <button 
                                onClick={copyToClipboard} 
                                className="shrink-0 size-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#FF2F81] hover:scale-105 active:scale-95 transition-all"
                              >
                                 {copied ? <Check className="size-5 text-emerald-500" /> : <Copy className="size-5" />}
                              </button>
                           </div>
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
                              <div className="grid gap-2 bg-slate-50/50 p-4 rounded-3xl border-2 border-slate-100 max-h-[300px] overflow-y-auto no-scrollbar">
                                 {Object.entries(formData.detailedHours).map(([day, hours]: [string, any]) => (
                                   <div key={day} className="flex items-center justify-between p-2 rounded-xl hover:bg-white transition-all">
                                      <span className="text-[9px] font-black uppercase italic text-slate-500 w-16">{day}</span>
                                      <div className="flex items-center gap-2">
                                         <Input type="time" disabled={hours.closed} value={hours.open} onChange={e => {
                                            const n = {...formData.detailedHours}; (n as any)[day].open = e.target.value; setFormData({...formData, detailedHours: n});
                                         }} className="h-8 w-24 text-[10px] font-bold" />
                                         <Input type="time" disabled={hours.closed} value={hours.close} onChange={e => {
                                            const n = {...formData.detailedHours}; (n as any)[day].close = e.target.value; setFormData({...formData, detailedHours: n});
                                         }} className="h-8 w-24 text-[10px] font-bold" />
                                      </div>
                                      <Switch checked={!hours.closed} onCheckedChange={v => {
                                         const n = {...formData.detailedHours}; (n as any)[day].closed = !v; setFormData({...formData, detailedHours: n});
                                      }} className="scale-75 data-[state=checked]:bg-emerald-500" />
                                   </div>
                                 ))}
                              </div>
                           </div>
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

                     {/* UNIFIED: Branding & Receipts */}
                     <div className="space-y-8 pt-8 border-t border-slate-100 mb-12">
                        <div className="grid md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                 <Palette className="size-4 text-slate-400" />
                                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic">COR DO CARDÁPIO</Label>
                              </div>
                              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                 <div className="size-10 rounded-lg shadow-inner border-2 border-white" style={{ backgroundColor: formData.primaryColor }} />
                                 <Input type="color" value={formData.primaryColor} onChange={e => setFormData({...formData, primaryColor: e.target.value})} className="flex-1 h-10 p-1 cursor-pointer bg-transparent border-none" />
                              </div>
                           </div>
                           <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                 <Receipt className="size-4 text-slate-400" />
                                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic">RODAPÉ DO RECIBO</Label>
                              </div>
                              <Input value={formData.receiptFooter} onChange={e => setFormData({...formData, receiptFooter: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 font-bold text-xs" />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* QR Code Graphic Section */}
                  <div className="relative">
                     <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-[56px] p-16 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 size-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                        <div className="bg-white p-6 rounded-[40px] shadow-2xl mb-10 transition-transform group-hover:scale-110 duration-500">
                           <QRCodeSVG 
                             value={`${getMenuBaseUrl()}/menu/${formData.menuSlug || 'sua-loja'}`} 
                             size={180} 
                           />
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

          {/* WHATSAPP */}
          {activeTab === "whatsapp" && (
            <motion.div key="whatsapp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-2 gap-16">
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
               </div>
            </motion.div>
          )}

          {/* LOGÍSTICA */}
          {activeTab === "entrega" && (
            <motion.div key="entrega" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
               <div className="grid lg:grid-cols-1 gap-12">
                  <div className="space-y-12">
                     <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                        <div className="size-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm"><MapPin className="size-5" /></div>
                        <div>
                           <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Logística & Endereço</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configure onde você está e como entrega</p>
                        </div>
                     </div>

                     <div className="p-10 rounded-[40px] bg-slate-50/50 border-2 border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1">
                           <Label className="text-lg font-black uppercase italic text-slate-900 leading-none">Atender Via Delivery?</Label>
                           <p className="text-[10px] uppercase text-slate-500 font-bold tracking-tight">Ative para permitir que clientes façam pedidos para entrega.</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", formData.atendeDelivery ? "text-emerald-500" : "text-slate-400")}>
                              {formData.atendeDelivery ? "Ativado" : "Desativado"}
                           </span>
                           <Switch checked={formData.atendeDelivery} onCheckedChange={c => setFormData({...formData, atendeDelivery: c})} className="data-[state=checked]:bg-emerald-500" />
                        </div>
                     </div>

                     <div className="grid md:grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">CEP do Local</Label>
                            <div className="flex gap-2">
                              <Input 
                                value={formData.cep} 
                                onChange={e => setFormData({...formData, cep: e.target.value})} 
                                onBlur={() => formData.cep.length === 8 && handleCEPLookup()}
                                className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700" 
                                placeholder="00000-000" 
                              />
                              <Button 
                                variant="outline" 
                                onClick={handleCEPLookup}
                                disabled={loading}
                                className="h-14 w-14 rounded-2xl border-2 border-slate-100 flex items-center justify-center p-0 hover:bg-slate-50 shadow-sm transition-all"
                              >
                                 {loading ? <RotateCw className="size-5 animate-spin" /> : <Search className="size-5" />}
                              </Button>
                            </div>
                         </div>
                        <div className="space-y-3">
                           <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Raio de Atendimento (KM)</Label>
                           <div className="relative">
                              <Input value={formData.deliveryRadius} onChange={e => setFormData({...formData, deliveryRadius: e.target.value})} className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700 pr-12" placeholder="Ex: 5" disabled={!formData.atendeDelivery} />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-300">KM</div>
                           </div>
                        </div>

                        <div className="md:col-span-2 space-y-3">
                           <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Rua / Avenida</Label>
                           <Input value={formData.address.street} onChange={e => setFormData({...formData, address: {...formData.address, street: e.target.value}})} className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700" />
                        </div>
                        
                        <div className="space-y-3">
                           <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Número</Label>
                           <Input value={formData.address.number} onChange={e => setFormData({...formData, address: {...formData.address, number: e.target.value}})} className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700" />
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Bairro</Label>
                           <Input value={formData.address.neighborhood} onChange={e => setFormData({...formData, address: {...formData.address, neighborhood: e.target.value}})} className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700" />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                           <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Complemento (Opcional)</Label>
                           <Input value={formData.address.complement} onChange={e => setFormData({...formData, address: {...formData.address, complement: e.target.value}})} className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700" placeholder="Ex: Apto 101, Bloco B" />
                        </div>

                        <div className="space-y-3">
                           <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Cidade</Label>
                           <Input value={formData.address.city} onChange={e => setFormData({...formData, address: {...formData.address, city: e.target.value}})} className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700" />
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[11px] font-black uppercase text-slate-400 ml-2">Estado</Label>
                           <Input value={formData.address.state} onChange={e => setFormData({...formData, address: {...formData.address, state: e.target.value}})} className="h-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-bold text-slate-700 uppercase" placeholder="Ex: SP" />
                        </div>
                     </div>

                     <div className="pt-6">
                        <Button 
                          onClick={handleSaveBusiness} 
                          disabled={loading} 
                          className="h-20 px-16 rounded-[28px] bg-slate-900 hover:bg-black text-white font-black uppercase italic text-sm gap-4 shadow-xl shadow-slate-200 transition-all active:scale-95 border-b-4 border-slate-700 active:border-b-0"
                        >
                           {loading ? <RotateCw className="size-6 animate-spin" /> : <Save className="size-6" />}
                           {loading ? "SALVANDO..." : "ATUALIZAR LOGÍSTICA"}
                        </Button>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* FINANCEIRO */}
          {activeTab === "financeiro" && (
            <motion.div key="financeiro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
               <div className="lg:col-span-8 space-y-12">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                     <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm"><CreditCard className="size-5" /></div>
                     <div>
                        <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Dados Financeiros</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configure suas formas de recebimento</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-lg font-black uppercase italic text-slate-900 leading-none ml-2">Formas de Pagamento na Entrega</Label>
                    <p className="text-[10px] uppercase text-slate-500 font-bold ml-2 mb-4 tracking-tight">Selecione quais opções estarão disponíveis para o cliente pagar no ato da entrega.</p>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                       {[
                         { id: "acceptPix", label: "PIX", desc: "Transferência instantânea" },
                         { id: "acceptCard", label: "Cartão", desc: "Crédito ou Débito" },
                         { id: "acceptCash", label: "Dinheiro", desc: "Pagamento em espécie" }
                       ].map(pay => (
                         <div key={pay.id} className={cn("p-8 rounded-[32px] border-2 transition-all flex flex-col justify-between gap-6 shadow-sm", (formData as any)[pay.id] ? "border-emerald-500/50 bg-emerald-50/30" : "border-slate-100 bg-slate-50/50 hover:border-slate-200")}>
                            <div>
                               <span className={cn("text-sm font-black uppercase italic tracking-tight block mb-1 transitions-colors", (formData as any)[pay.id] ? "text-emerald-900" : "text-slate-400")}>{pay.label}</span>
                               <span className="text-[9px] font-bold uppercase text-slate-400 leading-none">{pay.desc}</span>
                            </div>
                            <div className="flex justify-end">
                               <Switch 
                                  checked={(formData as any)[pay.id]} 
                                  onCheckedChange={c => setFormData({...formData, [pay.id]: c})} 
                                  className="data-[state=checked]:bg-emerald-500"
                               />
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-8 pt-8 border-t border-slate-100">
                     <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm"><Zap className="size-5" /></div>
                        <div>
                           <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Metas de Desempenho</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Defina seus objetivos financeiros</p>
                        </div>
                     </div>
                     
                     <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 space-y-4 max-w-md shadow-sm">
                        <Label className="text-[11px] font-black uppercase text-slate-400 ml-2 italic">Meta de Vendas Mensal (R$)</Label>
                        <div className="relative">
                           <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">R$</div>
                           <Input 
                              type="number"
                              value={formData.monthlyGoal} 
                              onChange={e => setFormData({...formData, monthlyGoal: e.target.value})} 
                              className="h-16 pl-14 rounded-2xl border-2 border-slate-100 focus:border-primary transition-all font-black text-2xl text-slate-700" 
                              placeholder="10000"
                           />
                        </div>
                     </div>
                  </div>

                  <div className="pt-12">
                     <Button 
                       onClick={handleSaveBusiness} 
                       disabled={loading} 
                       className="h-20 px-16 rounded-[28px] bg-slate-900 hover:bg-black text-white font-black uppercase italic text-sm gap-4 shadow-xl shadow-slate-200 transition-all active:scale-95 border-b-4 border-slate-700 active:border-b-0"
                     >
                        {loading ? <RotateCw className="size-6 animate-spin" /> : <Save className="size-6" />}
                        {loading ? "SALVANDO..." : "SALVAR FINANCEIRO"}
                     </Button>
                  </div>

                  {/* TUNA SECTION */}
                  <div className="pt-12 mt-12 border-t border-slate-100">
                    <div className="bg-slate-50/50 rounded-[40px] p-10 lg:p-16 border-2 border-slate-100 space-y-12">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                          <div className="space-y-4">
                             <div className="flex items-center gap-4">
                                <div className="size-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                   <Zap className="size-8" />
                                </div>
                                <div>
                                   <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Pagamentos Online <span className="text-indigo-600">(Tuna)</span></h3>
                                   <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
                                      <ShieldCheck className="size-3 text-emerald-500" /> Transações seguras via PIX Dinâmico
                                   </p>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className={cn(
                                "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2",
                                paymentSettings.tuna_connected ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                             )}>
                                <div className={cn("size-2 rounded-full", paymentSettings.tuna_connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                                {paymentSettings.tuna_connected ? "CONECTADO ✅" : "NÃO CONECTADO"}
                             </div>
                             {paymentSettings.tuna_connected && (
                               <div className="flex items-center gap-2 ml-4">
                                 <Label className="text-[10px] font-black uppercase text-slate-400">Ativar PIX</Label>
                                 <Switch 
                                    checked={paymentSettings.pix_enabled} 
                                    onCheckedChange={(c) => updateTunaSettings({ pix_enabled: c })} 
                                 />
                               </div>
                             )}
                          </div>
                       </div>

                       <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                          <div className="flex-1 space-y-2">
                             <h4 className="text-sm font-black uppercase italic text-slate-900">Configuração de Recebimento</h4>
                             <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                Conecte sua conta Tuna para aceitar pagamentos via PIX e receber as confirmações automaticamente no seu painel.
                             </p>
                          </div>
                          
                          <Button 
                            onClick={connectTuna}
                            disabled={loadingPayments}
                            className={cn(
                               "h-16 px-12 rounded-2xl font-black uppercase italic text-sm gap-4 transition-all shadow-xl active:scale-95",
                               paymentSettings.tuna_connected 
                                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                            )}
                          >
                             {paymentSettings.tuna_connected ? (
                                <>
                                  <Zap className="size-5" /> RECONECTAR CONTA TUNA
                                </>
                             ) : (
                                <>
                                  <Zap className="size-5 fill-white" /> CONECTAR COM TUNA
                                </>
                             )}
                          </Button>
                       </div>

                       {paymentSettings.tuna_connected && (
                          <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center gap-6">
                             <div className="size-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-100 shrink-0">
                                <Check className="size-6" />
                             </div>
                             <div className="space-y-1">
                                <p className="text-sm font-black text-emerald-900 uppercase italic leading-none">PIX Online: {paymentSettings.pix_enabled ? 'ATIVO' : 'DESATIVADO'}</p>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                                   Seus clientes {paymentSettings.pix_enabled ? 'já podem' : 'ainda não podem'} pagar via PIX no seu cardápio.
                                </p>
                             </div>
                          </div>
                       )}
                    </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* SISTEMA */}
          {activeTab === "sistema" && (
            <motion.div key="sistema" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
               <div className="flex items-center gap-6 pb-10 border-b border-slate-100">
                  <div className="size-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
                     <Monitor className="size-8" />
                  </div>
                  <div>
                     <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Status do <span className="text-blue-600">Sistema</span></h3>
                     <p className="text-slate-400 font-bold text-sm">Informações técnicas e operacionais da sua plataforma.</p>
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-slate-900 rounded-[56px] p-12 text-white flex flex-col justify-between relative overflow-hidden group">
                     <div className="absolute top-0 right-0 size-64 bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                     <div className="relative z-10">
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic mb-1">Ambiente de Execução</p>
                        <h4 className="text-3xl font-black italic uppercase tracking-tighter">SaaS High Performance</h4>
                     </div>
                     <div className="relative z-10 flex items-center gap-4 mt-12 bg-white/5 p-6 rounded-[32px] border border-white/5 backdrop-blur-sm">
                        <Globe className="size-8 text-rose-500" />
                        <p className="text-[10px] text-slate-200 uppercase font-black tracking-widest leading-relaxed">
                           Sua empresa está operando com latência otimizada via Google Cloud Engine & Supabase Realtime Server.
                        </p>
                     </div>
                  </div>

                  <div className="bg-white p-12 rounded-[56px] border-2 border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
                     <div className="size-24 bg-rose-50 rounded-[32px] flex items-center justify-center text-rose-500 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                        <ShieldCheck size={48} />
                     </div>
                     <div className="space-y-2">
                        <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Infraestrutura Blindada</h4>
                        <p className="text-[10px] text-slate-400 font-bold italic uppercase tracking-widest max-w-[250px] mx-auto">
                           Criptografia de ponta a ponta (AES-256) e backups automáticos garantem a segurança total dos seus dados.
                        </p>
                     </div>
                     <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-emerald-50 border border-emerald-100">
                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Servidor Online (99.9% Uptime)</span>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Tabs>
  )
}
