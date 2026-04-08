"use client"

import { useState, useEffect } from "react"
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
  Smartphone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

interface TeamMember {
  id: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'cozinha' | 'entregador'
  status: 'active' | 'inactive'
  created_at: string
}

const RoleBadge = ({ role }: { role: string }) => {
  switch(role) {
    case 'admin': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none flex gap-1 items-center"><Shield className="size-3" /> Admin</Badge>
    case 'cozinha': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none flex gap-1 items-center"><ChefHat className="size-3" /> Cozinha</Badge>
    case 'entregador': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none flex gap-1 items-center"><Truck className="size-3" /> Entregador</Badge>
    default: return <Badge variant="outline">{role}</Badge>
  }
}

import { FeatureGuard } from "@/components/dashboard/FeatureGuard"

export default function TeamPage() {
  return (
    <FeatureGuard feature="equipe" planRequired="pro">
      <TeamContent />
    </FeatureGuard>
  )
}

function TeamContent() {
  const { business } = useBusiness()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "cozinha"
  })

  useEffect(() => {
    if (business?.id) {
      fetchMembers()
    }
  }, [business?.id])

  async function fetchMembers() {
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
  }

  async function handleAddMember() {
    if (!business?.id) {
      toast.error("Erro: Empresa não identificada. Recarregue a página.")
      return
    }

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

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  )


  return (
    <div className="dashboard-grid pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-2 uppercase italic leading-none">
            Gestão de <span className="text-pink-500">Equipe</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Gerencie os acessos e funções do seu estabelecimento.</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
              <Button className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl h-12 px-6 flex gap-2 font-bold shadow-lg shadow-pink-100 transition-all active:scale-95 w-full md:w-auto">
                <UserPlus className="size-5" />
                Convidar Membro
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
                    <SelectItem value="cozinha" className="font-bold flex items-center gap-2">Cozinha</SelectItem>
                    <SelectItem value="entregador" className="font-bold">Entregador</SelectItem>
                    <SelectItem value="admin" className="font-bold">Administrador</SelectItem>
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

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <Input 
              placeholder="Buscar por nome ou e-mail..." 
              className="pl-12 h-12 rounded-2xl bg-slate-50 border-none font-medium w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
             <div className="flex -space-x-3">
                {members.slice(0, 5).map((m, i) => (
                   <div key={i} className="size-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center font-black text-xs text-slate-600 uppercase">
                     {m.name.charAt(0)}
                   </div>
                ))}
                {members.length > 5 && (
                  <div className="size-10 rounded-full bg-pink-500 border-2 border-white flex items-center justify-center font-black text-xs text-white">
                    +{members.length - 5}
                  </div>
                )}
             </div>
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ativos agora</span>
          </div>
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
                          <div className="flex items-center gap-2 text-slate-400">
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

      {/* Dicas de Gestão */}
      <div className="kpi-grid">
         <div className="kpi-card group border-none !h-auto py-8">
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600 w-fit mb-4">
              <Shield className="size-5" />
            </div>
            <h4 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">Administradores</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Têm acesso total às configurações, financeiro e relatórios do sistema.</p>
         </div>
         <div className="kpi-card group border-none !h-auto py-8">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600 w-fit mb-4">
              <ChefHat className="size-5" />
            </div>
            <h4 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">Cozinha</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Focam na produção dos pedidos. Têm acesso apenas ao Painel da Cozinha.</p>
         </div>
         <div className="kpi-card group border-none !h-auto py-8">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600 w-fit mb-4">
              <Truck className="size-5" />
            </div>
            <h4 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">Entregadores</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Gerenciam o status de entrega e localização dos pedidos prontos.</p>
         </div>
      </div>
    </div>
  )
}
