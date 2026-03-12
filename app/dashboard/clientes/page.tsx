"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Star, Gift, Filter, MoreHorizontal, Mail, Phone, Calendar, UserPlus, TrendingUp, MessageCircle, SearchX } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface Client {
  id: string
  name: string
  phone: string
  email: string
  birthday: string
  total_spent: number
  orders_count: number
  last_purchase: string
  is_vip: boolean
}

export default function ClientesPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // New Client Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    birthday: ""
  })

  useEffect(() => {
    if (user) {
      fetchClients()
    }
  }, [user])

  async function fetchClients() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setClients(data || [])
    } catch (error: any) {
      console.error("Error fetching clients:", error.message || error)
      toast.error("Erro ao carregar clientes")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveClient() {
    if (!formData.name) {
      toast.error("O nome é obrigatório")
      return
    }

    setIsSaving(true)
    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
          })
          .eq('id', editingClient.id)

        if (error) throw error
        
        toast.success("Cliente atualizado com sucesso!")
        fetchClients()
      } else {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            user_id: user?.id,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
          })
          .select()
          .single()

        if (error) throw error

        setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
        toast.success("Cliente cadastrado com sucesso!")
      }
      
      handleCloseModal()
    } catch (error: any) {
      console.error("Error saving client:", error.message || error)
      if (error.message?.includes("subscription")) {
        toast.error("Sua assinatura expirou. Renove para cadastrar novos clientes.")
      } else {
        toast.error("Erro ao salvar cliente")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCloseModal = () => {
    setNewClientOpen(false)
    setEditingClient(null)
    setFormData({ name: "", phone: "", email: "", birthday: "" })
  }

  async function handleDeleteClient(id: string) {
    if (!window.confirm("Deseja realmente excluir este cliente?")) return
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
      setClients(prev => prev.filter(c => c.id !== id))
      toast.success("Cliente excluído!")
    } catch (error: any) {
      console.error("Error deleting:", error.message || error)
      toast.error("Erro ao excluir cliente")
    }
  }

  const handleWhatsAppClick = (client: Client) => {
    if (!client.phone) {
      toast.error("Cliente não possui telefone cadastrado")
      return
    }
    const text = `Olá ${client.name}! Aqui é da DoceGestão. Passando para desejar um ótimo dia!`
    window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = [
    { label: "Clientes", value: clients.length, icon: UserPlus, color: "text-primary" },
    { label: "VIPs", value: clients.filter(c => c.is_vip).length, icon: Star, color: "text-amber-600" },
    { label: "Receita Total", value: `R$ ${clients.reduce((acc: number, curr: any) => acc + (curr.total_spent || 0), 0).toLocaleString()}`, icon: TrendingUp, color: "text-green-600" },
    { label: "Pedidos", value: clients.reduce((acc: number, curr: any) => acc + (curr.orders_count || 0), 0), icon: Gift, color: "text-pink-500" },
  ]

  return (
    <div className="space-y-12 pb-24">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-2 uppercase italic leading-none">
            Gestão de <span className="text-primary tracking-tighter">Clientes</span>
          </h1>
          <p className="text-slate-500 font-medium">Relacionamento, fidelização e histórico completo de quem ama seus doces.</p>
        </div>

        <Dialog open={newClientOpen} onOpenChange={(val) => {
          if (!val) handleCloseModal()
          else setNewClientOpen(true)
        }}>
          <DialogTrigger asChild>
            <Button className="h-14 px-10 rounded-[20px] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
              <Plus className="mr-2 size-5" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl border-white/60 bg-white/90 backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl overflow-hidden text-slate-900">
            <div className="absolute -top-24 -right-24 size-48 bg-primary/10 rounded-full blur-3xl" />
            <DialogHeader className="mb-8 relative z-10">
              <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic">
                Cadastrar <span className="text-primary italic">Cliente</span>
              </DialogTitle>
              <p className="text-slate-500 text-sm font-medium">Crie um perfil rico para personalizar seu atendimento.</p>
            </DialogHeader>

            <div className="grid gap-8 relative z-10">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</Label>
                <Input
                  placeholder="Ex: Maria das Graças"
                  className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all font-primary text-slate-900"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp / Telefone</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 focus:ring-primary/10 font-bold text-slate-900"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data de Aniversário</Label>
                  <Input
                    type="date"
                    className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 focus:ring-primary/10 font-bold text-slate-900"
                    value={formData.birthday}
                    onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email (Opcional)</Label>
                <Input
                  type="email"
                  placeholder="cliente@exemplo.com"
                  className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 focus:ring-primary/10 font-bold text-slate-900 font-primary"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <Button
                className="h-14 mt-4 rounded-2xl bg-gradient-to-r from-primary to-rose-500 hover:from-primary/90 hover:to-rose-600 font-black text-lg shadow-xl shadow-primary/20 text-white uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                onClick={handleSaveClient}
                disabled={isSaving}
              >
                {isSaving ? "PROCESSANDO..." : "CONFIRMAR CADASTRO ✨"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* CRM Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
          >
            <div className="group relative h-full overflow-hidden rounded-[32px] border border-white/60 bg-white/40 backdrop-blur-xl p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute -top-12 -right-12 size-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className={cn("flex size-14 items-center justify-center rounded-2xl text-white shadow-xl transform group-hover:rotate-6 transition-transform duration-500", stat.color.replace('text-', 'bg-').replace('600', '400').replace('primary', 'bg-primary/80').replace('amber-600', 'bg-amber-400'))}>
                  <stat.icon className="size-7" />
                </div>
              </div>

              <div className="relative z-10">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Pesquisar clientes por nome, telefone ou email..."
            className="h-14 rounded-3xl border-white/60 bg-white/40 backdrop-blur-md pl-14 text-slate-900 placeholder:text-slate-400 focus:ring-8 focus:ring-primary/5 focus:border-primary/20 transition-all shadow-xl shadow-rose-200/5"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-14 px-8 rounded-3xl border-white bg-white/40 backdrop-blur-md text-slate-600 hover:text-primary font-black uppercase tracking-widest text-[10px] shadow-lg border">
          <Filter className="mr-2 size-4" />
          Filtros Avançados
        </Button>
      </div>

      {/* Clients Grid 2.0 */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-40 flex flex-col items-center justify-center">
            <div className="size-16 border-8 border-rose-100 border-t-primary rounded-full animate-spin shadow-xl" />
            <p className="mt-6 text-slate-400 font-black uppercase tracking-widest text-[10px]">Sincronizando base de clientes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-32 text-center flex flex-col items-center justify-center">
            <div className="size-32 bg-rose-50 rounded-[40px] flex items-center justify-center text-primary mb-8">
              <SearchX className="size-16 opacity-20" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Cliente não encontrado</h3>
            <p className="text-slate-500 mt-4 max-w-sm font-medium">Não encontramos ninguém com esses termos na sua base atual.</p>
            <Button className="mt-6 text-primary font-black uppercase tracking-widest text-xs">+ Cadastrar Novo</Button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((client, i) => (
              <motion.div
                layout
                key={client.id}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }}
                className="group relative flex flex-col overflow-hidden rounded-[40px] border border-white/60 bg-white/40 backdrop-blur-xl p-8 hover:shadow-[0_20px_50px_rgba(244,114,182,0.15)] transition-all duration-500 hover:-translate-y-2"
              >
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="flex size-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-rose-50 to-white border border-rose-100 text-xl font-black text-primary shadow-xl transform group-hover:rotate-[-5deg] transition-transform duration-500">
                        {client.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      {client.is_vip && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 3 }}
                          className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-amber-400 text-zinc-950 ring-4 ring-white shadow-lg"
                        >
                          <Star className="size-4 fill-current" />
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-tight group-hover:text-primary transition-colors">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        {client.is_vip ? (
                          <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">CLIENTE VIP</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">COMUM</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setEditingClient(client)
                        setFormData({
                          name: client.name,
                          phone: client.phone || "",
                          email: client.email || "",
                          birthday: client.birthday || ""
                        })
                        setNewClientOpen(true)
                      }}
                      className="rounded-full text-primary hover:bg-primary/10 text-xs font-bold uppercase tracking-widest px-4 transition-all"
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleDeleteClient(client.id)}
                      className="rounded-full text-rose-500 hover:bg-rose-50 text-xs font-bold uppercase tracking-widest px-4 transition-all"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 p-4 rounded-3xl bg-white/50 border border-white/40 shadow-sm">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gasto Total</span>
                      <span className="text-lg font-black text-slate-900 tracking-tighter">R$ {(client.total_spent || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-4 rounded-3xl bg-white/50 border border-white/40 shadow-sm">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Frequência</span>
                      <span className="text-lg font-black text-slate-900 tracking-tighter">{client.orders_count || 0} Pedidos</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600 bg-rose-50/50 p-3 rounded-2xl border border-rose-100/30">
                      <Calendar className="size-4 text-primary" />
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nascimento:</span>
                      <span className="text-slate-900 font-bold">{client.birthday ? new Date(client.birthday).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' }) : 'Não informado'}</span>
                    </div>
                    {client.last_purchase && (
                      <div className="flex items-center gap-3 text-sm font-medium text-slate-600 bg-rose-50/50 p-3 rounded-2xl border border-rose-100/30">
                        <TrendingUp className="size-4 text-primary" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Última Venda:</span>
                        <span className="text-slate-900 font-bold">{new Date(client.last_purchase).toLocaleDateString("pt-BR")}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-6 border-t border-rose-100/30 font-primary">
                    <Button
                      onClick={() => handleWhatsAppClick(client)}
                      className="h-14 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-green-200 transition-all hover:scale-[1.05] active:scale-95"
                    >
                      <MessageCircle className="mr-2 size-5" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14 rounded-2xl border-white bg-white/40 backdrop-blur-md text-slate-600 hover:text-primary font-black uppercase tracking-widest text-[10px] shadow-lg border transition-all"
                    >
                      <Mail className="mr-2 size-5" />
                      Email
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
