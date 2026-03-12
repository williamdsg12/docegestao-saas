"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingBag, Users, DollarSign, Calendar } from "lucide-react"

const features = [
  {
    id: "pedidos",
    title: "Pedidos",
    description: "Controle de encomendas de ponta a ponta.",
    icon: ShoppingBag,
    color: "from-pink-400 to-rose-400",
  },
  {
    id: "clientes",
    title: "Clientes",
    description: "Histórico completo e fidelização.",
    icon: Users,
    color: "from-blue-400 to-indigo-400",
  },
  {
    id: "financeiro",
    title: "Financeiro",
    description: "Fluxo de caixa transparente e lucro real.",
    icon: DollarSign,
    color: "from-emerald-400 to-teal-400",
  },
  {
    id: "agenda",
    title: "Agenda",
    description: "Calendário de entregas unificado.",
    icon: Calendar,
    color: "from-amber-400 to-orange-400",
  },
]

export function InteractiveFeatures() {
  const [activeFeature, setActiveFeature] = useState(features[0])

  return (
    <section id="recursos" className="relative py-24 lg:py-32 bg-slate-50 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
              Por dentro do sistema
            </h2>
            <h3 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
              Tudo que você precisa, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">em um só lugar.</span>
            </h3>
          </motion.div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Navigation */}
          <div className="flex w-full lg:w-1/3 flex-col gap-4">
            {features.map((feature) => {
              const isActive = activeFeature.id === feature.id
              const Icon = feature.icon

              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature)}
                  className={`relative flex items-center gap-4 p-6 rounded-2xl text-left transition-all duration-300 ${
                    isActive
                      ? "bg-white shadow-lg border border-primary/20 scale-105"
                      : "hover:bg-white/60 hover:scale-[1.02]"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                      isActive
                        ? `bg-gradient-to-br ${feature.color} text-white shadow-md`
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className={`text-lg font-bold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {feature.title}
                    </h4>
                    <p className={`text-sm ${isActive ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                      {feature.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Interactive Preview */}
          <div className="w-full lg:w-2/3 perspective-1000">
            <div className="relative aspect-video w-full rounded-2xl border border-border/50 bg-white shadow-2xl overflow-hidden p-2">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
              <div className="h-full w-full rounded-xl bg-card border border-border flex items-center justify-center relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature.id}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.05, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
                  >
                    <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${activeFeature.color} text-white shadow-xl isolate`}>
                      <activeFeature.icon className="h-10 w-10 animate-pulse" />
                    </div>
                    <h5 className="text-2xl font-bold text-foreground mb-2">Painel de {activeFeature.title}</h5>
                    <p className="text-muted-foreground">
                      Insira uma imagem demonstrativa do módulo de {activeFeature.title.toLowerCase()} aqui.
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
