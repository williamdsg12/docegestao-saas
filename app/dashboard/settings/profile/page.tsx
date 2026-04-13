"use client"

import { ProfileHeader } from "@/components/dashboard/profile/ProfileHeader"
import { ProfileTabs } from "@/components/dashboard/profile/ProfileTabs"
import { motion } from "framer-motion"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ShieldCheck } from "lucide-react"

export default function ProfileSettingsPage() {
  return (
    <div className="space-y-10 pb-20">
      <PageHeader 
        title="Minha" 
        highlight="Conta" 
        subtitle="Gerencie seus dados e as configurações profissionais do seu negócio."
        actions={(
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Conta Verificada</span>
          </div>
        )}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10"
      >
        <ProfileHeader />
        
        <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
           <ProfileTabs />
        </div>
      </motion.div>
    </div>
  )
}

