"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { 
  Printer, 
  Plus, 
  Trash2, 
  Settings2, 
  Wifi, 
  Usb, 
  Zap,
  CheckCircle2,
  XCircle,
  FileText,
  Terminal,
  RefreshCw,
  Layout
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
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

export default function ImpressorasPage() {
  const { business } = useBusiness()
  const [printers, setPrinters] = useState<any[]>([])
  const [printQueue, setPrintQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newPrinter, setNewPrinter] = useState({
    nome: "",
    ip: "",
    porta: 9100,
    setor: "cozinha"
  })

  useEffect(() => {
    if (business?.id) {
      fetchPrinters()
      
      // Subscribe to print queue via realtime
      const channel = supabase
        .channel('print_queue')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fila_impressao' }, () => fetchPrinters())
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [business?.id])

  async function fetchPrinters() {
    try {
      setLoading(true)
      const [printersRes, queueRes] = await Promise.all([
        supabase.from('impressoras').select('*').eq('company_id', business!.id),
        supabase.from('fila_impressao').select('*, pedidos(numero_pedido, total_value)').eq('company_id', business!.id).order('created_at', { ascending: false }).limit(20)
      ])
      setPrinters(printersRes.data || [])
      setPrintQueue(queueRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddPrinter() {
    try {
      const { error } = await supabase.from('impressoras').insert({
        ...newPrinter,
        company_id: business!.id
      })
      if (error) throw error
      toast.success("Impressora configurada!")
      setIsDialogOpen(false)
      fetchPrinters()
    } catch (e) {
      toast.error("Erro ao salvar impressora.")
    }
  }

  async function handleToggleStatus(id: string, current: boolean) {
     await supabase.from('impressoras').update({ ativa: !current }).eq('id', id)
     fetchPrinters()
  }

  return (
    <div className="p-6 md:p-10 space-y-12 min-h-screen pb-40">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Automação <span className="text-orange-500">Impressão</span>
          </h1>
          <p className="text-slate-500 font-medium italic uppercase text-[10px] tracking-widest ml-1">Infraestrutura ESC/POS & Fila Automática V3</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="h-16 px-8 rounded-3xl bg-orange-500 text-white font-black uppercase text-[10px] tracking-widest flex gap-3 shadow-xl hover:bg-orange-600 transition-all active:scale-95">
           <Printer className="size-5" /> Adicionar Impressora
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
         
         {/* Printers List */}
         <div className="xl:col-span-2 space-y-8">
            <div className="bg-white rounded-[56px] shadow-2xl border border-slate-50 overflow-hidden">
               <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                     <Layout className="size-6 text-orange-500" /> Dispositivos Pareados
                  </h2>
               </div>
               <div className="p-8">
                  {printers.length === 0 ? (
                     <div className="h-60 flex flex-col items-center justify-center text-center opacity-30 gap-6">
                        <Printer className="size-16 stroke-1" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Nenhuma impressora térmica encontrada</p>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {printers.map(printer => (
                           <div key={printer.id} className="p-8 rounded-[40px] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-2xl transition-all group relative overflow-hidden">
                              <div className="relative z-10 flex items-start justify-between">
                                 <div className="space-y-4">
                                    <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-orange-500">
                                       {printer.ip ? <Wifi className="size-8" /> : <Usb className="size-8" />}
                                    </div>
                                    <div className="space-y-1">
                                       <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">{printer.nome}</h4>
                                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{printer.ip || 'USB Connection'} : {printer.porta}</p>
                                    </div>
                                    <Badge className={cn("rounded-full px-4 py-1 font-black text-[9px] uppercase tracking-widest border-none", printer.ativa ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500")}>
                                       {printer.ativa ? 'ON-LINE' : 'OFF-LINE'}
                                    </Badge>
                                 </div>
                                 <div className="flex flex-col gap-2">
                                    <Button variant="ghost" onClick={() => handleToggleStatus(printer.id, printer.ativa)} className="size-12 rounded-2xl bg-white shadow-sm hover:text-orange-500 transition-all">
                                       <RefreshCw className="size-5" />
                                    </Button>
                                    <Button variant="ghost" className="size-12 rounded-2xl bg-white shadow-sm hover:text-rose-500 transition-all">
                                       <Trash2 className="size-5" />
                                    </Button>
                                 </div>
                              </div>
                              <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12 text-orange-500">
                                 <Zap className="size-40" />
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>

            {/* Print Logs / Queue */}
            <div className="bg-slate-900 rounded-[56px] shadow-2xl overflow-hidden border border-slate-800">
               <div className="p-10 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white flex items-center gap-4">
                     <Terminal className="size-6 text-orange-500" /> Console de Impressão
                  </h2>
                  <Badge className="bg-orange-500/10 text-orange-500 border-none font-black text-[9px] uppercase tracking-widest px-4 py-2">Real-time Node</Badge>
               </div>
               <div className="overflow-x-auto">
                  <Table>
                     <TableHeader>
                        <TableRow className="border-slate-800 hover:bg-transparent">
                           <TableHead className="py-8 px-10 text-[9px] font-black uppercase tracking-widest text-slate-600">ID Pedido</TableHead>
                           <TableHead className="py-8 text-[9px] font-black uppercase tracking-widest text-slate-600">Status</TableHead>
                           <TableHead className="py-8 text-[9px] font-black uppercase tracking-widest text-slate-600 text-right px-10">Data/Hora</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {printQueue.map(item => (
                           <TableRow key={item.id} className="border-slate-800 hover:bg-white/5 transition-colors">
                              <TableCell className="py-6 px-10">
                                 <p className="font-black text-white text-xs tracking-widest">#{item.pedido_id.slice(0, 8)}</p>
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-center gap-2">
                                    {item.status === 'impresso' ? <CheckCircle2 className="size-4 text-emerald-500" /> : <RefreshCw className="size-4 text-orange-500 animate-spin" />}
                                    <span className={cn("text-[9px] font-black uppercase tracking-widest", item.status === 'impresso' ? "text-emerald-500" : "text-orange-500")}>
                                       {item.status}
                                    </span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-right px-10">
                                 <p className="text-[10px] font-black text-slate-500 tracking-tighter">{new Date(item.created_at).toLocaleString()}</p>
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </div>
            </div>
         </div>

         {/* Sidebar / Info */}
         <div className="space-y-8">
            <div className="bg-orange-50 rounded-[48px] p-10 border border-orange-100 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 text-orange-500">
                  <FileText className="size-32" />
               </div>
               <div className="relative z-10 space-y-8">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black italic uppercase tracking-tighter text-orange-600">Manual Pro</h3>
                     <p className="text-slate-500 font-medium italic text-sm">Como usar a impressão automática.</p>
                  </div>
                  <ul className="space-y-6">
                     {[
                        { t: 'Servidor Local', d: 'Conecte sua impressora ao PC com nosso Agent.' },
                        { t: 'ESC/POS nativo', d: 'Suporte total a 80mm e 58mm térmicas.' },
                        { t: 'Multi-setor', d: 'Impressão separada por categoria de item.' }
                     ].map(step => (
                        <li key={step.t} className="flex gap-4">
                           <div className="size-2 bg-orange-500 rounded-full mt-1.5 shrink-0 shadow-lg shadow-orange-500/30" />
                           <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase text-orange-900 tracking-widest leading-none">{step.t}</p>
                              <p className="text-xs text-slate-500 font-medium italic">{step.d}</p>
                           </div>
                        </li>
                     ))}
                  </ul>
               </div>
            </div>

            <div className="bg-white rounded-[48px] p-10 shadow-2xl border border-slate-50 space-y-8">
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status do Servidor</p>
                  <div className="flex items-center gap-3">
                     <div className="size-4 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/40" />
                     <h3 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase">Gateway Online</h3>
                  </div>
               </div>
               <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">IP do Local Gateway</p>
                  <Input readOnly value="192.168.1.10" className="h-12 bg-white border-none font-black text-xs text-slate-900 rounded-xl" />
               </div>
               <Button className="w-full h-16 rounded-[24px] bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-slate-800">
                  DOWNLOAD AGENT .EXE
               </Button>
            </div>
         </div>

      </div>

      {/* Printer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="rounded-[40px] border-none shadow-2xl p-0 overflow-hidden max-w-lg">
            <div className="bg-orange-500 p-10 text-white">
               <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Configurar <br /> <span className="text-slate-900">Impressora</span></h2>
               <p className="text-orange-900 text-[10px] font-black uppercase tracking-widest mt-4">Pareie seu hardware térmico V3</p>
            </div>
            <div className="p-10 space-y-6">
               <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Identificador</Label>
                  <Input 
                     placeholder="EX: IMPRESSORA COZINHA" 
                     className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg uppercase"
                     value={newPrinter.nome}
                     onChange={e => setNewPrinter({...newPrinter, nome: e.target.value})}
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">IP da Impressora (Opcional)</Label>
                     <Input 
                        placeholder="192.168.x.x" 
                        className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-sm"
                        value={newPrinter.ip}
                        onChange={e => setNewPrinter({...newPrinter, ip: e.target.value})}
                     />
                  </div>
                  <div className="space-y-4">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Setor</Label>
                     <select 
                        className="w-full h-16 rounded-[24px] bg-slate-50 border-none font-black text-[10px] uppercase tracking-widest px-6 outline-none"
                        value={newPrinter.setor}
                        onChange={e => setNewPrinter({...newPrinter, setor: e.target.value})}
                     >
                        <option value="cozinha">COZINHA</option>
                        <option value="balcao">BALCÃO / ATENDIMENTO</option>
                        <option value="bar">BAR / BEBIDAS</option>
                        <option value="entrega">ZONA DE ENTREGA</option>
                     </select>
                  </div>
               </div>

               <Button onClick={handleAddPrinter} className="w-full h-20 rounded-[32px] bg-slate-900 border-none hover:bg-slate-800 text-white font-black italic uppercase text-xs tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 mt-6">
                  Conectar e Salvar
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  )
}
