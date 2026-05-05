"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  Zap, 
  Image as ImageIcon,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Share2,
  Copy,
  CheckCircle2,
  GripVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Slider } from "@/components/ui/slider"

interface OptimizationResult {
  name: string
  description: string
  price_suggestion: {
    min: number
    max: number
    ideal: number
  }
  score: number
  analysis: string
  variations: any[]
  extras: any[]
  marketing: {
    whatsapp_text: string
    instagram_caption: string
  }
  image_analysis: {
    score: number
    critique: string
    improvement_plan: string
  }
  improved_image_url?: string
}

interface AIOptimizerModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  optimization: OptimizationResult | null
  onApply: (data: Partial<OptimizationResult>) => void
}

export function AIOptimizerModal({
  isOpen,
  onClose,
  product,
  optimization,
  onApply
}: AIOptimizerModalProps) {
  const [activeTab, setActiveTab] = useState("compare")
  const [sliderPos, setSliderPos] = useState(50)

  if (!isOpen || !optimization) return null

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado!")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl rounded-[40px] p-0 border-none bg-[#0F172A] text-white shadow-3xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-slate-900/50 backdrop-blur-xl relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-indigo-500 to-emerald-500" />
             <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                   <Sparkles className="text-white" size={24} />
                </div>
                <div>
                   <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Otimizador <span className="text-indigo-400">Inteligente</span></DialogTitle>
                   <DialogDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transformando seu produto em uma máquina de vendas</DialogDescription>
                </div>
             </div>
             
             <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Score de Qualidade</span>
                   <div className="flex items-center gap-3">
                      <span className="text-2xl font-black italic text-emerald-400">{optimization.score}/100</span>
                      <Progress value={optimization.score} className="w-24 h-2 bg-white/5" />
                   </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-white/5">
                   <X size={20} />
                </Button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl h-14 w-fit mx-auto">
                   <TabsTrigger value="compare" className="px-8 rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
                      <Zap size={14} /> Comparação
                   </TabsTrigger>
                   <TabsTrigger value="image" className="px-8 rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
                      <ImageIcon size={14} /> Upgrade Visual
                   </TabsTrigger>
                   <TabsTrigger value="pricing" className="px-8 rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
                      <DollarSign size={14} /> Estratégia de Preço
                   </TabsTrigger>
                   <TabsTrigger value="marketing" className="px-8 rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
                      <Share2 size={14} /> Marketing Ready
                   </TabsTrigger>
                </TabsList>

                {/* Tab: Comparação */}
                <TabsContent value="compare" className="space-y-8 mt-0 focus-visible:outline-none">
                   <div className="grid grid-cols-2 gap-8 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-12 rounded-full bg-indigo-600 border-4 border-[#0F172A] z-10 flex items-center justify-center shadow-2xl">
                         <ArrowRight className="text-white" size={20} />
                      </div>

                      {/* Antes */}
                      <div className="space-y-4">
                         <Badge variant="outline" className="border-slate-700 text-slate-500 font-black uppercase italic py-1 px-4">ESTADO ATUAL</Badge>
                         <div className="bg-white/5 border border-white/5 rounded-[32px] p-8 space-y-6 opacity-60">
                            <div className="space-y-1">
                               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Produto</h4>
                               <p className="text-xl font-bold text-slate-400 italic leading-tight">{product.name}</p>
                            </div>
                            <div className="space-y-1">
                               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</h4>
                               <p className="text-xs font-bold text-slate-500 leading-relaxed italic line-clamp-4">{product.description || "Nenhuma descrição definida."}</p>
                            </div>
                            <div className="space-y-1">
                               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Preço</h4>
                               <p className="text-2xl font-black text-slate-400 italic leading-tight">R$ {product.price}</p>
                            </div>
                         </div>
                      </div>

                      {/* Depois */}
                      <div className="space-y-4">
                         <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black uppercase italic py-1 px-4">OTIMIZAÇÃO IA ✨</Badge>
                         <div className="bg-indigo-600/5 border-2 border-indigo-500/20 rounded-[32px] p-8 space-y-6 shadow-2xl shadow-indigo-500/5">
                            <div className="space-y-1">
                               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Título Profissional Otimizado</h4>
                               <p className="text-xl font-black text-white italic leading-tight uppercase tracking-tighter">{optimization.name}</p>
                            </div>
                            <div className="space-y-1">
                               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Copywriting Irresistível</h4>
                               <p className="text-xs font-bold text-slate-300 leading-relaxed italic">{optimization.description}</p>
                            </div>
                            <div className="space-y-1">
                               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Preço Ideal Sugerido</h4>
                               <p className="text-2xl font-black text-emerald-400 italic leading-tight">R$ {optimization.price_suggestion.ideal.toFixed(2)}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex items-start gap-4">
                      <AlertCircle className="text-amber-500 shrink-0" size={24} />
                      <div>
                         <h5 className="text-[11px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Análise da nossa IA</h5>
                         <p className="text-xs font-bold text-amber-200/80 leading-relaxed italic">{optimization.analysis}</p>
                      </div>
                   </div>
                </TabsContent>

                {/* Tab: Image Upgrade */}
                <TabsContent value="image" className="mt-0 focus-visible:outline-none space-y-8">
                   <div className="flex flex-col lg:flex-row gap-8 items-center">
                      <div className="flex-1 w-full max-w-xl aspect-square relative rounded-[40px] overflow-hidden border-8 border-white/5 shadow-3xl bg-black">
                         {/* Slider Content */}
                         <div className="absolute inset-0 grayscale-[0.8] opacity-50 blur-[2px]">
                            <img src={product.image_url || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800"} className="size-full object-cover" />
                            <Badge className="absolute top-6 left-6 bg-black/60 backdrop-blur-md text-white border-none font-black italic">ORIGINAL - FOTO SIMPLES</Badge>
                         </div>
                         
                         <div 
                           className="absolute inset-0 z-10 transition-none"
                           style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                         >
                            <div className="absolute inset-0 bg-indigo-500/10 blur-[10px] animate-pulse" />
                            <img 
                              src={optimization.improved_image_url || product.image_url || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800"} 
                              className="size-full object-cover saturate-[1.2] contrast-[1.1] brightness-[1.05]" 
                            />
                            {/* Overlay effects to simulate premium look if no key provided */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <Badge className="absolute top-6 right-6 bg-pink-500 text-white border-none font-black italic shadow-lg shadow-pink-500/20">PREMIUM - OTIMIZADA IA ✨</Badge>
                         </div>

                         {/* Slider Handle */}
                         <div 
                           className="absolute top-0 bottom-0 w-1 bg-white z-20 shadow-2xl"
                           style={{ left: `${sliderPos}%` }}
                         >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-10 rounded-full bg-white text-slate-900 border-4 border-slate-900 flex items-center justify-center cursor-ew-resize shadow-2xl">
                               <GripVertical size={20} />
                            </div>
                         </div>

                         <input 
                           type="range" 
                           min="0" max="100" 
                           value={sliderPos}
                           onChange={(e) => setSliderPos(parseInt(e.target.value))}
                           className="absolute inset-0 opacity-0 z-30 cursor-ew-resize w-full h-full"
                         />
                      </div>

                      <div className="flex-1 space-y-6">
                         <div className="p-8 rounded-[32px] bg-white/5 border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                               <h5 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Análise Técnica da Imagem</h5>
                               <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black italic">{optimization.image_analysis.score}/100 Score Gastrômico</Badge>
                            </div>
                            <div className="space-y-4">
                               <div className="flex items-start gap-3">
                                  <AlertCircle className="text-pink-500 shrink-0 mt-1" size={18} />
                                  <div>
                                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Crítica da IA</p>
                                     <p className="text-xs font-bold text-slate-300 italic leading-relaxed">{optimization.image_analysis.critique}</p>
                                  </div>
                               </div>
                               <div className="flex items-start gap-3">
                                  <Check className="text-emerald-500 shrink-0 mt-1" size={18} />
                                  <div>
                                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Plano de Melhoria Aplicado</p>
                                     <ul className="text-xs font-bold text-emerald-400/80 italic space-y-1 mt-1">
                                        <li>✔️ {optimization.image_analysis.improvement_plan}</li>
                                        <li>✔️ Ajuste de Curvas e exposição gourmet</li>
                                        <li>✔️ Upscale de nitidez em 2x</li>
                                     </ul>
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="rounded-[32px] p-6 bg-indigo-600/10 border-2 border-dashed border-indigo-500/20 flex flex-col items-center text-center gap-3">
                            <Sparkles className="text-indigo-400" size={24} />
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Aparência Professional Ativada</p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase leading-relaxed max-w-[200px]">Simulamos ajustes de iluminação iFood Style para este preview.</p>
                         </div>
                      </div>
                   </div>
                </TabsContent>

                {/* Tab: Pricing */}
                <TabsContent value="pricing" className="mt-0 focus-visible:outline-none">
                   <div className="grid grid-cols-3 gap-6">
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center gap-4">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mínimo de Mercado</span>
                         <span className="text-2xl font-black text-slate-400 italic">R$ {optimization.price_suggestion.min.toFixed(2)}</span>
                         <p className="text-[9px] font-bold text-slate-500 leading-tight">Preço de entrada para alta concorrência.</p>
                      </div>
                      <div className="bg-emerald-600/10 border-2 border-emerald-500/20 rounded-3xl p-8 flex flex-col items-center text-center gap-4 scale-110 shadow-2xl">
                         <Zap className="text-emerald-500" size={24} />
                         <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Preço Ideal Recomendado</span>
                         <span className="text-4xl font-black text-white italic">R$ {optimization.price_suggestion.ideal.toFixed(2)}</span>
                         <p className="text-[9px] font-black text-emerald-500 leading-tight uppercase tracking-widest">Máximo de Lucratividade</p>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center gap-4">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Máximo Premium</span>
                         <span className="text-2xl font-black text-slate-400 italic">R$ {optimization.price_suggestion.max.toFixed(2)}</span>
                         <p className="text-[9px] font-bold text-slate-500 leading-tight">Valor sugerido para branding exclusivo.</p>
                      </div>
                   </div>
                </TabsContent>

                {/* Tab: Marketing */}
                <TabsContent value="marketing" className="mt-0 focus-visible:outline-none space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-400">
                               <MessageSquare size={16} />
                               <span className="text-[10px] font-black uppercase tracking-widest">Copy para WhatsApp</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleCopyText(optimization.marketing.whatsapp_text)} className="h-7 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/10 text-emerald-500 gap-2">
                               <Copy size={12} /> Copiar
                            </Button>
                         </div>
                         <div className="bg-emerald-900/10 border border-emerald-900/20 rounded-3xl p-6 font-bold text-xs text-emerald-200/70 italic leading-relaxed whitespace-pre-wrap">
                            {optimization.marketing.whatsapp_text}
                         </div>
                      </div>

                      <div className="space-y-3">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-400">
                               <Share2 size={16} />
                               <span className="text-[10px] font-black uppercase tracking-widest">Legenda Instagram</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleCopyText(optimization.marketing.instagram_caption)} className="h-7 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/10 text-indigo-500 gap-2">
                               <Copy size={12} /> Copiar
                            </Button>
                         </div>
                         <div className="bg-indigo-900/10 border border-indigo-900/20 rounded-3xl p-6 font-bold text-xs text-indigo-200/70 italic leading-relaxed whitespace-pre-wrap">
                            {optimization.marketing.instagram_caption}
                         </div>
                      </div>
                   </div>
                </TabsContent>
             </Tabs>
          </div>

          <div className="p-8 bg-slate-900/80 border-t border-white/5 shrink-0 flex items-center justify-between gap-6 backdrop-blur-xl">
             <Button variant="ghost" onClick={onClose} className="h-16 px-10 rounded-2xl font-black uppercase italic text-[11px] text-slate-500 hover:text-white transition-all">
                Agora não, manter original
             </Button>
             <Button 
                onClick={() => onApply(optimization)} 
                className="h-20 flex-1 rounded-[28px] bg-white text-slate-900 hover:bg-emerald-400 hover:text-white font-black uppercase italic text-sm gap-4 shadow-3xl transition-all active:scale-95 group"
             >
                <div className="size-8 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-white group-hover:text-emerald-500 transition-all">
                   <Check size={20} strokeWidth={4} />
                </div>
                APLICAR TODAS AS MELHORIAS AGORA
             </Button>
          </div>
      </DialogContent>
    </Dialog>
  )
}

