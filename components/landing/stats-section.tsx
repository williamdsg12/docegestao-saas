"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { Users, TrendingUp, Clock } from "lucide-react"

const stats = [
    {
        icon: TrendingUp,
        label: "Aumento médio no lucro",
        value: 45,
        prefix: "+",
        suffix: "%",
        subtext: "de crescimento real"
    },
    {
        icon: Clock,
        label: "Horas economizadas",
        value: 3,
        suffix: "h",
        prefix: "",
        subtext: "por dia de trabalho"
    },
    {
        icon: Users,
        label: "Confeiteiras ativas",
        value: 2500,
        suffix: "+",
        prefix: "",
        subtext: "em todo o Brasil"
    },
]

export function StatsSection() {
    return (
        <section className="relative py-24 lg:py-32 bg-background overflow-hidden border-y border-border">
            {/* Ambient Background */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_10%)] opacity-5 blur-[100px]" />

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid gap-8 md:gap-12 md:grid-cols-3">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                className="relative flex flex-col items-center text-center group p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-shadow duration-500 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                <div className="mb-6 p-4 rounded-2xl bg-primary/10 text-primary">
                                    <Icon className="w-8 h-8" />
                                </div>
                                
                                <div className="mb-4">
                                    <span className="font-sans text-5xl font-black tracking-tight text-foreground md:text-6xl">
                                        {stat.prefix}
                                        <AnimatedNumber value={stat.value} />
                                        {stat.suffix}
                                    </span>
                                </div>

                                <div className="space-y-2 relative z-10">
                                    <h4 className="text-lg font-bold text-foreground">
                                        {stat.label}
                                    </h4>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {stat.subtext}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    )
}

function AnimatedNumber({ value }: { value: number }) {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-50px" })

    useEffect(() => {
        if (isInView) {
            let start = 0
            const end = value
            const duration = 2000
            const increment = end / (duration / 16)
            const timer = setInterval(() => {
                start += increment
                if (start >= end) {
                    setCount(end)
                    clearInterval(timer)
                } else {
                    setCount(Math.floor(start))
                }
            }, 16)
            return () => clearInterval(timer)
        }
    }, [isInView, value])

    return <span ref={ref} className="tabular-nums">{count.toLocaleString('pt-BR')}</span>
}
