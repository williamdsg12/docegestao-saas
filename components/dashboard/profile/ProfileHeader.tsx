"use client"

import { useAuth } from "@/hooks/useAuth"
import { motion } from "framer-motion"
import { Trophy, TrendingUp, Users, BookOpen, ShoppingCart, Star, Camera, ExternalLink, MapPin, Store, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { useProfileStats } from "@/hooks/useProfileStats"
import Link from "next/link"

export function ProfileHeader() {
  const { user, updateProfile } = useAuth()
  const [completeness, setCompleteness] = useState(0)
  const [uploading, setUploading] = useState(false)

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      await updateProfile({ avatar_url: publicUrl })
    } catch (e: any) {
      console.error("Upload error:", e.message)
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (user) {
      const fields = [
        user.user_metadata?.full_name,
        user.user_metadata?.phone,
        user.user_metadata?.city,
        user.user_metadata?.state,
        user.user_metadata?.specialty,
        user.user_metadata?.experience_years,
        user.user_metadata?.store_name,
        user.user_metadata?.instagram,
        user.user_metadata?.bio
      ]
      const filled = fields.filter(f => !!f).length
      setCompleteness(Math.round((filled / fields.length) * 100))
    }
  }, [user])

  const { receitas, pedidos, clientes, faturamento, avaliacao, loading: loadingStats } = useProfileStats()

  const stats = [
    { label: "Receitas", value: loadingStats ? "..." : receitas.toString(), icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Pedidos", value: loadingStats ? "..." : pedidos.toString(), icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Clientes", value: loadingStats ? "..." : clientes.toString(), icon: Users, color: "text-pink-500", bg: "bg-pink-50" },
    { label: "Faturamento", value: loadingStats ? "..." : `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Avaliação", value: "4.9", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
  ]

  const getMenuBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return process.env.NEXT_PUBLIC_APP_URL || ""
  }

  const menuSlug = user?.user_metadata?.menu_slug || user?.user_metadata?.slug || ""

  return (
    <div className="space-y-8">
      {/* Main Profile Card */}
      <div className="relative group">
        {/* Background Decor */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800 rounded-[40px] shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 size-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 size-64 bg-indigo-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-10">
          {/* Avatar Section */}
          <div className="relative shrink-0">
            <div className="size-40 rounded-[48px] bg-white/10 backdrop-blur-md p-1.5 border border-white/20 shadow-2xl overflow-hidden group/avatar">
              <div className="size-full rounded-[40px] overflow-hidden bg-slate-800 flex items-center justify-center relative">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="size-full object-cover transition-transform duration-500 group-hover/avatar:scale-110" />
                ) : (
                  <span className="text-5xl font-black text-white/20 capitalize">
                    {user?.user_metadata?.full_name?.[0] || user?.email?.[0]}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                  <Camera className="size-8 text-white" />
                </div>
              </div>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => document.getElementById('avatar-upload')?.click()}
              className={cn(
                "absolute -bottom-2 -right-2 size-12 rounded-2xl bg-[#FF2F81] text-white flex items-center justify-center shadow-xl border-4 border-slate-900 cursor-pointer transition-all",
                uploading && "opacity-50 cursor-wait"
              )}
            >
              <Camera className={cn("size-5", uploading && "animate-pulse")} />
            </motion.div>
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </div>

          {/* Info Section */}
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div className="space-y-2">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <h2 className="text-4xl font-black text-white tracking-tight uppercase italic leading-none">
                  {user?.user_metadata?.full_name || user?.user_metadata?.owner_name || "Usuário Doce"}
                </h2>
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none w-fit mx-auto lg:mx-0 font-black italic uppercase tracking-widest text-[10px] py-1.5 px-4 shadow-lg shadow-emerald-500/20">
                  <Sparkles size={12} className="mr-2" />
                  {user?.user_metadata?.plan?.toUpperCase() || "PLANO PREMIUM"}
                </Badge>
              </div>
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-x-6 gap-y-2 text-slate-400 font-bold text-sm uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Store size={14} className="text-[#FF2F81]" />
                  {user?.user_metadata?.store_name || "Sua Confeitaria"}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#FF2F81]" />
                  {user?.user_metadata?.city || "Sua Cidade"}, {user?.user_metadata?.state || "UF"}
                </div>
              </div>
            </div>
            
            <div className="pt-4 max-w-sm mx-auto lg:mx-0">
              <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-[0.2em] italic">
                 <span className="text-[#FF2F81]">Conclusão do Perfil</span>
                 <span className="text-white">{completeness}%</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${completeness}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#FF2F81] to-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 shrink-0 w-full lg:w-64">
             <Button 
                onClick={() => {
                    if (!menuSlug) {
                        alert("Por favor, defina o link do seu cardápio nas configurações primeiro.")
                        return
                    }
                    window.open(`${getMenuBaseUrl()}/menu/${menuSlug}`, '_blank')
                }}
                className="w-full h-14 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black uppercase italic text-xs shadow-xl transition-all active:scale-95 group"
              >
                Ver Perfil Público
                <motion.span
                  className="ml-2 inline-block"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ExternalLink className="size-4" />
                </motion.span>
              </Button>
            <Link href="/dashboard/configuracoes">
              <Button 
                variant="outline" 
                className="w-full h-14 rounded-2xl border-2 border-white/10 bg-transparent text-white hover:bg-white/5 font-black uppercase italic text-xs transition-all active:scale-95"
              >
                Gerenciar Painel
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards - More compact & modern */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stats.map((item, i) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:translate-y-[-4px] transition-all"
          >
            <div className="flex flex-col items-center text-center">
              <div className={cn("size-12 rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm", item.bg, item.color)}>
                 <item.icon className="size-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 italic">{item.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}


