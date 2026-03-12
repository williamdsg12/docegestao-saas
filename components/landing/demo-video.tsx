"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, X } from "lucide-react"

export function DemoVideo() {
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  return (
    <section id="demonstracao" className="relative py-24 lg:py-32 bg-background overflow-hidden border-y border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
              Veja em Ação
            </h2>
            <h3 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
              Descubra como o DoceGestão <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">facilita seu dia a dia.</span>
            </h3>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl group cursor-pointer border border-border/50"
          onClick={() => setIsVideoOpen(true)}
        >
          {/* Thumbnail Placeholder */}
          <div className="aspect-video bg-muted/30 w-full relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 group-hover:scale-105 transition-transform duration-700" />
            
            {/* Play Button */}
            <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[0_0_40px_rgba(255,107,154,0.4)] transition-transform group-hover:scale-110">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <Play className="h-10 w-10 text-primary ml-2" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setIsVideoOpen(false)}
          >
            <div className="absolute top-6 right-6 z-[110]">
              <button
                onClick={() => setIsVideoOpen(false)}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                title="fechar"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-6xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xl font-bold p-8 text-center flex-col gap-4">
                <Play className="h-16 w-16 opacity-30" />
                <p>Aqui você pode inserir o embed de um vídeo do YouTube ou Vimeo.<br/>Ou um elemento &lt;video&gt; local.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
