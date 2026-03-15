"use client"

import { ProfileHeader } from "@/components/dashboard/profile/ProfileHeader"
import { ProfileTabs } from "@/components/dashboard/profile/ProfileTabs"
import { motion } from "framer-motion"
import { User, Home, ChevronRight } from "lucide-react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link"

export default function ProfilePage() {
    return (
        <div className="space-y-10 pb-20">
            {/* Breadcrumb Section */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <Home className="size-4" />
                                <span>Home</span>
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="font-bold text-slate-900">Meu Perfil</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Page Header Area */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                    MEU <span className="text-[#FF2F81]">PERFIL</span>
                </h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                    <User className="size-3 text-primary" />
                    Gerencie seus dados pessoais, profissionais e identidade visual do negócio.
                </p>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
            >
                {/* Header with Avatar and Stats */}
                <ProfileHeader />
                
                {/* Unified Editing Tabs */}
                <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                   <ProfileTabs />
                </div>
            </motion.div>
        </div>
    )
}
