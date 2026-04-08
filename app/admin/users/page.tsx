"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    User,
    Mail,
    Shield,
    MoreHorizontal,
    Ban,
    Trash2,
    Building2,
    SearchX,
    UserCircle,
    ChevronRight,
    CheckCircle2
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AppUser {
    id: string
    full_name: string
    email: string
    company_name: string
    role: string
    created_at: string
    last_login: string | null
    is_admin: boolean
    plan: string
    trial_ends_at: string | null
    subscription_status: string
}

export default function UsersManagement() {
    const [users, setUsers] = useState<AppUser[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchUsers()
    }, [])

    async function fetchUsers() {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/users')
            if (!response.ok) {
                throw new Error('API Error')
            }
            const data = await response.json()

            if (!data || data.length === 0) {
                setUsers([])
                return
            }

            const formatted: AppUser[] = data.map((u: any) => ({
                id: u.id,
                full_name: u.owner_name || 'Usuário',
                email: u.email || 'N/A', 
                company_name: u.empresas?.name || u.business_name || 'Sem Empresa',
                role: u.role === 'admin' ? 'Administrador' : 'Confeiteira',
                created_at: u.created_at || new Date().toISOString(),
                last_login: null,
                is_admin: u.is_admin || u.role === 'admin',
                plan: u.plan || 'free',
                trial_ends_at: u.trial_ends_at,
                subscription_status: u.subscription_status || 'inactive'
            }))

            setUsers(formatted)
        } catch (error: any) {
            console.error("error fetching users:", error)
            // Mock data for UI 
            setUsers([
                { id: '1', full_name: 'Admin System', email: 'admin@docegestao.com', company_name: 'DoceGestão Pro', role: 'Administrador', created_at: new Date().toISOString(), last_login: null, is_admin: true, plan: 'business', trial_ends_at: null, subscription_status: 'active' },
                { id: '2', full_name: 'Maria Silva', email: 'maria@docesabor.com', company_name: 'Doce Sabor', role: 'Confeiteira', created_at: new Date().toISOString(), last_login: null, is_admin: false, plan: 'free', trial_ends_at: new Date().toISOString(), subscription_status: 'active' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(u => 
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-slate-800 border-t-rose-500 rounded-full animate-spin shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Caregando Diretório...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 w-full xl:max-w-[70%]">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] italic">Identity Governance</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-[0.85]">
                        Diretório <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-400">Global</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic mt-4">Access Control // Base de Operadores</p>
                </div>
                
                <div className="flex items-center gap-4 bg-slate-900 border border-white/5 px-6 py-4 rounded-2xl shadow-xl">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Usuários Ativos</p>
                        <p className="text-2xl font-black text-white italic">{users.length}</p>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-900 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="p-8 border-b border-white/5 relative z-10 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar Identidade, Email ou Entidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-white/5 text-slate-300 text-sm rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Identidade / Contact</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Ecosystem / Entity</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Plan / Subscription</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Privileges</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Onboarding</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Access Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user, index) => (
                                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-black group-hover:bg-rose-500/20 group-hover:text-rose-400 transition-colors shadow-inner shadow-black/50">
                                                <UserCircle className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm mb-0.5">{user.full_name}</p>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                                    <Mail className="size-3" /> {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <Building2 className="size-4 text-slate-500" />
                                            <span className="font-bold text-sm">{user.company_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <select 
                                            value={user.plan}
                                            onChange={async (e) => {
                                                const newPlan = e.target.value
                                                try {
                                                    const res = await fetch('/api/admin/users', {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ userId: user.id, plan: newPlan, subscription_status: 'active' })
                                                    })
                                                    if (res.ok) {
                                                        toast.success(`Plano de ${user.full_name} atualizado para ${newPlan}`)
                                                        fetchUsers()
                                                    }
                                                } catch (err) {
                                                    toast.error("Erro ao atualizar plano")
                                                }
                                            }}
                                            className={cn(
                                                "bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-rose-500 transition-all outline-none",
                                                user.plan === 'business' ? "text-amber-400 border-amber-500/30" : 
                                                user.plan === 'pro' ? "text-pink-400 border-pink-500/30" : "text-slate-400"
                                            )}
                                        >
                                            <option value="free">Free / Trial</option>
                                            <option value="starter">Starter</option>
                                            <option value="pro">Pro</option>
                                            <option value="business">Business</option>
                                        </select>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border inline-flex items-center justify-center gap-1.5",
                                            user.is_admin 
                                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                                                : "bg-white/5 text-slate-300 border-white/10"
                                        )}>
                                            {user.is_admin && <Shield className="size-3" />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-slate-300">
                                            {format(new Date(user.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-colors">
                                                <Ban className="size-4" />
                                            </button>
                                            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-colors">
                                                <Trash2 className="size-4 text-rose-400/50 hover:text-rose-400" />
                                            </button>
                                            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-colors">
                                                <ChevronRight className="size-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-bold">
                                        Nenhum usuário encontrado na base ativa.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    )
}
