"use client"

import { ShoppingCart, X, Plus, Minus, ArrowRight, Star, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string
  variation?: any
  extras?: any[]
  observation?: string
  totalItemPrice: number
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (id: string, delta: number) => void
  onRemoveItem: (id: string) => void
  onCheckout: () => void
  subtotal: number
}

export function CartDrawer({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout, 
  subtotal 
}: CartDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ x: "100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">Sua <span className="text-red-500">Sacola</span></h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{items.length} itens selecionados</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="rounded-full bg-slate-50 hover:bg-slate-100 h-10 w-10 transition-all active:scale-95"
              >
                <X className="size-5 text-slate-400" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 scrollbar-none">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="size-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-4">
                    <ShoppingCart className="size-8 stroke-1 text-slate-300" />
                  </div>
                  <p className="font-black uppercase tracking-widest text-[10px] italic text-slate-400">Sua sacola está vazia</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <motion.div 
                    key={`${item.id}-${index}`} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 md:gap-5 group"
                  >
                    <div className="size-20 rounded-2xl bg-slate-50 border border-slate-100 shrink-0 overflow-hidden relative shadow-sm">
                      {item.image_url ? (
                        <img src={item.image_url} className="size-full object-cover" alt={item.name} />
                      ) : (
                        <div className="size-full flex items-center justify-center text-slate-200">
                          <Star className="size-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-slate-900 uppercase text-[11px] md:text-xs italic leading-tight truncate">{item.name}</h4>
                        <span className="font-black text-slate-900 italic text-xs md:text-sm shrink-0">R$ {item.totalItemPrice.toFixed(2)}</span>
                      </div>
                      
                      <div className="space-y-1">
                        {item.variation && (
                          <p className="text-[9px] font-bold text-red-500 uppercase flex items-center gap-1">
                             ● {item.variation.name}
                          </p>
                        )}
                        {item.extras && item.extras.length > 0 && item.extras.map((ex: any) => (
                          <p key={ex.id} className="text-[9px] font-medium text-slate-500 flex items-center gap-1">
                             + {ex.quantity}x {ex.name}
                          </p>
                        ))}
                        {item.observation && (
                          <p className="text-[9px] italic text-slate-400 bg-slate-50 p-1.5 rounded-lg border border-slate-100 mt-1 line-clamp-2">
                             "{item.observation}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center bg-slate-50 rounded-xl p-0.5 border border-slate-100 shadow-sm">
                          <button 
                            onClick={() => onUpdateQuantity(item.id, -1)} 
                            className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white transition-all active:scale-90"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-8 text-center font-black text-[11px] text-slate-700">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(item.id, 1)} 
                            className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white transition-all active:scale-90"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => onRemoveItem(item.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors active:scale-90"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 space-y-6 shrink-0 rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Subtotal</span>
                  <span className="text-2xl md:text-3xl font-black text-slate-900 italic tracking-tighter">R$ {subtotal.toFixed(2)}</span>
                </div>
                <Button 
                  onClick={onCheckout} 
                  className="w-full h-14 md:h-16 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase italic tracking-[0.15em] shadow-xl shadow-red-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all outline-none"
                >
                  Continuar para o Checkout <ArrowRight className="size-5" />
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
