"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "#funcionalidades", label: "Funcionalidades" },
    { href: "#como-funciona", label: "Como funciona" },
    { href: "#planos", label: "Planos" },
    { href: "#depoimentos", label: "Depoimentos" },
  ]

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? "border-b border-white/20 bg-white/70 backdrop-blur-xl py-4 shadow-[0_4px_30px_rgba(255,107,154,0.1)] dark:bg-slate-900/70"
        : "bg-transparent py-6"
        }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-xl font-bold text-white shadow-lg transition-all group-hover:scale-105 group-hover:shadow-primary/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 blur-sm translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="relative z-10">D</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-primary dark:text-white">
            DoceGestão
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-all hover:text-primary dark:text-slate-300"
            >
              <motion.span whileHover={{ y: -2 }} className="inline-block relative after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full">
                {link.label}
              </motion.span>
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
          >
            Entrar
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="h-11 rounded-full bg-gradient-to-r from-primary to-[#ff8cae] px-8 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:shadow-primary/50 border-0"
              asChild
            >
              <Link href="/cadastro">Começar teste grátis</Link>
            </Button>
          </motion.div>
        </div>

        {/* Mobile Toggle */}
        <button
          className="flex size-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Alternar menu"
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute left-0 right-0 top-full overflow-hidden border-b border-slate-100 bg-white/95 backdrop-blur-xl shadow-2xl md:hidden dark:bg-slate-900/95 dark:border-slate-800"
          >
            <div className="flex flex-col gap-4 p-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl p-3 text-base font-medium text-slate-700 transition-colors hover:bg-primary/5 hover:text-primary dark:text-slate-200"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                <Link
                  href="/login"
                  className="w-full rounded-xl p-3 text-center text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => setMobileOpen(false)}
                >
                  Entrar
                </Link>
                <Button
                  className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-[#ff8cae] text-base font-bold text-white shadow-lg shadow-primary/30 border-0"
                  asChild
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/cadastro">Começar teste grátis</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
