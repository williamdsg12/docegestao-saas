"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Search,
  CheckCircle2,
  Truck,
  FileText,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Flame,
  SearchX,
  MessageCircle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  format,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

type OrderStatus = "orcamento" | "confirmado" | "producao" | "finalizado" | "entregue"

const statusConfig: Record<OrderStatus, { label: string, color: string, icon: any, bg: string, iconBg: string, border: string }> = {
  orcamento: { label: "Orçamento", color: "text-slate-500", icon: FileText, bg: "bg-slate-100", iconBg: "bg-slate-400", border: "border-slate-200" },
  confirmado: { label: "Confirmado", color: "text-blue-600", icon: CheckCircle2, bg: "bg-blue-50", iconBg: "bg-blue-400", border: "border-blue-200" },
  producao: { label: "Produção", color: "text-amber-600", icon: Flame, bg: "bg-amber-50", iconBg: "bg-amber-400", border: "border-amber-200" },
  finalizado: { label: "Finalizado", color: "text-primary", icon: CheckCircle2, bg: "bg-rose-50", iconBg: "bg-primary/80", border: "border-rose-200" },
  entregue: { label: "Entregue", color: "text-green-600", icon: Truck, bg: "bg-green-50", iconBg: "bg-green-400", border: "border-green-200" },
}

const mockedOrders = [
  {
    id: "ord-1",
    client_name: "Mariana Costa",
    product_name: "Bolo de Casamento 3 Andares (M)",
    total_value: 850.00,
    deposit_value: 425.00,
    status: "confirmado" as OrderStatus,
    delivery_date: new Date(Date.now() + 86400000 * 3).toISOString(),
  },
  {
    id: "ord-2",
    client_name: "Juliana Mendes",
    product_name: "Kit Festa 50 Pessoas (Classic)",
    total_value: 520.00,
    deposit_value: 520.00,
    status: "producao" as OrderStatus,
    delivery_date: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    id: "ord-3",
    client_name: "Ricardo Oliveira",
    product_name: "Cento de Brigadeiros Gourmet",
    total_value: 180.00,
    deposit_value: 90.00,
    status: "orcamento" as OrderStatus,
    delivery_date: new Date(Date.now() + 86400000 * 5).toISOString(),
  },
  {
    id: "ord-4",
    client_name: "Fernanda Lima",
    product_name: "Torta Holandesa Grande",
    total_value: 145.00,
    deposit_value: 145.00,
    status: "finalizado" as OrderStatus,
    delivery_date: new Date(Date.now()).toISOString(),
  },
  {
    id: "ord-5",
    client_name: "Camila Rocha",
    product_name: "Barra de Chocolate Recheada (Especial)",
    total_value: 65.00,
    deposit_value: 65.00,
    status: "entregue" as OrderStatus,
    delivery_date: new Date(Date.now() - 86400000).toISOString(),
  }
]

export default function CapturePedidosPage() {
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("todos")

  const filtered = mockedOrders.filter((o) => {
    const matchSearch = o.client_name.toLowerCase().includes(search.toLowerCase()) ||
      o.product_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "todos" || o.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="min-h-screen bg-slate-50/50 p-12 space-y-12">
      {/* Header Section */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-2 uppercase italic leading-none">
            Gestão de <span className="text-primary tracking-tighter">Pedidos</span>
          </h1>
          <p className="text-slate-500 font-medium">Controle sua produção e encante seus clientes com organização absoluta.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button className="h-14 px-10 rounded-[20px] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30">
            <Plus className="mr-2 size-5" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-3 pb-2 overflow-x-auto scrollbar-hide">
          {["total", "orcamento", "confirmado", "producao", "finalizado", "entregue"].map((key, i) => {
            const isActive = (key === "total" && filterStatus === "todos") || filterStatus === key
            const config = (key as any) !== "total" ? (statusConfig as any)[key] : { label: "Todos", icon: Search }

            return (
              <button
                key={key}
                onClick={() => setFilterStatus(key === "total" ? "todos" : key)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-500 whitespace-nowrap",
                  isActive
                    ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                    : "bg-white/40 backdrop-blur-md border-white/60 text-slate-500"
                )}
              >
                <config.icon className={cn("size-4", isActive ? "text-white" : "text-primary")} />
                <span className="text-xs font-black uppercase tracking-widest">{config.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Pesquisar por cliente, produto ou ID..."
              className="h-14 rounded-3xl border-white/60 bg-white/40 backdrop-blur-md pl-14 text-slate-900 shadow-xl shadow-rose-200/5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((order, i) => {
          const config = statusConfig[order.status]
          const balance = order.total_value - order.deposit_value
          const progress = (order.deposit_value / order.total_value) * 100

          return (
            <motion.div
              layout
              key={order.id}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }}
              className="group relative flex flex-col overflow-hidden rounded-[40px] border border-white/60 bg-white/40 backdrop-blur-xl p-8 shadow-sm hover:translate-y-[-4px] transition-transform duration-300"
            >
              <div className={cn("absolute top-0 left-0 right-0 h-2 opacity-80", config.iconBg)} />

              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={cn("flex size-14 items-center justify-center rounded-2xl text-white shadow-xl shadow-primary/20 transform rotate-[-3deg]", config.iconBg)}>
                    <config.icon className="size-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID: #{order.id}</p>
                    <Badge className={cn("px-4 py-1.5 border-none font-black text-[10px] uppercase rounded-full", config.bg, config.color)}>
                      {config.label}
                    </Badge>
                  </div>
                </div>
                <MessageCircle className="size-6 text-slate-400" />
              </div>

              <div className="mb-8 space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none truncate group-hover:text-primary transition-colors">
                  {order.client_name}
                </h3>
                <p className="text-sm font-bold text-slate-500 line-clamp-1">{order.product_name}</p>
              </div>

              <div className="mt-auto space-y-6">
                <div className="flex items-center justify-between p-4 rounded-3xl bg-white/50 border border-white/40 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-rose-50 flex items-center justify-center text-primary">
                      <CalendarIcon className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrega</p>
                      <p className="text-sm font-black text-slate-800 tracking-tight">
                        {new Date(order.delivery_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</p>
                    <p className="text-lg font-black text-primary tracking-tighter">R$ {order.total_value.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-2 px-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Pagamento</span>
                    <span className={cn("text-xs font-black", balance > 0 ? "text-rose-500" : "text-green-500")}>
                      {balance > 0 ? `Pendente R$ ${balance.toFixed(2)}` : "Quitado 100%"}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-white/50">
                    <div
                      className={cn("h-full transition-all duration-1000", balance > 0 ? "bg-rose-400" : "bg-green-400")}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
