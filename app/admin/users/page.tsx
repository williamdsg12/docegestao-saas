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
import { AdminModal } from "@/components/admin/AdminModal"
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog"
import { AdminButton } from "@/components/admin/AdminButton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
    const [actionLoading, setActionLoading] = useState(false)

    // Form states
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: 'confeiteira',
        company_id: '',
        is_admin: false
    })

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

    async function handleCreate() {
        setActionLoading(true)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    owner_name: formData.full_name,
                    email: formData.email,
                    role: formData.role,
                    company_id: formData.company_id,
                    is_admin: formData.is_admin
                })
            })
            if (!res.ok) throw new Error('API Error')
            toast.success("Usuário criado com sucesso!")
            setIsCreateModalOpen(false)
            fetchUsers()
        } catch (error) {
            toast.error("Erro ao criar usuário")
        } finally {
            setActionLoading(false)
        }
    }

    async function handleUpdate() {
        if (!selectedUser) return
        setActionLoading(true)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    owner_name: formData.full_name,
                    email: formData.email,
                    role: formData.role,
                    is_admin: formData.is_admin
                })
            })
            if (!res.ok) throw new Error('API Error')
            toast.success("Usuário atualizado!")
            setIsEditModalOpen(false)
            fetchUsers()
        } catch (error) {
            toast.error("Erro ao atualizar usuário")
        } finally {
            setActionLoading(false)
        }
    }

    async function handleDelete() {
        if (!selectedUser) return
        setActionLoading(true)
        try {
            const res = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('API Error')
            toast.success("Usuário excluído!")
            setIsDeleteOpen(false)
            fetchUsers()
        } catch (error) {
            toast.error("Erro ao excluir usuário")
        } finally {
            setActionLoading(false)
        }
    }

    const openEdit = (user: AppUser) => {
        setSelectedUser(user)
        setFormData({
            full_name: user.full_name,
            email: user.email,
            role: user.role === 'Administrador' ? 'admin' : 'confeiteira',
            company_id: (user as any).company_id || '',
            is_admin: user.is_admin
        })
        setIsEditModalOpen(true)
    }

    const openCreate = () => {
        setFormData({
            full_name: '',
            email: '',
            role: 'confeiteira',
            company_id: '',
            is_admin: false
        })
        setIsCreateModalOpen(true)
    }

    const filteredUsers = users.filter(u => 
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="size-16 border-4 border-white/[0.05] border-t-rose-500 rounded-full animate-spin" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Caregando Diretório...</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                        Diretório <span className="text-rose-500">Global</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">Controle de acesso e gestão de operadores do ecossistema.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col text-right pr-4 border-r border-white/[0.05]">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none mb-1">Total Usuários</p>
                        <p className="text-xl font-bold text-white">{users.length}</p>
                    </div>
                    <AdminButton 
                        label="Novo Usuário"
                        icon={User}
                        onClick={openCreate}
                        className="bg-rose-600 text-white h-11 px-6 rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 text-xs font-semibold"
                    />
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
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openEdit(user)
                                                }}
                                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-colors"
                                            >
                                                <UserCircle className="size-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedUser(user)
                                                    setIsDeleteOpen(true)
                                                }}
                                                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-colors"
                                            >
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

            {/* Modals */}
            <AdminModal
                isOpen={isCreateModalOpen || isEditModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                title={isCreateModalOpen ? "Registrar Operador" : "Editar Identidade"}
                description="Gestão de acesso e privilégios do sistema."
            >
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Nome Completo</Label>
                        <Input 
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            placeholder="Ex: Maria das Dores"
                            className="bg-slate-950 border-white/5 h-12 rounded-xl focus:ring-rose-500/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">E-mail de Acesso</Label>
                        <Input 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="usuario@email.com"
                            className="bg-slate-950 border-white/5 h-12 rounded-xl focus:ring-rose-500/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Cargo / Função</Label>
                            <Select 
                                value={formData.role}
                                onValueChange={(v) => setFormData({...formData, role: v})}
                            >
                                <SelectTrigger className="bg-slate-950 border-white/5 h-12 rounded-xl uppercase font-black text-[10px] italic">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white">
                                    <SelectItem value="confeiteira">Confeiteira</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="operador">Operador de Loja</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Admin Global</Label>
                            <Select 
                                value={formData.is_admin ? "true" : "false"}
                                onValueChange={(v) => setFormData({...formData, is_admin: v === "true"})}
                            >
                                <SelectTrigger className="bg-slate-950 border-white/5 h-12 rounded-xl uppercase font-black text-[10px] italic">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white">
                                    <SelectItem value="false">Não</SelectItem>
                                    <SelectItem value="true">Sim (Audit Access)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">ID da Empresa (Opcional)</Label>
                        <Input 
                            value={formData.company_id}
                            onChange={(e) => setFormData({...formData, company_id: e.target.value})}
                            placeholder="UUID da Empresa vinculo"
                            className="bg-slate-950 border-white/5 h-12 rounded-xl focus:ring-rose-500/20"
                        />
                    </div>

                    <button
                        onClick={isCreateModalOpen ? handleCreate : handleUpdate}
                        disabled={actionLoading}
                        className="w-full h-14 bg-rose-600 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-xl shadow-rose-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center"
                    >
                        {actionLoading ? (
                            <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (isCreateModalOpen ? "Criar Identidade" : "Salvar Alterações")}
                    </button>
                </div>
            </AdminModal>

            <ConfirmationDialog 
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                loading={actionLoading}
                title="Excluir Usuário?"
                description="Esta ação removerá todos os privilégios de acesso deste usuário. Esta ação não pode ser desfeita."
                confirmText="Excluir Identidade"
            />
        </div>
    )
}
