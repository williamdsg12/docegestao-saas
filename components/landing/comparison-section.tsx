"use client"

import { CheckCircle2, X } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const rows = [
  { feature: "Controle de pedidos total", without: false, with: true },
  { feature: "Ficha técnica com custo real", without: false, with: true },
  { feature: "Precificação automática", without: false, with: true },
  { feature: "Alerta de estoque e validade", without: false, with: true },
  { feature: "CMV e Lucro em tempo real", without: false, with: true },
  { feature: "Calendário de produção", without: false, with: true },
  { feature: "Simulador de metas", without: false, with: true },
]

export function ComparisonSection() {
  return (
    <section className="relative py-24 lg:py-40 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-sans text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-6">
              Comparativo
            </h2>
            <h3 className="font-sans text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl uppercase italic leading-none">
              Caderninho vs <span className="text-primary not-italic">DoceGestão</span>
            </h3>
            <p className="mt-8 text-lg font-medium text-slate-500 leading-relaxed">
              A diferença entre ter um passatempo e ter um negócio lucrativo e profissional.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto mt-20 max-w-4xl overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)]"
        >
          <div className="grid grid-cols-3 gap-0 bg-slate-50 px-8 py-8 border-b border-slate-100">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Funcionalidade</div>
            <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Caderninho</div>
            <div className="text-center text-[10px] font-black uppercase tracking-widest text-primary">DoceGestão</div>
          </div>

          <div className="divide-y divide-slate-50">
            {rows.map((row, i) => (
              <div
                key={row.feature}
                className={cn(
                  "grid grid-cols-3 gap-0 px-8 py-6 transition-colors",
                  i % 2 === 0 ? "bg-transparent" : "bg-slate-50/30"
                )}
              >
                <div className="flex items-center text-sm font-black text-slate-900 uppercase italic tracking-tight">{row.feature}</div>
                <div className="flex justify-center items-center">
                  <X className="size-5 text-slate-200" />
                </div>
                <div className="flex justify-center items-center">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="size-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 p-10 text-center">
            <p className="text-lg font-black text-white uppercase italic tracking-tight">
              "A organização é o primeiro passo para o lucro real."
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
