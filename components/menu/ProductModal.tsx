"use client"

import { useState, useEffect } from "react"
import { X, Plus, Minus, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ProductModalProps {
  product: any
  isOpen: boolean
  onClose: () => void
  onAddToCart: (customizedProduct: any) => void
}

export function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [selectedVariation, setSelectedVariation] = useState<any>(null)
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({})
  const [quantity, setQuantity] = useState(1)
  const [observation, setObservation] = useState("")

  useEffect(() => {
    if (!isOpen) {
      setSelectedVariation(null)
      setSelectedExtras({})
      setQuantity(1)
      setObservation("")
    }
  }, [isOpen])

  if (!product) return null

  const calculateCurrentPrice = () => {
    let price = parseFloat(product.price) || 0
    if (selectedVariation) {
      price += (parseFloat(selectedVariation.price_adjustment) || 0)
    }
    Object.entries(selectedExtras).forEach(([extraId, qty]) => {
      const extra = product.extras?.find((e: any) => e.id === extraId)
      if (extra) {
        price += (parseFloat(extra.price) || 0) * qty
      }
    })
    return price * quantity
  }

  const handleAdd = () => {
    const extrasArray = Object.entries(selectedExtras).map(([id, qty]) => {
      const ex = product.extras.find((e: any) => e.id === id)
      return { id, name: ex.name, price: ex.price, quantity: qty }
    })

    onAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image_url: product.image_url,
      variation: selectedVariation,
      extras: extrasArray,
      observation,
      totalItemPrice: calculateCurrentPrice()
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl bg-white max-h-[90vh] flex flex-col rounded-[24px] md:rounded-[32px]">
        {/* Header Image */}
        <div className="relative h-48 md:h-64 w-full shrink-0">
          {product.image_url ? (
            <img src={product.image_url} className="size-full object-cover" alt={product.name} />
          ) : (
            <div className="size-full bg-slate-50 flex items-center justify-center text-slate-200 italic font-black text-4xl">
              DOCE GESTÃO
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 bg-black/20 backdrop-blur-md rounded-full hover:bg-black/40 text-white z-50 transition-all active:scale-90"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar">
          {/* info */}
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                {product.name}
              </h2>
              <span className="text-xl md:text-2xl font-black text-slate-900 italic tracking-tighter shrink-0">
                R$ {parseFloat(product.price).toFixed(2)}
              </span>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              {product.description || "Delicioso produto artesanal, preparado com os melhores ingredientes."}
            </p>
          </div>

          {/* variations */}
          {product.variations && product.variations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic">Escolha o Tamanho / Tipo</h4>
                <Badge className="bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5">Obrigatório</Badge>
              </div>
              <div className="grid gap-3">
                {product.variations.map((v: any) => (
                  <button 
                    key={v.id}
                    onClick={() => setSelectedVariation(v)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                      selectedVariation?.id === v.id ? "border-red-500 bg-red-50/10 shadow-sm" : "border-slate-50 bg-slate-50 hover:bg-white hover:border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-5 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedVariation?.id === v.id ? "border-red-500 bg-red-500" : "border-slate-300 bg-white"
                      )}>
                        {selectedVariation?.id === v.id && <div className="size-2 rounded-full bg-white" />}
                      </div>
                      <span className={cn("text-xs font-bold uppercase transition-colors", selectedVariation?.id === v.id ? "text-red-600" : "text-slate-600")}>{v.name}</span>
                    </div>
                    {v.price_adjustment > 0 && (
                      <span className="text-xs font-black text-slate-900">+ R$ {parseFloat(v.price_adjustment).toFixed(2)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* extras */}
          {product.extras && product.extras.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic">Adicionais Extras</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Opcional</p>
              </div>
              <div className="grid gap-3">
                {product.extras.map((ex: any) => {
                  const currentQty = selectedExtras[ex.id] || 0
                  return (
                    <div 
                      key={ex.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                        currentQty > 0 ? "border-red-500 bg-red-50/10 shadow-sm" : "border-slate-50 bg-slate-50"
                      )}
                    >
                      <div className="flex-1">
                        <p className={cn("text-xs font-bold uppercase", currentQty > 0 ? "text-red-700" : "text-slate-600")}>{ex.name}</p>
                        <p className="text-[10px] font-black text-slate-900 mt-0.5">+ R$ {parseFloat(ex.price).toFixed(2)}</p>
                      </div>
                      
                      <div className="flex items-center bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
                        <button 
                          className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 transition-all active:scale-95"
                          onClick={() => {
                            const newExtras = {...selectedExtras}
                            if (currentQty > 0) {
                              newExtras[ex.id] = currentQty - 1
                              if (newExtras[ex.id] === 0) delete newExtras[ex.id]
                              setSelectedExtras(newExtras)
                            }
                          }}
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className={cn("w-8 text-center font-black text-xs", currentQty > 0 ? "text-red-600" : "text-slate-400")}>{currentQty}</span>
                        <button 
                          className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 transition-all active:scale-95 disabled:opacity-30"
                          disabled={ex.limit && currentQty >= ex.limit}
                          onClick={() => {
                            const newExtras = {...selectedExtras}
                            newExtras[ex.id] = currentQty + 1
                            setSelectedExtras(newExtras)
                          }}
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* observation */}
          <div className="space-y-4 pb-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic">Observações</h4>
            <Textarea 
              placeholder="Alguma observação para o pedido?"
              className="min-h-[100px] rounded-2xl border-none bg-slate-50 p-4 text-sm font-medium focus-visible:ring-red-500/20 active:bg-white transition-all shadow-inner"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-6 md:p-8 border-t border-slate-50 bg-slate-50/50 shrink-0">
          <div className="flex items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center bg-white rounded-2xl p-1.5 shrink-0 border border-slate-100 shadow-sm h-14 md:h-16">
              <button 
                className="size-10 md:size-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              >
                <Minus className="size-5" />
              </button>
              <span className="w-10 md:w-12 text-center font-black text-lg text-slate-900">
                {quantity}
              </span>
              <button 
                className="size-10 md:size-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                onClick={() => setQuantity(prev => prev + 1)}
              >
                <Plus className="size-5" />
              </button>
            </div>

            <Button 
              className="flex-1 h-14 md:h-16 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase italic tracking-widest shadow-xl shadow-red-100 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
              disabled={product.variations?.length > 0 && !selectedVariation}
              onClick={handleAdd}
            >
              Adicionar • R$ {calculateCurrentPrice().toFixed(2)}
            </Button>
          </div>
          {product.variations?.length > 0 && !selectedVariation && (
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-red-500 mt-4 animate-pulse">Escolha uma opção obrigatória para continuar</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
