"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ShoppingBag,
    Calendar,
    Download,
    CheckSquare,
    Square,
    Printer,
    Filter,
    ArrowRight,
    Search,
    ChevronRight,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

const mockIngredients = [
    { id: 1, name: "Leite Condensado", quantity: 15, unit: "unid", category: "Laticínios", checked: false },
    { id: 2, name: "Creme de Leite", quantity: 10, unit: "unid", category: "Laticínios", checked: true },
    { id: 3, name: "Chocolate em Pó 50%", quantity: 2.5, unit: "kg", category: "Chocolates", checked: false },
    { id: 4, name: "Manteiga sem Sal", quantity: 1200, unit: "g", category: "Gorduras", checked: false },
    { id: 5, name: "Açúcar Refinado", quantity: 5, unit: "kg", category: "Secos", checked: false },
    { id: 6, name: "Farinha de Trigo", quantity: 10, unit: "kg", category: "Secos", checked: false },
    { id: 7, name: "Ovos Brancos", quantity: 60, unit: "unid", category: "Frescos", checked: false }
]

export default function ListaComprasPage() {
    const [ingredients, setIngredients] = useState(mockIngredients)
    const [isGenerating, setIsGenerating] = useState(false)
    const [showList, setShowList] = useState(false)

    const toggleChecked = (id: number) => {
        setIngredients(prev => prev.map(ing =>
            ing.id === id ? { ...ing, checked: !ing.checked } : ing
        ))
    }

    const handleGenerate = () => {
        setIsGenerating(true)
        setTimeout(() => {
            setIsGenerating(false)
            setShowList(true)
        }, 1500)
    }

    return (
        <div className="space-y-12 pb-24">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
            >
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-2 uppercase italic leading-none">
                        Lista de <span className="text-primary tracking-tighter">Compras</span>
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight italic">Planejamento inteligente para nunca faltar o essencial.</p>
                </div>
                {showList && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex gap-4"
                    >
                        <Button variant="outline" className="h-14 px-8 rounded-2xl border-white bg-white/40 backdrop-blur-md text-slate-600 hover:text-primary font-black uppercase tracking-widest text-[10px] shadow-lg border transition-all">
                            <Printer className="mr-2 size-5" /> Imprimir
                        </Button>
                        <Button className="h-14 px-8 rounded-2xl bg-gradient-to-r from-primary to-rose-500 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                            <Download className="mr-2 size-5" /> Exportar PDF
                        </Button>
                    </motion.div>
                )}
            </motion.div>

            <AnimatePresence mode="wait">
                {!showList ? (
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -30 }}
                        className="max-w-3xl mx-auto pt-10"
                    >
                        <div className="relative group">
                            {/* Decorative background blur */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-rose-400/10 rounded-[60px] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

                            <Card className="relative rounded-[50px] border border-white/60 bg-white/40 backdrop-blur-2xl shadow-2xl overflow-hidden">
                                <CardHeader className="bg-gradient-to-b from-white/40 to-transparent p-12 text-center relative overflow-hidden">
                                    <div className="absolute -top-12 -right-12 size-48 bg-primary/10 rounded-full blur-3xl" />
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ repeat: Infinity, duration: 4 }}
                                        className="size-24 rounded-[32px] bg-primary flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-primary/30"
                                    >
                                        <ShoppingBag className="size-12" />
                                    </motion.div>
                                    <CardTitle className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none mb-4">
                                        Gerador de <span className="text-primary italic">Insumos</span>
                                    </CardTitle>
                                    <CardDescription className="text-slate-500 font-bold max-w-sm mx-auto text-base">
                                        Calculamos automaticamente cada grama necessária cruzando seus pedidos e estoque atual.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="p-12 space-y-10">
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Período de Extração</label>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="group relative bg-white/50 backdrop-blur-md p-6 rounded-[32px] border border-white/60 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-all hover:bg-white shadow-sm overflow-hidden">
                                                <div className="size-12 rounded-2xl bg-rose-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                    <Calendar className="size-6" />
                                                </div>
                                                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Produção Hoje</span>
                                                <div className="absolute -bottom-8 -right-8 size-20 bg-primary/5 rounded-full blur-xl" />
                                            </div>
                                            <div className="group relative bg-slate-900 p-6 rounded-[32px] border-none flex items-center gap-4 cursor-pointer shadow-xl shadow-slate-900/20 transform hover:-translate-y-1 transition-all overflow-hidden">
                                                <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary">
                                                    <Calendar className="size-6 shadow-[0_0_15px_rgba(244,114,182,0.3)]" />
                                                </div>
                                                <span className="text-sm font-black text-white uppercase tracking-widest">Próximos 7 Dias</span>
                                                <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-white/5 to-transparent" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Inteligência de Segurança</label>
                                        <div className="group bg-rose-50/40 backdrop-blur-sm p-8 rounded-[36px] border border-rose-100/50 flex items-center justify-between hover:bg-rose-50/60 transition-colors">
                                            <div className="flex items-center gap-5">
                                                <div className="size-12 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-primary">
                                                    <ArrowRight className="size-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Margem de Erro (+5%)</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Proteção extra para insumos secos e laticínios</p>
                                                </div>
                                            </div>
                                            <Checkbox checked className="size-8 rounded-xl border-primary data-[state=checked]:bg-primary shadow-lg shadow-primary/20" />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="w-full h-20 rounded-[32px] bg-primary text-white font-black italic uppercase text-xl shadow-[0_20px_50px_rgba(244,114,182,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 overflow-hidden relative group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        {isGenerating ? (
                                            <><Loader2 className="mr-3 size-8 animate-spin" /> Analisando Fichas Técnicas...</>
                                        ) : (
                                            "Gerar Lista Inteligente ✨"
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-12"
                    >
                        {/* Highlights Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { label: "Diversidade", value: "24 Insumos", color: "from-rose-50 to-rose-100/30", textColor: "text-rose-600", icon: Filter },
                                { label: "Produção Associada", value: "18 Pedidos", color: "from-indigo-50 to-indigo-100/30", textColor: "text-indigo-600", icon: Calendar },
                                { label: "Status Compras", value: "15%", color: "from-emerald-50 to-emerald-100/30", textColor: "text-emerald-600", progress: true }
                            ].map((stat, i) => (
                                <Card key={i} className={cn("border-none bg-gradient-to-br shadow-sm rounded-[32px] p-8", stat.color)}>
                                    <div className="flex flex-col h-full justify-between gap-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic leading-none">{stat.label}</span>
                                            {stat.icon && <stat.icon className={cn("size-5 opacity-40", stat.textColor)} />}
                                        </div>
                                        {stat.progress ? (
                                            <div className="space-y-4">
                                                <p className={cn("text-3xl font-black tracking-tighter", stat.textColor)}>{stat.value}</p>
                                                <Progress value={15} className="h-2.5 rounded-full bg-emerald-200/50" />
                                            </div>
                                        ) : (
                                            <p className={cn("text-3xl font-black tracking-tighter", stat.textColor)}>{stat.value}</p>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Ingredients Grid */}
                        <div className="grid grid-cols-1 gap-6">
                            {ingredients.map((ing, idx) => (
                                <motion.div
                                    key={ing.id}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => toggleChecked(ing.id)}
                                    className={cn(
                                        "group relative flex items-center justify-between overflow-hidden rounded-[40px] border border-white/60 bg-white/40 backdrop-blur-md p-8 hover:shadow-[0_20px_50px_rgba(244,114,182,0.1)] transition-all duration-500 hover:-translate-y-1 cursor-pointer",
                                        ing.checked && "opacity-60 bg-slate-50/50 grayscale-[0.5]"
                                    )}
                                >
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className={cn(
                                            "size-14 rounded-[20px] flex items-center justify-center border-2 transition-all duration-500 shadow-lg",
                                            ing.checked
                                                ? "bg-emerald-500 border-emerald-400 text-white scale-110 rotate-3 shadow-emerald-200"
                                                : "bg-white border-slate-100 text-slate-200"
                                        )}>
                                            <CheckSquare className={cn("size-8", !ing.checked && "hidden")} />
                                            <div className={cn("size-4 rounded-full border-4 border-slate-100", ing.checked && "hidden")} />
                                        </div>
                                        <div>
                                            <h3 className={cn(
                                                "text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none transition-all duration-500",
                                                ing.checked && "line-through text-slate-400"
                                            )}>
                                                {ing.name}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-3">
                                                <Badge className="bg-rose-50 text-primary border-none text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                                    {ing.category}
                                                </Badge>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                    Ref: #{ing.id + 1000}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">Nesc. Técnica</p>
                                        <div className="flex items-baseline justify-end gap-2">
                                            <span className="text-4xl font-black text-slate-900 tracking-tighter italic">
                                                {ing.quantity}
                                            </span>
                                            <span className="text-sm font-black text-primary uppercase tracking-widest">
                                                {ing.unit}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Decorative subtle background shapes */}
                                    <div className="absolute -bottom-8 -left-8 size-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex flex-col items-center gap-6 pt-12 pb-10">
                            <div className="h-px w-24 bg-slate-200" />
                            <Button
                                onClick={() => setShowList(false)}
                                variant="ghost"
                                className="px-10 h-14 rounded-full text-slate-400 font-black italic uppercase tracking-[0.2em] text-[10px] hover:text-primary hover:bg-white/50 transition-all"
                            >
                                <ChevronRight className="mr-2 size-4 rotate-180" />
                                Ajustar Configurações
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function Progress({ value, className }: { value: number, className?: string }) {
    return (
        <div className={cn("relative overflow-hidden", className)}>
            <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${value}%` }}
            />
        </div>
    )
}
