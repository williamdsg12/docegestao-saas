"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Shield } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32 bg-slate-900 border-t border-white/10">
      {/* Sophisticated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1f2937] via-[#0f172a] to-primary/20 opacity-80" />
      
      {/* Animated Light Rays */}
      <div className="absolute top-0 left-1/4 w-[600px] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent blur-sm" />

      {/* Decorative large glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] bg-primary/20 blur-[150px] rounded-full flex-none -z-10 animate-pulse" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-6 py-2 text-xs font-bold uppercase tracking-widest text-white/90 backdrop-blur-md"
          >
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span>Acesso liberado agora</span>
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-8">
            Comece agora a organizar sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">confeitaria.</span>
          </h2>

          <p className="mx-auto max-w-2xl text-xl text-slate-300 leading-relaxed mb-12">
            Teste o DoceGestão gratuitamente. Descubra como é ter controle total das suas encomendas, financeiro e clientes.
          </p>

          <div className="flex flex-col items-center justify-center gap-8">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="group h-16 w-full sm:w-auto px-10 rounded-full bg-gradient-to-r from-primary to-[#ff8cae] text-white hover:opacity-90 text-base font-bold shadow-[0_20px_40px_rgba(255,107,154,0.3)] transition-all border-0"
                asChild
              >
                <Link href="/cadastro">
                  Começar teste grátis
                  <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span>Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                <span>7 dias grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
