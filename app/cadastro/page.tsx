"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import {
    ArrowRight,
    Mail,
    Lock,
    Eye,
    EyeOff,
    User,
    Store,
    ArrowLeft,
    Shield,
} from "lucide-react"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function RegisterPage() {
    const { user, signUp, isAdmin, loadingSubscription } = useAuth()
    const router = useRouter()
    const [name, setName] = useState("")
    const [storeName, setStoreName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("user")

    useEffect(() => {
        if (user && !loadingSubscription) {
            if (isAdmin) {
                router.push("/admin")
            } else {
                router.push("/dashboard")
            }
        }
    }, [user, isAdmin, loadingSubscription, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        const isUserTab = activeTab === "user"
        const isMissingFields = isUserTab 
            ? (!name || !storeName || !email || !password)
            : (!name || !email || !password)

        if (isMissingFields) {
            toast.error("Preencha todos os campos")
            return
        }

        setIsLoading(true)
        try {
            const { error } = await signUp(email, password, {
                full_name: name,
                store_name: storeName
            })

            if (error) {
                toast.error("Erro ao criar conta", {
                    description: error.message
                })
            } else {
                toast.success("Conta criada! Verifique seu e-mail.")
            }
        } catch (error) {
            toast.error("Erro ao processar cadastro")
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
                <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight mb-6 drop-shadow-lg">
                    Transforme paixão em <span className="text-[#FF6B9A] drop-shadow-md">Lucro Real.</span>
                </h2>
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                        <div className="size-10 rounded-full bg-[#FF6B9A]/20 flex items-center justify-center border border-[#FF6B9A]/30">
                            <span className="font-bold text-[#FF6B9A]">🔥</span>
                        </div>
                        <p className="font-medium text-white/90">Precificação Automática em Segundos</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                        <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <span className="font-bold text-emerald-400">📦</span>
                        </div>
                        <p className="font-medium text-white/90">Controle de Estoque Inteligente</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                        <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                            <span className="font-bold text-blue-400">📈</span>
                        </div>
                        <p className="font-medium text-white/90">Relatórios de Lucratividade Reais</p>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-[500px] bg-white/85 backdrop-blur-[10px] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/50 p-6 sm:p-10 flex flex-col max-h-[96vh] overflow-y-auto custom-scrollbar"
            >
                {/* Header Sub Logo Mobile */}
                <div className="lg:hidden flex justify-center mb-6">
                    <Link href="/" className="font-black italic uppercase text-3xl tracking-tight text-slate-800">
                        Doce<span className="text-[#FF6B9A]">Gestão</span>
                    </Link>
                </div>

                {/* Title Section */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Criar minha Conta</h1>
                    <p className="mt-1 text-sm text-slate-500 font-medium">Escolha seu melhor e-mail para começar.</p>
                </div>

                <Tabs defaultValue="user" onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100/50 rounded-xl h-12 p-1 border border-slate-200/50">
                        <TabsTrigger 
                            value="user" 
                            className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-[#FF6B9A] data-[state=active]:shadow-sm transition-all"
                        >
                            <Store className="size-3.5 mr-2" />
                            Minha Confeitaria
                        </TabsTrigger>
                        <TabsTrigger 
                            value="admin"
                            className="rounded-lg font-bold text-xs data-[state=active]:bg-[#1F2937] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                        >
                            <Shield className="size-3.5 mr-2" />
                            Administrador
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="user" className="mt-0 focus-visible:outline-none">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Name Field */}
                                <div className="space-y-1.5 focus-within:text-[#FF6B9A] text-slate-500 transition-colors">
                                    <Label className="text-xs font-semibold text-slate-700 ml-1">Nome Completo</Label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 transition-colors" />
                                        <Input
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nome Sobrenome"
                                            className="h-11 pl-10 bg-white/60 border-white/60 focus:bg-white focus:ring-[#FF6B9A]/20 focus:border-[#FF6B9A] shadow-sm rounded-xl text-slate-800 placeholder:text-slate-400 transition-all font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Store Name Field */}
                                <div className="space-y-1.5 focus-within:text-[#FF6B9A] text-slate-500 transition-colors">
                                    <Label className="text-xs font-semibold text-slate-700 ml-1">Nome da Confeitaria</Label>
                                    <div className="relative">
                                        <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 transition-colors" />
                                        <Input
                                            required
                                            value={storeName}
                                            onChange={(e) => setStoreName(e.target.value)}
                                            placeholder="Ex: Doces da Lu"
                                            className="h-11 pl-10 bg-white/60 border-white/60 focus:bg-white focus:ring-[#FF6B9A]/20 focus:border-[#FF6B9A] shadow-sm rounded-xl text-slate-800 placeholder:text-slate-400 transition-all font-medium text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="space-y-1.5 focus-within:text-[#FF6B9A] text-slate-500 transition-colors">
                                <Label className="text-xs font-semibold text-slate-700 ml-1">E-mail Comercial</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 transition-colors" />
                                    <Input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@empresa.com"
                                        className="h-11 pl-10 bg-white/60 border-white/60 focus:bg-white focus:ring-[#FF6B9A]/20 focus:border-[#FF6B9A] shadow-sm rounded-xl text-slate-800 placeholder:text-slate-400 transition-all font-medium text-sm"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5 focus-within:text-[#FF6B9A] text-slate-500 transition-colors">
                                <Label className="text-xs font-semibold text-slate-700 ml-1">Crie uma Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 transition-colors" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-11 pl-10 pr-10 bg-white/60 border-white/60 focus:bg-white focus:ring-[#FF6B9A]/20 focus:border-[#FF6B9A] shadow-sm rounded-xl text-slate-800 placeholder:text-slate-400 transition-all font-medium text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#FF6B9A] transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Policy Check */}
                            <div className="flex items-start space-x-3 ml-1 py-1">
                                <Checkbox id="terms" className="mt-0.5 rounded border-slate-300 data-[state=checked]:bg-[#FF6B9A] data-[state=checked]:border-[#FF6B9A]" required />
                                <Label htmlFor="terms" className="text-xs font-medium text-slate-500 leading-tight cursor-pointer">
                                    Li e concordo com os <br className="sm:hidden" /><Link href="/termos" className="text-[#FF6B9A] hover:underline hover:text-[#e05b87]">Termos de Uso</Link> e a <Link href="/privacidade" className="text-[#FF6B9A] hover:underline hover:text-[#e05b87]">Política de Privacidade</Link>.
                                </Label>
                            </div>

                            {/* Create Button */}
                            <Button
                                disabled={isLoading}
                                className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-[#FF6B9A] to-[#ff8cae] hover:from-[#e65a88] hover:to-[#ff759f] shadow-lg shadow-[#FF6B9A]/20 text-white font-bold text-sm transition-all hover:shadow-[#FF6B9A]/40 hover:-translate-y-0.5 group relative overflow-hidden"
                            >
                                <motion.div
                                    className="absolute inset-x-0 bottom-0 h-1 bg-white/20"
                                    initial={{ width: 0 }}
                                    animate={{ width: isLoading ? "100%" : 0 }}
                                    transition={{ duration: 2 }}
                                />
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Configurando Dashboard...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        Criar Conta Grátis
                                        <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-200/50 text-center">
                            <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-[#FF6B9A] transition-colors flex items-center justify-center gap-2">
                                <ArrowLeft className="size-4" />
                                Já tenho uma conta
                            </Link>
                        </div>
                    </TabsContent>

                    {/* ADMIN TAB */}
                    <TabsContent value="admin" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3 mb-5 backdrop-blur-sm">
                            <p className="text-xs font-bold text-amber-700 mb-0.5">Aviso de Segurança</p>
                            <p className="text-xs text-amber-600/90 leading-relaxed font-medium">
                                O cadastro de administradores é restrito. Após o cadastro, sua conta precisará ser aprovada por um administrador master.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name Field */}
                            <div className="space-y-1.5 focus-within:text-[#1F2937] text-slate-500 transition-colors">
                                <Label className="text-xs font-semibold text-slate-700 ml-1">Nome Completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 transition-colors" />
                                    <Input
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Nome do Administrador"
                                        className="h-11 pl-10 bg-white/60 border-white/60 focus:bg-white focus:ring-[#1F2937]/20 focus:border-[#1F2937] shadow-sm rounded-xl text-slate-800 placeholder:text-slate-400 transition-all font-medium text-sm"
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="space-y-1.5 focus-within:text-[#1F2937] text-slate-500 transition-colors">
                                <Label className="text-xs font-semibold text-slate-700 ml-1">Seu Melhor E-mail</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 transition-colors" />
                                    <Input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ex: voce@email.com"
                                        className="h-11 pl-10 bg-white/60 border-white/60 focus:bg-white focus:ring-[#1F2937]/20 focus:border-[#1F2937] shadow-sm rounded-xl text-slate-800 placeholder:text-slate-400 transition-all font-medium text-sm"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5 focus-within:text-[#1F2937] text-slate-500 transition-colors">
                                <Label className="text-xs font-semibold text-slate-700 ml-1">Senha Mestra</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 transition-colors" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-11 pl-10 pr-10 bg-white/60 border-white/60 focus:bg-white focus:ring-[#1F2937]/20 focus:border-[#1F2937] shadow-sm rounded-xl text-slate-800 placeholder:text-slate-400 transition-all font-medium text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F2937] transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Create Button */}
                            <Button
                                disabled={isLoading}
                                className="w-full h-12 mt-2 rounded-xl bg-[#1F2937] hover:bg-slate-800 shadow-lg shadow-slate-900/20 text-white font-bold text-sm transition-all hover:-translate-y-0.5 group relative overflow-hidden"
                            >
                                <motion.div
                                    className="absolute inset-x-0 bottom-0 h-1 bg-white/20"
                                    initial={{ width: 0 }}
                                    animate={{ width: isLoading ? "100%" : 0 }}
                                    transition={{ duration: 2 }}
                                />
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processando...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        Solicitar Acesso Admin
                                        <Shield className="size-4.5 group-hover:scale-110 transition-transform" />
                                    </div>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-200/50 text-center">
                            <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-[#1F2937] transition-colors flex items-center justify-center gap-2">
                                <ArrowLeft className="size-4" />
                                Já tenho uma conta
                            </Link>
                        </div>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </main>
    )
}
