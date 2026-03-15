"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronLeft, 
  Save, 
  Palette, 
  Smartphone, 
  Layout, 
  Image as ImageIcon,
  MousePointer2,
  Share2,
  Sparkles,
  RefreshCw,
  Eye,
  Settings2,
  GripVertical,
  BarChart3,
  TrendingUp,
  MousePointerClick,
  Link as LinkIcon,
  Check,
  Star,
  Search,
  ArrowRight
} from "lucide-react"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function MenuEditorPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { profile, business } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [stats, setStats] = useState({
    views: 0,
    clicks: 0,
    topProducts: [] as any[]
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Menu Settings State
  const [settings, setSettings] = useState({
    store_name: "",
    store_description: "",
    menu_cover: "",
    menu_logo: "",
    primary_color: "#ff2266",
    background_color: "#ffffff",
    button_color: "#ff2266",
    text_color: "#0f172a",
    button_text: "Pedir no WhatsApp",
    button_style: "rounded",
    menu_layout: "grid",
    whatsapp: "",
    instagram: "",
    facebook: "",
    website: "",
    animation_style: "fade"
  })

  useEffect(() => {
    if (user && profile?.company_id) {
      fetchSettings()
      fetchProducts()
      fetchStats()
    }
  }, [user, profile?.company_id])

  async function fetchStats() {
    try {
      const companyId = (profile as any).company_id
      
      const { count: viewsCount } = await supabase
        .from('menu_views')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)

      const { data: prods } = await supabase
        .from('menu_products')
        .select('id')
        .eq('company_id', companyId)

      const prodIds = prods?.map(p => p.id) || []
      let clicksCount = 0
      
      if (prodIds.length > 0) {
        const { count } = await supabase
          .from('product_clicks')
          .select('*', { count: 'exact', head: true })
          .in('product_id', prodIds)
        clicksCount = count || 0
      }

      setStats(prev => ({
        ...prev,
        views: viewsCount || 0,
        clicks: clicksCount
      }))
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
  }

  async function handleAIDesign() {
    const combinations = [
        { primary: "#ff2266", bg: "#ffffff", text: "#0f172a" },
        { primary: "#7c3aed", bg: "#faf5ff", text: "#1e1b4b" },
        { primary: "#059669", bg: "#f0fdf4", text: "#064e3b" },
        { primary: "#db2777", bg: "#fdf2f8", text: "#500724" },
        { primary: "#2563eb", bg: "#eff6ff", text: "#172554" }
    ]
    const random = combinations[Math.floor(Math.random() * combinations.length)]
    setSettings(prev => ({
      ...prev,
      primary_color: random.primary,
      background_color: random.bg,
      text_color: random.text,
      button_color: random.primary
    }))
    toast.success("Novo design gerado pela IA!")
  }

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('menu_products')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('position', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      console.error("Error fetching products:", error.message)
    }
  }

  async function fetchSettings() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('digital_menu_settings')
        .select('*')
        .eq('company_id', (profile as any).company_id)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setSettings(data)
      } else {
        const bus = business as any
        const prof = profile as any
        setSettings(prev => ({
          ...prev,
          store_name: bus?.name || prof?.business_name || "",
          whatsapp: bus?.whatsapp || ""
        } as any))
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error.message)
      toast.error("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, field: 'menu_logo' | 'menu_cover') {
    const file = e.target.files?.[0]
    if (!file || !user || !profile?.company_id) return

    try {
      setSaving(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}_${field}.${fileExt}`
      const filePath = `menu/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      setSettings(prev => ({ ...prev, [field]: publicUrl }))
      toast.success("Imagem enviada!")
    } catch (error: any) {
      console.error("Upload error:", error.message)
      toast.error("Erro ao enviar imagem")
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    if (!profile?.company_id) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('digital_menu_settings')
        .upsert({
          ...settings,
          company_id: (profile as any).company_id,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      toast.success("Configurações salvas com sucesso!")
    } catch (error: any) {
      console.error("Error saving settings:", error.message)
      toast.error("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event

    if (active.id !== over.id) {
      setProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newOrder = arrayMove(items, oldIndex, newIndex)
        
        Promise.all(
          newOrder.map((product, index) => 
            supabase
              .from('menu_products')
              .update({ position: index })
              .eq('id', product.id)
          )
        ).catch(err => console.error("Error updating positions:", err))

        return newOrder
      })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium italic">Carregando editor profissional...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/30 flex flex-col -mt-8 -mx-4 md:-mx-8">
      {/* 🚀 FIXED TOP BAR - SaaS STYLE */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-3 flex items-center justify-between sticky top-0 z-[60] shadow-sm">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-xl hover:bg-slate-100 transition-all"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <div className="h-8 w-px bg-slate-200 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                Editor de <span className="text-primary">Cardápio</span>
              </h1>
              <Badge variant="outline" className="rounded-full px-2 py-0 text-[8px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/10">PRO</Badge>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
              <Smartphone className="size-3" /> Visualizador em Tempo Real Ativo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-11 px-6 rounded-2xl border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest gap-2 hover:border-primary hover:text-primary transition-all hover:scale-105"
            onClick={() => window.open(`/menu/${(business as any)?.menu_slug}`, '_blank')}
          >
            <Eye className="size-4" /> Visualizar Link
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="h-11 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
            {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? "Salvando..." : "Salvar Design"}
          </Button>
        </div>
      </div>

      {/* 🏗️ MAIN GRID - 1600px FULL WIDTH */}
      <div className="max-w-[1700px] mx-auto w-full grid grid-cols-1 xl:grid-cols-[1.4fr_420px_380px] gap-8 p-8 flex-1">
        
        {/* 🎨 CENTER: THE BIG EDITOR SURFACE */}
        <div className="space-y-8 order-2 xl:order-1">
          {/* Identity Section Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-200/60"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Palette className="size-5" />
              </div>
              <div>
                <h2 className="font-black uppercase italic text-slate-900 tracking-tighter text-xl leading-none">Identidade Visual</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Como sua marca aparece para os clientes</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome da Confeitaria</label>
                  <input 
                    type="text" 
                    value={settings.store_name}
                    onChange={e => setSettings({...settings, store_name: e.target.value})}
                    className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-2 border-transparent font-bold text-slate-900 focus:border-primary/20 focus:bg-white transition-all outline-none text-lg"
                    placeholder="Ex: Doce Sonho"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição curta</label>
                  <input 
                    type="text" 
                    value={settings.store_description}
                    onChange={e => setSettings({...settings, store_description: e.target.value})}
                    className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-2 border-transparent font-bold text-slate-900 focus:border-primary/20 focus:bg-white transition-all outline-none"
                    placeholder="Ex: Os melhores bolos artesanais"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Logo do Negócio</label>
                  <div className="relative group overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 aspect-video flex items-center justify-center transition-all hover:border-primary/30 hover:bg-white">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => handleImageUpload(e, 'menu_logo')}
                      className="absolute inset-0 opacity-0 cursor-pointer z-20"
                    />
                    {settings.menu_logo ? (
                      <div className="relative size-full animate-in fade-in duration-500">
                        <img src={settings.menu_logo} className="size-full object-contain p-4" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white text-[10px] font-black uppercase tracking-widest">Alterar Logo</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center group-hover:scale-110 transition-transform">
                        <ImageIcon className="size-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Clique para enviar</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Capa do Cardápio</label>
                  <div className="relative group overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 aspect-video flex items-center justify-center transition-all hover:border-primary/30 hover:bg-white">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => handleImageUpload(e, 'menu_cover')}
                      className="absolute inset-0 opacity-0 cursor-pointer z-20"
                    />
                    {settings.menu_cover ? (
                      <div className="relative size-full animate-in fade-in duration-500">
                        <img src={settings.menu_cover} className="size-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white text-[10px] font-black uppercase tracking-widest">Alterar Capa</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center group-hover:scale-110 transition-transform">
                        <ImageIcon className="size-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Clique para enviar</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Style Section Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-200/60"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="size-10 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600">
                <Smartphone className="size-5" />
              </div>
              <div>
                <h2 className="font-black uppercase italic text-slate-900 tracking-tighter text-xl leading-none">Estilo do App</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cores e layouts da interface</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cor Principal</label>
                      <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <input 
                          type="color" 
                          value={settings.primary_color}
                          onChange={e => setSettings({...settings, primary_color: e.target.value, button_color: e.target.value})}
                          className="size-12 rounded-xl cursor-pointer border-none bg-transparent"
                        />
                        <span className="text-sm font-mono font-black text-slate-900">{settings.primary_color.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cor do Fundo</label>
                      <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <input 
                          type="color" 
                          value={settings.background_color}
                          onChange={e => setSettings({...settings, background_color: e.target.value})}
                          className="size-12 rounded-xl cursor-pointer border-none bg-transparent"
                        />
                        <span className="text-sm font-mono font-black text-slate-900">{settings.background_color.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Formato do Botão</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['rounded', 'square'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSettings({...settings, button_style: s})}
                          className={cn(
                            "h-14 rounded-2xl flex items-center justify-center uppercase font-black text-[10px] tracking-widest border-2 transition-all",
                            settings.button_style === s 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                          )}
                        >
                          {s === 'rounded' ? 'Arredondado' : 'Quadrado'}
                        </button>
                      ))}
                    </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Texto do CTA</label>
                    <input 
                      type="text" 
                      value={settings.button_text}
                      onChange={e => setSettings({...settings, button_text: e.target.value})}
                      className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Layout da Grade</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['grid', 'list', 'cards'].map((l) => (
                        <button
                          key={l}
                          onClick={() => setSettings({...settings, menu_layout: l})}
                          className={cn(
                            "h-14 rounded-2xl flex flex-col items-center justify-center gap-1 uppercase font-black text-[9px] tracking-widest border-2 transition-all",
                            settings.menu_layout === l 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                          )}
                        >
                          <span className="capitalize">{l}</span>
                        </button>
                      ))}
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>

          {/* Reorder Section Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-200/60"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="size-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Layout className="size-5" />
              </div>
              <div>
                <h2 className="font-black uppercase italic text-slate-900 tracking-tighter text-xl leading-none">Ordem dos Produtos</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Arraste para definir a ordem de exibição</p>
              </div>
            </div>
            
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={products.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <SortableProductItem key={product.id} product={product} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </motion.div>
        </div>

        {/* 📱 CENTER COLUMN: THE SMARTPHONE PREVIEW - HIGH FIDELITY */}
        <div className="flex flex-col items-center order-1 xl:order-2 sticky top-[100px] h-fit">
          <div className="mb-6 flex items-center gap-3 px-6 py-2 bg-white rounded-full shadow-sm border border-slate-100">
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Live Preview</span>
          </div>

          <div className="relative w-[340px] h-[680px] bg-slate-900 rounded-[4rem] p-3 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] border-[10px] border-slate-800 transition-all hover:scale-[1.02] transform origin-center">
            {/* Camera & Sensors Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-3xl z-40 flex items-center justify-center gap-2">
               <div className="size-1.5 rounded-full bg-slate-700/50" />
               <div className="w-8 h-1 rounded-full bg-slate-700/50" />
            </div>
            
            <div 
              className="w-full h-full rounded-[3.2rem] overflow-hidden overflow-y-auto custom-scrollbar relative bg-white"
              style={{ backgroundColor: settings.background_color }}
            >
              {/* 🏠 MOCKUP CONTENT */}
              <div className="relative">
                {/* Immersive Cover Image */}
                <div className="h-56 w-full relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={settings.menu_cover}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="size-full"
                    >
                      {settings.menu_cover ? (
                        <img src={settings.menu_cover} className="size-full object-cover" />
                      ) : (
                        <div className="size-full bg-slate-100 flex items-center justify-center text-slate-200">
                          <ImageIcon className="size-12" />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Floating Logo - Professional Interaction */}
                  <motion.div 
                    layoutId="logo"
                    className="absolute -bottom-6 left-8 size-20 rounded-3xl bg-white shadow-xl p-1 z-10"
                  >
                    <div className="size-full rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100">
                      {settings.menu_logo ? (
                        <img src={settings.menu_logo} className="size-full object-cover" />
                      ) : (
                        <Star className="size-6 text-slate-200" />
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Glassmorphism Header Inside Mockup */}
                <div className="sticky top-0 z-30 pt-4 px-6 pointer-events-none">
                  <div className="h-10 w-full bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm flex items-center px-4 gap-3">
                    <Search className="size-3 text-slate-400" />
                    <div className="h-2 w-24 bg-slate-200 rounded-full" />
                  </div>
                </div>

                <div className="pt-10 px-8 pb-32">
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={settings.store_name}
                    className="space-y-1"
                  >
                    <h3 
                      className="text-xl font-black italic tracking-tighter uppercase"
                      style={{ color: settings.text_color }}
                    >
                      {settings.store_name || "Sua Confeitaria"}
                    </h3>
                    <div className="flex items-center gap-2">
                       <Star className="size-3 fill-amber-400 text-amber-400" />
                       <span className="text-[10px] font-black text-slate-900">4.9</span>
                       <span className="text-[10px] font-bold text-slate-400 opacity-50 uppercase tracking-widest">• Aberto agora</span>
                    </div>
                  </motion.div>

                  {/* Category Chips - Modern Interactive */}
                  <div className="mt-8 flex gap-2 overflow-x-auto no-scrollbar py-2">
                    {['Todos', 'Bolos', 'Doces', 'Salgados'].map((c, i) => (
                      <div 
                        key={c}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                          i === 0 
                            ? "text-white shadow-lg shadow-primary/20" 
                            : "bg-white border border-slate-100 text-slate-400"
                        )}
                        style={i === 0 ? { backgroundColor: settings.primary_color } : {}}
                      >
                        {c}
                      </div>
                    ))}
                  </div>

                  {/* Products Grid - Modernized */}
                  <div className="mt-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">🔥 Recomendações</h4>
                      <ArrowRight className="size-3 text-slate-300" />
                    </div>

                    <div className={cn(
                      "grid gap-4",
                      settings.menu_layout === 'grid' ? "grid-cols-2" : "grid-cols-1"
                    )}>
                      {(products.length > 0 ? products.slice(0, 4) : [1, 2, 3, 4]).map((p, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all border-b-4"
                          style={{ borderColor: i === 0 ? settings.primary_color : 'transparent' }}
                        >
                          <div className="h-28 bg-slate-50 relative overflow-hidden">
                            {p.image_url ? (
                              <img src={p.image_url} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                              <div className="size-full flex items-center justify-center text-slate-200">
                                <ImageIcon className="size-10 stroke-1" />
                              </div>
                            )}
                            <div className="absolute top-3 right-3 size-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md">
                               <Plus className="size-3.5 text-primary" />
                            </div>
                          </div>
                          <div className="p-4 space-y-2">
                            <p className="text-[10px] font-black uppercase italic truncate text-slate-900">{p.name || "Produto Exemplo"}</p>
                            <div className="flex items-center justify-between mt-1">
                               <span className="text-[11px] font-black italic" style={{ color: settings.primary_color }}>R$ {p.price || "25,00"}</span>
                               <div className="size-1.5 rounded-full bg-emerald-400" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Glassmorphism Navigation Bar */}
                <div className="absolute bottom-6 left-0 right-0 px-6 z-40">
                  <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-2 flex items-center justify-between shadow-2xl overflow-hidden group">
                     <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                     <Button 
                      className={cn(
                        "w-full h-12 font-black uppercase italic tracking-[0.2em] text-[10px] transition-all shadow-lg relative z-10",
                        settings.button_style === 'rounded' ? "rounded-full" : "rounded-2xl"
                      )}
                      style={{ backgroundColor: settings.button_color, color: '#fff' }}
                    >
                      {settings.button_text}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 RIGHT COLUMN: STATS & TEMPLATES */}
        <div className="space-y-8 order-3 sticky top-[100px] h-fit">
          {/* Stats Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200/60"
          >
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <BarChart3 className="size-3 text-primary" /> Performance
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100/50 flex flex-col gap-1 hover:bg-white hover:shadow-md transition-all group">
                <div className="flex justify-between items-center mb-1">
                  <Eye className="size-4 text-primary group-hover:scale-110 transition-transform" />
                  <TrendingUp className="size-3 text-emerald-500" />
                </div>
                <p className="text-2xl font-black italic text-slate-900 tracking-tighter">{stats.views}</p>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Views</p>
              </div>
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100/50 flex flex-col gap-1 hover:bg-white hover:shadow-md transition-all group">
                <div className="flex justify-between items-center mb-1">
                  <MousePointerClick className="size-4 text-violet-500 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-2xl font-black italic text-slate-900 tracking-tighter">{stats.clicks}</p>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Cliques</p>
              </div>
            </div>
          </motion.div>

          {/* Templates Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200/60"
          >
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Layout className="size-3 text-violet-500" /> Modelos sugeridos
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Pink Modern', primary: '#ff4d6d', bg: '#ffffff', text: '#0f172a' },
                { name: 'Dark Velvet', primary: '#9f1239', bg: '#0f172a', text: '#ffffff' },
                { name: 'Minimalist', primary: '#1e293b', bg: '#f8fafc', text: '#334155' }
              ].map(t => (
                <button 
                  key={t.name}
                  onClick={() => setSettings({...settings, primary_color: t.primary, background_color: t.bg, text_color: t.text, button_color: t.primary})}
                  className="w-full p-4 rounded-3xl border border-slate-100 hover:border-primary/40 text-left transition-all group relative items-center flex justify-between bg-slate-50/50 hover:bg-white"
                >
                  <div>
                    <p className="text-[10px] font-black uppercase italic text-slate-900 group-hover:text-primary transition-colors">{t.name}</p>
                    <div className="flex gap-1.5 mt-2">
                      <div className="size-3 rounded-full shadow-sm" style={{ backgroundColor: t.primary }} />
                      <div className="size-3 rounded-full border border-slate-200" style={{ backgroundColor: t.bg }} />
                    </div>
                  </div>
                  <Plus className="size-4 text-slate-300 group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>

            <Button 
              onClick={handleAIDesign}
              className="w-full h-12 rounded-2xl bg-slate-900 mt-6 gap-3 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="size-4 text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white relative z-10">IA Suggested Design</span>
            </Button>
          </motion.div>

          {/* Designer Tip */}
          <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] text-white relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 size-32 bg-primary/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 size-24 bg-violet-600/10 rounded-full blur-[40px] translate-y-1/2 -translate-x-1/2" />
            <h4 className="text-xs font-black uppercase italic tracking-widest flex items-center gap-2 mb-4">
              <Settings2 className="size-4 text-primary" /> Designer Tip
            </h4>
            <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
              "Imagens com fundo neutro e boa iluminação aumentam a conversão do cardápio em até 40%."
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function SortableProductItem({ product }: { product: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: product.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-5 p-4 bg-white rounded-3xl border border-slate-200 transition-all shadow-sm group",
        isDragging && "shadow-2xl border-primary ring-2 ring-primary/10 opacity-70 scale-95"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-primary p-2">
        <GripVertical className="size-5" />
      </div>
      {product.image_url ? (
        <div className="size-16 rounded-[20px] overflow-hidden shrink-0 shadow-inner">
          <img src={product.image_url} alt="" className="size-full object-cover" />
        </div>
      ) : (
        <div className="size-16 rounded-[20px] bg-slate-50 flex items-center justify-center text-slate-200 shrink-0">
          <ImageIcon className="size-8" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black uppercase italic text-slate-900 truncate tracking-tight">{product.name}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-2">Categoria: {product.category_id?.slice(0, 8)}</p>
        <div className="flex items-center gap-2">
           <span className="text-[11px] font-black text-primary px-3 py-1 rounded-full bg-primary/5 border border-primary/10">R$ {parseFloat(product.price).toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
