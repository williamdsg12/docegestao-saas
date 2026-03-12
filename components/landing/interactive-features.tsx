"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingBag, Users, DollarSign, Calendar } from "lucide-react"

const features = [
  {
    id: "dashboard",
    title: "Visão Geral",
    description: "Inteligência de negócio em tempo real.",
    icon: ShoppingBag,
    color: "from-indigo-400 to-cyan-400",
    image: "/assets/images/dashboard_overview.png"
  },
  {
    id: "pedidos",
    title: "Pedidos",
    description: "Controle de encomendas de ponta a ponta.",
    icon: ShoppingBag,
    color: "from-pink-400 to-rose-400",
    image: "/assets/images/feature_pedidos.png"
  },
  {
    id: "clientes",
    title: "Clientes",
    description: "Histórico completo e fidelização.",
    icon: Users,
    color: "from-blue-400 to-indigo-400",
    image: "/assets/images/feature_clientes.png"
  },
  {
    id: "financeiro",
    title: "Financeiro",
    description: "Fluxo de caixa transparente e lucro real.",
    icon: DollarSign,
    color: "from-emerald-400 to-teal-400",
    image: "/assets/images/feature_financeiro.png"
  },
  {
    id: "agenda",
    title: "Agenda",
    description: "Calendário de entregas unificado.",
    icon: Calendar,
    color: "from-amber-400 to-orange-400",
    image: "/assets/images/feature_agenda.png"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 w-full lg:w-1/3 gap-4">
            {features.map((feature) => {
              const isActive = activeFeature.id === feature.id
              const Icon = feature.icon

              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature)}
                  className={`relative flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-300 ${
                    isActive
                      ? "bg-white shadow-xl border border-primary/20 scale-[1.03] z-10"
                      : "hover:bg-white/60 hover:scale-[1.01]"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-br ${feature.color} text-white shadow-lg rotate-3`
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-base font-bold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {feature.title}
                    </h4>
                    <p className={`text-xs ${isActive ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                      {feature.description}
                    </p>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute right-4 h-2 w-2 rounded-full bg-primary"
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Interactive Preview */}
          <div className="w-full lg:w-2/3 perspective-1000">
            <div className="relative aspect-video w-full rounded-3xl border-4 border-white bg-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-6 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-1.5 z-20">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <div className="ml-4 h-2 w-32 rounded bg-slate-200" />
              </div>
              <div className="h-full w-full pt-6 relative overflow-hidden bg-slate-50">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature.id}
                    initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <img
                      src={activeFeature.image}
                      alt={`Interface do painel de ${activeFeature.title}`}
                      className="h-full w-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Feature caption */}
            <motion.div
              layout
              className="mt-6 flex items-center justify-between px-4"
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${activeFeature.color} flex items-center justify-center text-white shadow-sm`}>
                  <activeFeature.icon className="h-4 w-4" />
                </div>
                <span className="font-bold text-slate-900">{activeFeature.title}</span>
              </div>
              <div className="h-px flex-1 mx-6 bg-slate-200" />
              <p className="text-sm font-medium text-slate-500 italic">Visualização Profissional</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
