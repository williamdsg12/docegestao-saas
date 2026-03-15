"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  CreditCard,
  Truck,
  MapPin,
  Clock,
  ExternalLink,
  Phone,
  ChevronDown
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export default function HistoricoPage() {
  const { business } = useBusiness()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")

  useEffect(() => {
    if (business?.id) {
      fetchOrders()
    }
  }, [business?.id, statusFilter, paymentFilter])

  async function fetchOrders() {
    try {
      setLoading(true)
      let query = supabase
        .from('pedidos')
        .select('*, clientes(nome, telefone), itens_pedido(count)')
        .eq('empresa_id', business!.id)
        .order('created_at', { ascending: false })

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter)
      }
      if (paymentFilter !== "all") {
        query = query.eq('payment_method', paymentFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      toast.error("Erro ao carregar histórico")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(o => 
    (o.clientes?.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'entregue': return <Badge className="bg-emerald-50 text-emerald-600 border-none font-black uppercase text-[10px] tracking-widest px-3 py-1">Entregue</Badge>
      case 'cancelado': return <Badge className="bg-rose-50 text-rose-600 border-none font-black uppercase text-[10px] tracking-widest px-3 py-1">Cancelado</Badge>
      case 'saiu_entrega': return <Badge className="bg-blue-50 text-blue-600 border-none font-black uppercase text-[10px] tracking-widest px-3 py-1">Em Trânsito</Badge>
      case 'em_preparo': return <Badge className="bg-amber-50 text-amber-600 border-none font-black uppercase text-[10px] tracking-widest px-3 py-1">Preparando</Badge>
      default: return <Badge className="bg-slate-50 text-slate-600 border-none font-black uppercase text-[10px] tracking-widest px-3 py-1">{status.toUpperCase()}</Badge>
    }
  }

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">
            Gestão de <span className="text-pink-500">Vendas</span>
          </h1>
          <p className="text-slate-500 font-medium italic uppercase text-[10px] tracking-widest ml-1">Relatórios e Histórico de Pedidos Profissional</p>
        </div>

        <Button className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest flex gap-3 shadow-2xl transition-all active:scale-95">
          <Download className="size-5" />
          Gerar Relatório PDF
        </Button>
      </div>

      <div className="bg-white rounded-[48px] border-none shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex flex-col xl:flex-row gap-8 justify-between items-center">
          <div className="relative w-full xl:max-w-md group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-pink-500 transition-colors" />
            <Input 
              placeholder="Buscar por cliente ou ID..." 
              className="pl-14 h-16 rounded-[28px] bg-slate-50 border-none font-bold w-full focus-visible:ring-2 focus-visible:ring-pink-500/10 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-16 rounded-[24px] bg-slate-50 border-none font-black uppercase text-[10px] tracking-widest px-8 flex gap-4 text-slate-600 hover:bg-slate-100">
                  <Filter className="size-4 text-pink-500" />
                  Status: <span className="text-slate-900 border-b-2 border-pink-500/20">{statusFilter === 'all' ? 'Todos' : statusFilter.toUpperCase()}</span>
                  <ChevronDown className="size-4 opacity-30" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-[24px] border-none shadow-2xl p-4 min-w-[200px]">
                {['all', 'recebido', 'confirmado', 'em_preparo', 'pronto', 'saiu_entrega', 'entregue', 'cancelado'].map(s => (
                  <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className="font-black uppercase text-[10px] tracking-widest px-6 py-4 cursor-pointer rounded-xl hover:bg-pink-50 hover:text-pink-600 transition-all mb-1">
                    {s === 'all' ? 'Todos os Status' : s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-16 rounded-[24px] bg-slate-50 border-none font-black uppercase text-[10px] tracking-widest px-8 flex gap-4 text-slate-600 hover:bg-slate-100">
                  <CreditCard className="size-4 text-pink-500" />
                  Pagamento: <span className="text-slate-900 border-b-2 border-pink-500/20">{paymentFilter === 'all' ? 'Todos' : paymentFilter.toUpperCase()}</span>
                  <ChevronDown className="size-4 opacity-30" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-[24px] border-none shadow-2xl p-4 min-w-[200px]">
                {['all', 'pix', 'dinheiro', 'cartao'].map(p => (
                  <DropdownMenuItem key={p} onClick={() => setPaymentFilter(p)} className="font-black uppercase text-[10px] tracking-widest px-6 py-4 cursor-pointer rounded-xl hover:bg-pink-50 hover:text-pink-600 transition-all mb-1">
                    {p === 'all' ? 'Todos os Métodos' : p.toUpperCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="h-16 px-8 bg-slate-900 text-white rounded-[24px] flex items-center gap-4 shadow-xl">
               <Calendar className="size-4 text-pink-500" />
               <span className="text-[10px] font-black uppercase tracking-widest">Últimos 30 dias</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-50 hover:bg-transparent">
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 py-10 px-10">Pedido & Data</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 py-10">Cliente & Contato</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 py-10 text-center">Modo</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 py-10 text-center">Status Venda</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 py-10 text-right px-10">Valor Líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center gap-6 opacity-40">
                      <div className="size-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
                      <span className="font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <Clock className="size-4" /> Sincronizando Dados Base...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center gap-6 opacity-40">
                      <div className="size-24 bg-slate-50 rounded-[40px] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-slate-100 animate-pulse" />
                        <ClipboardList className="size-10 relative z-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter italic">Histórico Vazio</h3>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aguardando seu primeiro pedido para registrar.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-slate-50 hover:bg-slate-50/80 group transition-all cursor-pointer">
                    <TableCell className="py-10 px-10">
                       <div className="space-y-1">
                          <p className="font-black text-slate-900 text-sm uppercase italic tracking-tighter">#{order.numero_pedido || order.id.slice(0, 4)}</p>
                          <p className="font-medium text-[10px] text-slate-400 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
                       </div>
                    </TableCell>
                    <TableCell className="py-10">
                      <div className="flex items-center gap-6">
                        <div className="size-14 rounded-[20px] bg-slate-900 flex items-center justify-center font-black text-pink-500 uppercase text-lg italic tracking-widest border border-slate-800">
                          {(order.clientes?.nome || "U").charAt(0)}
                        </div>
                        <div className="space-y-1 border-l border-slate-100 pl-6">
                          <p className="font-black text-slate-900 uppercase italic tracking-tight text-lg">{order.clientes?.nome || "Cliente Desconhecido"}</p>
                          <p className="text-[10px] font-black text-slate-400 flex items-center gap-2 tracking-widest">
                             <Phone className="size-3 text-emerald-500" /> {order.clientes?.telefone || "N/A"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-10">
                      <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-600 border border-slate-100/50">
                        {order.tipo_pedido === 'delivery' ? <Truck className="size-3 text-pink-500" /> : <MapPin className="size-3 text-pink-500" />}
                        {order.tipo_pedido?.toUpperCase() || 'DELIVERY'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-10">
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell className="text-right py-10 px-10">
                       <div className="space-y-1">
                          <p className="font-black text-slate-900 text-2xl italic tracking-tighter">R$ {order.valor_total?.toFixed(2) || '0.00'}</p>
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{order.payment_method?.toUpperCase() || 'N/A'}</p>
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
  )
}
