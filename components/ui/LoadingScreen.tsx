"use client"

import { motion } from "framer-motion"

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="relative flex flex-col items-center">
        {/* Logo or Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="mb-8 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 p-0.5 shadow-2xl shadow-primary/20"
        >
          <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-background">
            <span className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">DG</span>
          </div>
        </motion.div>

        {/* Spinner */}
        <div className="relative h-12 w-12">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary"
          />
        </div>

        {/* Text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-sm font-medium text-muted-foreground animate-pulse"
        >
          Verificando credenciais...
        </motion.p>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-1/4 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-[100px]" />
      <div className="absolute bottom-1/4 -right-20 h-64 w-64 rounded-full bg-primary/5 blur-[100px]" />
    </div>
  )
}
