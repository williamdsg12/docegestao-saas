"use client"
import { useState } from "react"

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
  const [deliveryType, setDeliveryType] = useState<'local' | 'retirada' | 'delivery'>('delivery')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ x: "100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#F7F7F7] z-[101] shadow-2xl flex flex-col"
          >
            {/* 🔝 HEADER */}
            <div className="bg-white px-6 h-16 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10">
               <button onClick={onClose} className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                 <X className="size-5" /> Voltar
               </button>
               <div className="text-right">
                 <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Sua sacola</span>
                 <span className="block text-sm font-black text-[#1a56db] italic">R$ {subtotal.toFixed(2)}</span>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pb-40">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-40">
                  <ShoppingCart className="size-16 text-slate-200 mb-4" />
                  <p className="font-bold text-sm text-slate-400 uppercase">Sua sacola está vazia</p>
                </div>
              ) : (
                <div className="bg-white">
                  {items.map((item, index) => (
                    <div 
                      key={`${item.id}-${index}`} 
                      className="flex gap-4 p-6 border-b border-slate-50"
                    >
                      <div className="size-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} className="size-full object-cover" alt={item.name} />
                        ) : (
                          <div className="size-full flex items-center justify-center text-slate-200"><Star className="size-5" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                           <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                           <span className="font-bold text-slate-900 text-sm shrink-0">R$ {item.totalItemPrice.toFixed(2)}</span>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                           <div className="flex items-center bg-slate-100 rounded-lg h-9">
                              <button 
                                onClick={() => item.quantity === 1 ? onRemoveItem(item.id) : onUpdateQuantity(item.id, -1)} 
                                className="px-3 h-full flex items-center justify-center text-slate-400 hover:text-red-500"
                              >
                                {item.quantity === 1 ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
                              </button>
                              <span className="w-8 text-center font-bold text-xs">{item.quantity}</span>
                              <button 
                                onClick={() => onUpdateQuantity(item.id, 1)} 
                                className="px-3 h-full flex items-center justify-center text-slate-400 hover:text-[#1a56db]"
                              >
                                <Plus className="size-4" />
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 🍰 COMPLEMENTE SEU PEDIDO */}
              <div className="mt-4 p-6 bg-white">
                 <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-400 mb-4">Complemente seu pedido</h3>
                 <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="min-w-[140px] bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                         <div className="aspect-square bg-white rounded-lg overflow-hidden border border-slate-100">
                           <img src={`https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=200`} className="size-full object-cover" alt="Complemento" />
                         </div>
                         <h5 className="font-bold text-[11px] truncate leading-tight">Mousse de Chocolate</h5>
                         <div className="flex items-center justify-between">
                            <span className="text-xs font-black italic">R$ 12,00</span>
                            <button className="size-6 bg-[#1a56db] text-white rounded-full flex items-center justify-center"><Plus className="size-4" /></button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            {/* 🛒 FOOTER ACTIONS */}
            {items.length > 0 && (
              <div className="fixed bottom-0 right-0 w-full max-w-md bg-white border-t border-slate-100 p-6 space-y-6">
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                   {(['local', 'retirada', 'delivery'] as const).map((type) => (
                     <button
                        key={type}
                        onClick={() => setDeliveryType(type)}
                        className={cn(
                          "flex-1 py-3 text-[10px] font-black uppercase italic tracking-widest rounded-lg transition-all",
                          deliveryType === type ? "bg-white text-[#1a56db] shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                     >
                        {type === 'local' ? 'No local' : type === 'retirada' ? 'Retirada' : 'Delivery'}
                     </button>
                   ))}
                </div>
                
                <Button 
                  onClick={onCheckout} 
                  className="w-full h-14 rounded-xl bg-[#1a56db] hover:bg-[#1e40af] text-white font-black uppercase italic tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-100 active:scale-95"
                >
                  Confirmar (R$ {subtotal.toFixed(2)})
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
