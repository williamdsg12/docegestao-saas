"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { 
    Package, 
    AlertTriangle, 
    XCircle, 
    TrendingUp, 
    ArrowRight,
    Search,
    ShoppingBag,
    Flame,
    History
} from "lucide-react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function SmartDashboard() {
    const { profile } = useBusiness()
    const router = useRouter()
    const [stats, setStats] = useState({
        total: 0,
        low: 0,
        out: 0,
        recentMovements: [] as any[]
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile?.tenant_id || profile?.company_id) {
            loadStats()
        }
    }, [profile])

    async function loadStats() {
        const tenantId = profile?.tenant_id || profile?.company_id
        setLoading(true)
        try {
            // 1. Ingredients Stats
            const { data: ingredients } = await supabase
                .from('ingredients')
                .select('current_quantity, min_stock')
                .eq('tenant_id', tenantId)
            
            if (ingredients) {
                const low = ingredients.filter(i => i.current_quantity > 0 && i.current_quantity <= i.min_stock).length
                const out = ingredients.filter(i => i.current_quantity <= 0).length
                setStats(prev => ({ ...prev, total: ingredients.length, low, out }))
            }

            // 2. Recent Movements (Using inventory_movements if exists, or fallback to mock for UI)
            const { data: movements } = await supabase
                .from('inventory_movements')
                .select('*, ingredients(name)')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })
                .limit(5)
            
            if (movements) setStats(prev => ({ ...prev, recentMovements: movements }))

        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    }

    return (
        <div className="space-y-8">
            {/* Greeting */}
            <header>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                    Painel <span className="text-pink-500">Inteligente</span>
                </h1>
                <p className="text-slate-400 font-bold mt-1 text-xs uppercase tracking-widest italic">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </header>

            {/* Quick Stats Grid */}
            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-4"
            >
                <motion.div variants={item}>
                    <Card className="p-5 rounded-[32px] bg-white border-slate-100 shadow-sm flex flex-col gap-4">
                        <div className="size-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                            <Package size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Insumos</p>
                            <h3 className="text-2xl font-black text-slate-900 leading-none tracking-tighter italic">{stats.total}</h3>
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="p-5 rounded-[32px] bg-white border-slate-100 shadow-sm flex flex-col gap-4">
                        <div className="size-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Estoque Baixo</p>
                            <h3 className="text-2xl font-black text-amber-500 leading-none tracking-tighter italic">{stats.low}</h3>
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="p-5 rounded-[32px] bg-white border-slate-100 shadow-sm flex flex-col gap-4 text-rose-500">
                        <div className="size-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                            <XCircle size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Itens Zerados</p>
                            <h3 className="text-2xl font-black leading-none tracking-tighter italic">{stats.out}</h3>
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="p-5 rounded-[32px] bg-slate-900 text-white shadow-xl shadow-slate-200 border-none flex flex-col gap-4">
                        <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center text-pink-500">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-40">Movimentações</p>
                            <h3 className="text-2xl font-black leading-none tracking-tighter italic">+{stats.recentMovements.length}</h3>
                        </div>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Quick Actions */}
            <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">Ações Rápidas</h4>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    <Button 
                        onClick={() => router.push('/dashboard/producao')}
                        className="h-16 px-8 rounded-2xl bg-white text-slate-900 border border-slate-100 shadow-sm shrink-0 flex items-center gap-3 group"
                    >
                        <div className="size-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Flame size={16} /></div>
                        <span className="font-black uppercase text-[10px] tracking-widest">Iniciar Produção</span>
                    </Button>
                    <Button 
                        onClick={() => router.push('/dashboard/lista-compras')}
                        className="h-16 px-8 rounded-2xl bg-white text-slate-900 border border-slate-100 shadow-sm shrink-0 flex items-center gap-3 group"
                    >
                        <div className="size-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform"><ShoppingBag size={16} /></div>
                        <span className="font-black uppercase text-[10px] tracking-widest">Ver Lista Compras</span>
                    </Button>
                </div>
            </section>

            {/* Recent Activity */}
            <section className="space-y-4 pb-10">
                <div className="flex items-center justify-between mx-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Atividade Recente</h4>
                    <Button variant="ghost" className="text-[9px] font-black uppercase text-pink-500 tracking-widest">Ver Tudo</Button>
                </div>

                <div className="space-y-3">
                    {stats.recentMovements.length > 0 ? stats.recentMovements.map((mov, i) => (
                        <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`size-10 rounded-xl flex items-center justify-center ${
                                    mov.type === 'entry' ? 'bg-emerald-50 text-emerald-500' : 
                                    mov.type === 'exit' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'
                                }`}>
                                    {mov.type === 'entry' ? <TrendingUp size={18} /> : <History size={18} />}
                                </div>
                                <div>
                                    <h5 className="text-xs font-black text-slate-900 uppercase italic leading-none">{mov.ingredients?.name}</h5>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {mov.type === 'entry' ? 'Entrada de' : 'Remoção de'} {mov.quantity} un
                                    </p>
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-slate-300 italic">2m atrás</span>
                        </div>
                    )) : (
                        <div className="text-center py-10 opacity-30 flex flex-col items-center">
                            <History size={40} className="mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma atividade registrada</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
