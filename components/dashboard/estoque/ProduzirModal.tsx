"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { useAuth } from "@/hooks/useAuth"
import { 
    Flame, 
    CheckCircle2, 
    Loader2,
    AlertTriangle,
    ArrowRight,
    ChefHat,
    Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { produceRecipe, convertToBaseUnit, InputUnit } from "@/utils/inventory"
import { useRouter } from "next/navigation"

interface ProduzirModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    recipe: any
}

export function ProduzirModal({ isOpen, onOpenChange, recipe }: ProduzirModalProps) {
    const { profile } = useBusiness()
    const { user } = useAuth()
    const router = useRouter()
    
    const [quantity, setQuantity] = useState("1")
    const [isProducing, setIsProducing] = useState(false)
    const [missingIngredients, setMissingIngredients] = useState<any[]>([])
    const [checkingImpact, setCheckingImpact] = useState(false)

    useEffect(() => {
        if (isOpen && recipe) {
            checkImpact(parseFloat(quantity) || 1)
        }
    }, [isOpen, recipe, quantity])

    async function checkImpact(qty: number) {
        if (!recipe) return
        setCheckingImpact(true)
        try {
            // 1. Buscar ingredientes vinculados na tabela receita_ingredientes
            const { data: recipeIngs } = await supabase
                .from('receita_ingredientes')
                .select('*, ingredientes(id, nome, estoque_atual, unidade_base)')
                .eq('receita_id', recipe.id)
            
            if (!recipeIngs || recipeIngs.length === 0) {
                setMissingIngredients([])
                return
            }

            const missing = recipeIngs.filter(ri => {
                const totalNeededRaw = ri.quantidade * qty
                const { value: neededBase } = convertToBaseUnit(totalNeededRaw, ri.unidade as InputUnit)
                return (ri.ingredientes.estoque_atual || 0) < neededBase
            })

            setMissingIngredients(missing.map(m => {
                const totalNeededRaw = m.quantidade * qty
                const { value: neededBase } = convertToBaseUnit(totalNeededRaw, m.unidade as InputUnit)
                return {
                    nome: m.ingredientes.nome,
                    needed: neededBase,
                    available: m.ingredientes.estoque_atual || 0,
                    unit: m.ingredientes.unidade_base
                }
            }))
        } catch (e) {
            console.error("Erro ao checar impacto:", e)
        } finally {
            setCheckingImpact(false)
        }
    }

    async function handleConfirm() {
        if (!recipe || isProducing) return
        const qty = parseFloat(quantity) || 1
        const tenantId = profile?.tenant_id || profile?.company_id
        if (!tenantId || !user) return

        setIsProducing(true)
        toast.loading("Baixando estoque e registrando produção...", { id: 'produce' })

        try {
            await produceRecipe(recipe.id, qty, tenantId, user.id)
            toast.success(`Sucesso! ${qty}x ${recipe.nome} produzidos.`, { id: 'produce' })
            onOpenChange(false)
            router.refresh()
        } catch (e: any) {
            toast.error(e.message || "Erro ao registrar produção", { id: 'produce' })
        } finally {
            setIsProducing(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xs rounded-[40px] p-8 border-none shadow-2xl bg-white overflow-hidden font-bold">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                
                <DialogHeader className="mb-8 items-center text-center">
                    <div className="size-14 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center mb-4">
                        <Flame size={28} fill="currentColor" className="opacity-20" />
                    </div>
                    <DialogTitle className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter leading-none mb-1">
                        {recipe?.nome}
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Configurar ciclo de produção</DialogDescription>
                </DialogHeader>

                <div className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Quanto vai produzir?</label>
                        <Input 
                            type="number" 
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="h-16 rounded-[24px] bg-slate-50 border-none text-center text-3xl font-black italic focus-visible:ring-pink-500 shadow-inner"
                        />
                        <p className="text-center text-[8px] text-slate-400 uppercase font-black mt-2">
                            Rendimento original: {recipe?.rendimento || '1'} unid
                        </p>
                    </div>

                    {/* Impact / Missing Alert */}
                    <div className="space-y-3 min-h-[60px] flex items-center justify-center">
                        {checkingImpact ? (
                            <Loader2 className="animate-spin text-slate-200" />
                        ) : missingIngredients.length > 0 ? (
                            <div className="p-5 rounded-[32px] bg-rose-50 border border-rose-100 space-y-3 w-full">
                                <div className="flex items-center gap-2 text-rose-500">
                                    <AlertTriangle size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Insumos Faltando!</span>
                                </div>
                                <div className="space-y-1">
                                    {missingIngredients.map((m, i) => (
                                        <p key={i} className="text-[10px] font-bold text-rose-400 uppercase leading-tight">
                                            - {m.nome}: Falta {Math.abs(m.available - m.needed).toFixed(1)}{m.unit}
                                        </p>
                                    ))}
                                </div>
                                <Button 
                                    onClick={() => { router.push('/dashboard/estoque'); onOpenChange(false); }}
                                    variant="link" 
                                    className="text-rose-600 font-black p-0 h-auto text-[9px] uppercase tracking-widest pt-2 flex items-center gap-1"
                                >
                                    Ir para o Estoque <ArrowRight size={10} />
                                </Button>
                            </div>
                        ) : (
                            <div className="p-5 rounded-[32px] bg-emerald-50 border border-emerald-100 flex items-center gap-3 w-full animate-in zoom-in-95">
                                <div className="size-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <CheckCircle2 size={16} />
                                </div>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Tudo pronto no estoque!</span>
                            </div>
                        )}
                    </div>

                    <Button 
                        onClick={handleConfirm}
                        disabled={isProducing || missingIngredients.length > 0 || checkingImpact}
                        className="w-full h-18 rounded-[24px] bg-slate-900 hover:bg-black text-white font-black italic uppercase text-base tracking-tighter shadow-2xl transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 py-4"
                    >
                        {isProducing ? <Loader2 className="animate-spin" /> : (
                            <><Flame size={20} fill="currentColor" /> INICIAR PRODUÇÃO</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
