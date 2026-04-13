import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Pedido {
    id: string
    status: string
    total: number
    delivery_type: string
    created_at: string
    customers?: {
        name: string
        phone: string
    }
    delivery_address?: string
    delivery_number?: string
    payment_status: string
    payment_method: string
    [key: string]: any
}

interface PedidoStore {
    pedidos: Pedido[]
    pedidoSelecionado: Pedido | null
    novoPedido: boolean
    popupQueue: Pedido[]

    config: {
        alertMin: number
        criticalMin: number
        soundVolume: number
        showAddressAlways: boolean
        autoAccept: boolean
        isCompactMode: boolean
    }

    setPedidos: (pedidos: Pedido[]) => void
    addPedido: (pedido: Pedido) => void
    updatePedido: (id: string, updates: Partial<Pedido>) => void
    selecionarPedido: (pedido: Pedido | null) => void
    marcarComoVisto: () => void
    addToQueue: (pedido: Pedido) => void
    removeFromQueue: (id: string) => void
    updateConfig: (updates: Partial<PedidoStore['config']>) => void
}

export const usePedidoStore = create<PedidoStore>()(
    persist(
        (set) => ({
            pedidos: [],
            pedidoSelecionado: null,
            novoPedido: false,
            popupQueue: [],
            config: {
                alertMin: 5,
                criticalMin: 15,
                soundVolume: 1,
                showAddressAlways: false,
                autoAccept: false,
                isCompactMode: false
            },

            setPedidos: (pedidos) => set({ pedidos }),

            addPedido: (pedido) =>
                set((state) => {
                    // Check if already exists to avoid duplicates
                    if (state.pedidos.some(p => p.id === pedido.id)) return state
                    return {
                        pedidos: [pedido, ...state.pedidos],
                        novoPedido: true,
                        // Only add to popup queue if it's a NEW order from realtime
                        popupQueue: [...state.popupQueue, pedido]
                    }
                }),

            addToQueue: (pedido) => set((s) => ({ popupQueue: [...s.popupQueue, pedido] })),
            removeFromQueue: (id) => set((s) => ({ popupQueue: s.popupQueue.filter(p => p.id !== id) })),

            updatePedido: (id, updates) =>
                set((state) => ({
                    pedidos: state.pedidos.map(p => p.id === id ? { ...p, ...updates } : p),
                    // If the selected order is the one being updated, update it too
                    pedidoSelecionado: state.pedidoSelecionado?.id === id
                        ? { ...state.pedidoSelecionado, ...updates }
                        : state.pedidoSelecionado
                })),

            selecionarPedido: (pedido) =>
                set({ pedidoSelecionado: pedido, novoPedido: false }),

            marcarComoVisto: () => set({ novoPedido: false }),

            updateConfig: (updates) => 
                set((state) => ({ 
                    config: { ...state.config, ...updates } 
                }))
        }),
        {
            name: "pedidos-storage", // name of the item in storage (must be unique)
            partialize: (state) => ({ 
                pedidos: state.pedidos,
                config: state.config 
            }), // persist pedidos and config
        }
    )
)
