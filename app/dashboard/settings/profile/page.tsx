"use client"

import { ProfileHeader } from "@/components/dashboard/profile/ProfileHeader"
import { ProfileTabs } from "@/components/dashboard/profile/ProfileTabs"
import { motion } from "framer-motion"

export default function ProfileSettingsPage() {
  return (
    <div className="space-y-10 pb-20">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
          MINHA <span className="text-[#FF2F81]">CONTA</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
          Gerencie seus dados pessoais e as configurações profissionais do seu negócio.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10"
      >
        <ProfileHeader />
        
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
           <ProfileTabs />
        </div>
      </motion.div>
    </div>
  )
}
