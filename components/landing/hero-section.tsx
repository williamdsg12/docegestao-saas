"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Star, Shield, CreditCard, TrendingUp, DollarSign, ShoppingCart, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { AnimatedDashboardMockup } from "./animated-dashboard-mockup"

function FloatingCard({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className={cn("absolute z-20", className)}
    >
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: delay * 0.5 }}
        className="rounded-[24px] border border-slate-100 bg-white/95 p-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] backdrop-blur-md"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-40 pb-20 lg:pt-52 lg:pb-32 bg-[var(--bg-app)]">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--accent-light)] rounded-full blur-[120px] mix-blend-multiply opacity-40 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[var(--secondary)]/10 rounded-full blur-[150px] mix-blend-multiply opacity-30" />
      </div>

      <div className="container mx-auto px-6 lg:px-8 max-w-7xl flex flex-col items-center justify-center text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--primary)]/20 bg-[var(--accent-light)] text-[var(--primary)] text-sm font-black uppercase tracking-widest italic backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-[var(--secondary)] animate-ping" />
            Gestão Inteligente & Lucrativa
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl text-5xl md:text-7xl font-black tracking-tight text-[var(--text-primary)] uppercase italic leading-[1.1]"
        >
          O sistema inteligente para confeitaria <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--secondary)]">
            crescer de verdade.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mt-8 max-w-2xl text-lg md:text-xl font-bold text-[var(--text-muted)]"
        >
          Organize pedidos, controle vendas, estoque e clientes em um só lugar.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center w-full"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
            <Button
              className="h-14 w-full sm:w-auto rounded-2xl px-10 text-base font-black uppercase tracking-widest text-white shadow-xl shadow-[var(--primary)]/20 bg-[var(--primary)] hover:bg-[var(--primary-hover)] border-0 transition-all"
              asChild
            >
              <Link href="/cadastro">
                Teste grátis 7 dias
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="h-14 w-full sm:w-auto rounded-2xl px-10 text-base font-black uppercase tracking-widest border-2 border-[var(--border)] bg-white hover:bg-[var(--accent-light)] text-[var(--text-primary)] transition-all"
              asChild
            >
              <Link href="#demonstracao">
                <Play className="mr-2 h-5 w-5 fill-current opacity-70" />
                Ver demonstração
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Trust */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-10 flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]"
        >
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--secondary)]" /> Sem cartão de crédito</div>
          <div className="hidden sm:flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--secondary)]" /> 7 dias grátis</div>
        </motion.div>

        {/* Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 relative w-full mx-auto z-10"
        >
          <AnimatedDashboardMockup />
        </motion.div>
      </div>
    </section>
  )
}
