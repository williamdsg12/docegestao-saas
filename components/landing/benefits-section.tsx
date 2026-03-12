"use client"

import { CheckCircle2, Zap, BarChart3, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const benefits = [
  {
    title: "Gestão de Pedidos",
    description: "Organize suas encomendas em um fluxo claro, do orçamento à entrega final.",
    items: ["Status personalizados", "Agenda de entregas", "Histórico completo"],
    icon: Zap,
    color: "text-rose-500",
    bg: "bg-rose-50"
  },
  {
    title: "Ficha Técnica & Custo",
    description: "Saiba exatamente quanto custa cada doce e garanta sua margem de lucro real.",
    items: ["Cálculo automático", "Sugestão de preço", "Gestão de insumos"],
    icon: BarChart3,
    color: "text-rose-500",
    bg: "bg-rose-50"
  },
  {
    title: "Financeiro & Lucro",
    description: "Controle entradas, saídas e veja o lucro da sua confeitaria crescer todo mês.",
    items: ["Fluxo de caixa", "Relatórios de lucro", "Controle de gastos"],
    icon: TrendingUp,
    color: "text-rose-500",
    bg: "bg-rose-50"
  },
]

import { Variants } from "framer-motion"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

export function BenefitsSection() {
  return (
    <section id="beneficios" className="relative overflow-hidden py-24 lg:py-32 bg-secondary/30">
      {/* Decorative background decoration */}
      <div className="absolute top-0 right-0 size-[500px] bg-primary/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              Tudo o que você precisa para <span className="text-gradient">crescer</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              O Doce Gestão reúne as ferramentas essenciais para transformar sua confeitaria caseira em um negócio profissional.
            </p>
          </motion.div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-20 grid gap-8 lg:grid-cols-3"
        >
          {benefits.map((benefit) => (
            <motion.div key={benefit.title} variants={itemVariants}>
              <div className="glass-card group relative h-full overflow-hidden p-8 transition-all hover:border-primary/20">
                <div className={cn("mb-6 flex size-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110", benefit.bg)}>
                  <benefit.icon className={cn("size-6", benefit.color)} />
                </div>
                <h3 className="font-serif text-2xl font-bold text-foreground mb-4">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-8">{benefit.description}</p>
                <div className="space-y-4">
                  {benefit.items.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                      <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                        <CheckCircle2 className="size-3" />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
                {/* Subtle gradient hover effect */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
