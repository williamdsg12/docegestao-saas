"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Package,
  ChefHat,
  ShoppingBag,
  Users,
  FileText,
  ClipboardList,
  Smartphone,
  Globe,
  DollarSign,
  BarChart3,
  MousePointer2,
  Bell,
  Search,
  Plus,
  MoreVertical,
  TrendingUp,
  CreditCard,
  Cake,
  Filter
} from "lucide-react"

// Color definitions matching the palette
const colors = {
  primary: "#FF6B9A",
  primaryLight: "#FFB3C7",
  secondary: "#7C3AED",
  dark: "#1F2937",
  pastel: "#FFF1F5",
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "ingredientes", label: "Ingredientes", icon: Package },
  { id: "receitas", label: "Receitas", icon: ChefHat },
  { id: "produtos", label: "Produtos", icon: ShoppingBag },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "orcamentos", label: "Orçamentos", icon: FileText },
  { id: "pedidos", label: "Pedidos", icon: ClipboardList },
  { id: "cardapio", label: "Cardápio Digital", icon: Smartphone },
  { id: "online", label: "Pedidos Online", icon: Globe },
  { id: "financeiro", label: "Fluxo de Caixa", icon: DollarSign },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
]

// --- Page Components ---

const PageDashboard = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="p-6 h-full flex flex-col gap-6"
  >
    <div className="grid grid-cols-4 gap-4">
      {[
        { label: "Receita Total", value: "R$ 15.420,00", color: "text-emerald-500", bg: "bg-emerald-50" },
        { label: "Clientes", value: "142", color: "text-blue-500", bg: "bg-blue-50" },
        { label: "Orçamentos", value: "12 aguardando", color: "text-amber-500", bg: "bg-amber-50" },
        { label: "Pedidos Hoje", value: "8", color: "text-[#FF6B9A]", bg: "bg-[#FFF1F5]" },
      ].map((kpi, i) => (
        <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">{kpi.label}</span>
          <span className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</span>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-6 flex-1">
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col">
        <h4 className="text-sm font-bold text-slate-800 mb-4">Próximos Pedidos</h4>
        <div className="flex flex-col gap-3">
          {[
            { n: "Bolo de Casamento", t: "14:00", s: "Em produção" },
            { n: "100 Brigadeiros", t: "16:30", s: "Pendente" },
            { n: "Torta de Limão", t: "18:00", s: "Pronto" },
          ].map((p, i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 text-sm">
              <span className="font-medium text-slate-700">{p.n}</span>
              <div className="flex gap-3 items-center">
                <span className="text-slate-400 text-xs">{p.t}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF1F5] text-[#FF6B9A] uppercase">{p.s}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col">
        <h4 className="text-sm font-bold text-slate-800 mb-4">Próximos Recebimentos</h4>
        <div className="flex flex-col gap-3">
          {[
            { n: "Sinal - Casamento Ana", v: "R$ 450,00", d: "Hoje" },
            { n: "Saldo - Aniversário João", v: "R$ 200,00", d: "Amanhã" },
          ].map((p, i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-emerald-50/50 text-sm border border-emerald-100/50">
              <span className="font-medium text-slate-700">{p.n}</span>
              <div className="flex gap-3 items-center">
                <span className="font-bold text-emerald-600">{p.v}</span>
                <span className="text-slate-400 text-xs">{p.d}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
)

const PageIngredientes = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#FFF1F5] rounded-lg text-[#FF6B9A]"><Package className="size-5"/></div>
        <h3 className="text-lg font-bold text-slate-800">Ingredientes</h3>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 bg-[#FF6B9A] text-white rounded-lg text-sm font-medium">
        <Plus className="size-4" /> Novo Ingrediente
      </button>
    </div>
    <div className="flex-1 border border-slate-100 rounded-xl bg-white overflow-hidden shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
          <tr><th className="p-4">Nome</th><th className="p-4">Categoria</th><th className="p-4">Quantidade</th><th className="p-4">Custo</th><th className="p-4"></th></tr>
        </thead>
        <tbody>
          {[
            { n: "Leite Condensado Moça", c: "Laticínios", q: "395g", v: "R$ 7,50" },
            { n: "Farinha de Trigo", c: "Secos", q: "1 kg", v: "R$ 4,20" },
            { n: "Chocolate em Pó 50%", c: "Chocolates", q: "500g", v: "R$ 18,90" },
            { n: "Manteiga Extra", c: "Laticínios", q: "200g", v: "R$ 12,00" },
          ].map((i, idx) => (
            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="p-4 font-medium text-slate-700">{i.n}</td>
              <td className="p-4 text-slate-500"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{i.c}</span></td>
              <td className="p-4 text-slate-600">{i.q}</td>
              <td className="p-4 font-medium text-emerald-600">{i.v}</td>
              <td className="p-4 text-right"><MoreVertical className="size-4 text-slate-400 inline-block"/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
)

const PageReceitas = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-lg font-bold text-slate-800">Fichas Técnicas</h3>
      <button className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-medium flex items-center gap-2">Nova Receita</button>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {[
        { n: "Massa Branca de Fazer Dinheiro", ing: 5, t: "45 min", c: "R$ 15,30" },
        { n: "Brigadeiro Gourmet 20g", ing: 4, t: "30 min", c: "R$ 22,00 (receita)" },
        { n: "Recheio de Ninho Trufado", ing: 3, t: "20 min", c: "R$ 18,50" },
        { n: "Calda de Açúcar Básica", ing: 2, t: "10 min", c: "R$ 2,10" },
      ].map((r, i) => (
        <div key={i} className="p-5 border border-slate-100 rounded-xl bg-white shadow-sm flex flex-col gap-3 group hover:border-[#7C3AED]/30 transition-colors">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-slate-700">{r.n}</h4>
            <span className="text-xs font-bold text-[#7C3AED] bg-[#7C3AED]/10 px-2 py-1 rounded">{r.c}</span>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <span>{r.ing} ingredientes</span>
            <span>Preparo: {r.t}</span>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
)

const PageProdutos = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-lg font-bold text-slate-800">Catálogo de Produtos</h3>
      <button className="px-4 py-2 bg-[#FF6B9A] text-white rounded-lg text-sm font-medium flex items-center gap-2"><Plus className="size-4"/> Novo Doce</button>
    </div>
    <div className="grid grid-cols-4 gap-4">
      {[
        { n: "Bolo de Pote Morango", p: "R$ 18,00", c: "Potes" },
        { n: "Caixa 12 Brigadeiros", p: "R$ 45,00", c: "Kits" },
        { n: "Bolo Vulcão Ninho", p: "R$ 85,00", c: "Bolos" },
        { n: "Torta de Limão M", p: "R$ 120,00", c: "Tortas" },
      ].map((p, i) => (
        <div key={i} className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="h-24 bg-slate-100 flex items-center justify-center text-slate-300"><Cake className="size-8"/></div>
          <div className="p-4">
            <span className="text-[10px] uppercase font-bold text-[#FF6B9A]">{p.c}</span>
            <h4 className="font-bold text-slate-800 text-sm mt-1 mb-2 leading-tight">{p.n}</h4>
            <span className="font-black text-slate-900">{p.p}</span>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
)

const PageClientes = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-lg font-bold text-slate-800">Meus Clientes</h3>
      <div className="flex gap-2">
        <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg flex items-center gap-2 text-sm text-slate-400">
          <Search className="size-4"/> Buscar cliente...
        </div>
        <button className="px-4 py-2 bg-[#1F2937] text-white rounded-lg text-sm font-medium">Cadastrar</button>
      </div>
    </div>
    <div className="flex-1 border border-slate-100 rounded-xl bg-white overflow-hidden shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
          <tr><th className="p-4">Nome</th><th className="p-4">WhatsApp</th><th className="p-4">Pedidos</th><th className="p-4">Última Compra</th></tr>
        </thead>
        <tbody>
          {[
            { n: "Ana Clara Silva", w: "(11) 98765-4321", p: 12, u: "Hoje" },
            { n: "João Pedro Santos", w: "(11) 99999-8888", p: 3, u: "Há 2 dias" },
            { n: "Marcia Souza", w: "(11) 97777-6666", p: 8, u: "Na última semana" },
            { n: "Eventos XYZ", w: "(11) 95555-4444", p: 2, u: "Há 1 mês" },
          ].map((c, i) => (
            <tr key={i} className="border-b border-slate-50">
              <td className="p-4 font-bold text-slate-700">{c.n}</td>
              <td className="p-4 text-emerald-600 font-medium">{c.w}</td>
              <td className="p-4 text-slate-600"><span className="bg-[#FFF1F5] text-[#FF6B9A] px-2 py-0.5 rounded font-bold">{c.p}</span></td>
              <td className="p-4 text-slate-500">{c.u}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
)

const PageComponent = ({ title, children, color = "primary" }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <button className={`px-4 py-2 ${color === 'primary' ? 'bg-[#FF6B9A]' : 'bg-[#7C3AED]'} text-white rounded-lg text-sm font-medium flex items-center gap-2`}><Plus className="size-4"/> Novo</button>
    </div>
    {children}
  </motion.div>
)

const PageOrcamentos = () => (
  <PageComponent title="Orçamentos" color="secondary">
    <div className="flex flex-col gap-3">
      {[
        { c: "Casamento Júlia", v: "R$ 3.450,00", s: "Aprovado", bg: "bg-emerald-100 text-emerald-700" },
        { c: "Aniversário 15 anos", v: "R$ 1.200,00", s: "Aguardando", bg: "bg-amber-100 text-amber-700" },
        { c: "Kit Festa Empresa", v: "R$ 800,00", s: "Enviado", bg: "bg-blue-100 text-blue-700" },
      ].map((o, i) => (
        <div key={i} className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">{o.c}</span>
            <span className="text-sm text-slate-500">{o.v}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${o.bg}`}>{o.s}</span>
        </div>
      ))}
    </div>
  </PageComponent>
)

const PagePedidos = () => (
  <PageComponent title="Controle de Pedidos">
    <div className="flex gap-4 mb-4">
      {["Todos", "Pendentes", "Produção", "Entregues"].map((f, i) => (
        <span key={i} className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${i === 1 ? 'bg-[#FF6B9A] text-white' : 'bg-slate-100 text-slate-500'}`}>{f}</span>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-4 h-full">
      {/* Kanban style columns */}
      <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-3">
        <h5 className="font-bold text-slate-600 text-sm mb-2">A Fazer</h5>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-rose-400">
          <span className="text-[10px] text-slate-400 font-bold">#1024</span>
          <p className="font-bold text-sm text-slate-800 my-1">Bolo Vulcão</p>
          <span className="text-xs text-rose-500 font-medium">Entregar às 14:00</span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-rose-400">
          <span className="text-[10px] text-slate-400 font-bold">#1025</span>
          <p className="font-bold text-sm text-slate-800 my-1">50 Brigadeiros</p>
          <span className="text-xs text-rose-500 font-medium">Entregar às 16:00</span>
        </div>
      </div>
      <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-3">
        <h5 className="font-bold text-slate-600 text-sm mb-2">Em Produção</h5>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-amber-400">
          <span className="text-[10px] text-slate-400 font-bold">#1023</span>
          <p className="font-bold text-sm text-slate-800 my-1">Torta de Limão</p>
          <span className="text-xs text-amber-600 font-medium">Massa no forno</span>
        </div>
      </div>
      <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-3">
        <h5 className="font-bold text-slate-600 text-sm mb-2">Pronto p/ Entrega</h5>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-emerald-400 opacity-70">
          <span className="text-[10px] text-slate-400 font-bold">#1022</span>
          <p className="font-bold text-sm text-slate-800 my-1">Kit Mesversário</p>
          <span className="text-xs text-emerald-600 font-medium">Aguardando motoboy</span>
        </div>
      </div>
    </div>
  </PageComponent>
)

const PageCardapio = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full flex flex-col items-center justify-center text-center">
    <div className="w-16 h-16 bg-[#FFF1F5] text-[#FF6B9A] rounded-2xl flex items-center justify-center mb-6">
      <Smartphone className="size-8"/>
    </div>
    <h3 className="text-2xl font-bold text-slate-800 mb-2">Cardápio Digital Ativo</h3>
    <p className="text-slate-500 max-w-sm mb-8">Seu link exclusivo está pronto para receber pedidos via WhatsApp.</p>
    <div className="flex gap-4 bg-slate-100 p-2 rounded-xl border border-slate-200">
      <span className="px-4 py-2 font-medium text-slate-600 text-sm">docegestao.com/atelierdamanu</span>
      <button className="bg-[#7C3AED] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md">Copiar Link</button>
    </div>
  </motion.div>
)

const PagePedidosOnline = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
        Recepção Online
      </h3>
    </div>
    <div className="flex-1 bg-slate-800 rounded-xl p-6 relative overflow-hidden flex flex-col items-center justify-center border border-slate-700">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
      
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl z-10 relative">
        <div className="bg-rose-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full absolute -top-3 -right-3 shadow-lg flex items-center gap-1">
          <Bell className="size-3" /> NOVO PEDIDO
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">ML</div>
          <div><p className="font-bold text-slate-800 leading-none">Marta Lima</p><p className="text-xs text-slate-500 mt-1">Agora mesmo</p></div>
        </div>
        <div className="border-t border-b border-slate-100 py-3 my-3">
          <p className="text-sm font-medium text-slate-700 flex justify-between"><span>1x Bolo de Pote Ninho</span> <span>R$ 18,00</span></p>
          <p className="text-sm font-medium text-slate-700 flex justify-between mt-1"><span>2x Bolo de Pote Chocolate</span> <span>R$ 36,00</span></p>
        </div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm text-slate-500">Total</span>
          <span className="font-black text-xl text-emerald-600">R$ 54,00</span>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-sm font-bold">Recusar</button>
          <button className="flex-1 bg-emerald-500 text-white py-2 rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/30">Aceitar P/ Produção</button>
        </div>
      </motion.div>
    </div>
  </motion.div>
)

const PageFluxoCaixa = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full flex flex-col gap-6">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-bold text-slate-800">Fluxo de Caixa</h3>
      <div className="flex bg-slate-100 rounded-lg p-1">
        <button className="px-3 py-1 text-xs font-bold bg-white shadow-sm rounded-md">Mês atual</button>
        <button className="px-3 py-1 text-xs font-medium text-slate-500">Mês passado</button>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
        <p className="text-xs uppercase font-bold text-emerald-600/70 mb-1">Entradas</p>
        <p className="text-2xl font-black text-emerald-600">R$ 5.420,00</p>
      </div>
      <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
        <p className="text-xs uppercase font-bold text-rose-600/70 mb-1">Saídas</p>
        <p className="text-2xl font-black text-rose-600">R$ 1.840,00</p>
      </div>
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <p className="text-xs uppercase font-bold text-blue-600/70 mb-1">Lucro</p>
        <p className="text-2xl font-black text-blue-600">R$ 3.580,00</p>
      </div>
    </div>
    <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 flex items-end p-6 gap-2">
      {/* Abstract chart */}
      {[30, 45, 25, 60, 80, 50, 95, 70, 85, 100].map((h, i) => (
        <div key={i} className="flex-1 rounded-t-sm w-full opacity-80" style={{ height: `${h}%`, backgroundImage: 'linear-gradient(to top, #7C3AED, #c4a7f5)' }}></div>
      ))}
    </div>
  </motion.div>
)

const PageRelatorios = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full flex flex-col gap-6">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-bold text-slate-800">Relatórios Inteligentes</h3>
    </div>
    <div className="grid grid-cols-2 gap-6 h-full">
      <div className="border border-slate-100 rounded-xl p-5 flex flex-col gap-4 bg-white shadow-sm">
        <h4 className="text-sm font-bold text-slate-600">Produtos mais vendidos</h4>
        <div className="flex flex-col gap-3 flex-1 justify-center">
          {[
            { n: "Bolo Vulcão", p: 85, c: 'bg-[#FF6B9A]' },
            { n: "Caixa Brigadeiros", p: 60, c: 'bg-[#7C3AED]' },
            { n: "Torta de Limão", p: 40, c: 'bg-emerald-400' },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>{item.n}</span>
                <span>{item.p}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className={`h-full ${item.c}`} style={{ width: `${item.p}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border border-[#7C3AED]/20 bg-[#7C3AED]/5 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="size-16 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center mb-4"><TrendingUp className="size-8"/></div>
        <h4 className="text-sm font-bold text-slate-800 mb-2">Crescimento Mensal</h4>
        <p className="text-3xl font-black text-[#7C3AED]">+ 24%</p>
        <p className="text-xs text-slate-500 mt-2 font-medium">em comparação ao mês passado</p>
      </div>
    </div>
  </motion.div>
)

const pagesMap: Record<string, React.FC> = {
  dashboard: PageDashboard,
  ingredientes: PageIngredientes,
  receitas: PageReceitas,
  produtos: PageProdutos,
  clientes: PageClientes,
  orcamentos: PageOrcamentos,
  pedidos: PagePedidos,
  cardapio: PageCardapio,
  online: PagePedidosOnline,
  financeiro: PageFluxoCaixa,
  relatorios: PageRelatorios
}

export function AnimatedDashboardMockup() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [isClicking, setIsClicking] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Animation Sequence Logic
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const sequence = [0, 6, 4, 3, 9] // Dashboard, Pedidos, Clientes, Produtos, Fluxo de Caixa

    const moveToNext = async () => {
      const currentSeqIndex = sequence.indexOf(currentIndex)
      const nextSeqIndex = (currentSeqIndex + 1) % sequence.length
      const nextIndex = sequence[nextSeqIndex]

      const targetMenu = menuRefs.current[nextIndex]

      if (targetMenu && containerRef.current) {
        // Compute relative position of the menu item inside the container
        const containerRect = containerRef.current.getBoundingClientRect()
        const targetRect = targetMenu.getBoundingClientRect()
        
        // Target x,y to move cursor
        const targetX = targetRect.left - containerRect.left + 20 // move into the button
        const targetY = targetRect.top - containerRect.top + 20

        // Move cursor
        setCursorPos({ x: targetX, y: targetY })

        // Wait for cursor to arrive, then click
        timeoutId = setTimeout(() => {
          setIsClicking(true)
          
          timeoutId = setTimeout(() => {
            setIsClicking(false)
            setCurrentIndex(nextIndex)
            
            // Wait reading time before next
            timeoutId = setTimeout(moveToNext, 3500)
            
          }, 300) // click duration
        }, 800) // travel time
      }
    }

    // Start sequence
    timeoutId = setTimeout(moveToNext, 4000)

    return () => clearTimeout(timeoutId)
  }, [currentIndex])

  // Center cursor initially safely
  useEffect(() => {
    if (menuRefs.current[0]) {
       const target = menuRefs.current[0]
       // rough center
       setCursorPos({ x: 30, y: 30 }) 
    }
  }, [])

  const CurrentComponent = pagesMap[menuItems[currentIndex].id]

  return (
    <div className="relative mx-auto max-w-5xl [perspective:2000px] mt-10">
      <motion.div 
        className="relative mx-auto w-full [transform-style:preserve-3d]"
        initial={{ rotateX: 15, rotateY: -8, rotateZ: 2, y: 50, opacity: 0 }}
        animate={{ rotateX: 10, rotateY: -4, rotateZ: 1, y: 0, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {/* Subtle, neutral shadow for depth without colored glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] bg-black/10 blur-[120px] -z-10 rounded-full"></div>

        {/* Laptop Screen Frame */}
        <div className="relative rounded-[2rem] border-[12px] border-slate-800 bg-slate-900 shadow-2xl px-2 pt-2 pb-6 ring-1 ring-white/10 mx-auto max-w-[1000px]">
          
          {/* Top Camera dot */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-black/50 border border-slate-700/50"></div>

          {/* Browser-like window wrapper inside laptop */}
          <div 
            ref={containerRef}
            className="relative flex h-[500px] lg:h-[600px] w-full overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            {/* Sidebar */}
            <div className="w-56 border-r border-slate-100 bg-slate-50/80 flex flex-col z-10 hidden sm:flex">
              <div className="h-16 flex items-center px-6 border-b border-slate-100 font-black italic uppercase text-lg tracking-tight">
                Doce<span className="text-[#FF6B9A]">Gestão</span>
              </div>
              <div className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-visible">
                {menuItems.map((item, index) => {
                  const active = currentIndex === index
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      ref={(el) => { menuRefs.current[index] = el }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active 
                          ? "bg-white text-[#FF6B9A] shadow-sm border border-slate-100 shadow-[#FF6B9A]/5 scale-[1.02]" 
                          : "text-slate-500 hover:bg-slate-100/50"
                      }`}
                    >
                      <Icon className={`size-4 ${active ? 'text-[#FF6B9A]' : 'text-slate-400'}`} />
                      {item.label}
                    </button>
                  )
                })}
              </div>
              {/* User profile mock at bottom */}
              <div className="p-4 border-t border-slate-100 flex items-center gap-3">
                 <div className="size-8 rounded-full bg-slate-200 shrink-0"></div>
                 <div className="flex flex-col">
                   <span className="text-xs font-bold text-slate-700">Atelier Manu</span>
                   <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Plano Prod</span>
                 </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative z-0 bg-[#F8FAFC]">
              {/* Topbar */}
              <div className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-10 shadow-sm shadow-slate-100/50">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-md border border-slate-100 text-slate-400 text-sm">
                  <Search className="size-4" /> Buscar...
                </div>
                <div className="flex gap-4 text-slate-400">
                   <Filter className="size-5 hover:text-slate-600 transition-colors"/>
                   <Bell className="size-5 hover:text-slate-600 transition-colors"/>
                </div>
              </div>

              {/* Page Content */}
              <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <CurrentComponent />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Animated Mouse Cursor */}
            <motion.div
              animate={{ x: cursorPos.x, y: cursorPos.y, scale: isClicking ? 0.8 : 1 }}
              transition={{ 
                x: { type: "spring", stiffness: 70, damping: 20 },
                y: { type: "spring", stiffness: 70, damping: 20 },
                scale: { duration: 0.15 }
              }}
              className="absolute z-50 pointer-events-none drop-shadow-2xl flex items-center justify-center -translate-x-1.5 -translate-y-1.5 hidden sm:flex"
            >
              {/* Glow effect on click */}
              <motion.div 
                 animate={{ opacity: isClicking ? 0.4 : 0, scale: isClicking ? 2 : 0 }}
                 className="absolute size-8 bg-[#FF6B9A] rounded-full blur-[4px]"
              />
              <MousePointer2 className="size-6 text-slate-800 fill-white -rotate-12" strokeWidth={1.5} />
            </motion.div>

          </div>
          
          {/* Base bottom lip of laptop */}
          <div className="absolute -bottom-[22px] inset-x-0 h-[22px] bg-slate-800 rounded-b-[2rem] flex justify-center items-end pb-1.5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border-t border-slate-700/50">
             <div className="w-24 h-1 rounded-full bg-slate-600/50"></div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
