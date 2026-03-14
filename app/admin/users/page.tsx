"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    User,
    Mail,
    Shield,
    Calendar,
    MoreHorizontal,
    Edit3,
    Key,
    Ban,
    Trash2,
    Building2,
    SearchX,
    UserCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface AppUser {
    id: string
    full_name: string
    email: string
    company_name: string
    role: string
    created_at: string
    last_login: string | null
    is_admin: boolean
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
            if (!response.ok) throw new Error('API Error')
            const data = await response.json()

            if (!data || data.length === 0) {
                setUsers([])
                return
            }

            const formatted: AppUser[] = data.map((u: any) => ({
                id: u.id,
                full_name: u.owner_name || 'Usuário',
                email: u.email || 'N/A', 
                company_name: u.companies?.name || u.business_name || 'Sem Empresa',
                role: u.role === 'admin' ? 'Administrador' : 'Confeiteira',
                created_at: u.created_at || new Date().toISOString(),
                last_login: null,
                is_admin: u.role === 'admin'
            }))

            setUsers(formatted)
        } catch (error: any) {
            console.error("error fetching users:", error)
            toast.error("Erro ao carregar banco de usuários")
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(u => 
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-12 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-2 bg-rose-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] italic">Identity Governance</span>
                    </div>
                    <h2 className="text-6xl font-black text-slate-900 italic uppercase tracking-tighter leading-[0.8]">
                        Diretório <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-400">Global</span>
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">Access Control // Base de Operadores</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex flex-col text-right mr-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuários Ativos</p>
                        <p className="text-2xl font-black text-slate-900 italic">{users.length}</p>
                    </div>
                </div>
            </div>

            {/* Search Bar Dashboard */}
            <div className="relative group max-w-2xl">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors">
                    <Search className="size-6" />
                </div>
                <input
                    type="text"
                    placeholder="BUSCAR IDENTIDADE, EMAIL OU ENTIDADE..."
                    className="w-full h-20 pl-16 pr-6 bg-white border border-slate-100 rounded-[32px] text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-500/5 focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 outline-none transition-all placeholder:text-slate-300 italic"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Premium Table Content */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-[48px] border border-white/40 shadow-2xl shadow-rose-500/5 overflow-hidden bg-white/60 backdrop-blur-md"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Identidade / Contact</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Ecosystem / Entity</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Privileges</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Onboarding</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">Access Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-16 bg-slate-100 rounded-full" />
                                                    <div className="space-y-2 flex-1">
                                                        <div className="h-4 bg-slate-100 rounded w-1/3" />
                                                        <div className="h-2 bg-slate-50 rounded w-1/4" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((u) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={u.id}
                                            className="hover:bg-rose-50/30 transition-all group relative"
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="size-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shrink-0 group-hover:from-rose-600 group-hover:to-orange-500 group-hover:text-white group-hover:shadow-xl group-hover:shadow-rose-500/20 group-hover:scale-110 transition-all duration-500 overflow-hidden relative">
                                                        <span className="font-black italic text-xl z-10">{u.full_name.charAt(0)}</span>
                                                        <UserCircle className="size-8 absolute opacity-5 -right-1 -bottom-1" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 italic uppercase tracking-tighter text-lg">{u.full_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-black flex items-center gap-1 uppercase tracking-[0.2em] mt-1 italic">
                                                            <Mail className="size-3" />
                                                            {u.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black text-slate-900 italic uppercase tracking-tighter text-xs">{u.company_name}</span>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
                                                        <Building2 className="size-3" /> ID: {u.id.substring(0, 8)}...
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic border transition-all duration-500",
                                                    u.is_admin 
                                                        ? "bg-indigo-900 text-white border-indigo-900 shadow-lg shadow-indigo-900/20" 
                                                        : "bg-white text-slate-400 border-slate-100 group-hover:border-slate-300"
                                                )}>
                                                    <Shield className="size-3" />
                                                    {u.role}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">
                                                        {new Date(u.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[8px] text-slate-400 font-black uppercase mt-1 tracking-[0.2em]">Deployment Date</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                                    <button title="Reset Core Password" className="size-11 rounded-[14px] bg-white border border-slate-100 text-amber-500 flex items-center justify-center hover:bg-amber-500 hover:text-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                                                        <Key className="size-5" />
                                                    </button>
                                                    <button title="Edit Identity" className="size-11 rounded-[14px] bg-white border border-slate-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                                                        <Edit3 className="size-5" />
                                                    </button>
                                                    <button title="Suspend Session" className="size-11 rounded-[14px] bg-white border border-slate-100 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                                                        <Ban className="size-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center bg-slate-50/10">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="size-24 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-100 shadow-xl shadow-rose-500/5">
                                                    <SearchX className="size-12" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-slate-900 font-black uppercase tracking-widest text-sm italic">Identidades não mapeadas</p>
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Ajuste os parâmetros de busca no diretório</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Footnote Stats */}
                <div className="px-10 py-8 border-t border-slate-100/50 flex flex-col sm:flex-row items-center justify-between bg-white gap-6">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-rose-600 flex items-center justify-center text-white text-[10px] font-black italic shadow-lg shadow-rose-500/30">
                            {filteredUsers.length}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                            Identificadores validados pelo kernel
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
