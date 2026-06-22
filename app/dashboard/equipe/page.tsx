"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  ChefHat, 
  Truck, 
  Search,
  MoreVertical,
  Mail,
  Smartphone,
  Check,
  X,
  Pencil,
  Plus,
  RefreshCw,
  Eye,
  Settings,
  Lock,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"

interface TeamMember {
  id: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'manager' | 'atendente' | 'caixa' | 'cozinha' | 'entregador'
  status: 'active' | 'inactive'
  created_at: string
}

interface DeliveryDriver {
  id: string
  name: string
  email: string
  phone: string
  whatsapp?: string
  cpf?: string
  vehicle: string
  plate: string
  photo: string
  status: 'online' | 'offline' | 'em_entrega' | 'pausado'
  latitude?: number
  longitude?: number
  last_update?: string
  created_at: string
}

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'atendente', label: 'Atendente' },
  { value: 'caixa', label: 'Caixa' },
  { value: 'cozinha', label: 'Cozinha' },
  { value: 'entregador', label: 'Entregador' },
]

const PERMISSION_COLUMNS = [
  { key: 'pedidos', label: 'Pedidos' },
  { key: 'produtos', label: 'Produtos' },
  { key: 'mostrar_ocultar', label: 'Mostrar/Ocultar' },
  { key: 'aparencia', label: 'Aparência' },
  { key: 'inventario', label: 'Inventário' },
  { key: 'vendas', label: 'Vendas' },
  { key: 'configuracoes', label: 'Configurações' },
  { key: 'cozinha', label: 'Cozinha' },
  { key: 'entregador', label: 'Entregador' },
]

const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  admin: {
    pedidos: true, produtos: true, mostrar_ocultar: true, aparencia: true,
    inventario: true, vendas: true, configuracoes: true, cozinha: true, entregador: true
  },
  manager: {
    pedidos: true, produtos: true, mostrar_ocultar: true, aparencia: true,
    inventario: true, vendas: true, configuracoes: true, cozinha: true, entregador: true
  },
  atendente: {
    pedidos: true, produtos: false, mostrar_ocultar: false, aparencia: false,
    inventario: false, vendas: false, configuracoes: false, cozinha: true, entregador: false
  },
  caixa: {
    pedidos: true, produtos: false, mostrar_ocultar: false, aparencia: false,
    inventario: false, vendas: true, configuracoes: false, cozinha: false, entregador: false
  },
  cozinha: {
    pedidos: false, produtos: false, mostrar_ocultar: false, aparencia: false,
    inventario: false, vendas: false, configuracoes: false, cozinha: true, entregador: false
  },
  entregador: {
    pedidos: false, produtos: false, mostrar_ocultar: false, aparencia: false,
    inventario: false, vendas: false, configuracoes: false, cozinha: false, entregador: true
  }
}

const RoleBadge = ({ role }: { role: string }) => {
  switch(role) {
    case 'admin': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none flex gap-1 items-center"><Shield className="size-3" /> Admin</Badge>
    case 'manager': return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none flex gap-1 items-center"><Shield className="size-3" /> Gerente</Badge>
    case 'atendente': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none flex gap-1 items-center"><Users className="size-3" /> Atendente</Badge>
    case 'caixa': return <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border-none flex gap-1 items-center"><Users className="size-3" /> Caixa</Badge>
    case 'cozinha': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none flex gap-1 items-center"><ChefHat className="size-3" /> Cozinha</Badge>
    case 'entregador': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none flex gap-1 items-center"><Truck className="size-3" /> Entregador</Badge>
    default: return <Badge variant="outline">{role}</Badge>
  }
}

export default function TeamPage() {
  return (
    <FeatureGuard feature="equipe" planRequired="pro">
      <TeamContent />
    </FeatureGuard>
  )
}

function TeamContent() {
  const { business } = useBusiness()
  const [activeTab, setActiveTab] = useState<'equipe' | 'entregadores'>('equipe')
  const [members, setMembers] = useState<TeamMember[]>([])
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDrivers, setLoadingDrivers] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Add Member Modal State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "cozinha"
  })

  // Add Driver Modal State
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false)
  const [newDriver, setNewDriver] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    cpf: "",
    email: "",
    password: "",
    vehicle: "Moto",
    plate: "",
    photo: ""
  })

  // Permissions matrix state
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>(DEFAULT_ROLE_PERMISSIONS)
  const [isSavingPermissions, setIsSavingPermissions] = useState(false)

  // Fetch Team data
  const fetchMembers = useCallback(async () => {
    if (!business?.id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('company_team')
        .select('*')
        .eq('company_id', business.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembers(data || [])
    } catch (error: any) {
      toast.error("Erro ao carregar equipe")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [business?.id])

  // Fetch Drivers data
  const fetchDrivers = useCallback(async () => {
    if (!business?.id) return
    try {
      setLoadingDrivers(true)
      const { data, error } = await supabase
        .from('delivery_drivers')
        .select('*')
        .eq('company_id', business.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDrivers(data || [])
    } catch (error: any) {
      toast.error("Erro ao carregar entregadores")
      console.error(error)
    } finally {
      setLoadingDrivers(false)
    }
  }, [business?.id])

  // Fetch permissions configuration
  const fetchPermissions = useCallback(async () => {
    if (!business?.id) return
    try {
      const { data, error } = await supabase
        .from('team_role_permissions')
        .select('*')
        .eq('company_id', business.id)

      if (error) throw error
      if (data && data.length > 0) {
        const loaded: Record<string, Record<string, boolean>> = { ...DEFAULT_ROLE_PERMISSIONS }
        data.forEach(row => {
          loaded[row.role] = {
            ...DEFAULT_ROLE_PERMISSIONS[row.role],
            ...(row.permissions as Record<string, boolean>)
          }
        })
        setRolePermissions(loaded)
      }
    } catch (error) {
      console.error("Erro ao buscar permissões customizadas:", error)
    }
  }, [business?.id])

  useEffect(() => {
    if (business?.id) {
      fetchMembers()
      fetchDrivers()
      fetchPermissions()
    }
  }, [business?.id, fetchMembers, fetchDrivers, fetchPermissions])

  // Add Member Action
  async function handleAddMember() {
    if (!business?.id) return
    try {
      if (!newMember.name || !newMember.email) {
        toast.error("Nome e E-mail são obrigatórios")
        return
      }

      const { data, error } = await supabase
        .from('company_team')
        .insert({
          company_id: business.id,
          name: newMember.name,
          email: newMember.email,
          phone: newMember.phone,
          role: newMember.role,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      setMembers([data, ...members])
      setIsAddDialogOpen(false)
      setNewMember({ name: "", email: "", phone: "", role: "cozinha" })
      toast.success("Membro adicionado com sucesso!")
    } catch (error: any) {
      toast.error("Erro ao adicionar membro")
      console.error(error)
    }
  }

  // Delete Member Action
  async function handleDeleteMember(id: string) {
    if (!confirm("Deseja realmente remover este membro da equipe?")) return
    try {
      const { error } = await supabase
        .from('company_team')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMembers(members.filter(m => m.id !== id))
      toast.success("Membro removido!")
    } catch (error: any) {
      toast.error("Erro ao remover membro")
      console.error(error)
    }
  }

  // Add Driver Action
  async function handleAddDriver() {
    if (!business?.id) return
    try {
      if (!newDriver.name || !newDriver.email || !newDriver.password) {
        toast.error("Nome, E-mail e Senha são obrigatórios")
        return
      }

      const response = await fetch('/api/delivery/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDriver.name,
          email: newDriver.email,
          password: newDriver.password,
          phone: newDriver.phone,
          whatsapp: newDriver.whatsapp || newDriver.phone,
          cpf: newDriver.cpf,
          vehicle: newDriver.vehicle,
          plate: newDriver.plate,
          photo: newDriver.photo,
          company_id: business.id
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao cadastrar entregador')

      toast.success("Entregador cadastrado com sucesso!")
      setIsAddDriverOpen(false)
      setNewDriver({
        name: "", phone: "", whatsapp: "", cpf: "", email: "", password: "",
        vehicle: "Moto", plate: "", photo: ""
      })
      fetchDrivers()
    } catch (error: any) {
      toast.error(error.message)
      console.error(error)
    }
  }

  // Delete Driver Action
  async function handleDeleteDriver(id: string) {
    if (!confirm("Deseja realmente excluir este entregador? Isso removerá a credencial de login.")) return
    try {
      const response = await fetch(`/api/delivery/drivers?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao excluir entregador')

      setDrivers(drivers.filter(d => d.id !== id))
      toast.success("Entregador excluído com sucesso!")
    } catch (error: any) {
      toast.error(error.message)
      console.error(error)
    }
  }

  // Update Driver Status Toggle
  async function toggleDriverStatus(driver: DeliveryDriver) {
    const nextStatus = driver.status === 'offline' ? 'online' : 'offline'
    try {
      const { error } = await supabase
        .from('delivery_drivers')
        .update({ status: nextStatus })
        .eq('id', driver.id)

      if (error) throw error
      toast.success(`Entregador agora está ${nextStatus === 'online' ? 'Online' : 'Offline'}`)
      setDrivers(drivers.map(d => d.id === driver.id ? { ...d, status: nextStatus } : d))
    } catch (error: any) {
      toast.error("Erro ao alterar status")
      console.error(error)
    }
  }

  // Edit Permissions Grid Cell Toggle
  const handleTogglePermission = (role: string, permissionKey: string) => {
    if (role === 'admin') return // Admin cannot be modified
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permissionKey]: !prev[role]?.[permissionKey]
      }
    }))
  }

  // Save Permissions Matrix Configuration
  const handleSavePermissions = async () => {
    if (!business?.id) return
    try {
      setIsSavingPermissions(true)
      const promises = Object.entries(rolePermissions).map(async ([role, permissions]) => {
        const { error } = await supabase
          .from('team_role_permissions')
          .upsert({
            company_id: business.id,
            role,
            permissions
          }, { onConflict: 'company_id,role' })
        if (error) throw error
      })

      await Promise.all(promises)
      toast.success("Permissões de funções salvas com sucesso!")
    } catch (error: any) {
      toast.error("Erro ao salvar permissões")
      console.error(error)
    } finally {
      setIsSavingPermissions(false)
    }
  }

  // Search filter
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredDrivers = drivers.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="dashboard-grid pb-24">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-2 uppercase italic leading-none">
            Gerenciar <span className="text-pink-500">Equipe</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Configure cargos, permissões e cadastro de entregadores.</p>
        </div>

        {/* Tab Selector Button Grid */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button 
            onClick={() => { setActiveTab('equipe'); setSearchTerm(''); }}
            className={`h-11 px-6 rounded-xl font-black text-[10px] uppercase italic tracking-widest transition-all ${activeTab === 'equipe' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            Equipe Geral
          </button>
          <button 
            onClick={() => { setActiveTab('entregadores'); setSearchTerm(''); }}
            className={`h-11 px-6 rounded-xl font-black text-[10px] uppercase italic tracking-widest transition-all ${activeTab === 'entregadores' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            Entregadores
          </button>
        </div>
      </div>

      {activeTab === 'equipe' ? (
        <div className="space-y-10">
          {/* Permissions Matrix */}
          <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-4">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Saiba mais sobre as funções</CardTitle>
                  <CardDescription className="font-medium text-slate-500">Abaixo você pode configurar os acessos de cada perfil da equipe.</CardDescription>
                </div>
                <Button 
                  onClick={handleSavePermissions} 
                  disabled={isSavingPermissions}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 px-5 font-bold text-xs shrink-0"
                >
                  {isSavingPermissions ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 bg-slate-50/20">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 py-4 px-6 min-w-[150px]">Função</TableHead>
                    {PERMISSION_COLUMNS.map(col => (
                      <TableHead key={col.key} className="font-black uppercase text-[10px] tracking-widest text-slate-400 py-4 text-center min-w-[100px]">
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROLES.map(roleObj => (
                    <TableRow key={roleObj.value} className="border-slate-100 hover:bg-transparent">
                      <TableCell className="py-4 px-6 font-bold text-slate-700 capitalize">
                        {roleObj.label}
                      </TableCell>
                      {PERMISSION_COLUMNS.map(col => {
                        const hasAccess = rolePermissions[roleObj.value]?.[col.key] || false
                        const isReadOnly = roleObj.value === 'admin'
                        return (
                          <TableCell key={col.key} className="text-center py-4">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(roleObj.value, col.key)}
                              disabled={isReadOnly}
                              className={`size-6 rounded-lg mx-auto flex items-center justify-center transition-all ${
                                hasAccess 
                                  ? "bg-emerald-500 text-white shadow-sm" 
                                  : "bg-slate-50 text-slate-300 border border-slate-200"
                              } ${isReadOnly ? "opacity-90 cursor-default" : "hover:scale-105 active:scale-95"}`}
                            >
                              {hasAccess && <Check className="size-4 stroke-[3px]" />}
                            </button>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Team Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <Input 
                  placeholder="Buscar por nome ou e-mail..." 
                  className="pl-12 h-12 rounded-2xl bg-slate-50 border-none font-medium w-full"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl h-12 px-6 flex gap-2 font-bold shadow-lg shadow-pink-100 transition-all active:scale-95 w-full sm:w-auto shrink-0">
                    <UserPlus className="size-5" />
                    Adicionar Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-[425px] rounded-[32px] p-6 sm:p-10 max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Novo <span className="text-pink-500">Membro</span></DialogTitle>
                    <DialogDescription className="font-medium text-slate-500">
                      Preencha os dados abaixo para adicionar um novo membro à sua equipe.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                      <Input 
                        placeholder="Ex: João Silva" 
                        className="rounded-xl bg-slate-50 border-none h-12 font-bold"
                        value={newMember.name}
                        onChange={e => setNewMember({...newMember, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail de Acesso</label>
                      <Input 
                        placeholder="joao@email.com" 
                        className="rounded-xl bg-slate-50 border-none h-12 font-bold"
                        value={newMember.email}
                        onChange={e => setNewMember({...newMember, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Telefone (Opcional)</label>
                      <Input 
                        placeholder="(00) 00000-0000" 
                        className="rounded-xl bg-slate-50 border-none h-12 font-bold"
                        value={newMember.phone}
                        onChange={e => setNewMember({...newMember, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Função / Cargo</label>
                      <Select value={newMember.role} onValueChange={(v: any) => setNewMember({...newMember, role: v})}>
                        <SelectTrigger className="rounded-xl bg-slate-50 border-none h-12 font-bold">
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          <SelectItem value="admin" className="font-bold">Administrador</SelectItem>
                          <SelectItem value="manager" className="font-bold">Gerente</SelectItem>
                          <SelectItem value="atendente" className="font-bold">Atendente</SelectItem>
                          <SelectItem value="caixa" className="font-bold">Caixa</SelectItem>
                          <SelectItem value="cozinha" className="font-bold">Cozinha</SelectItem>
                          <SelectItem value="entregador" className="font-bold">Entregador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleAddMember} className="w-full h-14 bg-pink-500 hover:bg-pink-600 rounded-2xl font-black uppercase italic tracking-widest shadow-xl shadow-pink-100">
                      Salvar Membro
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-50 hover:bg-transparent">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 py-6 min-w-[200px]">Membro</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 py-6 text-center min-w-[120px]">Função</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 py-6 text-center min-w-[100px]">Status</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 py-6 text-center min-w-[120px]">Desde</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                          <div className="size-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
                          <span className="font-bold text-xs uppercase tracking-widest">Carregando equipe...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                          <Users className="size-12 mb-2" />
                          <span className="font-bold text-xs uppercase tracking-widest italic">Nenhum membro encontrado</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow key={member.id} className="border-slate-50 hover:bg-slate-50/50 group transition-colors">
                        <TableCell className="py-6">
                          <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-600 uppercase">
                              {member.name.charAt(0)}
                            </div>
                            <div className="space-y-1">
                              <p className="font-black text-slate-900 leading-none">{member.name}</p>
                              <div className="flex items-center gap-2 text-slate-400 mt-1">
                                <Mail className="size-3" />
                                <span className="text-xs font-medium">{member.email}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-6">
                          <div className="inline-flex justify-center w-full">
                            <RoleBadge role={member.role} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-6">
                          <Badge className="bg-emerald-50 text-emerald-600 border-none font-black uppercase text-[10px] tracking-widest px-3">
                            Ativo
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-6 text-slate-400 font-bold text-xs">
                          {new Date(member.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="py-6">
                          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              onClick={() => handleDeleteMember(member.id)}
                            >
                              <Trash2 className="size-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : (
        /* Entregadores Tab */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <Input 
                placeholder="Buscar por entregador..." 
                className="pl-12 h-12 rounded-2xl bg-white border border-slate-100 font-medium w-full shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <Dialog open={isAddDriverOpen} onOpenChange={setIsAddDriverOpen}>
              <DialogTrigger asChild>
                <Button className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl h-12 px-6 flex gap-2 font-bold shadow-lg shadow-pink-100 transition-all active:scale-95 w-full sm:w-auto shrink-0">
                  <UserPlus className="size-5" />
                  + Adicionar Entregador
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[450px] rounded-[32px] p-6 sm:p-10 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Novo <span className="text-pink-500">Entregador</span></DialogTitle>
                  <DialogDescription className="font-medium text-slate-500 font-sans">
                    Crie credenciais e cadastre as informações do veículo para o entregador.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                    <Input 
                      placeholder="Ex: Carlos Entregador" 
                      className="rounded-xl bg-slate-50 border-none h-11 font-bold"
                      value={newDriver.name}
                      onChange={e => setNewDriver({...newDriver, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Telefone</label>
                      <Input 
                        placeholder="(11) 99999-9999" 
                        className="rounded-xl bg-slate-50 border-none h-11 font-bold"
                        value={newDriver.phone}
                        onChange={e => setNewDriver({...newDriver, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp</label>
                      <Input 
                        placeholder="(11) 99999-9999" 
                        className="rounded-xl bg-slate-50 border-none h-11 font-bold"
                        value={newDriver.whatsapp}
                        onChange={e => setNewDriver({...newDriver, whatsapp: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail de Login</label>
                    <Input 
                      placeholder="email@entregador.com" 
                      type="email"
                      className="rounded-xl bg-slate-50 border-none h-11 font-bold"
                      value={newDriver.email}
                      onChange={e => setNewDriver({...newDriver, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha de Acesso</label>
                    <Input 
                      placeholder="Senha do entregador" 
                      type="password"
                      className="rounded-xl bg-slate-50 border-none h-11 font-bold"
                      value={newDriver.password}
                      onChange={e => setNewDriver({...newDriver, password: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Modelo da Moto</label>
                      <Input 
                        placeholder="Honda Titan 160" 
                        className="rounded-xl bg-slate-50 border-none h-11 font-bold"
                        value={newDriver.vehicle}
                        onChange={e => setNewDriver({...newDriver, vehicle: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Placa da Moto</label>
                      <Input 
                        placeholder="ABC-1234" 
                        className="rounded-xl bg-slate-50 border-none h-11 font-bold"
                        value={newDriver.plate}
                        onChange={e => setNewDriver({...newDriver, plate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CPF (Opcional)</label>
                      <Input 
                        placeholder="000.000.000-00" 
                        className="rounded-xl bg-slate-50 border-none h-11 font-bold"
                        value={newDriver.cpf}
                        onChange={e => setNewDriver({...newDriver, cpf: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Foto URL (Opcional)</label>
                      <Input 
                        placeholder="https://sua-foto-url.com/foto.jpg" 
                        className="rounded-xl bg-slate-50 border-none h-11 font-bold"
                        value={newDriver.photo}
                        onChange={e => setNewDriver({...newDriver, photo: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleAddDriver} className="w-full h-14 bg-pink-500 hover:bg-pink-600 rounded-2xl font-black uppercase italic tracking-widest shadow-xl shadow-pink-100">
                    Salvar Entregador
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Drivers List */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-50 hover:bg-transparent">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 py-6 min-w-[200px]">Entregador</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 py-6 text-center min-w-[120px]">Veículo</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 py-6 text-center min-w-[100px]">Placa</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 py-6 text-center min-w-[120px]">Status</TableHead>
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingDrivers ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                          <div className="size-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
                          <span className="font-bold text-xs uppercase tracking-widest">Buscando entregadores...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                          <Truck className="size-12 mb-2" />
                          <span className="font-bold text-xs uppercase tracking-widest italic">Nenhum entregador cadastrado</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <TableRow key={driver.id} className="border-slate-50 hover:bg-slate-50/50 group transition-colors">
                        <TableCell className="py-6">
                          <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                              {driver.photo ? (
                                <img src={driver.photo} alt={driver.name} className="size-full object-cover" />
                              ) : (
                                <Users className="size-6 text-slate-400" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="font-black text-slate-900 leading-none">{driver.name}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 mt-1">
                                <span className="text-xs font-medium flex items-center gap-1">
                                  <Mail className="size-3" /> {driver.email}
                                </span>
                                <span className="text-xs font-bold flex items-center gap-1">
                                  <Smartphone className="size-3" /> {driver.phone}
                                </span>
                                {driver.whatsapp && (
                                  <span className="text-xs font-bold flex items-center gap-1 text-emerald-600">
                                    WhatsApp: {driver.whatsapp}
                                  </span>
                                )}
                                {(driver as any).cpf && (
                                  <span className="text-xs font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                    CPF: {(driver as any).cpf}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-6 font-bold text-sm text-slate-700 capitalize">
                          {driver.vehicle || "Moto"}
                        </TableCell>
                        <TableCell className="text-center py-6">
                          <Badge variant="outline" className="border-slate-200 text-slate-600 font-mono font-black uppercase text-[10px]">
                            {driver.plate || "SEM PLACA"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-6">
                          <button
                            onClick={() => toggleDriverStatus(driver)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
                              driver.status === 'online' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                              driver.status === 'em_entrega' ? "bg-purple-50 text-purple-600 border-purple-200" :
                              driver.status === 'pausado' ? "bg-amber-50 text-amber-600 border-amber-200" :
                              "bg-slate-50 text-slate-400 border-slate-200"
                            }`}
                          >
                            <span className={`size-1.5 rounded-full ${
                              driver.status === 'online' ? "bg-emerald-500 animate-pulse" :
                              driver.status === 'em_entrega' ? "bg-purple-500" :
                              driver.status === 'pausado' ? "bg-amber-500" :
                              "bg-slate-400"
                            }`} />
                            {
                              driver.status === 'online' ? 'Online' :
                              driver.status === 'em_entrega' ? 'Em entrega' :
                              driver.status === 'pausado' ? 'Pausado' : 'Offline'
                            }
                          </button>
                        </TableCell>
                        <TableCell className="py-6">
                          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              onClick={() => handleDeleteDriver(driver.id)}
                            >
                              <Trash2 className="size-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
