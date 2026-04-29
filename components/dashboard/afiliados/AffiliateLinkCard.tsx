"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Copy, 
  Check, 
  Smartphone, 
  Link as LinkIcon, 
  QrCode,
  Share2,
  ExternalLink,
  MessageCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface AffiliateLinkCardProps {
  affiliateCode: string
  affiliateSlug?: string
}

export function AffiliateLinkCard({ affiliateCode, affiliateSlug }: AffiliateLinkCardProps) {
  const [hasCopied, setHasCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  
  // Use slug se existir, senão o código padrão
  const reference = affiliateSlug || affiliateCode
  const trackingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/ref/${reference}`

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingUrl)
    setHasCopied(true)
    toast.success("Link exclusivo copiado!")
    setTimeout(() => setHasCopied(false), 2000)
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Olha esse sistema incrível de gestão para confeiteiras que estou usando! Facilita toda a precificação e vendas. Cadastre-se com meu link: ${trackingUrl}`)
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  return (
    <div className="bg-slate-900 rounded-[40px] p-8 sm:p-12 text-white relative overflow-hidden group shadow-2xl">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32 transition-all duration-700 group-hover:bg-primary/30" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] -ml-24 -mb-24" />
      
      <div className="relative z-10 flex flex-col xl:flex-row gap-12 items-start xl:items-center justify-between">
        
        {/* Texts */}
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-2 border border-white/10">
             <LinkIcon className="size-4 text-primary" />
             <span className="text-[10px] font-black uppercase tracking-widest">Link de Divulgação Oficial</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase italic tracking-tighter leading-[0.9]">
            Seu Link <span className="text-primary">Exclusivo</span>
          </h2>
          <p className="text-slate-400 font-medium text-sm sm:text-base leading-relaxed">
            Compartilhe este link com outras confeiteiras. Qualquer pessoa que se cadastrar por ele ficará vinculada à sua rede por 90 dias através de <span className="text-white font-bold">Cookies Seguros</span>.
          </p>
        </div>

        {/* Interactivity Area */}
        <div className="w-full xl:w-[450px] space-y-4 shrink-0">
          
          <div className="bg-white p-2.5 rounded-3xl flex items-center shadow-inner border border-slate-100">
             <div className="flex-1 overflow-hidden px-4">
                <p className="text-xs font-bold text-slate-800 truncate select-all">
                  {trackingUrl}
                </p>
             </div>
             <Button 
               onClick={handleCopy}
               className={`h-12 w-12 sm:w-auto sm:px-6 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${
                 hasCopied ? "bg-green-500 hover:bg-green-600" : "bg-primary hover:bg-primary/90"
               }`}
             >
               {hasCopied ? <Check className="size-5" /> : <Copy className="size-5" />}
               <span className="hidden sm:block">{hasCopied ? "Copiado!" : "Copiar Link"}</span>
             </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
             <Button 
                onClick={handleWhatsAppShare}
                variant="outline" 
                className="h-12 rounded-xl bg-white/5 border-white/10 hover:bg-[#25D366] hover:border-[#25D366] hover:text-white group/btn transition-colors gap-2"
             >
                <MessageCircle className="size-4 text-[#25D366] group-hover/btn:text-white" />
                <span className="text-[10px] font-black uppercase tracking-wide hidden sm:block">WhatsApp</span>
             </Button>

             <Button 
                onClick={() => setShowQR(!showQR)}
                variant="outline" 
                className="h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white hover:text-slate-900 transition-colors gap-2"
             >
                <QrCode className="size-4" />
                <span className="text-[10px] font-black uppercase tracking-wide hidden sm:block">QR Code</span>
             </Button>

             <Button 
                onClick={() => window.open(trackingUrl, '_blank')}
                variant="outline" 
                className="h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white hover:text-slate-900 transition-colors gap-2"
             >
                <ExternalLink className="size-4" />
                <span className="text-[10px] font-black uppercase tracking-wide hidden sm:block">Testar</span>
             </Button>
          </div>

          {/* QR Code Expansion */}
          <AnimatePresence>
            {showQR && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="overflow-hidden"
               >
                 <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl mt-4 flex flex-col items-center justify-center space-y-4">
                    <div className="size-40 bg-white rounded-2xl flex items-center justify-center border-4 border-primary p-2">
                       {/* Placeholder para a img do QRcode. Idealmente pode usar react-qr-code */}
                       <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`} alt="QR Code" className="size-full rounded-xl" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">
                       Exiba no balcão ou nas suas redes sociais para atrair novas assinaturas.
                    </p>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}
