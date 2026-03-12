"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { toast } from "sonner"

export default function RecoverPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) {
            toast.error("Por favor, informe seu e-mail.")
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch("/api/auth/reset-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Erro ao solicitar redefinição.")
            }

            setIsSent(true)
            toast.success("E-mail de redefinição enviado!")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,#FF2F8105,transparent_50%)]" />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <Link href="/login">
                    <Image src="/logo doce gestao.svg" alt="DoceGestão" width={450} height={150} className="h-14 w-auto object-contain" />
                </Link>
            </motion.div>

            <div className="w-full max-w-[480px]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[32px] border border-slate-100 p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.08)]"
                >
                    {!isSent ? (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-black text-[#0F172A] uppercase italic leading-none">Recuperar <span className="text-[#FF2F81] not-italic">Senha</span></h1>
                                <p className="mt-4 text-sm font-medium text-[#64748B]">
                                    Insira seu e-mail e enviaremos um link para você criar uma nova senha.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2.5">
                                    <Label className="text-xs font-black uppercase tracking-widest text-[#0F172A] ml-1">Seu E-mail</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-[#FF2F81] transition-colors" />
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="exemplo@gmail.com"
                                            className="h-14 pl-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#FF2F81]/5 focus:border-[#FF2F81]/20 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <Button
                                    disabled={isLoading}
                                    className="w-full h-[60px] rounded-xl bg-[#FF2F81] hover:bg-[#db2777] text-white font-bold text-sm uppercase tracking-[0.1em] shadow-xl shadow-[#FF2F81]/20"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : "Enviar Link de Recuperação"}
                                </Button>

                                <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-[#0F172A] transition-colors group">
                                    <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                                    Voltar para o Login
                                </Link>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="size-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-green-100">
                                <CheckCircle2 className="size-10" />
                            </div>
                            <h2 className="text-2xl font-black text-[#0F172A] uppercase italic mb-4">E-mail <span className="text-green-500 not-italic">Enviado!</span></h2>
                            <p className="text-slate-500 font-medium mb-8">
                                Verifique sua caixa de entrada (e a pasta de spam) para o link de redefinição.
                            </p>
                            <Button
                                asChild
                                variant="outline"
                                className="w-full h-14 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                            >
                                <Link href="/login">Voltar para o Login</Link>
                            </Button>
                        </div>
                    )}
                </motion.div>
            </div>
        </main>
    )
}
