"use client"

import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    FileUp, 
    Loader2, 
    Check, 
    X, 
    Trash2, 
    Package, 
    Plus, 
    ReceiptText, 
    Sparkles,
    AlertCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface InvoiceItem {
    name: string
    quantity: number
    unit: string
    price_total: number
}

interface InvoiceImportModalProps {
    companyId: string
    tenantId: string
    userId: string
    onSuccess: () => void
}

export function InvoiceImportModal({ companyId, tenantId, userId, onSuccess }: InvoiceImportModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState<'upload' | 'processing' | 'preview'>('upload')
    const [isUploading, setIsUploading] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    const [parsedData, setParsedData] = useState<{
        supplier: string
        date: string
        total: number
        items: InvoiceItem[]
    } | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setError(null)
        setStep('processing')
        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('userId', userId)
            formData.append('companyId', companyId)
            formData.append('tenantId', tenantId)

            const res = await fetch('/api/upload-invoice', {
                method: 'POST',
                body: formData
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Erro ao processar nota')

            setParsedData(result.data)
            setStep('preview')
        } catch (err: any) {
            console.error('Upload Error:', err)
            setError(err.message)
            setStep('upload')
        } finally {
            setIsUploading(false)
        }
    }

    const handleConfirm = async () => {
        if (!parsedData) return
        setIsConfirming(true)
        try {
            const res = await fetch('/api/confirm-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    companyId,
                    tenantId,
                    items: parsedData.items,
                    total: parsedData.total,
                    supplier: parsedData.supplier,
                    date: parsedData.date
                })
            })

            if (!res.ok) throw new Error('Erro ao confirmar importação')

            toast.success("Nota importada com sucesso! ✨")
            onSuccess()
            setIsOpen(false)
            resetState()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsConfirming(false)
        }
    }

    const resetState = () => {
        setStep('upload')
        setParsedData(null)
        setError(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        if (!parsedData) return
        const newItems = [...parsedData.items]
        newItems[index] = { ...newItems[index], [field]: value }
        setParsedData({ ...parsedData, items: newItems })
    }

    const removeItem = (index: number) => {
        if (!parsedData) return
        setParsedData({
            ...parsedData,
            items: parsedData.items.filter((_, i) => i !== index)
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={(val) => {
            setIsOpen(val)
            if (!val) resetState()
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-14 px-8 rounded-3xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-black uppercase tracking-widest text-[10px] shadow-lg transition-all w-full sm:w-auto">
                    <Sparkles className="mr-2 size-4 animate-pulse" />
                    Importar via IA 📸
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-4xl border-white/60 bg-white/95 backdrop-blur-2xl p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden text-slate-900 max-h-[90vh] overflow-y-auto">
                <div className="absolute -top-24 -right-24 size-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                
                <DialogHeader className="mb-8 relative z-10">
                    <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                        <ReceiptText className={cn("size-8 text-primary", step === 'processing' && "animate-bounce")} />
                        Importar <span className="text-primary italic">Nota Fiscal</span>
                    </DialogTitle>
                    <p className="text-slate-500 text-sm font-medium">Extraímos seus insumos automaticamente usando Inteligência Artificial.</p>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    {step === 'upload' && (
                        <motion.div 
                            key="upload"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="relative z-10"
                        >
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="group border-4 border-dashed border-rose-100 rounded-[40px] p-20 flex flex-col items-center justify-center gap-6 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden h-[400px]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="size-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-primary transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10">
                                    <FileUp className="size-10" />
                                </div>
                                <div className="text-center relative z-10">
                                    <h4 className="text-xl font-black uppercase tracking-tighter text-slate-800 mb-2">Clique ou arraste sua nota</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">Suporta fotos (JPG, PNG) e PDF de até 5MB</p>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden" 
                                    accept="image/*,application/pdf"
                                />
                            </div>
                            
                            {error && (
                                <div className="mt-6 p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3 text-rose-500">
                                    <AlertCircle className="size-5 shrink-0" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 'processing' && (
                        <motion.div 
                            key="processing"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-20 flex flex-col items-center justify-center text-center gap-10 relative z-10"
                        >
                            <div className="relative">
                                <div className="size-40 bg-primary/10 rounded-full animate-ping absolute inset-0 blur-2xl" />
                                <div className="size-40 bg-white rounded-[40px] shadow-2xl flex items-center justify-center relative z-10 border border-rose-50">
                                    <Loader2 className="size-16 text-primary animate-spin" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                                    Lendo nota com <span className="text-primary italic">IA Profissional</span>
                                </h3>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse italic">Identificando produtos, pesos e valores em tempo real...</p>
                            </div>
                        </motion.div>
                    )}

                    {step === 'preview' && parsedData && (
                        <motion.div 
                            key="preview"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-10 relative z-10"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fornecedor</Label>
                                    <Input 
                                        value={parsedData.supplier} 
                                        onChange={e => setParsedData({...parsedData, supplier: e.target.value})}
                                        className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data da Compra</Label>
                                    <Input 
                                        type="date"
                                        value={parsedData.date} 
                                        onChange={e => setParsedData({...parsedData, date: e.target.value})}
                                        className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl px-5 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Valor Total</Label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                        <Input 
                                            type="number"
                                            value={parsedData.total} 
                                            onChange={e => setParsedData({...parsedData, total: parseFloat(e.target.value)})}
                                            className="h-14 border-rose-100 bg-rose-50/30 rounded-2xl pl-12 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[32px] border border-rose-100 bg-white shadow-sm overflow-hidden">
                                <div className="p-6 bg-slate-50 border-b border-rose-50">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 italic">Itens Detectados ({parsedData.items.length})</h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Produto</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Qtd</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Un</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                                                <th className="px-6 py-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-rose-50">
                                            {parsedData.items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <Input 
                                                            value={item.name} 
                                                            onChange={e => updateItem(idx, 'name', e.target.value)}
                                                            className="h-10 border-transparent bg-transparent hover:border-rose-200 focus:bg-white rounded-xl font-bold flex-1 underline decoration-dotted decoration-primary/20"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 w-24">
                                                        <Input 
                                                            type="number"
                                                            value={item.quantity} 
                                                            onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                                                            className="h-10 border-transparent bg-transparent hover:border-rose-200 focus:bg-white rounded-xl font-bold text-center"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 w-24">
                                                        <select 
                                                            value={item.unit}
                                                            onChange={e => updateItem(idx, 'unit', e.target.value)}
                                                            className="h-10 w-full bg-transparent border-transparent hover:border-rose-200 focus:bg-white rounded-xl font-black text-[10px] uppercase outline-none px-2 cursor-pointer"
                                                        >
                                                            <option value="un">un</option>
                                                            <option value="g">g</option>
                                                            <option value="kg">kg</option>
                                                            <option value="ml">ml</option>
                                                            <option value="l">l</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 w-32">
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">R$</span>
                                                            <Input 
                                                                type="number"
                                                                value={item.price_total} 
                                                                onChange={e => updateItem(idx, 'price_total', parseFloat(e.target.value))}
                                                                className="h-10 border-transparent bg-transparent hover:border-rose-200 focus:bg-white rounded-xl font-black pl-8"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 w-16">
                                                        <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="rounded-xl hover:bg-rose-100 hover:text-rose-500 text-slate-300 transition-all">
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button 
                                    variant="outline"
                                    onClick={resetState}
                                    className="h-16 px-10 rounded-[20px] border-slate-200 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-rose-500 w-full sm:w-auto"
                                >
                                    Fazer novo upload
                                </Button>
                                <Button 
                                    onClick={handleConfirm}
                                    disabled={isConfirming || parsedData.items.length === 0}
                                    className="h-16 flex-1 rounded-[20px] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3"
                                >
                                    {isConfirming ? <Loader2 className="size-4 animate-spin text-white" /> : <Check className="size-5" />}
                                    {isConfirming ? "Sincronizando..." : "Confirmar Importação de Produtos"}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    )
}
