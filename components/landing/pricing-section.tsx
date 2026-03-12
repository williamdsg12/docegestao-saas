"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, Star, Zap } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Iniciante",
    price: "67",
    description: "Para quem está começando e quer organizar o básico.",
    features: [
      "Até 50 pedidos/mês",
      "Ficha técnica básica",
      "Controle de estoque",
      "Financeiro simples",
      "Suporte via e-mail",
    ],
    cta: "Começar agora",
    popular: false,
    icon: Star,
  },
  {
    name: "Profissional",
    price: "97",
    description: "O mais escolhido pelas confeiteiras de sucesso.",
    features: [
      "Pedidos ilimitados",
      "Ficha técnica avançada",
      "Controle de estoque e validade",
      "Financeiro completo (CMV e Lucro)",
      "Relatórios inteligentes",
      "Suporte prioritário via WhatsApp",
    ],
    cta: "Escolher Profissional",
    popular: true,
    icon: Zap,
    badge: "Recomendado",
  },
  {
    name: "Premium",
    price: "147",
    description: "Para ateliês que buscam escala e automação total.",
    features: [
      "Tudo do Plano Profissional",
      "Múltiplos usuários",
      "Gestão de produção em equipe",
      "Consultoria de precificação",
      "Treinamento personalizado",
      "Mentoria de gestão",
    ],
    cta: "Seja Premium",
    popular: false,
    icon: Star,
  },
]

export function PricingSection() {
  return (
    <section id="planos" className="relative py-24 lg:py-32 bg-slate-50 overflow-hidden border-t border-border">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full -z-10" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
              Planos
            </h2>
            <h3 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              O plano perfeito para o <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">seu crescimento.</span>
            </h3>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Todos os planos incluem 7 dias de teste grátis. Escolha o que melhor se adapta ao momento do seu negócio.
            </p>
          </motion.div>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3 items-center">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative flex flex-col h-full"
            >
              <div
                className={cn(
                  "flex flex-col h-full rounded-3xl bg-card p-10 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 border relative overflow-hidden",
                  plan.popular ? "border-primary shadow-lg shadow-primary/10 lg:scale-[1.02] z-10" : "border-border/50 shadow-sm"
                )}
              >
                {/* Popular Glow */}
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
                )}

                {plan.badge && (
                  <div className="absolute top-0 inset-x-0 mx-auto w-fit -translate-y-1/2 rounded-full border border-primary bg-primary/10 px-4 py-1 text-xs font-bold text-primary backdrop-blur-md">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-8">
                  <h4 className="text-2xl font-bold text-foreground tracking-tight">{plan.name}</h4>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-2xl font-bold text-foreground">R$</span>
                  <span className="text-6xl font-black text-foreground tracking-tight">{plan.price}</span>
                  <span className="text-sm font-bold text-muted-foreground">/mês</span>
                </div>

                <ul className="flex flex-1 flex-col gap-4 mb-10">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm font-medium text-foreground">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className={cn(
                      "w-full h-14 rounded-xl font-bold text-sm transition-all",
                      plan.popular
                        ? "bg-gradient-to-r from-primary to-[#ff8cae] text-white shadow-lg shadow-primary/30 border-0"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                    asChild
                  >
                    <Link href="/cadastro">{plan.cta}</Link>
                  </Button>
                </motion.div>

                <p className="mt-6 text-center text-xs text-muted-foreground font-medium">
                  7 dias grátis • Cancele quando quiser
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
