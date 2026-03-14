"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, Package, Tag, Percent, Calculator, ChefHat, FileText, TrendingUp, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const mockedProducts = [
  {
    id: "BOLO-01",
    nome: "Bolo de Cenoura com Brigadeiro",
    categoria: "Bolos Caseiros",
    custo_base: 18.50,
    margem: 150,
    preco_venda: 46.25,
    ativo: true,
  },
  {
    id: "DOCE-01",
    nome: "Caixa Presente (12 Brigadeiros)",
    categoria: "Docinhos",
    custo_base: 12.80,
    margem: 220,
    preco_venda: 40.96,
    ativo: true,
  },
  {
    id: "TORT-01",
    nome: "Banoffee Clássica (G)",
    categoria: "Tortas",
    custo_base: 45.00,
    margem: 180,
    preco_venda: 126.00,
    ativo: true,
  },
  {
    id: "DOCE-02",
    nome: "Fatia Brownie com Caramelo",
    categoria: "Sobremesas",
    custo_base: 5.20,
    margem: 250,
    preco_venda: 18.20,
    ativo: true,
  }
]

const categoryColors: Record<string, string> = {
  "Bolos Caseiros": "text-primary bg-rose-50 border-rose-100",
  Docinhos: "text-blue-600 bg-blue-50 border-blue-100",
  Tortas: "text-amber-600 bg-amber-50 border-amber-100",
  Sobremesas: "text-green-600 bg-green-50 border-green-100",
}

const stats = [
  { label: "Produtos", value: "48", icon: Package, color: "text-primary" },
  { label: "Margem Média", value: "194%", icon: Percent, color: "text-blue-600" },
  { label: "Custo Médio", value: "R$ 16,40", icon: Calculator, color: "text-amber-600" },
  { label: "Lucro Estimado", value: "R$ 12.580", icon: TrendingUp, color: "text-green-600" },
]

export default function CaptureProdutosPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-12 space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 italic uppercase">Precificação <span className="text-primary font-black">& Fichas</span></h1>
          <p className="text-slate-500 font-medium tracking-tight">Crie receitas lucrativas com cálculo automático de ingredientes e mão de obra.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold">
            <FileText className="mr-2 size-4" />
            Exportar Fichas
          </Button>
          <Button className="h-11 px-8 rounded-xl bg-primary hover:bg-primary text-white font-bold shadow-lg shadow-primary/20">
            <Plus className="mr-2 size-5" />
            Nova Ficha Técnica
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 hover:border-primary/20 transition-all duration-300 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={cn("flex size-14 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform duration-500", stat.color)}>
                  <stat.icon className="size-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100">
              <TableHead className="py-5 pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Item / Receita</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Custo Total</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Preço Venda</TableHead>
              <TableHead className="py-5 pr-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockedProducts.map((product, i) => (
              <TableRow
                key={product.id}
                className="group border-slate-100 hover:bg-slate-50 transition-all duration-300"
              >
                <TableCell className="py-6 pl-8">
                  <div className="flex items-center gap-4">
                    <div className="size-11 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-primary shadow-sm overflow-hidden">
                      <ChefHat className="size-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-black text-slate-900 italic tracking-tight leading-none uppercase italic">{product.nome}</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase mt-1.5">{product.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-6">
                  <Badge variant="outline" className={cn("px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-none", categoryColors[product.categoria] || "border-slate-100")}>
                    {product.categoria}
                  </Badge>
                </TableCell>
                <TableCell className="py-6 text-slate-500 font-bold">
                  R$ {product.custo_base.toFixed(2)}
                </TableCell>
                <TableCell className="py-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-black text-slate-900 tracking-tighter">R$ {product.preco_venda.toFixed(2)}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-green-600 uppercase tracking-tight">+{product.margem}% Lucro</span>
                      <div className="size-1 rounded-full bg-green-500" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-6 pr-8 text-right">
                  <div className="flex justify-end gap-2 items-center">
                    <Button variant="ghost" size="icon" className="size-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary"><FileText className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="size-9 rounded-xl bg-slate-50 hover:bg-primary/10 text-slate-400 hover:text-primary transition-all"><Tag className="size-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
