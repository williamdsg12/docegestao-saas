"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Camera,
    Truck,
    MapPin,
    Clock,
    CheckCircle2,
    Search,
    ChevronRight,
    Plus,
    Filter,
    Image as ImageIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const portfolioPhotos = [
    { id: 1, url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80", title: "Bolo de Chocolate Belga", category: "Bolos" },
    { id: 2, url: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80", title: "Donuts Gourmet", category: "Doces" },
    { id: 3, url: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80", title: "Red Velvet Especial", category: "Bolos" },
    { id: 4, url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80", title: "Macarons Sortidos", category: "Doces" },
    { id: 5, url: "https://images.unsplash.com/photo-1535141192574-5d4897c82536?w=800&q=80", title: "Brigadeiro Gourmet", category: "Festa" }
]

const deliveries = [
    { id: 1, client: "Ana Beatriz", address: "Av. Paulista, 1200 - Apto 42", time: "14:30", status: "Em Rota", orderId: "#1024" },
    { id: 2, client: "Carlos Souza", address: "Rua das Flores, 45", time: "16:00", status: "Pendente", orderId: "#1025" },
    { id: 3, client: "Fernanda Lima", address: "Al. Santos, 800", time: "10:00", status: "Entregue", orderId: "#1020" }
]

export default function FotosEntregasPage() {
    const [activeTab, setActiveTab] = useState<"portfolio" | "entregas">("entregas")

    return (
        <div className="space-y-12 pb-24">
            {/* Header & Navigation */}
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-2 uppercase italic leading-none">
                        Logística & <span className="text-primary tracking-tighter">Portfólio</span>
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight italic">Excelência do preparo até o sorriso do cliente.</p>
                </div>

                <div className="relative p-1.5 rounded-[24px] bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl flex gap-1 group">
                    <div className="absolute -inset-2 bg-primary/5 rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab("entregas")}
                        className={cn(
                            "relative z-10 rounded-[20px] font-black uppercase tracking-widest text-[10px] px-8 h-12 transition-all duration-500",
                            activeTab === "entregas" ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                        )}
                    >
                        <Truck className={cn("mr-2 size-4 transition-transform", activeTab === "entregas" && "scale-110")} />
                        Rota de Entregas
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab("portfolio")}
                        className={cn(
                            "relative z-10 rounded-[20px] font-black uppercase tracking-widest text-[10px] px-8 h-12 transition-all duration-500",
                            activeTab === "portfolio" ? "bg-primary text-white shadow-2xl shadow-primary/20" : "text-slate-400 hover:text-primary hover:bg-white/50"
                        )}
                    >
                        <Camera className={cn("mr-2 size-4 transition-transform", activeTab === "portfolio" && "scale-110")} />
                        Galeria de Fotos
                    </Button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === "entregas" ? (
                    <motion.div
                        key="entregas"
                        initial={{ opacity: 0, scale: 0.98, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -30 }}
                        className="space-y-10"
                    >
                        {/* Status Dashboard */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: "Total Hoje", value: "14", color: "from-rose-50 to-rose-100/40", textColor: "text-rose-600", icon: Truck },
                                { label: "Pendentes", value: "05", color: "from-amber-50 to-amber-100/40", textColor: "text-amber-600", icon: Clock },
                                { label: "Em Rota", value: "03", color: "from-blue-50 to-blue-100/40", textColor: "text-blue-600", icon: MapPin },
                                { label: "Concluídas", value: "06", color: "from-emerald-50 to-emerald-100/40", textColor: "text-emerald-600", icon: CheckCircle2 }
                            ].map((stat, i) => (
                                <Card key={i} className={cn("border-none bg-gradient-to-br shadow-sm rounded-[32px] p-6 lg:p-8", stat.color)}>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic leading-none">{stat.label}</span>
                                            <stat.icon className={cn("size-4 opacity-50", stat.textColor)} />
                                        </div>
                                        <p className={cn("text-4xl font-black tracking-tighter leading-none", stat.textColor)}>{stat.value}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Deliveries List */}
                        <div className="space-y-6">
                            {deliveries.map((delivery, idx) => (
                                <motion.div
                                    key={delivery.id}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group relative overflow-hidden bg-white/40 backdrop-blur-md rounded-[40px] border border-white/60 p-8 hover:shadow-[0_20px_50px_rgba(244,114,182,0.1)] transition-all duration-500 hover:-translate-y-1"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                        <div className="flex items-center gap-8">
                                            <div className={cn(
                                                "size-20 rounded-[28px] flex items-center justify-center border-2 transition-all duration-500 shadow-xl shadow-slate-100/50",
                                                delivery.status === "Em Rota" ? "bg-blue-600 border-blue-400 text-white" :
                                                    delivery.status === "Entregue" ? "bg-emerald-600 border-emerald-400 text-white" : "bg-white border-slate-100 text-slate-300"
                                            )}>
                                                <Truck className={cn("size-10", delivery.status === "Pendente" && "animate-pulse")} />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">{delivery.client}</h3>
                                                    <Badge className="bg-slate-900/5 text-slate-400 border-none text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                                        {delivery.orderId}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-6">
                                                    <div className="flex items-center gap-2 group/info">
                                                        <div className="p-1.5 rounded-lg bg-rose-50 text-primary group-hover/info:scale-110 transition-transform">
                                                            <MapPin className="size-4" />
                                                        </div>
                                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">{delivery.address}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 group/info">
                                                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-500 group-hover/info:scale-110 transition-transform">
                                                            <Clock className="size-4" />
                                                        </div>
                                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">Previsão: {delivery.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 self-end md:self-auto">
                                            <div className="text-right">
                                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 mb-2">Stage</p>
                                                <Badge className={cn(
                                                    "px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest shadow-lg",
                                                    delivery.status === "Em Rota" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-200" :
                                                        delivery.status === "Entregue" ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-200" : "bg-white border border-slate-100 text-slate-400 shadow-slate-100"
                                                )}>
                                                    {delivery.status}
                                                </Badge>
                                            </div>
                                            <Button variant="ghost" className="size-16 rounded-[22px] bg-white border border-slate-100 hover:border-primary/30 hover:bg-white transition-all shadow-sm group-hover:shadow-xl">
                                                <ChevronRight className="size-6 text-slate-400 group-hover:text-primary transition-colors" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Decorative subtle background shape */}
                                    <div className="absolute -bottom-12 -right-12 size-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="portfolio"
                        initial={{ opacity: 0, scale: 0.98, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -30 }}
                        className="space-y-10"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="relative group flex-1 max-w-xl">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-hover:text-primary transition-colors" />
                                <Input
                                    placeholder="Explorar criações..."
                                    className="h-16 pl-16 pr-8 rounded-[24px] border-none bg-white shadow-lg text-base font-medium focus-visible:ring-primary/20 placeholder:text-slate-300"
                                />
                            </div>
                            <Button className="h-16 px-10 rounded-[24px] bg-gradient-to-r from-primary to-rose-500 text-white font-black italic uppercase shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                                <Plus className="mr-3 size-6" />
                                Imortalizar Criação
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {portfolioPhotos.map((photo, idx) => (
                                <motion.div
                                    key={photo.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group relative aspect-[4/5] rounded-[48px] overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-700"
                                >
                                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900/95 via-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

                                    <img src={photo.url} alt={photo.title} className="size-full object-cover transition-transform duration-1000 group-hover:scale-110" />

                                    <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                                        <Badge className="w-fit mb-4 bg-primary/20 backdrop-blur-md border border-primary/30 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1">
                                            {photo.category}
                                        </Badge>
                                        <h4 className="text-white text-2xl font-black italic uppercase tracking-tighter leading-tight mb-6">
                                            {photo.title}
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <Button className="flex-1 h-12 rounded-2xl bg-white text-slate-900 font-bold uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-colors">
                                                Visualizar
                                            </Button>
                                            <Button size="icon" className="size-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-rose-500 hover:border-rose-400 transition-all">
                                                <ImageIcon className="size-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Action Overlays always visible subtle */}
                                    <div className="absolute top-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="size-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white">
                                            <CheckCircle2 className="size-6" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
