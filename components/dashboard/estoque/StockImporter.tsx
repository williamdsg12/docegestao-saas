"use client"

import { useState, useRef } from "react"
import { 
    Upload, 
    Camera, 
    FileText, 
    X, 
    Check, 
    AlertCircle, 
    Loader2, 
    Trash2, 
    Save, 
    Table as TableIcon,
    RefreshCw,
    Sparkles,
    ChevronRight,
    Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import * as XLSX from 'xlsx'
import { motion, AnimatePresence } from "framer-motion"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ImportItem {
    id: string
    item: string
    codigo: string
    descricao: string
    quantidade: number
    unidade: string
    valor_unitario: number
    valor_total: number
    status: 'pending' | 'new' | 'update' | 'error'
    message?: string
}

export function StockImporter({ isOpen, onOpenChange, onImportComplete, tenantId, userId }: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onImportComplete: () => void
    tenantId: string
    userId: string
}) {
    const [step, setStep] = useState<'upload' | 'preview'>('upload')
    const [items, setItems] = useState<ImportItem[]>([])
    const [loading, setLoading] = useState(false)
    const [supplier, setSupplier] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)

    // Reset state on open
    const handleOpenChange = (open: boolean) => {
        if (open) {
            setStep('upload')
            setItems([])
            setSupplier("")
        }
        onOpenChange(open)
    }

    // --- PARSERS ---

    const processExcel = async (file: File) => {
        setLoading(true)
        try {
            const data = await file.arrayBuffer()
            const workbook = XLSX.read(data)
            const worksheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]
            
            // Map common column names
            const mapped = jsonData.map((row, idx) => {
                const item = row.DESCRIÇÃO || row.PRODUTO || row.ITEM || row.Nome || row.name || ""
                const qty = parseFloat(row.QTD || row.QUANTIDADE || row.Quantidade || row.qty || 0)
                const total = parseFloat(row.TOTAL || row.VL_TOTAL || row.Subtotal || 0)
                const unitPrice = parseFloat(row.VL_UNIT || row.PREÇO || row.Preço || row.price || (qty > 0 ? total / qty : 0))

                return {
                    id: crypto.randomUUID(),
                    item: String(item),
                    codigo: String(row.CÓDIGO || row.SKU || row.REF || ""),
                    descricao: String(row.DESCRIÇÃO || ""),
                    quantidade: isNaN(qty) ? 0 : qty,
                    unidade: String(row.UN || row.UNIDADE || row.un || "un"),
                    valor_unitario: isNaN(unitPrice) ? 0 : unitPrice,
                    valor_total: isNaN(total) ? 0 : total,
                    status: 'pending' as const
                }
            }).filter(i => i.item && i.quantidade > 0)

            setItems(mapped)
            setStep('preview')
            toast.success(`${mapped.length} itens extraídos da planilha!`)
        } catch (e) {
            toast.error("Erro ao ler Excel")
        } finally {
            setLoading(false)
        }
    }

    const processXml = async (file: File) => {
        setLoading(true)
        try {
            const text = await file.text()
            const parser = new DOMParser()
            const xmlDoc = parser.parseFromString(text, "text/xml")
            
            const dets = xmlDoc.getElementsByTagName("det")
            const extracted: ImportItem[] = []

            for (let i = 0; i < dets.length; i++) {
                const prod = dets[i].getElementsByTagName("prod")[0]
                const name = prod.getElementsByTagName("xProd")[0]?.textContent || ""
                const qty = parseFloat(prod.getElementsByTagName("qCom")[0]?.textContent || "0")
                const unit = prod.getElementsByTagName("uCom")[0]?.textContent || "un"
                const unitPrice = parseFloat(prod.getElementsByTagName("vUnCom")[0]?.textContent || "0")
                const totalPrice = parseFloat(prod.getElementsByTagName("vProd")[0]?.textContent || "0")
                const code = prod.getElementsByTagName("cProd")[0]?.textContent || ""

                extracted.push({
                    id: crypto.randomUUID(),
                    item: name,
                    codigo: code,
                    descricao: name,
                    quantidade: qty,
                    unidade: unit,
                    valor_unitario: unitPrice,
                    valor_total: totalPrice,
                    status: 'pending'
                })
            }

            // Extract supplier
            const emit = xmlDoc.getElementsByTagName("emit")[0]
            const fornr = emit?.getElementsByTagName("xNome")[0]?.textContent || ""
            if (fornr) setSupplier(fornr)

            setItems(extracted)
            setStep('preview')
            toast.success(`${extracted.length} itens extraídos da Nota Fiscal!`)
        } catch (e) {
            toast.error("Erro ao processar XML")
        } finally {
            setLoading(false)
        }
    }

    const processImage = async (file: File) => {
        setLoading(true)
        toast.loading("Analisando imagem com IA...", { id: 'vision' })
        try {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1]
                
                const res = await fetch('/api/ai/parse-invoice-vision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64 })
                })
                
                const parsed = await res.json()
                if (parsed.success) {
                    const mapped = parsed.data.items.map((i: any) => ({
                        id: crypto.randomUUID(),
                        item: i.item,
                        codigo: i.codigo || "",
                        descricao: i.descricao || "",
                        quantidade: i.quantidade,
                        unidade: i.unidade,
                        valor_unitario: i.valor_unitario,
                        valor_total: i.valor_total,
                        status: 'pending'
                    }))
                    setItems(mapped)
                    if (parsed.data.fornecedor) setSupplier(parsed.data.fornecedor)
                    setStep('preview')
                    toast.success("Imagem analisada com sucesso!", { id: 'vision' })
                } else {
                    throw new Error(parsed.error)
                }
            }
        } catch (e: any) {
            toast.error(`Erro: ${e.message}`, { id: 'vision' })
        } finally {
            setLoading(false)
        }
    }

    const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.name.endsWith('.xlsx')) processExcel(file)
        else if (file.name.endsWith('.xml')) processXml(file)
        else if (file.type.startsWith('image/')) processImage(file)
        else toast.error("Formato de arquivo não suportado")
    }

    const confirmImport = async () => {
        if (items.length === 0) return
        setLoading(true)
        toast.loading("Atualizando estoque...", { id: 'import' })
        
        try {
            const res = await fetch('/api/inventory/import-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items,
                    tenantId,
                    userId,
                    fornecedor: supplier
                })
            })

            const data = await res.json()
            if (data.success) {
                toast.success("Importação concluída com sucesso!", { id: 'import' })
                onImportComplete()
                onOpenChange(false)
            } else {
                throw new Error(data.error)
            }
        } catch (e: any) {
            toast.error(`Erro na importação: ${e.message}`, { id: 'import' })
        } finally {
            setLoading(false)
        }
    }

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id))
    }

    const updateItem = (id: string, field: keyof ImportItem, value: any) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] md:h-[85vh] overflow-hidden p-0 rounded-[40px] border-none shadow-2xl flex flex-col">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none flex items-center gap-3">
                        {step === 'upload' ? 'Importação' : 'Conferência'} 
                        <span className="text-pink-500">De Estoque</span>
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic mt-1">
                        {step === 'upload' ? 'Upload de planilhas, notas fiscais ou fotos' : 'Valide os itens extraídos antes de confirmar'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {step === 'upload' ? (
                            <motion.div 
                                key="upload"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="p-8 space-y-8"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Excel/XML Area */}
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="group relative flex flex-col items-center justify-center p-10 py-16 rounded-[40px] border-4 border-dashed border-slate-100 hover:border-pink-500 hover:bg-pink-50/30 transition-all duration-500"
                                    >
                                        <div className="size-20 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-white transition-all shadow-xl shadow-slate-200/50 group-hover:shadow-pink-200">
                                            <FileText size={40} />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-widest text-slate-600 group-hover:text-pink-500">Upload Planilha / XML</span>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-2">Suporta .xlsx e XML de Nota Fiscal</p>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept=".xlsx,.xml,image/*" 
                                            onChange={onFileUpload} 
                                        />
                                    </button>

                                    {/* Camera Area */}
                                    <button 
                                        onClick={() => cameraInputRef.current?.click()}
                                        className="group relative flex flex-col items-center justify-center p-10 py-16 rounded-[40px] border-4 border-dashed border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-500"
                                    >
                                        <div className="size-20 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-xl shadow-slate-200/50 group-hover:shadow-blue-200">
                                            <Camera size={40} />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-widest text-slate-600 group-hover:text-blue-500">Importar pela Câmera</span>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-2">Tire uma foto do cupom fiscal</p>
                                        <input 
                                            type="file" 
                                            ref={cameraInputRef} 
                                            className="hidden" 
                                            accept="image/*" 
                                            capture="environment" 
                                            onChange={onFileUpload} 
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                    <div className="size-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500">
                                        <AlertCircle size={20} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                        Dica: A importação inteligente detecta produtos existentes pelo <span className="text-pink-500">Código SKU</span> ou <span className="text-pink-500">Nome</span>. Novos produtos serão criados automaticamente.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="preview"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex flex-col bg-slate-50/50 overflow-hidden"
                            >
                                <div className="p-8 pb-4 flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Fornecedor / Emitente</label>
                                        <Input 
                                            value={supplier} 
                                            onChange={e => setSupplier(e.target.value)}
                                            placeholder="Nome do Fornecedor"
                                            className="h-12 rounded-2xl bg-white border-none px-6 font-bold shadow-sm italic"
                                        />
                                    </div>
                                    <Badge variant="outline" className="h-12 px-6 rounded-2xl bg-white border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest mb-0.5">
                                        {items.length} ITENS IDENTIFICADOS
                                    </Badge>
                                </div>

                                <ScrollArea className="flex-1 px-8 pb-8">
                                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50/50">
                                                <TableRow className="hover:bg-transparent border-slate-100">
                                                    <TableHead className="text-[9px] font-black uppercase tracking-widest italic px-6">Item / Prod</TableHead>
                                                    <TableHead className="text-[9px] font-black uppercase tracking-widest italic text-center w-24">Qtd</TableHead>
                                                    <TableHead className="text-[9px] font-black uppercase tracking-widest italic text-center w-20">Un</TableHead>
                                                    <TableHead className="text-[9px] font-black uppercase tracking-widest italic text-right w-32">Vl. Unit</TableHead>
                                                    <TableHead className="text-[9px] font-black uppercase tracking-widest italic text-right w-32">Total</TableHead>
                                                    <TableHead className="w-12"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item) => (
                                                    <TableRow key={item.id} className="hover:bg-slate-50/30 border-slate-50 transition-colors group">
                                                        <TableCell className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <input 
                                                                    className="bg-transparent font-black text-sm text-slate-900 border-b border-transparent hover:border-slate-200 focus:border-pink-500 outline-none w-full uppercase italic"
                                                                    value={item.item}
                                                                    onChange={e => updateItem(item.id, 'item', e.target.value)}
                                                                />
                                                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                                                                    CÓD: {item.codigo || 'S/ REF'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <input 
                                                                type="number"
                                                                className="bg-slate-50 text-center font-black text-xs h-9 rounded-xl border-none outline-none w-full"
                                                                value={item.quantidade}
                                                                onChange={e => updateItem(item.id, 'quantidade', parseFloat(e.target.value))}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <input 
                                                                className="bg-transparent text-center font-bold text-[10px] text-slate-400 border-none outline-none w-full uppercase"
                                                                value={item.unidade}
                                                                onChange={e => updateItem(item.id, 'unidade', e.target.value)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <input 
                                                                type="number"
                                                                className="bg-transparent text-right font-bold text-xs text-slate-600 border-none outline-none w-full pr-1"
                                                                value={item.valor_unitario}
                                                                onChange={e => updateItem(item.id, 'valor_unitario', parseFloat(e.target.value))}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-black text-sm text-slate-900 italic">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_total)}
                                                        </TableCell>
                                                        <TableCell className="px-4">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => removeItem(item.id)}
                                                                className="size-8 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 group-hover:opacity-100 opacity-0 transition-opacity"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </ScrollArea>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <DialogFooter className="p-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                    {step === 'preview' && (
                        <Button 
                            variant="ghost" 
                            onClick={() => setStep('upload')}
                            className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400"
                        >
                            Voltar
                        </Button>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <Button 
                            variant="ghost" 
                            onClick={() => onOpenChange(false)}
                            className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400"
                        >
                            Cancelar
                        </Button>
                        {step === 'preview' && (
                            <Button 
                                disabled={loading || items.length === 0}
                                onClick={confirmImport}
                                className="h-16 px-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                            >
                                {loading ? <Loader2 className="animate-spin size-4" /> : <Check size={18} />}
                                Confirmar Entrada de Estoque
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
