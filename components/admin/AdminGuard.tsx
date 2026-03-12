"use client"

import { useAuth } from "@/hooks/useAuth"
import { Lock, ShieldAlert, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { isAdmin, loading, user } = useAuth()
    const router = useRouter()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Verificando Autorização Admin...</p>
                </div>
            </div>
        )
    }

    if (!user || !isAdmin) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full p-10 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
                    <div className="absolute -top-24 -right-24 size-48 bg-rose-500/5 rounded-full blur-3xl" />

                    <div className="size-20 rounded-3xl bg-rose-50 border-2 border-rose-100 flex items-center justify-center mx-auto mb-8">
                        <ShieldAlert className="size-10 text-rose-500" />
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter mb-4">
                        Acesso Restrito
                    </h2>

                    <p className="text-slate-500 font-medium leading-relaxed mb-10">
                        Esta área é exclusiva para administradores do sistema DoceGestão. Se você acredita que isso é um erro, entre em contato com o suporte técnico.
                    </p>

                    <div className="grid gap-4">
                        <Link href="/dashboard" className="w-full">
                            <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20 text-white font-black uppercase italic text-lg flex items-center justify-center gap-3">
                                <ArrowLeft className="size-6" />
                                Voltar ao Dashboard
                            </Button>
                        </Link>

                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Auditoria de acesso registrada
                        </p>
                    </div>
                </motion.div>
            </div>
        )
    }

    return <>{children}</>
}
