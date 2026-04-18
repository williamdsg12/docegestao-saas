"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { FileUp, ClipboardList, Check, Loader2, Sparkles, Trash2, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"

export function TextImportModal({ isOpen, onClose, ingredients, onSuccess }: any) {
    const { profile } = useBusiness()
    const { user } = useAuth()
    const [text, setText] = useState("")
    const [parsedItems, setParsedItems] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.txt')) {
            return toast.error("Selecione um arquivo .txt")
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            setText(event.target?.result as string)
        }
        reader.readAsText(file)
    }

    async function handleAnalyze() {
        if (!text.trim()) return toast.error("Cole algum texto primeiro")

        setLoading(true)
        try {
            const res = await fetch('/api/ai/parse-shopping-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            // Auto-mapeamento inicial
            const itemsWithMapping = result.data.items.map((item: any) => {
                const match = ingredients.find((ing: any) => 
                    item.item?.toLowerCase().includes(ing.nome.toLowerCase()) ||
                    ing.nome.toLowerCase().includes(item.item?.toLowerCase())
                )
                return {
                    ...item,
                    ingrediente_id: match?.id || "",
                    id: Math.random().toString(36).substr(2, 9)
                }
            })

            setParsedItems(itemsWithMapping)
            toast.success("Texto analisado com sucesso!")
        } catch (err: any) {
            toast.error("Erro na análise: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleConfirm() {
        if (parsedItems.length === 0) return
        
        setIsSaving(true)
        const tenantId = profile?.tenant_id || profile?.company_id

        try {
            const inserts = parsedItems.map(item => ({
                tenant_id: tenantId,
                company_id: tenantId,
                ingrediente_id: item.ingrediente_id || null,
                nome_item: item.item, // Mapeado do novo campo IA
                codigo: item.codigo || null,
                descricao: item.descricao || null,
                quantidade: parseFloat(item.quantidade) || 1,
                unidade: item.unidade,
                preco_unitario: parseFloat(item.valor_unitario) || 0,
                valor_total: parseFloat(item.valor_total) || 0,
                fornecedor: item.fornecedor || '',
                status: 'pendente',
                usuario_id: user?.id,
                origem: 'ia_text'
            }))

            const { error } = await supabase.from('lista_compras').insert(inserts)
            if (error) throw error

            toast.success(`${parsedItems.length} itens adicionados à lista!`)
            onSuccess?.()
            onClose()
            setParsedItems([])
            setText("")
        } catch (err: any) {
            toast.error("Erro ao salvar: " + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 flex items-center gap-3">
                        <Sparkles size={32} className="text-blue-500" />
                        Bulk Import <span className="text-blue-500">via IA</span>
                    </DialogTitle>
                    <DialogDescription className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400 italic">
                        Cole sua lista (WhatsApp, notas) e deixe a IA organizar tudo.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-8 pt-0 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
                        {/* Input Area */}
                        <div className="flex flex-col gap-4 min-h-0">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-2">
                                <ClipboardList size={12} className="text-blue-500" /> Cole o conteúdo abaixo
                            </h4>
                            <div className="flex-1 relative group min-h-0">
                                <Textarea 
                                    placeholder="Ex: Preciso de 5kg de farinha, 2 caixas de leite e também chocolate 50%..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="h-full rounded-[24px] border-slate-100 bg-slate-50/30 p-6 font-bold text-sm tracking-tight focus-visible:ring-blue-500 resize-none transition-all overflow-y-auto"
                                />
                                <div className="absolute top-4 right-6 h-10 w-10">
                                    <label className="h-full w-full cursor-pointer bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors">
                                        <FileUp size={20} />
                                        <input type="file" accept=".txt" onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>
                            </div>
                            <Button 
                                onClick={handleAnalyze}
                                disabled={loading || !text}
                                className="h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-xl shadow-blue-500/10"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                {loading ? "IA Analisando..." : "Analisar com IA"}
                            </Button>
                        </div>

                        {/* Result Area */}
                        <div className="flex flex-col gap-4 min-h-0">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-2">
                                <Check size={12} className="text-emerald-500" /> Itens Detectados ({parsedItems.length})
                            </h4>
                            
                            <div className="flex-1 bg-slate-50 rounded-[32px] p-4 flex flex-col min-h-0">
                                <ScrollArea className="flex-1 pr-2">
                                    <AnimatePresence mode="popLayout">
                                        {parsedItems.length > 0 ? (
                                            <div className="space-y-3">
                                                {parsedItems.map((item, idx) => (
                                                    <motion.div 
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        className="bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-blue-200 transition-all group"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex flex-col flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h5 className="font-black italic text-slate-900 uppercase text-xs truncate max-w-[120px]">{item.item}</h5>
                                                                    <Badge variant="secondary" className="text-[8px] font-black uppercase rounded-lg">
                                                                        {item.quantidade}{item.unidade}
                                                                    </Badge>
                                                                    {item.codigo && (
                                                                        <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase border border-blue-100">
                                                                            REF: {item.codigo}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {item.descricao && (
                                                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter line-clamp-1 mb-1 italic">
                                                                        {item.descricao}
                                                                    </p>
                                                                )}
                                                                {(item.valor_unitario > 0 || item.valor_total > 0) && (
                                                                    <p className="text-[9px] font-bold text-slate-500 uppercase italic bg-slate-50 p-1 rounded-md inline-block w-fit">
                                                                        UN: R$ {Number(item.valor_unitario).toFixed(2)} | <span className="text-emerald-500">TOTAL: R$ {Number(item.valor_total).toFixed(2)}</span>
                                                                    </p>
                                                                )}
                                                            </div>
                        
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => setParsedItems(prev => prev.filter(i => i.id !== item.id))}
                                                                className="size-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </div>

                                                        <Select 
                                                            value={item.ingrediente_id} 
                                                            onValueChange={(val) => {
                                                                const newItems = [...parsedItems]
                                                                newItems[idx].ingrediente_id = val
                                                                setParsedItems(newItems)
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-8 rounded-lg border-slate-100 font-bold text-[9px] uppercase shadow-none focus:ring-blue-500">
                                                                <SelectValue placeholder="Vincular ao estoque..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                                                <SelectItem value="none" className="text-[9px] font-black uppercase py-2">Não vincular (Livre)</SelectItem>
                                                                {ingredients.map((ing: any) => (
                                                                    <SelectItem key={ing.id} value={ing.id} className="text-[9px] font-black uppercase py-2">
                                                                        {ing.nome} ({ing.unidade_base})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-[200px] flex flex-col items-center justify-center text-center opacity-30 italic p-8">
                                                <ClipboardList size={40} className="mb-4" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Aguardando análise de texto...</p>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-slate-50/50 flex items-center justify-end gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="h-12 px-6 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-white"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirm}
                        disabled={parsedItems.length === 0 || isSaving}
                        className="h-12 px-10 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/10 gap-3"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                        {isSaving ? "Salvando..." : `Adicionar ${parsedItems.length} Itens`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
