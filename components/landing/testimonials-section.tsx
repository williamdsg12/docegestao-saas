"use client"

import { Star, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const testimonials = [
  {
    name: "Ana Paula Rodrigues",
    handle: "@paula.confeitaria",
    content: "Antes eu perdia pedidos no WhatsApp toda semana. Com o DoceGestão, tripliquei minha produção e agora sei exatamente quanto estou lucrando. É liberdade!",
    imageColor: "bg-rose-100 text-rose-600",
  },
  {
    name: "Maria Fernanda",
    handle: "@mf.docesgourmet",
    content: "A ficha técnica é mágica! Descobri que perdia dinheiro em cada cento de brigadeiro. Ajustei tudo e agora meu negócio é de verdade profissional.",
    imageColor: "bg-blue-100 text-blue-600",
  },
  {
    name: "Juliana Mendes",
    handle: "@ju.cakedesigner",
    content: "O controle de sinal me salvou. Nunca mais esqueci de cobrar e as clientes amam o profissionalismo do sistema. Passa muito mais confiança.",
    imageColor: "bg-amber-100 text-amber-600",
  },
]

export function TestimonialsSection() {
  return (
    <section id="depoimentos" className="py-24 lg:py-40 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-sans text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-6">
              Prova Social
            </h2>
            <h3 className="font-sans text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl uppercase italic leading-none">
              Quem usa, <span className="text-primary not-italic">recomenda</span>
            </h3>
            <p className="mt-8 text-lg font-medium text-slate-500 leading-relaxed">
              Mais de 2.500 confeiteiras já abandonaram o caderno e planilhas confusas em todo o Brasil.
            </p>
          </motion.div>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.handle}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="flex flex-col rounded-3xl border border-slate-100 p-10 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.05)] hover:-translate-y-1"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-lg font-medium leading-relaxed text-slate-600 italic mb-8 flex-grow">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-4 pt-8 border-t border-slate-50">
                <div className={cn("size-12 rounded-full flex items-center justify-center font-black text-lg", testimonial.imageColor)}>
                  {testimonial.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-black text-slate-900 uppercase italic text-sm tracking-tight">{testimonial.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 tracking-widest">{testimonial.handle}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
