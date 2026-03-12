"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Store, 
  MapPin, 
  ChevronRight, 
  ChevronLeft, 
  Package, 
  Layout, 
  Check, 
  Search,
  MessageCircle,
  Sparkles,
  ShoppingBag,
  X,
  PartyPopper,
  User,
  Camera,
  Instagram,
  CreditCard,
  Clock,
  Trophy,
  Users,
  Smartphone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"

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

const CATEGORIES = [
  { id: "lanches", name: "Lanches", items: ["X-Burger", "Hot Dog"], icon: "🍔" },
  { id: "pizzas", name: "Pizzas", items: ["Margherita", "Calabresa"], icon: "🍕" },
  { id: "sobremesas", name: "Sobremesas", items: ["Bolo de Pote", "Brownie"], icon: "🍰" },
  { id: "bebidas", name: "Bebidas", items: ["Suco Natural", "Refrigerante"], icon: "🥤" },
  { id: "doces", name: "Doces", items: ["Brigadeiro", "Beijinho"], icon: "🍬" }
]

// Balloon component for the final animation
const Balloon = ({ delay, x, color }: { delay: number; x: string; color: string }) => (
  <motion.div
    initial={{ y: "110vh", opacity: 1, scale: 1 }}
    animate={{ y: "-20vh", opacity: 0, scale: 1.1 }}
    transition={{ duration: 6, delay, ease: "easeOut" }}
    style={{ left: x }}
    className="absolute pointer-events-none z-[120]"
  >
    <div className="relative">
      <div className={cn("size-24 rounded-[50%_50%_50%_50%_/_40%_40%_60%_60%] shadow-2xl border-2 border-white/30", color)}>
        <div className="absolute top-4 left-6 size-6 bg-white/20 rounded-full blur-[2px]" />
      </div>
      <div className="w-0.5 h-16 bg-white/20 mx-auto -mt-2" />
    </div>
  </motion.div>
)

export function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const { user, updateProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  
  // States - Personal (Step 1)
  const [fullName, setFullName] = useState("")
  const [personalPhone, setPersonalPhone] = useState("")
  const [personalWhatsapp, setPersonalWhatsapp] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [experience, setExperience] = useState("")
  const [personalCity, setPersonalCity] = useState("")
  const [personalState, setPersonalState] = useState("")

  // States - Business (Step 2)
  const [storeName, setStoreName] = useState("")
  const [instagram, setInstagram] = useState("")
  const [businessPhone, setBusinessPhone] = useState("")
  const [businessBio, setBusinessBio] = useState("")
  const [segment, setSegment] = useState("Confeitaria Gourmet")

  // States - Location/Delivery (Step 3)
  const [cep, setCep] = useState("")
  const [address, setAddress] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: ""
  })
  const [atendeDelivery, setAtendeDelivery] = useState(true)
  const [deliveryRadius, setDeliveryRadius] = useState("5")

  // States - Finance (Step 4)
  const [acceptPix, setAcceptPix] = useState(true)
  const [acceptCard, setAcceptCard] = useState(true)
  const [acceptCash, setAcceptCash] = useState(true)
  const [minOrderValue, setMinOrderValue] = useState("0,00")

  // States - Menu (Step 5)
  const [menuType, setMenuType] = useState<"clean" | "model" | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "")
      setFullName(user.user_metadata?.owner_name || user.user_metadata?.full_name || "")
    }
  }, [user])

  const handleNext = () => setStep(prev => prev + 1)
  const handlePrev = () => setStep(prev => prev - 1)

  const handleCEPLookup = async () => {
    const cleanCEP = cep.replace(/\D/g, "")
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
        setAddress(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }))
        setPersonalCity(data.localidade)
        setPersonalState(data.uf)
        toast.success("Endereço preenchido!")
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP")
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      // 0. Ensure we have a session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !currentSession) throw new Error("Sessão expirada. Recarregue a página.")

      const userId = currentSession.user.id
      const fullAddress = `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ""}, ${address.neighborhood}, ${address.city} - ${address.state}`
      
      // 1. Update Profile (Modernized Sync)
      const { error: profileError } = await updateProfile({
        full_name: fullName,
        owner_name: fullName,
        phone: personalPhone || businessPhone,
        whatsapp: personalWhatsapp || businessPhone,
        city: personalCity || address.city,
        state: personalState || address.state,
        specialty,
        experience_years: experience,
        store_name: storeName,
        instagram: instagram,
        has_completed_onboarding: true
      })
      if (profileError) throw profileError

      // 2. Direct DB Sync to 'profiles' (for the new fields)
      await supabase.from("profiles").update({
        phone: personalPhone,
        whatsapp: personalWhatsapp,
        city: personalCity,
        state: personalState,
        specialty: specialty,
        experience_years: experience
      }).eq("id", userId)

      // 3. Update 'companies'
      const { data: companyData } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle()

      const companyId = companyData?.id
      if (companyId) {
        await supabase.from("companies").update({
          name: storeName,
          instagram: instagram,
          description: businessBio,
          address_street: address.street,
          address_number: address.number,
          address_complement: address.complement,
          address_neighborhood: address.neighborhood,
          address_city: address.city,
          address_state: address.state,
          address_zip: cep,
          delivery_radius: parseFloat(deliveryRadius),
          accept_pix: acceptPix,
          accept_card: acceptCard,
          accept_cash: acceptCash,
          min_order_value: parseFloat(minOrderValue.replace(",", "."))
        }).eq("id", companyId)

        // Setup Menu if requested
        if (menuType === "model" && selectedCategories.length > 0) {
          const categoriesToCreate = CATEGORIES.filter(c => selectedCategories.includes(c.id))
          for (const cat of categoriesToCreate) {
            const { data: newCat, error: catErr } = await supabase
              .from("menu_categories")
              .insert({ name: cat.name, company_id: companyId })
              .select().single()

            if (newCat && !catErr) {
              const products = cat.items.map(p_name => ({
                name: p_name,
                company_id: companyId,
                category_id: newCat.id,
                price: 15.00,
                active: true
              }))
              await supabase.from("menu_products").insert(products)
            }
          }
        }
      }

      setIsFinished(true)
      setTimeout(() => onComplete(), 7000)
      
    } catch (error: any) {
      console.error("Onboarding Error:", error)
      toast.error(error.message || "Erro ao finalizar configuração")
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { id: 1, label: "VOCÊ", icon: User },
    { id: 2, label: "NEGÓCIO", icon: Store },
    { id: 3, label: "ENTREGA", icon: MapPin },
    { id: 4, label: "PAGAMENTO", icon: CreditCard },
    { id: 5, label: "CARDÁPIO", icon: Layout }
  ]

  const balloons = useMemo(() => {
    const colors = ["bg-[#FF2F81]", "bg-blue-500", "bg-yellow-400", "bg-purple-500", "bg-emerald-500"]
    return [...Array(30)].map((_, i) => ({
      delay: i * 0.15,
      x: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))
  }, [])

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/95 backdrop-blur-2xl overflow-hidden">
        {balloons.map((b, i) => <Balloon key={i} delay={b.delay} x={b.x} color={b.color} />)}
        <motion.div 
          initial={{ opacity: 0, scale: 0.7, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="text-center relative z-[130] p-16 max-w-4xl"
        >
          <div className="size-48 rounded-[64px] bg-gradient-to-br from-[#FF2F81] to-[#FF6B9D] flex items-center justify-center mx-auto mb-12 shadow-[0_0_80px_rgba(255,47,129,0.5)] border-4 border-white/20">
             <PartyPopper className="size-24 text-white animate-bounce" />
          </div>
          <h2 className="text-8xl font-black text-white italic uppercase tracking-tighter mb-6 leading-none">
            EXPLOSÃO DE <span className="text-[#FF2F81]">SUCESSO!</span>
          </h2>
          <p className="text-slate-300 font-bold text-3xl mb-12 leading-tight">
            Sua Doce Gestão profissional está pronta para decolar.
          </p>
          <div className="space-y-4">
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 6, ease: "linear" }} className="h-full bg-gradient-to-r from-[#FF2F81] to-[#FF6B9D]" />
            </div>
            <p className="text-[#FF2F81] font-black uppercase tracking-[0.4em] text-sm animate-pulse italic">PREPARANDO SEU DASHBOARD SaaS...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[1480px] h-full max-h-[950px] bg-white rounded-[60px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] flex overflow-hidden relative"
      >
        {/* Sidebar */}
        <div className="hidden lg:flex w-[340px] bg-[#0F172A] p-10 flex-col relative overflow-hidden shrink-0 border-r border-white/5">
          <div className="absolute top-0 right-0 size-80 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 space-y-12 h-full flex flex-col">
            <div className="space-y-6">
              <div className="size-20 rounded-[28px] bg-gradient-to-br from-[#FF2F81] to-[#FF6B9D] flex items-center justify-center shadow-2xl shadow-primary/40">
                <ShoppingBag className="size-10 text-white fill-white/20" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">DOCE <span className="text-[#FF2F81]">SaaS</span></h1>
                <p className="text-slate-400 font-bold text-[13px] leading-relaxed">Configuração profissional do seu ecossistema de confeitaria.</p>
              </div>
            </div>

            <div className="space-y-6 py-6 border-y border-white/5 flex-1 overflow-y-auto scrollbar-none">
              {steps.map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.id} className="flex items-center gap-6 group">
                    <div className={cn(
                      "size-12 rounded-[18px] flex items-center justify-center transition-all duration-500",
                      step === s.id 
                        ? "bg-[#FF2F81] text-white shadow-[0_0_30px_rgba(255,47,129,0.3)] scale-110" 
                        : step > s.id 
                          ? "bg-emerald-500 text-white" 
                          : "bg-slate-800 text-slate-500"
                    )}>
                      {step > s.id ? <Check className="size-6 stroke-[3px]" /> : <Icon className="size-6" />}
                    </div>
                    <div className="flex flex-col">
                      <span className={cn("text-[9px] font-black uppercase tracking-[0.25em]", step === s.id ? "text-[#FF2F81]" : "text-slate-500")}>PASSO 0{s.id}</span>
                      <span className={cn("text-sm font-black uppercase italic tracking-tight", step === s.id ? "text-white" : "text-slate-600")}>{s.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-auto p-5 rounded-[24px] bg-slate-800/40 border border-white/5 flex items-start gap-4">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><MessageCircle className="size-5" /></div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FF2F81] mb-1">Dúvida Técnica?</p>
                <p className="text-[11px] font-bold text-slate-400 leading-tight">Chame nosso gerente de contas pelo WhatsApp.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-white relative overflow-hidden">
          <button onClick={() => onComplete()} className="absolute top-10 right-10 p-2 rounded-full text-slate-300 hover:text-slate-900 hover:bg-slate-100 transition-all z-20"><X className="size-8" /></button>
          
          <div className="flex-1 overflow-y-auto px-16 md:px-24 py-16 scrollbar-thin scrollbar-thumb-slate-100 scrollbar-track-transparent">
            <AnimatePresence mode="wait">
              {/* Step 1: Personal Data */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-16">
                  <div className="flex items-center gap-8">
                    <div className="size-24 rounded-[40px] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm"><User className="size-12" /></div>
                    <div>
                      <h3 className="text-5xl lg:text-6xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Dados <span className="text-[#FF2F81]">Pessoais</span></h3>
                      <p className="text-slate-400 font-bold text-lg lg:text-xl mt-3">Queremos conhecer o profissional por trás dos doces.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
                    <div className="space-y-4">
                      <Label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">Seu Nome Completo</Label>
                      <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Como gostaria de ser chamado?" className="h-[80px] rounded-[32px] border-2 border-slate-200 bg-slate-50/50 font-black text-2xl px-10 focus:border-[#FF2F81]" />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">WhatsApp Pessoal</Label>
                      <Input value={personalWhatsapp} onChange={e => setPersonalWhatsapp(e.target.value)} placeholder="(00) 00000-0000" className="h-[80px] rounded-[32px] border-2 border-slate-200 bg-slate-50/50 font-black text-2xl px-10 focus:border-[#FF2F81]" />
                    </div>
                    
                    <div className="space-y-4">
                      <Label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">Sua Especialidade Principal</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {SPECIALTIES.map(s => (
                          <button key={s} onClick={() => setSpecialty(s)} className={cn("p-4 rounded-2xl border-2 transition-all font-bold text-xs uppercase", specialty === s ? "border-[#FF2F81] bg-[#FF2F81]/5 text-[#FF2F81]" : "border-slate-100 bg-slate-50 text-slate-500")}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">Tempo de Experiência</Label>
                      <div className="space-y-3">
                        {EXPERIENCE_LEVELS.map(exp => (
                          <button key={exp} onClick={() => setExperience(exp)} className={cn("w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between group", experience === exp ? "border-[#FF2F81] bg-[#FF2F81]/5" : "border-slate-100 bg-slate-50")}>
                            <span className={cn("font-bold text-sm", experience === exp ? "text-[#FF2F81]" : "text-slate-500")}>{exp}</span>
                            <div className={cn("size-5 rounded-full border-2", experience === exp ? "border-[#FF2F81] bg-[#FF2F81]" : "border-slate-300 group-hover:border-primary/50")} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Business Core */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-16">
                  <div className="flex items-center gap-8">
                    <div className="size-24 rounded-[40px] bg-pink-50 flex items-center justify-center text-primary shadow-sm"><Store className="size-12" /></div>
                    <div>
                      <h3 className="text-5xl lg:text-6xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Minha <span className="text-[#FF2F81]">Confeitaria</span></h3>
                      <p className="text-slate-400 font-bold text-lg lg:text-xl mt-3">Sua marca é seu maior ativo. Capriche nos detalhes.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
                    <div className="space-y-4">
                      <Label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">Nome Fantasia do Negócio</Label>
                      <Input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Ex: Doce Sonho Gourmet" className="h-[80px] rounded-[32px] border-2 border-slate-200 bg-slate-50/50 font-black text-2xl px-10 focus:border-[#FF2F81]" />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">WhatsApp Comercial / Delivery</Label>
                      <Input value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} placeholder="(00) 00000-0000" className="h-[80px] rounded-[32px] border-2 border-slate-200 bg-slate-50/50 font-black text-2xl px-10 focus:border-[#FF2F81]" />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">Perfil do Instagram (@)</Label>
                      <div className="relative">
                        <Smartphone className="absolute left-8 top-1/2 -translate-y-1/2 size-7 text-slate-300" />
                        <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@meu_negocio" className="h-[80px] rounded-[32px] border-2 border-slate-200 bg-slate-50/50 font-black text-2xl pl-20 pr-10 focus:border-[#FF2F81]" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">Bio / Descrição Curta (Slogan)</Label>
                      <Input value={businessBio} onChange={e => setBusinessBio(e.target.value)} placeholder="Ex: Os melhores bolos de festa da região..." className="h-[80px] rounded-[32px] border-2 border-slate-200 bg-slate-50/50 font-bold text-xl px-10 focus:border-[#FF2F81]" />
                    </div>

                    <div className="col-span-full space-y-6">
                       <Label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">Segmento de Atuação</Label>
                       <div className="flex flex-wrap gap-3">
                         {SEGMENTS.map(seg => (
                           <button key={seg} onClick={() => setSegment(seg)} className={cn("px-8 py-4 rounded-full border-2 transition-all font-black text-[10px] uppercase tracking-widest", segment === seg ? "border-[#FF2F81] bg-[#FF2F81] text-white" : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200")}>
                             {seg}
                           </button>
                         ))}
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Location & Delivery */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-16">
                  <div className="flex items-center gap-8">
                    <div className="size-24 rounded-[40px] bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm"><MapPin className="size-12" /></div>
                    <div>
                      <h3 className="text-5xl lg:text-6xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Localização & <span className="text-[#FF2F81]">Entrega</span></h3>
                      <p className="text-slate-400 font-bold text-lg lg:text-xl mt-3">Diga onde você está e até onde seus doces chegam.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <Label className="text-[12px] font-black uppercase italic text-slate-400 ml-2 tracking-widest">CEP</Label>
                        <div className="flex gap-4">
                          <Input value={cep} onChange={e => setCep(e.target.value)} placeholder="00000-000" className="h-[80px] rounded-[32px] border-2 border-slate-200 bg-slate-50/50 font-black text-2xl px-10 flex-1" />
                          <Button onClick={handleCEPLookup} className="h-[80px] rounded-[32px] bg-slate-900 px-8 text-white"><Search className="size-6" /></Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Rua</Label>
                          <Input value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="h-[64px] rounded-2xl border-2 border-slate-100" />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Nº</Label>
                          <Input value={address.number} onChange={e => setAddress({...address, number: e.target.value})} className="h-[64px] rounded-2xl border-2 border-slate-100 text-center" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-10">
                      <div className="p-8 rounded-[40px] bg-slate-50 border-2 border-slate-100 space-y-8">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary"><ShoppingBag className="size-6" /></div>
                               <span className="font-black italic uppercase text-lg text-slate-900 leading-none">Atende Delivery?</span>
                            </div>
                            <button onClick={() => setAtendeDelivery(!atendeDelivery)} className={cn("w-16 h-8 rounded-full p-1 transition-all", atendeDelivery ? "bg-[#FF2F81]" : "bg-slate-300")}>
                               <div className={cn("size-6 bg-white rounded-full transition-all", atendeDelivery ? "translate-x-8" : "translate-x-0")} />
                            </button>
                         </div>
                         
                         {atendeDelivery && (
                           <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                              <Label className="text-[10px] font-black uppercase text-slate-500">Raio de Entrega (Km)</Label>
                              <div className="flex items-center gap-6">
                                 <input type="range" min="1" max="50" value={deliveryRadius} onChange={e => setDeliveryRadius(e.target.value)} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                                 <span className="text-3xl font-black text-primary italic w-16">{deliveryRadius}km</span>
                              </div>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Finance */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-16">
                  <div className="flex items-center gap-8">
                    <div className="size-24 rounded-[40px] bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm"><CreditCard className="size-12" /></div>
                    <div>
                      <h3 className="text-5xl lg:text-6xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Pagamento & <span className="text-[#FF2F81]">Comercial</span></h3>
                      <p className="text-slate-400 font-bold text-lg lg:text-xl mt-3">Como seu cliente paga? Qual seu pedido mínimo?</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
                    <div className="space-y-8">
                       <Label className="text-[12px] font-black uppercase italic tracking-widest text-slate-400 ml-2">Métodos de Pagamento Aceitos</Label>
                       <div className="space-y-4">
                          {[
                            { id: "pix", label: "PIX", active: acceptPix, set: setAcceptPix, icon: Smartphone },
                            { id: "card", label: "Cartão (Crédito/Débito)", active: acceptCard, set: setAcceptCard, icon: CreditCard },
                            { id: "cash", label: "Dinheiro / Retirada", active: acceptCash, set: setAcceptCash, icon: ShoppingBag }
                          ].map(m => (
                            <button key={m.id} onClick={() => m.set(!m.active)} className={cn("w-full p-8 rounded-[32px] border-4 transition-all flex items-center justify-between group", m.active ? "border-[#FF2F81] bg-[#FF2F81]/5" : "border-slate-50 bg-slate-50 hover:border-slate-100")}>
                               <div className="flex items-center gap-6">
                                  <div className={cn("size-14 rounded-2xl flex items-center justify-center transition-all", m.active ? "bg-[#FF2F81] text-white" : "bg-white text-slate-300 shadow-sm")}>
                                     <m.icon className="size-7" />
                                  </div>
                                  <span className={cn("text-xl font-black italic uppercase tracking-tight", m.active ? "text-slate-900" : "text-slate-400")}>{m.label}</span>
                               </div>
                               <div className={cn("size-8 rounded-full border-4 flex items-center justify-center", m.active ? "border-[#FF2F81] bg-[#FF2F81] text-white" : "border-slate-200")}>
                                  {m.active && <Check className="size-4 stroke-[4px]" />}
                               </div>
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-12">
                       <div className="space-y-4">
                          <Label className="text-[12px] font-black uppercase italic tracking-widest text-slate-400 ml-2">Valor Mínimo para Pedido (R$)</Label>
                          <div className="relative">
                             <div className="absolute left-10 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300 italic">R$</div>
                             <Input value={minOrderValue} onChange={e => setMinOrderValue(e.target.value)} className="h-[100px] rounded-[40px] border-4 border-slate-100 bg-slate-50 font-black text-5xl px-24 focus:border-primary transition-all shadow-sm" />
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Menu Model */}
              {step === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-16">
                   <div className="flex items-center gap-8">
                    <div className="size-24 rounded-[40px] bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm"><Sparkles className="size-12" /></div>
                    <div>
                      <h3 className="text-5xl lg:text-6xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Seu <span className="text-[#FF2F81]">Cardápio</span></h3>
                      <p className="text-slate-400 font-bold text-lg lg:text-xl mt-3">Para finalizar, escolha como quer começar seu catálogo.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-10">
                    {[
                      { id: "model", title: "Modelo Pronto", desc: "Poupe tempo com produtos pré-cadastrados.", icon: Sparkles, badge: "RECOMENDADO" },
                      { id: "clean", title: "Do Zero", desc: "Folha em branco para máxima personalização.", icon: Package, badge: "CONTROLE TOTAL" }
                    ].map(type => (
                      <button key={type.id} onClick={() => setMenuType(type.id as any)} className={cn("relative p-12 rounded-[56px] border-[5px] text-left transition-all duration-500", menuType === type.id ? "border-[#FF2F81] bg-[#FF2F81]/5 shadow-2xl" : "border-slate-100 bg-slate-50")}>
                        <div className="absolute top-8 right-10"><Badge className="bg-emerald-500 border-none font-black text-[10px] uppercase px-4">{type.badge}</Badge></div>
                        <div className={cn("size-20 rounded-3xl flex items-center justify-center mb-8", menuType === type.id ? "bg-[#FF2F81] text-white" : "bg-white text-slate-300 shadow-sm")}>
                           <type.icon className="size-10" />
                        </div>
                        <h4 className="text-3xl font-black italic uppercase text-slate-900 leading-none">{type.title}</h4>
                        <p className="text-slate-400 font-bold mt-4">{type.desc}</p>
                        {menuType === type.id && <div className="absolute bottom-10 right-10 size-12 rounded-full bg-[#FF2F81] text-white flex items-center justify-center shadow-lg"><Check className="size-8 stroke-[4px]" /></div>}
                      </button>
                    ))}
                  </div>

                  {menuType === "model" && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 animate-in fade-in">
                       <Label className="text-[12px] font-black uppercase italic tracking-widest text-slate-500 ml-4">Quais categorias quer carregar?</Label>
                       <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {CATEGORIES.map(cat => (
                            <button key={cat.id} onClick={() => setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id])} className={cn("p-6 rounded-[32px] border-4 transition-all text-center group", selectedCategories.includes(cat.id) ? "border-[#FF2F81] bg-[#FF2F81]/5" : "border-slate-50 bg-white")}>
                               <div className="text-6xl mb-4 group-hover:scale-125 transition-transform">{cat.icon}</div>
                               <span className={cn("block font-black uppercase text-xs tracking-widest", selectedCategories.includes(cat.id) ? "text-[#FF2F81]" : "text-slate-400")}>{cat.name}</span>
                            </button>
                          ))}
                       </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="h-32 border-t border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-16 shrink-0 relative z-20">
            <Button variant="outline" onClick={handlePrev} disabled={step === 1 || loading} className="h-16 px-10 rounded-2xl border-2 border-slate-200 text-slate-500 gap-3 font-black uppercase italic text-xs">
              <ChevronLeft className="size-5" /> Voltar
            </Button>
            
            <div className="flex items-center gap-2">
               {steps.map(s => (
                 <div key={s.id} className={cn("h-1.5 rounded-full transition-all duration-500", step === s.id ? "w-12 bg-[#FF2F81]" : step > s.id ? "w-6 bg-emerald-500" : "w-3 bg-slate-200")} />
               ))}
            </div>

            <Button 
               onClick={step === 5 ? handleComplete : handleNext} 
               disabled={loading || (step === 1 && !fullName) || (step === 2 && !storeName) || (step === 5 && !menuType)}
               className="h-20 px-20 rounded-3xl bg-[#0F172A] hover:bg-slate-900 text-white font-black uppercase italic tracking-widest text-sm gap-5 shadow-2xl active:scale-95 transition-all"
            >
              {loading ? "PROCESSANDO..." : step === 5 ? "FINALIZAR SETUP SaaS" : "PRÓXIMO PASSO"}
              {step < 5 && <ChevronRight className="size-6" />}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
