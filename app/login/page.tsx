"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Mail, Lock, Eye, EyeOff, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

import { useAuth } from "@/hooks/useAuth"

export default function LoginPage() {
    const { user, signInWithGoogle, signInWithEmail, loading, isAdmin, loadingSubscription } = useAuth()
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (user && !loadingSubscription) {
            if (isAdmin) {
                router.push("/admin")
            } else {
                router.push("/dashboard")
            }
        }
    }, [user, isAdmin, loadingSubscription, router])

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        try {
            await signInWithGoogle()
        } catch (error) {
            toast.error("Erro ao entrar com Google")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) {
            toast.error("Preencha todos os campos")
            return
        }

        setIsLoading(true)
        try {
            const { error } = await signInWithEmail(email, password)
            if (error) {
                toast.error("E-mail ou senha inválidos", {
                    description: error.message
                })
            } else {
                toast.success("Login realizado com sucesso!")
            }
        } catch (error) {
            toast.error("Erro ao entrar no sistema")
        } finally {
            setIsLoading(false)
        }
    }

    // Bakery Background Image
    const bgImage = "/fundo%20padaria.jpg"

    return (
        <main className="min-h-screen w-full relative flex items-center justify-center lg:justify-end lg:pr-[8%] p-4 overflow-hidden">
            {/* Background Layer full screen */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('${bgImage}')` }}
            >
                {/* Blur Filter */}
                <div className="absolute inset-0 backdrop-blur-[12px]"></div>
                {/* Colorful SaaS Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B9A]/35 to-[#7C3AED]/35 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-black/20"></div>
            </div>

            {/* Content left side branding (hidden on mobile) */}
            <div className="hidden lg:flex flex-col absolute left-16 top-1/2 -translate-y-1/2 z-10 text-white max-w-lg">
                <Link href="/" className="mb-8 hover:scale-105 transition-transform flex items-center font-black italic uppercase text-4xl tracking-tight drop-shadow-md">
                    Doce<span className="text-[#FF6B9A]">Gestão</span>
                </Link>
                <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight mb-6 drop-shadow-lg">A receita certa para o sucesso da sua confeitaria.</h2>
                <p className="text-lg text-white/90 font-medium drop-shadow-md">Gerencie pedidos, clientes, custos e muito mais em uma plataforma única e elegante.</p>
            </div>

            {/* Form Card */}
            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-[480px] bg-white/85 backdrop-blur-[10px] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/50 p-8 sm:p-10 flex flex-col"
            >
                {/* Header Sub Logo Mobile */}
                <div className="lg:hidden flex justify-center mb-6">
                    <Link href="/" className="font-black italic uppercase text-3xl tracking-tight text-slate-800">
                        Doce<span className="text-[#FF6B9A]">Gestão</span>
                    </Link>
                </div>

                {/* Title Section */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Entrar na sua conta</h1>
                    <p className="mt-2 text-sm text-slate-500 font-medium">Bem-vindo de volta! Acesse seu painel.</p>
                </div>

                <Tabs defaultValue="user" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100/50 rounded-xl h-12 p-1 border border-slate-200/50">
                        <TabsTrigger 
                            value="user" 
                            className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-[#FF6B9A] data-[state=active]:shadow-sm transition-all"
                        >
                            Minha Confeitaria
                        </TabsTrigger>
                        <TabsTrigger 
                            value="admin"
                            className="rounded-lg font-bold text-xs data-[state=active]:bg-[#1F2937] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                        >
                            Administrador
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="user" className="mt-0 focus-visible:outline-none">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Field */}
                            <div className="space-y-1.5 focus-within:text-[#FF6B9A] text-slate-500 transition-colors">
                                <Label className="text-sm font-semibold text-slate-700 ml-1">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 transition-colors" />
                                    <Input
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-12 pl-11 bg-white/60 border-white/60 focus:bg-white focus:ring-[#FF6B9A]/20 focus:border-[#FF6B9A] shadow-sm rounded-xl text-slate-800 placeholder:text-slate-400 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5 focus-within:text-[#FF6B9A] text-slate-500 transition-colors">
                                <div className="flex items-center justify-between ml-1">
                                    <Label className="text-sm font-semibold text-slate-700">Senha</Label>
                                    <Link href="/recuperar-senha" className="text-xs font-semibold text-[#FF6B9A] hover:text-[#e05b87] transition-colors">
                                        Esqueceu a senha?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 transition-colors" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 pl-11 pr-11 bg-white/60 border-white/60 focus:bg-white focus:ring-[#FF6B9A]/20 focus:border-[#FF6B9A] shadow-sm rounded-xl text-slate-800 placeholder:text-slate-400 transition-all font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#FF6B9A] transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center space-x-2 ml-1 pb-1">
                                <Checkbox id="remember" className="rounded-md border-slate-300 data-[state=checked]:bg-[#FF6B9A] data-[state=checked]:border-[#FF6B9A]" />
                                <Label htmlFor="remember" className="text-sm font-semibold text-slate-600 cursor-pointer">
                                    Lembrar de mim
                                </Label>
                            </div>

                            {/* Submit Button */}
                            <Button
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#FF6B9A] to-[#ff8cae] hover:from-[#e65a88] hover:to-[#ff759f] shadow-lg shadow-[#FF6B9A]/20 text-white font-bold text-base transition-all hover:shadow-[#FF6B9A]/40 hover:-translate-y-0.5 group"
                            >
                                {isLoading ? (
                                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Entrar no Sistema
                                        <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="admin" className="mt-0 focus-visible:outline-none">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Field */}
                            <div className="space-y-1.5 focus-within:text-[#1F2937] text-slate-500 transition-colors">
                                <Label className="text-sm font-semibold text-slate-700 ml-1">E-mail Administrativo</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 transition-colors" />
                                    <Input
                                        type="email"
                                        placeholder="admin@docegestao.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-12 pl-11 bg-white/60 border-white/60 focus:bg-white focus:ring-[#1F2937]/20 focus:border-[#1F2937] shadow-sm rounded-xl text-slate-800 placeholder:text-slate-400 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5 focus-within:text-[#1F2937] text-slate-500 transition-colors">
                                <Label className="text-sm font-semibold text-slate-700 ml-1">Senha de Segurança</Label>
                                <div className="relative">
                                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 transition-colors" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 pl-11 pr-11 bg-white/60 border-white/60 focus:bg-white focus:ring-[#1F2937]/20 focus:border-[#1F2937] shadow-sm rounded-xl text-slate-800 placeholder:text-slate-400 transition-all font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F2937] transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                disabled={isLoading}
                                className="w-full h-12 mt-4 rounded-xl bg-[#1F2937] hover:bg-slate-800 shadow-lg shadow-slate-900/20 text-white font-bold text-base transition-all hover:-translate-y-0.5 group"
                            >
                                {isLoading ? (
                                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Acesso Restrito
                                        <Shield className="ml-2 size-5 group-hover:scale-110 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </TabsContent>

                    <div className="mt-8 relative flex items-center justify-center">
                        <span className="w-full border-t border-slate-300 absolute" />
                        <span className="bg-white/90 px-3 relative text-xs font-bold text-slate-400 uppercase tracking-widest rounded-md">ou entrar com</span>
                    </div>

                    <div className="mt-6">
                        <Button
                            variant="outline"
                            className="w-full h-12 border-slate-200 bg-white/60 hover:bg-white rounded-xl font-bold text-slate-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="size-5" alt="Google" />
                            Continuar com Google
                        </Button>
                    </div>

                </Tabs>

                {/* Footer Links */}
                <div className="mt-8 text-center text-sm font-medium text-slate-500">
                    Não tem uma conta?{" "}
                    <Link href="/cadastro" className="font-bold text-[#7C3AED] hover:text-[#642ce0] transition-colors">
                        Criar conta
                    </Link>
                </div>
            </motion.div>
        </main>
    )
}
