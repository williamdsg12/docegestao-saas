"use client"

import { PremiumAlert } from "@/components/premium/Alert"
import { motion } from "framer-motion"

export default function AlertsDemo() {
    return (
        <div className="p-10 space-y-12">
            <div>
                <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">UI Elements: <span className="text-primary">Alerts</span></h2>
                <p className="text-slate-500 font-medium">Componentes de alerta premium inspirados no TailAdmin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Success */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Sucesso</h3>
                    <PremiumAlert 
                        variant="success"
                        title="Mensagem de Sucesso"
                        description="Nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat."
                        onClose={() => {}}
                    />
                </motion.div>

                {/* Warning */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Aviso</h3>
                    <PremiumAlert 
                        variant="warning"
                        title="Mensagem de Aviso"
                        description="Nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat."
                        onClose={() => {}}
                    />
                </motion.div>

                {/* Error */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Erro</h3>
                    <PremiumAlert 
                        variant="error"
                        title="Mensagem de Erro"
                        description="Nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat."
                        onClose={() => {}}
                    />
                </motion.div>

                {/* Info */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Informação</h3>
                    <PremiumAlert 
                        variant="info"
                        title="Mensagem de Informação"
                        description="Nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat."
                        onClose={() => {}}
                    />
                </motion.div>
            </div>

            {/* Simple versions */}
            <div className="space-y-6 pt-10 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Versões Compactas</h3>
                <div className="space-y-4">
                    <PremiumAlert variant="success" title="Configurações salvas com sucesso!" />
                    <PremiumAlert variant="info" title="Um novo usuário se registrou hoje." />
                </div>
            </div>
        </div>
    )
}
