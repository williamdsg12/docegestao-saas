"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
    Settings,
    Shield,
    Globe,
    Mail,
    CreditCard,
    Lock,
    Save,
    Bell,
    Database,
    Palette,
    CheckCircle2,
    Copy,
    History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function AdminSettings() {
    const [loading, setLoading] = useState(false)

    const handleSave = () => {
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            toast.success("Configurações atualizadas com sucesso!")
        }, 1500)
    }

    const [isApiKeysOpen, setIsApiKeysOpen] = useState(false)

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">Configurações <span className="text-primary">Globais</span></h2>
                    <p className="text-slate-500 font-medium">Controle as definições mestre de todo o ecossistema SaaS</p>
                </div>
                <Button 
                    onClick={handleSave}
                    disabled={loading}
                    className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase italic shadow-xl shadow-slate-900/20 hover:scale-105 transition-transform flex items-center gap-3"
                >
                    <Save className="size-6" /> {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* General Settings */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Globe className="size-6" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 italic uppercase">Identidade do <span className="text-primary">Sistema</span></h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Plataforma</label>
                                <input 
                                    type="text" 
                                    defaultValue="Doce Gestão"
                                    className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Base</label>
                                <input 
                                    type="text" 
                                    defaultValue="app.docegestao.com"
                                    className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CreditCard className="size-6" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 italic uppercase">Integração de <span className="text-primary">Pagamentos</span></h3>
                        </div>
                        
                        <div className="space-y-8">
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <Database className="size-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm uppercase italic tracking-tight">Modo Sandbox (Testes)</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Habilitado para Stripe & Pix</p>
                                    </div>
                                </div>
                                <div className="size-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 cursor-pointer">
                                    <CheckCircle2 className="size-6" />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar Configs */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[40px] p-8 text-white">
                        <Shield className="size-10 text-primary mb-6" />
                        <h4 className="text-xl font-black italic uppercase tracking-tighter mb-4">Segurança <span className="text-primary">Mestre</span></h4>
                        <p className="text-slate-400 text-sm font-medium mb-8">Defina políticas de senha e autenticação de dois fatores para toda a base de usuários.</p>
                        
                        <Dialog open={isApiKeysOpen} onOpenChange={setIsApiKeysOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full h-12 rounded-xl bg-white text-slate-900 font-black uppercase italic text-[10px] tracking-widest hover:bg-slate-100 transition-all">
                                    Gerenciar Chaves API
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] rounded-[32px] bg-slate-900 border-slate-800 text-white">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">Chaves de <span className="text-primary">API</span></DialogTitle>
                                    <DialogDescription className="text-slate-400">
                                        Gerencie suas credenciais para acesso programático.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Produção (Live)</span>
                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px]">Ativa</Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs font-mono text-slate-300 flex-1 truncate">dg_live_458923758923758923</code>
                                            <Button variant="ghost" size="sm" onClick={() => {
                                                navigator.clipboard.writeText("dg_live_458923758923758923")
                                                toast.success("Chave copiada!")
                                            }} className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-slate-700">
                                                <Copy className="size-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Button className="w-full h-12 rounded-xl bg-primary text-slate-900 font-black uppercase italic tracking-widest">
                                        Gerar Nova Chave
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
                        <h4 className="text-base font-black text-slate-900 italic uppercase mb-6 flex items-center gap-2">
                            <Palette className="size-5 text-primary" /> Visual & Temas
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tema Admin</span>
                                <Badge 
                                    onClick={() => toast.info("O tema Dark Default é aplicado globalmente para administradores.")}
                                    className="bg-slate-900 text-white rounded-lg px-3 py-1 text-[10px] uppercase font-black italic cursor-pointer hover:bg-slate-800"
                                >
                                    Dark Default
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Botão Redondo</span>
                                <div className="size-6 rounded-full bg-primary" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
