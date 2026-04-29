"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Star,
  Users,
  MessageCircle,
  Mail,
  MoreHorizontal,
  Trash2,
  Calendar,
  Gift
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { PageFilters } from "@/components/dashboard/PageFilters"
import { PageSearch } from "@/components/dashboard/PageSearch"
import { EmptyStateV2 } from "@/components/dashboard/EmptyStateV2"

interface Client {
  id: string
  name: string
  phone: string
  email: string
  birthday: string
  total_spent: number
  orders_count: number
  is_vip: boolean
}

export default function ClientesPage() {
  return (
    <FeatureGuard feature="clientes" planRequired="pro">
      <div className="space-y-8 pb-20">
        <ClientesContent />
      </div>
    </FeatureGuard>
  )
}

function ClientesContent() {
  const { profile } = useBusiness()
  const { limits, canAddClient, refreshLimits } = usePlanLimits()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("todos")
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const [formData, setFormData] = useState({ name: "", phone: "", email: "" })

  useEffect(() => {
    if (profile?.tenant_id || profile?.company_id) {
      fetchClients()
    }
  }, [profile])

  async function fetchClients() {
    const tenantId = profile?.tenant_id || profile?.company_id
    if (!tenantId) return
    try {
      setLoading(true)
      const { data, error } = await supabase.from('customers').select('*').eq('tenant_id', tenantId).order('name')
      if (error) throw error
      setClients(data || [])
    } finally { setLoading(false) }
  }

  async function handleSaveClient() {
    if (!editingClient && !canAddClient()) return toast.error("Limite do plano atingido!")
    if (!formData.name) return toast.error("Nome é obrigatório")

    setIsSaving(true)
    try {
      const tenantId = profile?.tenant_id || profile?.company_id
      if (editingClient) {
        await supabase.from('customers').update(formData).eq('id', editingClient.id)
        toast.success("Cliente atualizado!")
      } else {
        await supabase.from('customers').insert({ ...formData, tenant_id: tenantId })
        toast.success("Cliente cadastrado!")
        refreshLimits()
      }
      fetchClients()
      handleCloseModal()
    } catch (e) { toast.error("Erro ao salvar") } finally { setIsSaving(false) }
  }

  const handleCloseModal = () => {
    setNewClientOpen(false)
    setEditingClient(null)
    setFormData({ name: "", phone: "", email: "" })
  }

  async function handleDeleteClient(id: string) {
    if (!confirm("Excluir este cliente?")) return
    await supabase.from('customers').delete().eq('id', id)
    setClients(prev => prev.filter(c => c.id !== id))
    toast.success("Excluído")
  }

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
    const matchStatus = filterStatus === "todos" || (filterStatus === "vip" && c.is_vip) || (filterStatus === "comum" && !c.is_vip)
    return matchSearch && matchStatus
  })

  const filterOptions = [
    { key: "todos", label: "Todos", count: clients.length },
    { key: "vip", label: "Clientes VIP", count: clients.filter(c => c.is_vip).length },
    { key: "comum", label: "Comuns", count: clients.filter(c => !c.is_vip).length },
  ]

  return (
    <>
      <PageHeader 
        title="Gestão de" 
        highlight="Clientes" 
        subtitle="Construa relacionamentos duradouros e fidelize quem ama seus doces"
        actions={(
          <Button onClick={() => setNewClientOpen(true)} className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 font-black uppercase text-[10px] text-white shadow-lg">
            <Plus className="mr-2 size-4" /> Novo Cliente {limits.max_clients < 9999 && `(${limits.current_clients}/${limits.max_clients})`}
          </Button>
        )}
      />

      <div className="space-y-6">
        <PageFilters options={filterOptions} activeKey={filterStatus} onSelect={setFilterStatus} />
        <PageSearch value={search} onChange={setSearch} placeholder="Buscar por nome ou telefone..." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((client) => (
            <motion.div
              key={client.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="size-10 sm:size-12 rounded-xl sm:rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 border border-slate-100 shrink-0 text-xs sm:text-sm">
                    {client.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 uppercase italic leading-tight truncate text-sm sm:text-base">{client.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      {client.is_vip ? (
                        <Badge className="bg-amber-100 text-amber-600 border-none font-black text-[7px] sm:text-[8px] uppercase px-1.5 py-0">VIP</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[7px] sm:text-[8px] uppercase px-1.5 py-0">Comum</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="size-8 rounded-lg text-slate-400" onClick={() => { setEditingClient(client); setFormData({ name: client.name, phone: client.phone || "", email: client.email || "" }); setNewClientOpen(true) }}>
                    <Plus className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 rounded-lg text-rose-400" onClick={() => handleDeleteClient(client.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-wide sm:tracking-widest block">Gasto Total</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 italic">R$ {(client.total_spent || 0).toFixed(2)}</span>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-wide sm:tracking-widest block">Frequência</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 italic">{client.orders_count || 0} Pedidos</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}`, '_blank')}
                  className="flex-1 h-9 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[9px] sm:text-[10px] gap-1.5 sm:gap-2"
                  disabled={!client.phone}
                >
                  <MessageCircle className="size-3.5 sm:size-4" /> WhatsApp
                </Button>
                <Button 
                  onClick={() => window.location.href = `mailto:${client.email}`}
                  variant="outline" 
                  className="h-9 sm:h-10 rounded-lg sm:rounded-xl font-black uppercase text-[9px] sm:text-[10px] text-slate-400 border-slate-100 px-3"
                  disabled={!client.email}
                >
                  <Mail className="size-3.5 sm:size-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && filtered.length === 0 && (
          <EmptyStateV2 
            icon={Users}
            title="Nenhum cliente"
            subtitle="Cadastre seus clientes para gerenciar pedidos e fidelizar transações"
            action={<Button onClick={() => setNewClientOpen(true)} className="h-10 px-6 rounded-xl bg-rose-500 text-white font-black uppercase text-[10px]">Novo Cliente</Button>}
          />
        )}
      </div>

      <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-2xl sm:rounded-[32px] p-4 sm:p-6 lg:p-8 mx-auto">
          <DialogHeader className="mb-4 sm:mb-6"><DialogTitle className="text-lg sm:text-xl lg:text-2xl font-black uppercase italic">{editingClient ? 'Editar' : 'Cadastrar'} Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4 sm:space-y-5 font-bold">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-[9px] sm:text-[10px] uppercase text-slate-400">Nome Completo</Label>
              <Input className="h-11 sm:h-12 rounded-lg sm:rounded-xl text-base" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2"><Label className="text-[9px] sm:text-[10px] uppercase text-slate-400">Telefone / WhatsApp</Label><Input className="h-11 sm:h-12 rounded-lg sm:rounded-xl text-base" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
              <div className="space-y-1.5 sm:space-y-2"><Label className="text-[9px] sm:text-[10px] uppercase text-slate-400">Email</Label><Input type="email" className="h-11 sm:h-12 rounded-lg sm:rounded-xl text-base" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
            </div>
            <Button onClick={handleSaveClient} disabled={isSaving} className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-rose-500 font-black uppercase text-white shadow-lg mt-3 sm:mt-4 text-sm sm:text-base">{isSaving ? "Gravando..." : "Salvar Cadastro"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
