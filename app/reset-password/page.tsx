"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"

import { Suspense } from "react"

function ResetPasswordContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isError, setIsError] = useState(false)

    useEffect(() => {
        if (!token) {
            setIsError(true)
            toast.error("Token de redefinição ausente ou inválido.")
        }
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.")
            return
        }

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem.")
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Erro ao redefinir senha.")
            }

            setIsSuccess(true)
            toast.success("Senha redefinida com sucesso!")

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push("/login")
            }, 3000)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (isError) {
        return (
            <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-[480px] text-center bg-white p-12 rounded-[32px] border border-slate-100 shadow-xl">
                    <AlertTriangle className="size-16 text-rose-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-black text-[#0F172A] uppercase italic mb-4">Link <span className="text-rose-500 not-italic">Inválido</span></h1>
                    <p className="text-slate-500 font-medium mb-8">
                        Este link de redefinição parece ser inválido ou já expirou.
                        Por favor, solicite um novo link.
                    </p>
                    <Button asChild className="w-full h-14 rounded-xl bg-[#0F172A] text-white font-bold">
                        <Link href="/recuperar-senha">Solicitar Novo Link</Link>
                    </Button>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,#FF2F8105,transparent_50%)]" />

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
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
                    {!isSuccess ? (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-black text-[#0F172A] uppercase italic leading-none">Nova <span className="text-[#FF2F81] not-italic">Senha</span></h1>
                                <p className="mt-4 text-sm font-medium text-[#64748B]">
                                    Crie uma senha forte e segura para sua conta.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2.5">
                                    <Label className="text-xs font-black uppercase tracking-widest text-[#0F172A] ml-1">Nova Senha</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-[#FF2F81] transition-colors" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="h-14 pl-12 pr-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#FF2F81]/5 focus:border-[#FF2F81]/20 transition-all font-medium"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-xs font-black uppercase tracking-widest text-[#0F172A] ml-1">Confirmar Senha</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-[#FF2F81] transition-colors" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="h-14 pl-12 pr-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#FF2F81]/5 focus:border-[#FF2F81]/20 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <Button
                                    disabled={isLoading}
                                    className="w-full h-[60px] rounded-xl bg-[#FF2F81] hover:bg-[#db2777] text-white font-bold text-sm uppercase tracking-[0.1em] shadow-xl shadow-[#FF2F81]/20"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : "Salvar Nova Senha"}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="size-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-green-100 shadow-sm">
                                <CheckCircle2 className="size-10" />
                            </div>
                            <h2 className="text-2xl font-black text-[#0F172A] uppercase italic mb-4">Senha <span className="text-green-500 not-italic">Atualizada!</span></h2>
                            <p className="text-slate-500 font-medium mb-8">
                                Sua senha foi redefinida com sucesso. Você será redirecionado para o login em instantes...
                            </p>
                            <Loader2 className="animate-spin text-primary mx-auto" />
                        </div>
                    )}
                </motion.div>
            </div>
        </main>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
                <Loader2 className="size-12 animate-spin text-slate-300" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
