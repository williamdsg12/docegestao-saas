"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
    Palette,
    Droplet,
    Info,
    RefreshCw,
    Save,
    ChevronRight,
    Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function CalculadoraCoresPage() {
    const [baseType, setBaseType] = useState<"Chantilly" | "Pasta Americana" | "Glace">("Chantilly")
    const [targetColor, setTargetColor] = useState("#FF2F81")
    const [intensity, setIntensity] = useState(50)

    // Simulated CMYK/RGB to Drops logic for Confectionary
    const dyes = [
        { name: "Vermelho", color: "#FF0000", drops: Math.round((intensity * 0.8)) },
        { name: "Azul", color: "#0000FF", drops: Math.round((intensity * 0.2)) },
        { name: "Amarelo", color: "#FFFF00", drops: Math.round((intensity * 0.4)) },
        { name: "Preto", color: "#000000", drops: Math.round((intensity * 0.05)) },
    ]

    return (
        <div className="space-y-10 pb-10">
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 italic uppercase leading-none">
                    Calculadora <span className="text-primary tracking-tighter italic uppercase">de Cores</span>
                </h1>
                <p className="text-slate-500 font-medium italic uppercase text-xs tracking-widest">
                    Descubra a mistura perfeita de corantes para suas receitas.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* CONFIGURATION */}
                <div className="space-y-8">
                    <section className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Droplet className="size-4 text-primary" /> Tipo de Base
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {["Chantilly", "Pasta Americana", "Glace"].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setBaseType(type as any)}
                                    className={cn(
                                        "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all border",
                                        baseType === type
                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                            : "bg-white text-slate-400 border-slate-100 hover:border-primary/20 hover:text-primary"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Palette className="size-4 text-primary" /> Cor Desejada
                        </h3>
                        <div className="flex items-center gap-6 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <input
                                type="color"
                                value={targetColor}
                                onChange={(e) => setTargetColor(e.target.value)}
                                className="size-20 rounded-2xl border-none cursor-pointer p-0 overflow-hidden"
                            />
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Intensidade da Cor</span>
                                    <span>{intensity}%</span>
                                </div>
                                <Slider
                                    value={[intensity]}
                                    onValueChange={(v) => setIntensity(v[0])}
                                    max={100}
                                    step={1}
                                    className="py-4"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="p-6 rounded-[32px] bg-slate-900 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 size-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/20 transition-colors" />
                        <div className="flex items-start gap-4 relative z-10">
                            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <Info className="size-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-black italic uppercase tracking-tight leading-none mb-2">Dica Pro</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Para cores escuras como <span className="text-white font-bold underline decoration-primary">Vermelho Intenso</span> ou <span className="text-white font-bold underline decoration-primary">Preto</span>, deixe a base descansar por pelo menos 2 horas. A cor costuma "subir" e ficar mais forte com o tempo.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* RESULTS */}
                <div className="space-y-8">
                    <Card className="border-none shadow-2xl shadow-primary/5 rounded-[40px] overflow-hidden bg-white">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-slate-900 italic uppercase leading-none">
                                    Sua <span className="text-primary">Fórmula</span>
                                </h3>
                                <Badge className="bg-rose-50 text-primary border-transparent font-black px-4 py-1">
                                    100g de {baseType}
                                </Badge>
                            </div>

                            <div className="grid gap-4">
                                {dyes.map((dye, i) => (
                                    <motion.div
                                        key={dye.name}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="size-8 rounded-full border-2 border-white shadow-sm"
                                                style={{ backgroundColor: dye.color }}
                                            />
                                            <span className="text-sm font-black text-slate-600 uppercase tracking-tight group-hover:text-primary transition-colors">
                                                Corante {dye.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-black text-slate-900">{dye.drops}</span>
                                            <span className="text-[10px] font-black uppercase text-slate-400">gotas</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Resultado Visual</span>
                                    <Sparkles className="size-4 text-amber-400" />
                                </div>
                                <div
                                    className="h-24 w-full rounded-3xl shadow-inner relative overflow-hidden flex items-center justify-center"
                                    style={{ backgroundColor: targetColor }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />
                                    <span className="relative z-10 text-white font-black uppercase italic tracking-widest text-lg drop-shadow-md">
                                        {targetColor.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <Button variant="outline" className="h-12 rounded-2xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50">
                                    <RefreshCw className="size-4 mr-2" />
                                    Limpar
                                </Button>
                                <Button className="h-12 rounded-2xl bg-primary hover:bg-primary shadow-lg shadow-primary/20 text-white font-bold">
                                    <Save className="size-4 mr-2" />
                                    Salvar Mix
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Button variant="ghost" className="w-full h-14 rounded-2xl text-slate-400 font-black uppercase italic tracking-widest hover:text-primary hover:bg-rose-50 border border-dashed border-slate-200">
                        Exportar como PDF para Cozinha
                        <ChevronRight className="size-5 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
