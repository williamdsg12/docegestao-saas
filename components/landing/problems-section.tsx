"use client"

import { Book, Calculator, Package, Wallet, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

const problems = [
  {
    icon: Book,
    title: "Falta de controle de pedidos",
    description: "Esquecer prazos, misturar encomendas e perder tempo procurando anotações em papéis ou conversas de WhatsApp.",
  },
  {
    icon: Calculator,
    title: "Preço calculado errado",
    description: "Trabalhar muito e não ver lucro porque você não sabe exatamente quanto custa cada grama do seu doce.",
  },
  {
    icon: Package,
    title: "Estoque desorganizado",
    description: "Perder vendas por falta de insumos ou jogar dinheiro fora com ingredientes vencidos no fundo do armário.",
  },
  {
    icon: Wallet,
    title: "Lucro invisível",
    description: "O faturamento entra, mas você não sabe para onde o dinheiro vai ou se realmente está sobrando no final do mês.",
  },
]

export function ProblemsSection() {
  return (
    <section id="problemas" className="relative py-24 lg:py-32 bg-muted/30">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 blur-[100px] rounded-full -z-10" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
              Identifique os sinais
            </h2>
            <h3 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Sua confeitaria não pode depender de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">anotações soltas.</span>
            </h3>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Muitas empreendedoras perdem o controle do próprio negócio por falta de ferramentas profissionais.
              O DoceGestão resolve os maiores vilões da sua lucratividade.
            </p>
          </motion.div>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative flex flex-col rounded-3xl bg-card p-8 shadow-sm transition-all hover:-translate-y-2 hover:shadow-xl border border-border/50 overflow-hidden"
            >
              {/* Hover Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                <problem.icon className="h-6 w-6" />
              </div>
              <h4 className="mb-4 text-xl font-bold text-foreground leading-tight relative flex items-center">
                {problem.title}
              </h4>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed relative">
                {problem.description}
              </p>
              
              {/* Bottom border decoration */}
              <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-primary to-secondary scale-x-0 transition-transform duration-500 origin-left group-hover:scale-x-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
