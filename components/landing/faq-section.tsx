"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { motion } from "framer-motion"

const faqs = [
  {
    question: "Preciso ter conhecimento técnico para usar?",
    answer: "Não! O DoceGestão foi feito para ser simples e intuitivo. Se você sabe usar WhatsApp, consegue usar nosso sistema. É direto ao ponto e sem complicações.",
  },
  {
    question: "Como funciona o teste grátis de 7 dias?",
    answer: "Você tem acesso completo a todas as funcionalidades por 7 dias, sem precisar cadastrar cartão de crédito. Após o período, você decide se quer assinar.",
  },
  {
    question: "O sistema funciona no celular?",
    answer: "Sim! O DoceGestão é 100% responsivo e funciona perfeitamente em celulares, tablets e computadores. Você gerencia sua confeitaria de onde estiver.",
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Absolutamente! Usamos criptografia de nível bancário, backups diários e servidores seguros. Seus dados são exclusivamente seus e estão protegidos.",
  },
  {
    question: "Consigo calcular o lucro de cada bolo?",
    answer: "Sim! Com a ficha técnica automática, você insere os ingredientes e o sistema mostra exatamente o seu custo e quanto você lucra em cada venda.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="relative py-24 lg:py-40 bg-slate-50/50 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-sans text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-6">
              Dúvidas Frequentes
            </h2>
            <h3 className="font-sans text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl uppercase italic leading-none">
              Tire suas <span className="text-primary not-italic">dúvidas</span>
            </h3>
            <p className="mt-8 text-lg font-medium text-slate-500 leading-relaxed">
              Tudo o que você precisa saber para começar a profissionalizar sua confeitaria hoje mesmo.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-16 max-w-3xl"
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-none rounded-2xl bg-white px-6 shadow-sm border border-slate-100">
                <AccordionTrigger className="text-left text-lg font-black text-slate-900 py-6 uppercase italic tracking-tight hover:text-primary transition-colors hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 font-medium leading-relaxed text-sm pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
