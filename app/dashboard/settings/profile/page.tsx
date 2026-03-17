"use client"

import { ProfileHeader } from "@/components/dashboard/profile/ProfileHeader"
import { ProfileTabs } from "@/components/dashboard/profile/ProfileTabs"
import { motion } from "framer-motion"

export default function ProfileSettingsPage() {
  return (
    <div className="space-y-6 md:space-y-10 p-4 md:p-0 pb-20">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
          MINHA <span className="text-[#FF2F81]">CONTA</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] md:text-xs">
          Gerencie seus dados e as configurações profissionais do seu negócio.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 md:space-y-10"
      >
        <ProfileHeader />
        
        <div className="bg-white rounded-[24px] md:rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
           <ProfileTabs />
        </div>
      </motion.div>
    </div>
  )
}
