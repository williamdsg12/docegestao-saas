"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileUp, FileText, Check, AlertCircle, Trash2, ArrowRight, Loader2 } from "lucide-react"
import { parseNfeXml, processNfePurchase } from "@/utils/inventory"
import { useBusiness } from "@/hooks/useBusiness"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function NfeImportModal({ isOpen, onClose, ingredients, onSuccess }: any) {
    const { profile } = useBusiness()
    const { user } = useAuth()
    const [file, setFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<any>(null)
    const [mappedItems, setMappedItems] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png']
        const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

        if (!hasValidExtension) {
            return toast.error("Por favor, selecione um arquivo PDF ou Imagem (JPG/PNG).")
        }

        setFile(file)
        setLoading(true)
        setParsedData(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('userId', user?.id || '')
        formData.append('tenantId', (profile?.tenant_id || profile?.company_id) || '')
        formData.append('companyId', (profile?.tenant_id || profile?.company_id) || '')

        try {
            const res = await fetch('/api/upload-invoice', {
                method: 'POST',
                body: formData
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Erro ao processar nota")

            const data = result.data
            setParsedData(data)
            
            // Tentar mapeamento automático inicial
            const initialMapping = data.items.map((item: any) => {
                const match = ingredients.find((ing: any) => 
                    item.nome.toLowerCase().includes(ing.nome.toLowerCase()) ||
                    ing.nome.toLowerCase().includes(item.nome.toLowerCase())
                )
                return {
                    ...item,
                    ingrediente_id: match?.id || "",
                    quantidade_base: item.quantidade
                }
            })
            setMappedItems(initialMapping)
            toast.success("Nota analisada com sucesso!")
        } catch (err: any) {
            console.error("AI Import Error:", err)
            const details = err.message || "Verifique sua conexão e os créditos da API."
            toast.error("Erro na Importação Inteligente", {
                description: details
            })
            setFile(null)
        } finally {
            setLoading(false)
        }
    }

    async function handleImport() {
        const unmapped = mappedItems.filter(i => !i.ingrediente_id)
        if (unmapped.length > 0) {
            return toast.error(`Vincule todos os itens aos ingredientes do estoque antes de importar. (${unmapped.length} pendentes)`)
        }

        setLoading(true)
        try {
            const tenantId = profile?.tenant_id || profile?.company_id
            await processNfePurchase({
                items: mappedItems,
                fornecedor: parsedData.fornecedor,
                numeroNota: parsedData.numeroNota,
                valorTotal: parsedData.items.reduce((acc: number, cur: any) => acc + cur.valorTotal, 0),
                tenantId: tenantId as string,
                userId: user?.id as string
            })
            toast.success("Nota Fiscal importada e estoque atualizado!")
            onSuccess?.()
            onClose()
        } catch (err) {
            console.error(err)
            toast.error("Erro ao processar a importação da nota.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 flex items-center gap-3">
                        <FileText size={32} className="text-emerald-500" />
                        Importar <span className="text-emerald-500">Nota Fiscal (IA)</span>
                    </DialogTitle>
                    <DialogDescription className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400 italic">
                        Automatize o abastecimento do seu estoque usando Inteligência Artificial.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-8 pt-0">
                    {!parsedData ? (
                        <div className="h-[400px] border-4 border-dashed border-slate-50 rounded-[40px] flex flex-col items-center justify-center p-12 text-center group hover:border-emerald-100 transition-colors bg-slate-50/30 relative overflow-hidden">
                            {loading && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                                    <div className="relative">
                                        <div className="size-24 rounded-[32px] bg-emerald-500 flex items-center justify-center text-white animate-bounce">
                                            <FileText size={48} />
                                        </div>
                                        <div className="absolute -inset-4 border-4 border-emerald-500 border-dashed rounded-[40px] animate-[spin_10s_linear_infinite]" />
                                    </div>
                                    <h3 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase mt-8">Escaneando Nota...</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest animate-pulse">A IA está lendo os produtos e valores</p>
                                </div>
                            )}
                            <div className="size-24 rounded-[32px] bg-white shadow-xl flex items-center justify-center text-slate-200 group-hover:text-emerald-500 group-hover:scale-110 transition-all duration-500 mb-6">
                                <FileUp size={48} />
                            </div>
                            <h3 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">Selecione a Nota Fiscal</h3>
                            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest max-w-xs">
                                Arraste ou selecione o arquivo PDF ou Foto (JPG/PNG) da sua nota.
                            </p>
                            <label 
                                htmlFor="invoice-upload"
                                className="absolute inset-0 z-20 cursor-pointer flex flex-col items-center justify-center"
                            >
                                <span className="sr-only">Upload Nota Fiscal</span>
                            </label>

                            <input 
                                id="invoice-upload"
                                type="file" 
                                accept=".pdf,.jpg,.jpeg,.png" 
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={loading}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6 h-full flex flex-col">
                            {/* NF Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">Fornecedor</p>
                                    <p className="font-black italic text-slate-900 truncate">{parsedData.fornecedor}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">Nota Fiscal</p>
                                    <p className="font-black italic text-slate-900">№ {parsedData.numeroNota}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">Emissão</p>
                                    <p className="font-black italic text-slate-900">{new Date(parsedData.dataEmissao).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">Total Prod.</p>
                                    <p className="font-black italic text-emerald-500">R$ {parsedData.items.reduce((acc: number, i: any) => acc + i.valorTotal, 0).toFixed(2).replace('.', ',')}</p>
                                </div>
                            </div>

                            {/* Mapping Area */}
                            <div className="flex-1 min-h-0 flex flex-col">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 italic flex items-center gap-2">
                                    <ArrowRight size={12} className="text-emerald-500" /> Vincular itens da nota ao estoque
                                </h4>
                                <ScrollArea className="flex-1 pr-4">
                                    <div className="space-y-3">
                                        {mappedItems.map((item, idx) => (
                                            <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-4 flex items-center justify-between group hover:border-emerald-200 transition-all shadow-sm">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h5 className="font-black italic text-slate-900 uppercase text-xs truncate">{item.nome}</h5>
                                                        <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-100 text-slate-400 rounded-lg">{item.quantidade}{item.unidade}</Badge>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">Valor Un: R$ {item.valorUnitario.toFixed(2).replace('.', ',')}</p>
                                                </div>

                                                <div className="w-[300px] shrink-0">
                                                    <Select 
                                                        value={item.ingrediente_id} 
                                                        onValueChange={(val) => {
                                                            const newItems = [...mappedItems]
                                                            newItems[idx].ingrediente_id = val
                                                            setMappedItems(newItems)
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-10 rounded-xl border-slate-100 font-bold text-[10px] uppercase shadow-none focus:ring-emerald-500">
                                                            <SelectValue placeholder="Vincular Ingrediente..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                            {ingredients.map((ing: any) => (
                                                                <SelectItem key={ing.id} value={ing.id} className="text-xs font-bold uppercase py-3 rounded-xl">
                                                                    {ing.nome} <span className="text-[9px] text-slate-400 ml-2">({ing.unidade_base})</span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-8 bg-slate-50/50 flex items-center justify-between sm:justify-between gap-4">
                    <Button 
                        variant="ghost" 
                        onClick={() => { setParsedData(null); setFile(null); }}
                        className="h-12 px-6 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-white"
                        disabled={!parsedData || loading}
                    >
                        Trocar Nota
                    </Button>
                    
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            onClick={onClose}
                            className="h-12 px-6 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-white"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleImport}
                            disabled={!parsedData || loading}
                            className="h-12 px-10 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/10 flex items-center gap-3"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                            {loading ? "Processando..." : "Confirmar e Abastecer"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
