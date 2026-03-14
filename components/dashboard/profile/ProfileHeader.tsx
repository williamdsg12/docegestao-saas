"use client"

import { useAuth } from "@/hooks/useAuth"
import { motion } from "framer-motion"
import { Trophy, TrendingUp, Users, BookOpen, ShoppingCart, Star, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
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
      // Simple completeness logic
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

  const stats = [
    { label: "Receitas", value: "12", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Pedidos", value: "48", icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Clientes", value: "156", icon: Users, color: "text-pink-500", bg: "bg-pink-50" },
    { label: "Faturamento", value: "R$ 3.420", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Avaliação", value: "4.9", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
  ]

  return (
    <div className="space-y-8">
      {/* Top Banner/Header */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        {/* Avatar Section */}
        <div className="relative shrink-0">
          <div className="size-32 rounded-[40px] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" className="size-full object-cover" />
            ) : (
              <span className="text-4xl font-black text-slate-400 capitalize">
                {user?.user_metadata?.full_name?.[0] || user?.email?.[0]}
              </span>
            )}
          </div>
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => document.getElementById('avatar-upload')?.click()}
            className={cn(
              "absolute -bottom-2 -right-2 size-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg border-4 border-white cursor-pointer transition-all",
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
        <div className="flex-1 text-center lg:text-left space-y-2">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
              {user?.user_metadata?.full_name || user?.user_metadata?.owner_name || "Usuário Doce"}
            </h2>
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none w-fit mx-auto lg:mx-0 font-black italic uppercase tracking-widest text-[10px] py-1 px-3">
              {user?.user_metadata?.plan?.toUpperCase() || "PLANO PREMIUM"}
            </Badge>
          </div>
          <p className="text-slate-500 font-bold text-lg">
            {user?.user_metadata?.store_name || "Sua Confeitaria"} • {user?.user_metadata?.city || "Sua Cidade"}, {user?.user_metadata?.state || "UF"}
          </p>
          
          <div className="pt-4 max-w-md mx-auto lg:mx-0">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-[#FF2F81] italic">Perfil {completeness}% completo</span>
               <Trophy className="size-4 text-amber-500" />
            </div>
            <Progress value={completeness} className="h-2 bg-slate-100 accent-primary" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full lg:w-auto">
          <Link href="/dashboard/configuracoes" className="flex-1 lg:flex-none">
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl border-2 border-slate-100 font-bold text-sm px-8 hover:bg-slate-50 transition-all active:scale-95"
            >
              Configurações
            </Button>
          </Link>
          <Link href={`/menu/${user?.user_metadata?.slug || ""}`} className="flex-1 lg:flex-none">
            <Button 
              className="w-full h-14 rounded-2xl bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-sm px-8 shadow-lg shadow-indigo-100 transition-all active:scale-95 group"
            >
              Ver Perfil Público
              <motion.span
                className="ml-2 inline-block"
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                →
              </motion.span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((item, i) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group"
          >
            <div className={cn("size-12 rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110", item.bg, item.color)}>
               <item.icon className="size-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{item.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

