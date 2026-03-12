"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import {
    User as UserIcon,
    Camera,
    CheckCircle2,
    Store,
    Phone,
    Instagram,
    MapPin,
    Crown,
    Calendar,
    Mail,
    Lock,
    Home,
    ChevronRight,
    Utensils,
    Globe,
    QrCode,
    Copy,
    ExternalLink,
    RefreshCw,
    Clock
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { QRCodeSVG } from "qrcode.react"

export default function ConfiguracoesPage() {
    const { user, updateProfile, subscription } = useAuth()
    const [isLoading, setIsLoading] = useState(false)

    // Form states
    const [name, setName] = useState(user?.user_metadata?.full_name || "")
    const [storeName, setStoreName] = useState(user?.user_metadata?.store_name || "")
    const [phone, setPhone] = useState(user?.user_metadata?.phone || "")
    const [instagram, setInstagram] = useState(user?.user_metadata?.instagram || "")
    const [whatsapp, setWhatsapp] = useState(user?.user_metadata?.whatsapp || "")
    const [address, setAddress] = useState(user?.user_metadata?.address || "")
    const [slug, setSlug] = useState(user?.user_metadata?.slug || "")
    const [minOrder, setMinOrder] = useState(user?.user_metadata?.min_order || "")
    const [businessHours, setBusinessHours] = useState(user?.user_metadata?.business_hours || "")
    const [promoBanner, setPromoBanner] = useState(user?.user_metadata?.promo_banner || "")
    const [isMenuLinkCopied, setIsMenuLinkCopied] = useState(false)

    // WhatsApp Client States
    const [waStatus, setWaStatus] = useState<'DISCONNECTED' | 'QR_READY' | 'AUTHENTICATING' | 'CONNECTED'>('DISCONNECTED')
    const [waQr, setWaQr] = useState<string | null>(null)

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/whatsapp/status')
                const data = await res.json()
                setWaStatus(data.status)
                setWaQr(data.qr)
            } catch (error) { }
        }
        checkStatus()
        const interval = setInterval(checkStatus, 3000)
        return () => clearInterval(interval)
    }, [])

    const handleStartWhatsApp = async () => {
        toast.info("Iniciando conexão com WhatsApp...")
        await fetch('/api/whatsapp/start', { method: 'POST' })
    }

    const handleStopWhatsApp = async () => {
        await fetch('/api/whatsapp/stop', { method: 'POST' })
        toast.success("WhatsApp Desconectado")
        setWaStatus('DISCONNECTED')
        setWaQr(null)
    }

    // Password states
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const handleSaveProfile = async () => {
        setIsLoading(true)
        try {
            const { error } = await updateProfile({
                full_name: name,
                store_name: storeName,
                phone,
                instagram,
                whatsapp,
                address,
                slug,
                min_order: minOrder,
                business_hours: businessHours,
                promo_banner: promoBanner
            })

            if (error) {
                toast.error("Erro ao salvar perfil")
            } else {
                toast.success("Perfil atualizado com sucesso!")
            }
        } catch (error) {
            toast.error("Erro inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 md:px-6">
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

            {/* Page Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Meu Perfil</h1>
                <p className="text-sm font-medium text-slate-500">
                    Gestão de Perfil - Gerencie suas informações pessoais e dados da empresa
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                {/* User Profile Card */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        {/* Internal Stats Header */}
                        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <div className="relative group">
                                <div className="size-24 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center shrink-0">
                                    {user?.user_metadata?.avatar_url ? (
                                        <img src={user.user_metadata.avatar_url} alt="" className="size-full object-cover" />
                                    ) : (
                                        <UserIcon className="size-10 text-slate-400" />
                                    )}
                                </div>
                                <button className="absolute bottom-0 right-0 size-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors border-2 border-white">
                                    <Camera className="size-4" />
                                </button>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight truncate uppercase italic">
                                        {user?.user_metadata?.full_name || "Confeiteira"}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">{user?.email}</p>
                                </div>

                                {/* Mini Stats Cluster */}
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receitas</span>
                                        <span className="text-lg font-black text-blue-600 italic">12</span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedidos</span>
                                        <span className="text-lg font-black text-pink-600 italic">48</span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clientes</span>
                                        <span className="text-lg font-black text-emerald-600 italic">156</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Internal Tabs */}
                        <Tabs defaultValue="perfil" className="w-full">
                            <TabsList className="w-full flex h-14 bg-slate-50 border-b border-slate-100 rounded-none p-0">
                                <TabsTrigger value="perfil" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 font-bold text-slate-500 transition-all">
                                    Dados do Perfil
                                </TabsTrigger>
                                <TabsTrigger value="senha" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 font-bold text-slate-500 transition-all">
                                    Alterar Senha
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="perfil" className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Nome Completo</Label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="h-12 border-slate-200 rounded-xl bg-white focus-visible:ring-4 focus-visible:ring-blue-600/10 focus-visible:border-blue-600 transition-all font-medium"
                                            placeholder="Seu nome"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">E-mail</Label>
                                        <Input
                                            value={user?.email || ""}
                                            disabled
                                            className="h-12 border-slate-200 rounded-xl bg-slate-50 cursor-not-allowed font-medium text-slate-400"
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 transition-all active:scale-95">
                                    {isLoading ? "Salvando..." : "Salvar Perfil"}
                                </Button>
                            </TabsContent>

                            <TabsContent value="senha" className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Senha Atual</Label>
                                        <Input
                                            type="password"
                                            className="h-12 border-slate-200 rounded-xl focus-visible:ring-4 focus-visible:ring-blue-600/10 focus-visible:border-blue-600"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Nova Senha</Label>
                                        <Input
                                            type="password"
                                            className="h-12 border-slate-200 rounded-xl focus-visible:ring-4 focus-visible:ring-blue-600/10 focus-visible:border-blue-600"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <Button className="w-full h-14 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200">
                                    Atualizar Senha
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Company Data Card */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        {/* Company Stats Header */}
                        <div className="p-8 border-b border-slate-50 flex items-center gap-6">
                            <div className="size-20 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
                                <Store className="size-10" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-900 uppercase italic leading-none truncate">
                                    {storeName || "Minha Confeitaria"}
                                </h3>
                                <div className="mt-4 flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ativos</span>
                                        <span className="text-sm font-black text-emerald-600">PRO</span>
                                    </div>
                                    <div className="w-px h-6 bg-slate-100" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Membros</span>
                                        <span className="text-sm font-black text-slate-600">01</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Nome Fantasia</Label>
                                    <Input
                                        value={storeName}
                                        onChange={(e) => setStoreName(e.target.value)}
                                        className="h-12 border-slate-200 rounded-xl bg-white focus-visible:ring-4 focus-visible:ring-emerald-600/10 focus-visible:border-emerald-600 font-medium transition-all"
                                        placeholder="Ex: Doce Ateliê"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Telefone</Label>
                                    <Input
                                        value={whatsapp}
                                        onChange={(e) => setWhatsapp(e.target.value)}
                                        className="h-12 border-slate-200 rounded-xl bg-white focus-visible:ring-4 focus-visible:ring-emerald-600/10 focus-visible:border-emerald-600 font-medium transition-all"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Instagram (@usuario)</Label>
                                <Input
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                    className="h-12 border-slate-200 rounded-xl bg-white focus-visible:ring-4 focus-visible:ring-emerald-600/10 focus-visible:border-emerald-600 font-medium transition-all"
                                    placeholder="@sua_confeitaria"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Endereço Completo</Label>
                                <Input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="h-12 border-slate-200 rounded-xl bg-white focus-visible:ring-4 focus-visible:ring-emerald-600/10 focus-visible:border-emerald-600 font-medium transition-all"
                                    placeholder="Rua, Número, Bairro, Cidade"
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isLoading}
                                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 transition-all active:scale-95 group"
                                >
                                    {isLoading ? "Processando..." : (
                                        <span className="flex items-center gap-2">
                                            Salvar Empresa
                                            <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Digital Menu Settings (NEW) */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[40px] overflow-hidden bg-white lg:col-span-2">
                    <CardContent className="p-0">
                        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row gap-8 items-center">
                            <div className="size-24 rounded-[32px] bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                                <Globe className="size-12" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-3">
                                    Meu <span className="text-primary tracking-tighter">Cardápio Digital</span>
                                </h3>
                                <p className="text-sm font-medium text-slate-500 max-w-xl">
                                    Configure seu link exclusivo e comece a vender online. Seus clientes poderão fazer pedidos diretamente pelo navegador.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                <Button variant="outline" className="h-12 rounded-xl bg-white border-slate-200 font-black uppercase text-[10px] tracking-widest gap-2">
                                    <ExternalLink className="size-4" /> Visualizar
                                </Button>
                            </div>
                        </div>

                        <div className="p-10 grid md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">URL do seu Cardápio</Label>
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 group focus-within:border-primary/20 transition-all">
                                        <div className="px-4 py-3 bg-white rounded-xl text-xs font-bold text-slate-400 border border-slate-100 shadow-sm">
                                            docegestao.com/menu/
                                        </div>
                                        <input
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                            placeholder="sua-loja"
                                            className="flex-1 bg-transparent border-none outline-none font-black text-primary italic placeholder:text-slate-300"
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="size-10 rounded-xl hover:bg-white"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`https://docegestao.com/menu/${slug}`)
                                                setIsMenuLinkCopied(true)
                                                toast.success("Link copiado!")
                                                setTimeout(() => setIsMenuLinkCopied(false), 2000)
                                            }}
                                        >
                                            <Copy className={cn("size-4 transition-all", isMenuLinkCopied ? "text-emerald-500 scale-125" : "text-slate-400")} />
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight ml-1 italic">
                                        * Este será o endereço que você vai colocar na sua Bio do Instagram.
                                    </p>
                                </div>

                                {/* Funcionamento e Regras (NEW) */}
                                <div className="space-y-6 pt-6 border-t border-slate-50">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 italic">
                                        <Clock className="size-4" /> Funcionamento & Regras
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pedido Mínimo (R$)</Label>
                                            <Input 
                                                value={minOrder}
                                                onChange={(e) => setMinOrder(e.target.value)}
                                                placeholder="0.00" 
                                                className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Horário de Atendimento</Label>
                                            <Input 
                                                value={businessHours}
                                                onChange={(e) => setBusinessHours(e.target.value)}
                                                placeholder="Ex: Seg-Sex: 09h-18h" 
                                                className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Texto do Banner Promocional</Label>
                                        <Input 
                                            value={promoBanner}
                                            onChange={(e) => setPromoBanner(e.target.value)}
                                            placeholder="Ex: Entrega grátis acima de R$ 100!" 
                                            className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 italic">
                                        <span className="size-2 rounded-full bg-primary" /> Recursos Ativados
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            "Pedidos via WhatsApp",
                                            "Pagamento Online",
                                            "Gestão de Estoque",
                                            "Cálculo de Entrega",
                                            "Banners Promocionais",
                                            "QR Code de Mesa"
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
                                                <CheckCircle2 className="size-3.5 text-emerald-500" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-[40px] text-white relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 size-40 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-100" />
                                
                                <div className="relative z-10 flex flex-col items-center gap-6">
                                    <div className="p-6 bg-white rounded-[32px] shadow-xl">
                                        <QRCodeSVG 
                                          value={`https://docegestao.com/menu/${slug || 'sua-loja'}`}
                                          size={128}
                                          bgColor={"#ffffff"}
                                          fgColor={"#0f172a"}
                                          level={"H"}
                                          includeMargin={false}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-black italic uppercase tracking-widest text-primary mb-1">QR Code de Balcão</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase max-w-[180px]">Imprima e coloque na sua loja para pedidos rápidos.</p>
                                    </div>
                                    <Button className="h-12 w-full rounded-2xl bg-white text-slate-900 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-100 gap-2">
                                        <RefreshCw className="size-4" /> Gerar Novo
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 pt-0">
                            <Button
                                onClick={handleSaveProfile}
                                disabled={isLoading}
                                className="w-full h-16 rounded-3xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4"
                            >
                                {isLoading ? "Salvando..." : (
                                    <>
                                        Publicar Alterações no Cardápio
                                        <ChevronRight className="size-5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Real WhatsApp Connection (NEW) */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[40px] overflow-hidden bg-white lg:col-span-2">
                    <CardContent className="p-0">
                        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row gap-8 items-center bg-slate-900 text-white relative overflow-hidden group shadow-2xl">
                             <div className="absolute top-0 right-0 size-64 bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-100" />
                            <div className="size-24 rounded-[32px] bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner z-10">
                                <Phone className="size-12" />
                            </div>
                            <div className="flex-1 text-center md:text-left z-10">
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">
                                    Conexão <span className="text-emerald-400 tracking-tighter">WhatsApp Autorizada</span>
                                </h3>
                                <p className="text-sm font-medium text-slate-300 max-w-xl">
                                    Faça a leitura do QR Code com o WhatsApp Oficial do seu estabelecimento para ativar mensagens automatizadas e confirmação de pedidos de clientes reais.
                                </p>
                            </div>
                        </div>

                        <div className="p-10">
                            <div className="flex flex-col items-center justify-center gap-6">
                                {waStatus === 'DISCONNECTED' && (
                                    <>
                                        <div className="text-center">
                                            <p className="text-sm font-black italic uppercase tracking-widest text-slate-600 mb-1">Status: Não Conectado</p>
                                        </div>
                                        <Button onClick={handleStartWhatsApp} className="h-14 px-8 rounded-2xl bg-emerald-600 text-white font-black uppercase text-xs tracking-widest hover:bg-emerald-700 shadow-xl gap-2 transition-all hover:scale-105 active:scale-95">
                                            <QrCode className="size-5" /> Gerar Novo QR Code Oficial
                                        </Button>
                                    </>
                                )}

                                {waStatus === 'QR_READY' && waQr && (
                                    <>
                                        <div className="p-6 bg-white border-2 border-slate-100 rounded-[32px] shadow-xl">
                                            <img src={waQr} alt="WhatsApp QR Code" className="w-[200px] h-[200px]" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black italic uppercase tracking-widest text-emerald-600 mb-1">Escaneie o QR Code</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase max-w-[200px]">Aponte seu celular para o código acima usando a aba Aparelhos Conectados no WhatsApp.</p>
                                        </div>
                                    </>
                                )}

                                {waStatus === 'AUTHENTICATING' && (
                                    <div className="text-center">
                                        <RefreshCw className="size-16 text-emerald-600 mx-auto animate-spin mb-4" />
                                        <p className="text-sm font-black italic uppercase tracking-widest text-emerald-600 mb-1">Autenticando...</p>
                                    </div>
                                )}

                                {waStatus === 'CONNECTED' && (
                                    <>
                                        <div className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-[32px] shadow-xl text-center">
                                            <CheckCircle2 className="size-16 text-emerald-600 mx-auto mb-4" />
                                            <p className="text-sm font-black italic uppercase tracking-widest text-emerald-600 mb-1">WhatsApp Conectado e Ativo!</p>
                                        </div>
                                        <Button variant="outline" onClick={handleStopWhatsApp} className="h-12 px-8 rounded-2xl border-rose-200 text-rose-600 font-bold uppercase text-xs hover:bg-rose-50 hover:text-rose-700">
                                            Desconectar Sessão
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
