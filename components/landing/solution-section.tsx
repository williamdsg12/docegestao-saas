"use client"

import { motion } from "framer-motion"

const steps = [
  {
    number: "01",
    title: "Cadastre seus produtos e fichas",
    description: "Insira seus ingredientes e o sistema calcula automaticamente o custo real de cada doce, sem planilhas complexas.",
  },
  {
    number: "02",
    title: "Gerencie pedidos com clareza",
    description: "Receba encomendas, controle prazos e acompanhe o status de produção em um painel inteligente e visual.",
  },
  {
    number: "03",
    title: "Visualize seu lucro e cresça",
    description: "Acompanhe seu faturamento e lucro financeiro em tempo real, tomando decisões baseadas em dados concretos.",
  },
]

export function SolutionSection() {
  return (
    <section id="como-funciona" className="relative py-24 lg:py-32 bg-background overflow-hidden border-t border-border">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 -left-32 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10 -translate-y-1/2" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
              O fluxo do sucesso
            </h2>
            <h3 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Como o DoceGestão <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">organiza sua rotina.</span>
            </h3>
          </motion.div>
        </div>

        <div className="mt-24 grid gap-12 lg:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              className="group relative flex flex-col items-start p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 font-sans text-9xl font-black text-muted/30 transition-colors group-hover:text-primary/10 -z-10 select-none">
                {step.number}
              </div>

              <div className="mb-8 flex items-baseline gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/30 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-secondary transition-all">
                  {step.number}
                </div>
              </div>

              <h4 className="mb-4 text-2xl font-bold text-foreground tracking-tight leading-tight">
                {step.title}
              </h4>

              <p className="text-base font-medium text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
