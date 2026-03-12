"use client"

import { NotificationCenter } from "@/components/premium/NotificationCenter"
import { motion } from "framer-motion"
import { Bell, Info } from "lucide-react"

export default function NotificationsDemo() {
    return (
        <div className="p-10 space-y-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">UI Elements: <span className="text-primary">Notifications</span></h2>
                    <p className="text-slate-500 font-medium">Centro de notificações e alertas em tempo real</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                        <Info className="size-5 text-amber-500" />
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Teste o Dropdown no Header ou Aqui</span>
                    </div>
                    <NotificationCenter />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Visual Guide */}
                <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8">
                    <h3 className="text-xl font-black text-slate-900 italic uppercase">Guia Visual</h3>
                    
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="size-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                <Bell className="size-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 italic uppercase text-sm">Ícone de Notificação</h4>
                                <p className="text-xs text-slate-500 font-medium">Estado padrão no header</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl shadow-slate-900/20">
                            <div className="relative size-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                <Bell className="size-6" />
                                <span className="absolute top-2.5 right-2.5 size-2.5 bg-rose-500 border-2 border-slate-900 rounded-full" />
                            </div>
                            <div>
                                <h4 className="font-black text-white italic uppercase text-sm">Estado Ativo</h4>
                                <p className="text-xs text-slate-400 font-medium">Indicador de novas notificações</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0F172A] rounded-[40px] p-10 border border-slate-800 shadow-2xl flex flex-col items-center justify-center text-center space-y-6">
                    <div className="size-20 rounded-[32px] bg-slate-800 flex items-center justify-center text-primary shadow-inner">
                        <Bell className="size-10" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-white italic uppercase mb-2">Real-time Ready</h4>
                        <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">
                            O componente de notificações está preparado para receber dados via Supabase Realtime.
                        </p>
                    </div>
                    <button className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase italic tracking-widest text-xs hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-primary/20">
                        Simular Notificação
                    </button>
                </div>
            </div>
        </div>
    )
}
