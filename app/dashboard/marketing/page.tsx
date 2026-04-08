"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Gift, 
  Star, 
  TrendingUp, 
  Users, 
  Zap,
  Target,
  Edit3,
  CheckCircle2,
  XCircle,
  Percent,
  DollarSign,
  Truck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { FeatureGuard } from "@/components/dashboard/FeatureGuard"

export default function MarketingPage() {
    return (
        <FeatureGuard feature="marketing" planRequired="pro">
            <MarketingContent />
        </FeatureGuard>
    )
}

function MarketingContent() {
  const { business } = useBusiness()
  const [coupons, setCoupons] = useState<any[]>([])
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    codigo: "",
    tipo: "percentual",
    valor: 0,
    valor_minimo: 0,
    limite_uso: 100
  })

  useEffect(() => {
    if (business?.id) {
      fetchMarketingData()
    }
  }, [business?.id])

  async function fetchMarketingData() {
    try {
      setLoading(true)
      const [couponsRes, rewardsRes] = await Promise.all([
        supabase.from('cupons').select('*').eq('company_id', business!.id).order('created_at', { ascending: false }),
        supabase.from('recompensas').select('*').eq('company_id', business!.id)
      ])
      setCoupons(couponsRes.data || [])
      setRewards(rewardsRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCoupon() {
    try {
      const { error } = await supabase.from('cupons').insert({
        ...newCoupon,
        company_id: business!.id,
        codigo: newCoupon.codigo.toUpperCase()
      })
      if (error) throw error
      toast.success("Cupom criado com sucesso!")
      setIsCouponDialogOpen(false)
      fetchMarketingData()
    } catch (e) {
      toast.error("Erro ao criar cupom.")
    }
  }

  async function handleDeleteCoupon(id: string) {
    try {
      await supabase.from('cupons').delete().eq('id', id)
      toast.success("Cupom removido.")
      fetchMarketingData()
    } catch (e) {
      toast.error("Erro ao remover.")
    }
  }

  return (
    <div className="p-6 md:p-10 space-y-12 min-h-screen pb-40">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Marketing <span className="text-pink-500">& Fidelidade</span>
          </h1>
          <p className="text-slate-500 font-medium italic uppercase text-[10px] tracking-widest ml-1">Estratégias de Retenção e Vendas V3</p>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
           <Button onClick={() => setIsCouponDialogOpen(true)} className="h-16 px-8 rounded-3xl bg-pink-500 text-white font-black uppercase text-[10px] tracking-widest flex gap-3 shadow-xl hover:bg-pink-600 w-full lg:w-auto justify-center">
              <Plus className="size-5" /> Criar Novo Cupom
           </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
         <div className="bg-slate-900 rounded-[32px] sm:rounded-[48px] p-8 sm:p-10 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-45 transition-all duration-1000">
               <Zap className="size-32" />
            </div>
            <div className="relative z-10 space-y-4 sm:space-y-6">
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cupons Ativos</p>
                  <h3 className="text-4xl sm:text-5xl font-black italic tracking-tighter">{coupons.filter(c => c.ativo).length}</h3>
               </div>
               <Badge className="bg-pink-500/20 text-pink-500 border-none font-black text-[9px] uppercase tracking-widest px-4 py-2">Impulsionando Vendas</Badge>
            </div>
         </div>

         <div className="bg-white rounded-[32px] sm:rounded-[48px] p-8 sm:p-10 border border-slate-100 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:rotate-0 transition-all duration-1000 text-pink-500">
               <Star className="size-32 fill-current" />
            </div>
            <div className="relative z-10 space-y-4 sm:space-y-6">
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Taxa de Conversão</p>
                  <h3 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-slate-900">24%</h3>
               </div>
               <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                  <TrendingUp className="size-4" /> +12% esse mês
               </div>
            </div>
         </div>

         <div className="bg-pink-50 rounded-[32px] sm:rounded-[48px] p-8 sm:p-10 border border-pink-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 text-pink-500">
               <Gift className="size-32" />
            </div>
            <div className="relative z-10 space-y-4 sm:space-y-6">
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-pink-600/60">Base de Clientes VIP</p>
                  <h3 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-pink-600">85</h3>
               </div>
               <p className="text-[10px] font-black text-pink-500/60 uppercase tracking-widest leading-none">Total: 1.240 clientes</p>
            </div>
         </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-[56px] shadow-2xl overflow-hidden border border-slate-50">
         <div className="p-6 sm:p-10 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter flex items-center gap-4">
               <div className="size-10 sm:size-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Ticket className="size-5 sm:size-6" />
               </div>
               Gestão de Cupons
            </h2>
         </div>
         <div className="overflow-x-auto">
            <Table>
               <TableHeader>
                  <TableRow className="border-slate-50 hover:bg-transparent">
                     <TableHead className="py-8 px-10 text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[150px]">Código</TableHead>
                     <TableHead className="py-8 text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[120px]">Tipo</TableHead>
                     <TableHead className="py-8 text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[120px]">Benefício</TableHead>
                     <TableHead className="py-8 text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[150px]">Usos</TableHead>
                     <TableHead className="py-8 text-right px-10 text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[100px]">Ações</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {coupons.map(coupon => (
                     <TableRow key={coupon.id} className="border-slate-50 hover:bg-slate-50 transition-colors">
                        <TableCell className="py-8 px-10">
                           <Badge className="h-10 px-4 rounded-xl bg-slate-900 text-white font-black text-sm uppercase italic tracking-widest">
                              {coupon.codigo}
                           </Badge>
                        </TableCell>
                        <TableCell className="py-8 text-xs font-black uppercase tracking-tight text-slate-500 italic">
                           {coupon.tipo === 'percentual' && <span className="flex items-center gap-2"> <Percent className="size-3" /> Percentual</span>}
                           {coupon.tipo === 'fixo' && <span className="flex items-center gap-2"> <DollarSign className="size-3" /> Valor Fixo</span>}
                           {coupon.tipo === 'frete_gratis' && <span className="flex items-center gap-2"> <Truck className="size-3" /> Frete Grátis</span>}
                        </TableCell>
                        <TableCell className="py-8">
                           <p className="font-black text-slate-900 text-lg italic tracking-tighter">
                              {coupon.tipo === 'percentual' ? `${coupon.valor}%` : `R$ ${coupon.valor.toFixed(2)}`}
                              {coupon.valor_minimo > 0 && <span className="text-[9px] font-bold text-slate-300 block">Min: R$ {coupon.valor_minimo}</span>}
                           </p>
                        </TableCell>
                        <TableCell className="py-8">
                           <div className="flex items-center gap-3">
                              <span className="font-black text-slate-900">{coupon.usos}</span>
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-pink-500 rounded-full" style={{ width: `${(coupon.usos / coupon.limite_uso) * 100}%` }} />
                              </div>
                              <span className="text-[10px] font-black text-slate-300">/ {coupon.limite_uso}</span>
                           </div>
                        </TableCell>
                        <TableCell className="py-8 text-right px-10">
                           <Button onClick={() => handleDeleteCoupon(coupon.id)} variant="ghost" className="size-12 rounded-2xl text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                              <Trash2 className="size-5" />
                           </Button>
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </div>
      </div>

      {/* Loyalty Rules & Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="bg-slate-900 rounded-[32px] sm:rounded-[56px] p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
               <Target className="size-64" />
            </div>
            <div className="relative z-10 space-y-10">
               <div className="space-y-2">
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter">Configuração de <span className="text-pink-500">Pontos</span></h3>
                  <p className="text-slate-400 font-medium italic text-sm">Gamifique a experiência das suas clientes.</p>
               </div>
               
               <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-3xl rounded-[32px] p-8 border border-white/10 flex items-center justify-between">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Conversão de Gasto</p>
                        <p className="text-xl font-black italic uppercase tracking-tighter">R$ 1.00 = 1 Ponto</p>
                     </div>
                     <Button variant="ghost" className="size-12 rounded-2xl bg-white/10 text-white"><Edit3 className="size-5" /></Button>
                  </div>

                  <div className="bg-white/5 backdrop-blur-3xl rounded-[32px] p-8 border border-white/10 flex items-center justify-between">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Bônus Primeira Compra</p>
                        <p className="text-xl font-black italic uppercase tracking-tighter">50 Pontos</p>
                     </div>
                     <Button variant="ghost" className="size-12 rounded-2xl bg-white/10 text-white"><Edit3 className="size-5" /></Button>
                  </div>
               </div>

               <div className="pt-6 space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-pink-500 text-center">Hierarquia de Níveis</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     {['Bronze', 'Prata', 'Ouro', 'Diamante'].map((tier, idx) => (
                        <div key={tier} className="text-center space-y-3 p-4 rounded-[28px] bg-white/5 border border-white/10">
                           <div className={cn("size-6 rounded-full mx-auto shadow-lg shadow-pink-500/20", idx === 0 ? "bg-amber-700" : idx === 1 ? "bg-slate-300" : idx === 2 ? "bg-amber-400" : "bg-emerald-400 animate-pulse")} />
                           <p className="text-[10px] font-black uppercase italic tracking-tighter leading-none">{tier}</p>
                           <p className="text-[8px] font-bold text-slate-500">{[0, 500, 1500, 5000][idx]} pts</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-white rounded-[32px] sm:rounded-[56px] p-8 sm:p-12 border border-slate-100 shadow-2xl space-y-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
               <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Catálogo de <span className="text-pink-500">Recompensas</span></h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O que suas clientes podem resgatar</p>
               </div>
               <Button className="h-14 w-full sm:w-14 rounded-2xl bg-pink-500 text-white shadow-xl hover:bg-pink-600 shrink-0"><Plus className="size-6" /></Button>
            </div>

            <div className="space-y-4">
               {rewards.length === 0 ? (
                  <div className="h-60 flex flex-col items-center justify-center text-center opacity-30 gap-4">
                     <Gift className="size-10 text-slate-300" />
                     <p className="text-[10px] font-black uppercase tracking-widest leading-none">Nenhuma recompensa cadastrada</p>
                  </div>
               ) : (
                  rewards.map(reward => (
                     <div key={reward.id} className="p-6 sm:p-8 rounded-[32px] bg-slate-50 border border-white flex flex-col sm:flex-row items-center justify-between group hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-500 cursor-pointer gap-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                           <div className="size-16 rounded-[20px] bg-white shadow-sm flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform shrink-0">
                              <Gift className="size-8" />
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Resgate com pontos</p>
                              <h4 className="text-lg sm:text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">{reward.nome}</h4>
                           </div>
                        </div>
                        <div className="bg-pink-500 h-10 px-6 rounded-full flex items-center justify-center text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-pink-100 w-full sm:w-auto">
                           {reward.pontos_necessarios} Pts
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>

      {/* Coupon Dialog */}
      <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
         <DialogContent className="w-[95vw] rounded-[32px] sm:rounded-[40px] border-none shadow-2xl p-0 overflow-hidden max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 p-10 text-white">
               <h2 className="text-3xl font-black italic uppercase tracking-tighter">Novo <span className="text-pink-500">Cupom</span></h2>
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Crie ofertas irresistíveis para suas clientes</p>
            </div>
            <div className="p-6 sm:p-10 space-y-6">
               <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Código do Cupom</Label>
                  <Input 
                     placeholder="EX: DOCE20, FRETEOFF" 
                     className="h-16 rounded-[24px] bg-slate-50 border-none font-black uppercase italic tracking-widest text-lg"
                     value={newCoupon.codigo}
                     onChange={e => setNewCoupon({...newCoupon, codigo: e.target.value})}
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo</Label>
                     <select 
                        className="w-full h-16 rounded-[24px] bg-slate-50 border-none font-black text-xs uppercase tracking-widest px-6 outline-none"
                        value={newCoupon.tipo}
                        onChange={e => setNewCoupon({...newCoupon, tipo: e.target.value})}
                     >
                        <option value="percentual">Percentual (%)</option>
                        <option value="fixo">Valor Fixo (R$)</option>
                        <option value="frete_gratis">Frete Grátis</option>
                     </select>
                  </div>
                  <div className="space-y-4">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Valor</Label>
                     <Input 
                        type="number"
                        placeholder="0" 
                        className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-xl"
                        value={newCoupon.valor}
                        onChange={e => setNewCoupon({...newCoupon, valor: parseFloat(e.target.value)})}
                        disabled={newCoupon.tipo === 'frete_gratis'}
                     />
                  </div>
               </div>

               <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Valor Mínimo do Pedido (Opcional)</Label>
                  <Input 
                     type="number"
                     placeholder="0.00" 
                     className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg"
                     value={newCoupon.valor_minimo}
                     onChange={e => setNewCoupon({...newCoupon, valor_minimo: parseFloat(e.target.value)})}
                  />
               </div>

               <Button onClick={handleCreateCoupon} className="w-full h-20 rounded-[32px] bg-slate-900 border-none hover:bg-slate-800 text-white font-black italic uppercase text-xs tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 mt-6">
                  Ativar Cupom Agora
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  )
}
