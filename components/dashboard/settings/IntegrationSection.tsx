"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Share2, Zap, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface IntegrationSectionProps {
    data: any
    onChange: (updates: any) => void
}

export function IntegrationSection({ data, onChange }: IntegrationSectionProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm"
        >
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="size-10 rounded-lg bg-slate-50 text-slate-900 flex items-center justify-center border border-slate-200">
                    <Share2 size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Integrações Avançadas</h3>
                    <p className="text-xs text-slate-500">Conecte sua loja com ferramentas externas</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* WhatsApp */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="size-4 text-emerald-500" />
                        <Label className="text-xs font-semibold text-slate-700">WhatsApp de Notificações</Label>
                    </div>
                    <Input 
                        value={data.whatsapp_number || ""}
                        onChange={e => onChange({ whatsapp_number: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="h-10 px-4 rounded-lg border-slate-200 focus:border-primary transition-all font-medium text-sm text-slate-700 bg-slate-50/50"
                    />
                    <p className="text-[11px] text-slate-400 px-1 italic leading-tight">
                        Usado para enviar alertas de novos pedidos via WhatsApp.
                    </p>
                </div>

                {/* Webhook */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Zap className="size-4 text-blue-500" />
                        <Label className="text-xs font-semibold text-slate-700">Webhook URL (n8n / Make)</Label>
                    </div>
                    <Input 
                        value={data.webhook_url || ""}
                        onChange={e => onChange({ webhook_url: e.target.value })}
                        placeholder="https://sua-url-de-webhook.com"
                        className="h-10 px-4 rounded-lg border-slate-200 focus:border-primary transition-all font-mono text-xs text-slate-700 bg-slate-50/50"
                    />
                    <p className="text-[11px] text-slate-400 px-1 italic leading-tight">
                        Envia um POST JSON para esta URL sempre que um pedido for criado.
                    </p>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row items-center gap-4 relative overflow-hidden">
                 <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center text-blue-400 border border-white/10 relative z-10 shrink-0">
                    <Zap size={20} className="animate-pulse" />
                 </div>
                 <div className="flex-1 space-y-0.5 relative z-10 text-center md:text-left">
                    <h4 className="font-bold text-sm tracking-tight text-white">Automação Inteligente</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                        Integre com Planilhas, CRMs ou softwares de logística automaticamente via JSON POST.
                    </p>
                 </div>
            </div>
        </motion.div>
    )
}
