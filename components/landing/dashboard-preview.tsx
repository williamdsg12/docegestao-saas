"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, DollarSign, ShoppingBag, Star, CheckCircle2, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { FinanceiroMock } from "./mock-screens/finance-mock"
import { PedidosMock } from "./mock-screens/pedidos-mock"
import { FichaMock } from "./mock-screens/ficha-mock"

const features = [
  {
    title: "Gestão de pedidos profissional",
    description: "Abandone o papel e as conversas perdidas no WhatsApp. Organize toda sua produção em um único lugar, com controle de status, prazos de entrega e lembretes automáticos.",
    badge: "Eficiência total",
    mock: <PedidosMock />,
    reversed: false,
  },
  {
    title: "Ficha técnica e custos automáticos",
    description: "Saiba exatamente quanto custa cada grama do seu doce. O sistema calcula automaticamente o custo de insumos, embalagens e mão de obra, sugerindo o preço ideal de venda.",
    badge: "Lucratividade garantida",
    mock: <FichaMock />,
    reversed: true,
  },
  {
    title: "Financeiro inteligente e simplificado",
    description: "Tenha clareza total sobre o que entra e o que sai. Relatórios de lucro real, controle de entradas e visão geral da saúde financeira do seu negócio sem complicação.",
    badge: "Saúde financeira",
    mock: <FinanceiroMock />,
    reversed: false,
  },
]

export function DashboardPreview() {
  return (
    <section id="recursos" className="relative py-24 lg:py-40 bg-slate-50/50 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="space-y-32">
          {features.map((feature, i) => (
            <div key={feature.title} className={cn("grid gap-16 lg:grid-cols-2 lg:items-center", feature.reversed && "lg:flex-row-reverse")}>
              {/* Text Side */}
              <motion.div
                initial={{ opacity: 0, x: feature.reversed ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={cn("max-w-xl", feature.reversed && "lg:order-2")}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                  <Star className="size-3 fill-primary" />
                  <span>{feature.badge}</span>
                </div>
                <h3 className="font-sans text-4xl font-black tracking-tight text-slate-900 md:text-5xl uppercase italic leading-none mb-8">
                  {feature.title}
                </h3>
                <p className="text-xl font-medium text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-10 flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-900 group cursor-pointer">
                    <span>Ver funcionalidade</span>
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>

              {/* Mockup Side */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: feature.reversed ? -40 : 40 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={cn("relative", feature.reversed && "lg:order-1")}
              >
                {/* Robust System Mockup Representation */}
                <div className="relative overflow-hidden rounded-[32px] border border-slate-200/60 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
                  <div className="h-10 border-b border-slate-100 bg-slate-50/50 px-6 flex items-center">
                    <div className="flex gap-1.5">
                      <div className="size-2.5 rounded-full bg-slate-200" />
                      <div className="size-2.5 rounded-full bg-slate-200" />
                      <div className="size-2.5 rounded-full bg-slate-200" />
                    </div>
                  </div>
                  <div className="aspect-[16/10] bg-slate-50/30 flex items-center justify-center relative overflow-hidden">
                    {feature.mock}
                    {/* Subtle Overlay to enhance crispness */}
                    <div className="absolute inset-0 ring-1 ring-inset ring-slate-900/5 rounded-b-[32px]" />
                  </div>
                </div>

                {/* Subtle Glows */}
                <div className="absolute -inset-4 -z-10 bg-primary/5 blur-3xl rounded-full" />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
