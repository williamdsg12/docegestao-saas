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
  total_orders?: number
  last_order_at?: string
  created_at?: string
  is_vip: boolean
  has_duplicate_inconsistency?: boolean
  cpf_cnpj?: string
  cep?: string
  address?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  complement?: string
  reference_point?: string
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
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("todos")
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const [formData, setFormData] = useState({ 
    name: "", 
    phone: "", 
    email: "", 
    birthday: "", 
    is_vip: false,
    cpf_cnpj: "",
    cep: "",
    address: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    complement: "",
    reference_point: ""
  })

  const isBirthdayThisMonth = (dateString: string) => {
    if (!dateString) return false
    try {
      const currentMonth = new Date().getMonth()
      const bDate = new Date(dateString)
      return bDate.getMonth() === currentMonth
    } catch {
      return false
    }
  }

  // Fetch clients from Supabase database
  async function fetchClients() {
    const tenantId = profile?.tenant_id || profile?.company_id
    if (!tenantId) return
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase.from('customers').select('*').eq('tenant_id', tenantId).is('deleted_at', null).order('name')
      if (error) throw error

      console.log('Clientes recebidos:', data)

      // Detect duplicates locally on retrieved phone numbers
      const phoneCounts: Record<string, number> = {}
      if (Array.isArray(data)) {
        data.forEach((c: any) => {
          const clean = c.phone?.replace(/\D/g, "")
          if (clean && clean.length >= 10) {
            phoneCounts[clean] = (phoneCounts[clean] || 0) + 1
          }
        })
      }

      const clientsWithInconsistency = Array.isArray(data)
        ? data.map((c: any) => {
            const clean = c.phone?.replace(/\D/g, "")
            return {
              ...c,
              has_duplicate_inconsistency: clean && phoneCounts[clean] > 1
            }
          })
        : []

      setClients(clientsWithInconsistency)
    } catch (err: any) {
      console.error('Erro ao buscar clientes:', err)
      setError(err.message || 'Erro ao carregar os clientes')
    } finally {
      setLoading(false)
    }
  }

  // Subscribe to Supabase Realtime changes and trigger fetches on profile changes
  useEffect(() => {
    const tenantId = profile?.tenant_id || profile?.company_id
    if (!tenantId) return

    fetchClients()

    // Create a realtime subscription to hear insert/update/delete events
    const channel = supabase
      .channel(`realtime-customers-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          console.log('Realtime change received for customers:', payload)
          fetchClients()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile])

  async function handleSaveClient() {
    if (!editingClient && !canAddClient()) return toast.error("Limite do plano atingido!")
    if (!formData.name) return toast.error("Nome é obrigatório")

    const cleanPhone = formData.phone.replace(/\D/g, "")
    if (!cleanPhone || cleanPhone.length < 10) {
      return toast.error("Telefone inválido. Deve conter DDD + número (mínimo 10 dígitos).")
    }

    setIsSaving(true)
    try {
      const tenantId = profile?.tenant_id || profile?.company_id
      const payload = {
        name: formData.name,
        full_name: formData.name,
        phone: cleanPhone,
        email: formData.email || null,
        birthday: formData.birthday || null,
        is_vip: formData.is_vip,
        cpf_cnpj: formData.cpf_cnpj || null,
        cep: formData.cep || null,
        address: formData.address || null,
        number: formData.number || null,
        neighborhood: formData.neighborhood || null,
        city: formData.city || null,
        state: formData.state || null,
        complement: formData.complement || null,
        reference_point: formData.reference_point || null
      }
      if (editingClient) {
        await supabase.from('customers').update(payload).eq('id', editingClient.id)
        toast.success("Cliente atualizado!")
      } else {
        await supabase.from('customers').insert({ ...payload, tenant_id: tenantId })
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
    setFormData({ 
      name: "", 
      phone: "", 
      email: "", 
      birthday: "", 
      is_vip: false,
      cpf_cnpj: "",
      cep: "",
      address: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      complement: "",
      reference_point: ""
    })
  }

  async function handleDeleteClient(id: string) {
    if (!confirm("Excluir este cliente?")) return
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Erro ao deletar')
      setClients(prev => prev.filter(c => c.id !== id))
      toast.success("Excluído")
    } catch (e) {
      console.error(e)
      toast.error("Erro ao excluir cliente")
    }
  }

  const filtered = Array.isArray(clients)
    ? clients.filter(c => {
        const clientNameClean = c.name || "";
        const matchSearch = clientNameClean.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
        let matchStatus = false
        if (filterStatus === "todos") matchStatus = true
        if (filterStatus === "vip") matchStatus = c.is_vip
        if (filterStatus === "comum") matchStatus = !c.is_vip
        if (filterStatus === "aniversariantes") matchStatus = isBirthdayThisMonth(c.birthday)
        
        return matchSearch && matchStatus
      })
    : []

  const filterOptions = [
    { key: "todos", label: "Todos", count: Array.isArray(clients) ? clients.length : 0 },
    { key: "vip", label: "VIP", count: Array.isArray(clients) ? clients.filter(c => c.is_vip).length : 0 },
    { key: "comum", label: "Comuns", count: Array.isArray(clients) ? clients.filter(c => !c.is_vip).length : 0 },
    { key: "aniversariantes", label: "Aniversariantes (Mês)", count: Array.isArray(clients) ? clients.filter(c => isBirthdayThisMonth(c.birthday)).length : 0 },
  ]

  return (
    <>
      <PageHeader 
        title="Gestão de" 
        highlight="Clientes" 
        subtitle="Construa relacionamentos duradouros e fidelize quem ama seus doces"
        actions={(
          <Button onClick={() => setNewClientOpen(true)} className="h-11 px-6 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] font-black uppercase text-[10px] text-white shadow-lg">
            <Plus className="mr-2 size-4" /> Novo Cliente {limits.max_clients < 9999 && `(${limits.current_clients}/${limits.max_clients})`}
          </Button>
        )}
      />

      <div className="space-y-6">
        <PageFilters options={filterOptions} activeKey={filterStatus} onSelect={setFilterStatus} />
        <PageSearch value={search} onChange={setSearch} placeholder="Buscar por nome ou telefone..." />
      </div>

<<<<<<< HEAD
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
=======
      {error && (
        <div className="p-8 rounded-3xl border border-red-100 bg-red-50/50 text-red-700 text-center space-y-4">
          <p className="font-bold text-sm">Ocorreu um erro ao carregar seus clientes.</p>
          <p className="text-xs text-red-500 font-mono">{error}</p>
          <Button onClick={fetchClients} className="h-10 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px]">
            Tentar Novamente
          </Button>
        </div>
      )}

      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
              <div className="size-10 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] animate-pulse">Carregando clientes...</span>
            </div>
          )}

          {!loading && Array.isArray(filtered) && filtered.length > 0 && (
            <AnimatePresence mode="popLayout">
              {filtered.map((client) => (
                <motion.div
                  key={client.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group bg-white rounded-3xl border border-[var(--border)] p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center font-black text-[var(--primary)] border border-[var(--border)]">
                        {(client.name || "Cliente").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-black text-[var(--text-primary)] uppercase italic leading-tight truncate max-w-[150px]">{client.name || "Cliente sem Nome"}</h3>
                        <div className="flex items-center gap-1 flex-wrap">
                          {client.is_vip ? (
                            <Badge className="bg-[var(--accent-light)] text-[var(--primary)] border-none font-black text-[8px] uppercase px-1.5 py-0">VIP</Badge>
                          ) : (
                            <Badge className="bg-[var(--bg-app)] text-[var(--text-muted)] border-none font-black text-[8px] uppercase px-1.5 py-0">Comum</Badge>
                          )}
                          {client.has_duplicate_inconsistency && (
                            <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[8px] uppercase px-1.5 py-0 animate-pulse" title="Inconsistência: Telefone duplicado!">Duplicado</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="size-8 rounded-lg text-[var(--text-muted)]" onClick={() => { 
                        setEditingClient(client); 
                        setFormData({ 
                          name: client.name || "", 
                          phone: client.phone || "", 
                          email: client.email || "", 
                          birthday: client.birthday || "", 
                          is_vip: client.is_vip || false,
                          cpf_cnpj: client.cpf_cnpj || "",
                          cep: client.cep || "",
                          address: client.address || "",
                          number: client.number || "",
                          neighborhood: client.neighborhood || "",
                          city: client.city || "",
                          state: client.state || "",
                          complement: client.complement || "",
                          reference_point: client.reference_point || ""
                        }); 
                        setNewClientOpen(true) 
                      }}>
                        <Plus className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 rounded-lg text-[var(--danger)]" onClick={() => handleDeleteClient(client.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-[var(--accent-light)]/30 border border-[var(--border)]">
                      <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Gasto Total</span>
                      <span className="text-sm font-black text-[var(--text-primary)] italic">R$ {(client.total_spent || 0).toFixed(2)}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[var(--accent-light)]/30 border border-[var(--border)]">
                      <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Frequência</span>
                      <span className="text-sm font-black text-[var(--text-primary)] italic">{client.total_orders || client.orders_count || 0} Pedidos</span>
                    </div>
                    
                    <div className="p-3 rounded-2xl bg-[var(--accent-light)]/30 border border-[var(--border)] col-span-2 text-xs space-y-2 text-slate-700">
                      <div>
                        <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">ID</span>
                        <span className="font-mono text-[9px] text-[var(--text-primary)] break-all">{client.id}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Telefone</span>
                        <span className="font-bold text-[var(--text-primary)]">{client.phone}</span>
                      </div>
                      {client.cpf_cnpj && (
                        <div>
                          <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">CPF / CNPJ</span>
                          <span className="font-bold text-[var(--text-primary)]">{client.cpf_cnpj}</span>
                        </div>
                      )}
                      {client.cep && (
                        <div>
                          <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">CEP</span>
                          <span className="font-bold text-[var(--text-primary)]">{client.cep}</span>
                        </div>
                      )}
                      {client.address && (
                        <div>
                          <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Endereço</span>
                          <span className="font-bold text-[var(--text-primary)] block">
                            {client.address}, {client.number} {client.complement && `- ${client.complement}`}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {client.neighborhood} - {client.city}/{client.state}
                          </span>
                          {client.reference_point && (
                            <span className="text-[10px] text-slate-400 italic block">
                              Ref: {client.reference_point}
                            </span>
                          )}
                        </div>
                      )}
                      {client.birthday && (
                        <div>
                          <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block flex items-center gap-1"><Gift className="size-3 text-[var(--secondary)]" /> Aniversário</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {new Date(client.birthday + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                      {client.last_order_at && (
                        <div>
                          <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Último Pedido</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {new Date(client.last_order_at).toLocaleDateString('pt-BR')} {new Date(client.last_order_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      {client.created_at && (
                        <div>
                          <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Data Cadastro</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {new Date(client.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {client.has_duplicate_inconsistency && (
                    <div className="mb-4 p-2 bg-amber-50 rounded-xl border border-amber-100/50 flex items-center gap-1.5 text-[9px] text-amber-800 font-bold leading-tight uppercase tracking-wider">
                      <span>⚠️ Telefone duplicado detectado</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}`, '_blank')}
                      className="flex-1 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] gap-2"
                      disabled={!client.phone}
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </Button>
                    <Button 
                      onClick={() => window.location.href = `mailto:${client.email}`}
                      variant="outline" 
                      className="h-10 rounded-xl font-black uppercase text-[10px] text-slate-400 border-slate-100"
                      disabled={!client.email}
                    >
                      <Mail size={14} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
>>>>>>> d8bd0f007bcba4de2d011984f266ae7f01f1b5f5

          {!loading && (!Array.isArray(filtered) || filtered.length === 0) && (
            <div className="col-span-full">
              <EmptyStateV2 
                icon={Users}
                title="Nenhum cliente"
                subtitle="Cadastre seus clientes para gerenciar pedidos e fidelizar transações"
                action={<Button onClick={() => setNewClientOpen(true)} className="h-10 px-6 rounded-xl bg-rose-500 text-white font-black uppercase text-[10px]">Novo Cliente</Button>}
              />
            </div>
          )}
        </div>
      )}

      <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
<<<<<<< HEAD
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
=======
        <DialogContent className="sm:max-w-xl rounded-[32px] p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-black uppercase italic">{editingClient ? 'Editar' : 'Cadastrar'} Cliente</DialogTitle></DialogHeader>
          <div className="space-y-5 font-bold">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase text-slate-400">Nome Completo</Label>
              <Input className="h-12 rounded-xl" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Telefone / WhatsApp</Label><Input className="h-12 rounded-xl" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">CPF / CNPJ</Label><Input className="h-12 rounded-xl" placeholder="000.000.000-00" value={formData.cpf_cnpj} onChange={e => setFormData({ ...formData, cpf_cnpj: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Email</Label><Input type="email" className="h-12 rounded-xl" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[10px] uppercase text-slate-400">Data de Nascimento</Label><Input type="date" className="h-12 rounded-xl" value={formData.birthday} onChange={e => setFormData({ ...formData, birthday: e.target.value })} /></div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Endereço de Entrega</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-slate-400">CEP</Label>
                  <Input 
                    className="h-12 rounded-xl" 
                    placeholder="00000-000" 
                    value={formData.cep} 
                    onChange={async (e) => {
                      const val = e.target.value
                      setFormData(prev => ({ ...prev, cep: val }))
                      const clean = val.replace(/\D/g, "")
                      if (clean.length === 8) {
                        try {
                          const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
                          const data = await res.json()
                          if (!data.erro) {
                            setFormData(prev => ({
                              ...prev,
                              address: data.logradouro,
                              neighborhood: data.bairro,
                              city: data.localidade,
                              state: data.uf
                            }))
                          }
                        } catch (err) {
                          console.error("Error fetching CEP", err)
                        }
                      }
                    }} 
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] uppercase text-slate-400">Rua / Logradouro</Label>
                  <Input className="h-12 rounded-xl" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-slate-400">Número</Label>
                  <Input className="h-12 rounded-xl" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] uppercase text-slate-400">Bairro</Label>
                  <Input className="h-12 rounded-xl" value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] uppercase text-slate-400">Cidade</Label>
                  <Input className="h-12 rounded-xl" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-slate-400">Estado (UF)</Label>
                  <Input className="h-12 rounded-xl" placeholder="UF" maxLength={2} value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-slate-400">Complemento</Label>
                  <Input className="h-12 rounded-xl" placeholder="Apto, bloco, etc." value={formData.complement} onChange={e => setFormData({ ...formData, complement: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-slate-400">Ponto de Referência</Label>
                  <Input className="h-12 rounded-xl" placeholder="Ex: Perto do parque" value={formData.reference_point} onChange={e => setFormData({ ...formData, reference_point: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="space-y-2 flex flex-col justify-center pt-2">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Input type="checkbox" className="size-5 rounded border-slate-200 text-primary focus:ring-primary" checked={formData.is_vip} onChange={e => setFormData({ ...formData, is_vip: e.target.checked })} />
                <span className="text-sm font-black text-slate-700 uppercase italic">Cliente VIP</span>
              </Label>
            </div>

            <Button onClick={handleSaveClient} disabled={isSaving} className="w-full h-14 rounded-2xl bg-rose-500 font-black uppercase text-white shadow-lg mt-4">{isSaving ? "Gravando..." : "Salvar Cadastro"}</Button>
>>>>>>> d8bd0f007bcba4de2d011984f266ae7f01f1b5f5
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
