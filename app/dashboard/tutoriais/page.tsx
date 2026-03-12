"use client"

import { Play, BookOpen, Video, Star, Info } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const tutorials = [
    {
        title: "Como cadastrar produtos",
        description: "Aprenda a cadastrar seus doces, bolos e salgados com fotos e descrições atraentes.",
        duration: "4:20",
        category: "Iniciando",
        icon: BookOpen,
        videoUrl: "#"
    },
    {
        title: "Como criar pedidos",
        description: "Veja como registrar pedidos de forma rápida e organizada, vinculando aos seus clientes.",
        duration: "5:15",
        category: "Vendas",
        icon: Video,
        videoUrl: "#"
    },
    {
        title: "Como calcular custos",
        description: "Domine a calculadora de ficha técnica para nunca mais ter prejuízo nas suas receitas.",
        duration: "10:30",
        category: "Financeiro",
        icon: Star,
        videoUrl: "#"
    },
    {
        title: "Como usar estoque",
        description: "Mantenha seus ingredientes sob controle e receba alertas quando algo estiver acabando.",
        duration: "3:45",
        category: "Gestão",
        icon: Info,
        videoUrl: "#"
    },
    {
        title: "Como organizar entregas",
        description: "Gerencie sua logística de entrega e garanta que seus doces cheguem perfeitos.",
        duration: "6:10",
        category: "Logística",
        icon: Video,
        videoUrl: "#"
    }
]

export default function TutorialsPage() {
    return (
        <div className="space-y-12 pb-24">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary w-fit">
                    <Star className="size-4 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Academia Doce Gestão</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black italic tracking-tight text-slate-900 uppercase leading-none">
                    Central de <span className="text-primary italic tracking-tighter">Domínio</span>
                </h1>
                <p className="text-slate-500 font-medium italic text-lg opacity-80 max-w-2xl">
                    Aprenda a escalar seu negócio com nossas trilhas de conhecimento exclusivas.
                </p>
            </motion.div>

            {/* Tutorials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tutorials.map((tutorial, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="group overflow-hidden rounded-[40px] border border-white/60 bg-white/40 backdrop-blur-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full">
                            {/* Video Placeholder */}
                            <div className="aspect-video relative overflow-hidden">
                                <div className="absolute inset-0 bg-slate-900/5 transition-colors group-hover:bg-slate-900/20" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                                {/* Decorative elements */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="size-20 rounded-full bg-white/30 backdrop-blur-xl border border-white/40 flex items-center justify-center text-white shadow-2xl relative z-20 group-hover:bg-primary transition-colors cursor-pointer"
                                    >
                                        <Play className="size-8 fill-current translate-x-1" />
                                    </motion.div>
                                </div>

                                <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-900 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full">
                                    {tutorial.category}
                                </Badge>

                                <Badge className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full">
                                    {tutorial.duration}
                                </Badge>
                            </div>

                            <CardHeader className="p-8 pb-4 space-y-4 flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <tutorial.icon className="size-5" />
                                    </div>
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="size-1 rounded-full bg-slate-200" />
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase leading-tight group-hover:text-primary transition-colors">
                                        {tutorial.title}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-3 font-medium text-slate-500 text-sm leading-relaxed italic">
                                        {tutorial.description}
                                    </CardDescription>
                                </div>
                            </CardHeader>

                            <CardContent className="p-8 pt-0">
                                <Button className="w-full h-14 rounded-2xl bg-white border border-slate-100 text-slate-900 font-black uppercase text-[10px] tracking-widest italic hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                    Assistir Masterclass
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Premium Support Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative overflow-hidden bg-slate-900 rounded-[56px] p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] border border-slate-800 text-center flex flex-col items-center gap-8"
            >
                {/* Background effects */}
                <div className="absolute top-0 right-0 size-96 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="absolute bottom-0 left-0 size-80 bg-indigo-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px] opacity-30" />

                <div className="relative z-10 space-y-4">
                    <div className="size-20 rounded-[28px] bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40 mx-auto transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                        <Info className="size-10" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
                        Precisa de <span className="text-primary italic tracking-tight">Consultoria VIP?</span>
                    </h2>
                    <p className="text-slate-400 font-medium italic text-lg opacity-80 max-w-2xl mx-auto">
                        Nossos especialistas estão online para te ajudar a configurar seu sistema e acelerar seus processos de produção.
                    </p>
                </div>

                <div className="relative z-10">
                    <Button className="h-20 px-12 rounded-[32px] bg-white text-slate-900 font-black italic uppercase text-xs tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-4 hover:bg-emerald-50">
                        <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                        Chamar no WhatsApp Oficial
                    </Button>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-6 opacity-60">
                        Resposta em média: 5 minutos • Disponível agora
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
