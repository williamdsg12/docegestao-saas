"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { motion } from "framer-motion"
import { 
    Shield, 
    Lock, 
    Smartphone, 
    LogOut, 
    Home,
    AlertCircle,
    CheckCircle2
} from "lucide-react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function SecurityPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [passwords, setPasswords] = useState({
        newPassword: "",
        confirmPassword: ""
    })

    const handleUpdatePassword = async () => {
        if (!passwords.newPassword || passwords.newPassword !== passwords.confirmPassword) {
            toast.error("As senhas não coincidem!")
            return
        }

        if (passwords.newPassword.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres")
            return
        }

        setLoading(true)
        const { error } = await supabase.auth.updateUser({
            password: passwords.newPassword
        })

        if (error) {
            toast.error("Erro ao atualizar senha: " + error.message)
        } else {
            toast.success("Senha atualizada com sucesso!")
            setPasswords({ newPassword: "", confirmPassword: "" })
        }
        setLoading(false)
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Breadcrumb */}
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
                        <BreadcrumbPage className="font-bold text-slate-900">Segurança</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Page Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                    SEGURANÇA <span className="text-primary">E ACESSO</span>
                </h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                    <Shield className="size-3 text-primary" />
                    Proteja sua conta e controle as sessões ativas do sistema.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Change Password */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white/70 backdrop-blur-xl">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-lg font-black uppercase italic tracking-tight flex items-center gap-3">
                            <Lock className="size-5 text-amber-500" />
                            Alterar Senha
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mantenha sua conta protegida</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nova Senha</Label>
                                <Input 
                                    type="password"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                                    placeholder="••••••••"
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Confirmar Nova Senha</Label>
                                <Input 
                                    type="password"
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                                    placeholder="••••••••"
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button 
                                onClick={handleUpdatePassword}
                                disabled={loading}
                                className="w-full h-15 rounded-2xl bg-[#0F172A] hover:bg-slate-900 text-white font-black uppercase italic tracking-widest text-[11px] shadow-lg transition-all"
                            >
                                {loading ? "Processando..." : "Atualizar Minha Senha"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Connected Devices (Mocked for now as Supabase session list is restricted client-side) */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white/70 backdrop-blur-xl">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-lg font-black uppercase italic tracking-tight flex items-center gap-3">
                            <Smartphone className="size-5 text-indigo-500" />
                            Sessões Ativas
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gerencie onde você está logado</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6">
                        <div className="space-y-4">
                            {/* Current Session */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-500">
                                        <CheckCircle2 className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black uppercase italic text-slate-900">Este Dispositivo</p>
                                        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Windows • Chrome • São Paulo, BR</p>
                                    </div>
                                </div>
                                <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest italic">Ativa Agora</span>
                            </div>

                            {/* Other Sessions Tip */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                                <AlertCircle className="size-5 text-slate-400 mt-0.5" />
                                <p className="text-[10px] font-bold uppercase tracking-tight text-slate-400 leading-relaxed">
                                    Para encerrar todas as outras sessões ativas por segurança, clique no botão abaixo. Isso exigirá que você logue novamente em outros aparelhos.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button 
                                variant="outline"
                                className="w-full h-15 rounded-2xl border-2 border-slate-100 font-black uppercase italic tracking-widest text-[11px] hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all gap-3"
                            >
                                <LogOut className="size-4" />
                                Encerrar Outras Sessões
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
