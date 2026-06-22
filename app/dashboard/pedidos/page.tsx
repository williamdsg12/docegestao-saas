"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { 
  ShoppingBag, 
  Truck, 
  RefreshCw, 
  Search, 
  Plus,
  ChevronDown,
  User,
  Settings2,
  Pause,
  LayoutGrid,
  Menu,
  UtensilsCrossed,
  Eye,
  MoreVertical,
  Printer,
  Smartphone,
  Globe,
  Bell,
  X,
  LayoutDashboard,
  Clock,
  LogOut,
  Package,
  Wallet,
  History,
  Layers,
  Calendar,
  Store,
  Lock,
  Unlock,
  Trash2,
  Edit3
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useOrders } from "@/hooks/useOrders"
import { useQueryClient } from "@tanstack/react-query"
import { OrderRow } from "@/components/dashboard/pedidos/OrderRow"
import { OrderDetailsPanel } from "@/components/dashboard/pedidos/OrderDetailsPanel"
import { OrderPaymentPanel } from "@/components/dashboard/pedidos/OrderPaymentPanel"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStoreSettings } from "@/hooks/useStoreSettings"
import { useProducts } from "@/hooks/useProducts"
import { getStoreStatus } from "@/lib/storeStatus"
import { Switch } from "@/components/ui/switch"

type OrderType = 'balcao' | 'delivery' | 'retirada' | 'mesas' | 'historico' | 'caixa' | 'comandas'
type FilterType = 'tudo' | 'pendente' | 'em_curso' | 'pdv_web' | 'aplicativos'

export default function MerchantDashboardV2() {
  const { profile } = useBusiness()
  const companyId = profile?.tenant_id || profile?.company_id
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  
  // Store Settings & Products Hooks
  const { settings, updateSettings } = useStoreSettings()
  const { data: products = [] } = useProducts(companyId)

  const { data: orders = [], isLoading: loading, updateStatus, refetch } = useOrders(companyId)
  
  const [activeTab, setActiveTab] = useState<OrderType>('delivery')
  const [activeFilter, setActiveFilter] = useState<FilterType>('tudo')
  const [historyFilter, setHistoryFilter] = useState<'hoje' | 'semana' | 'mes'>('hoje')
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [orderForPayment, setOrderForPayment] = useState<any | null>(null)
  const [isFetchingFullOrder, setIsFetchingFullOrder] = useState(false)
  const [newOrderIds, setNewOrderIds] = useState<string[]>([])

  // Cash Register States
  const [activeRegister, setActiveRegister] = useState<any>(null)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [initialAmount, setInitialAmount] = useState("")

  // Extended Cash Register States
  const [transactions, setTransactions] = useState<any[]>([])
  const [calculatedAmount, setCalculatedAmount] = useState(0)
  const [cashSalesAmount, setCashSalesAmount] = useState(0)
  const [pixSalesAmount, setPixSalesAmount] = useState(0)
  const [debitSalesAmount, setDebitSalesAmount] = useState(0)
  const [creditSalesAmount, setCreditSalesAmount] = useState(0)
  const [operatorName, setOperatorName] = useState("")
  const [registerNotes, setRegisterNotes] = useState("")

  useEffect(() => {
    if (profile && !operatorName) {
      const name = (profile as any).name || (profile as any).nome || (profile as any).full_name || ""
      setOperatorName(name)
    }
  }, [profile, operatorName])
  
  const [cashTab, setCashTab] = useState<'operacoes' | 'historico'>('operacoes')
  const [opType, setOpType] = useState<'suprimento' | 'sangria'>('suprimento')
  const [opAmount, setOpAmount] = useState("")
  const [opDescription, setOpDescription] = useState("")
  
  const [closingAmount, setClosingAmount] = useState("")
  const [isClosingConfirmOpen, setIsClosingConfirmOpen] = useState(false)

  // Modals & Dropdowns States
  const [isSchedulerModalOpen, setIsSchedulerModalOpen] = useState(false)
  const [isManualOrderDropdownOpen, setIsManualOrderDropdownOpen] = useState(false)
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false)
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)

  // Manual Order Creation States
  const [newOrderType, setNewOrderType] = useState<'balcao' | 'delivery' | 'retirada' | 'mesa'>('balcao')
  const [newOrderCustomerName, setNewOrderCustomerName] = useState("")
  const [newOrderCustomerPhone, setNewOrderCustomerPhone] = useState("")
  const [newOrderAddress, setNewOrderAddress] = useState("")
  const [newOrderTableNumber, setNewOrderTableNumber] = useState("")
  const [newOrderItems, setNewOrderItems] = useState<any[]>([])
  const [newOrderPaymentMethod, setNewOrderPaymentMethod] = useState("dinheiro")
  const [newOrderNotes, setNewOrderNotes] = useState("")
  const [newOrderSearchProduct, setNewOrderSearchProduct] = useState("")
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<any | null>(null)
  const [productAddQty, setProductAddQty] = useState(1)
  const [productAddObs, setProductAddObs] = useState("")
  const [tables, setTables] = useState<any[]>([])
  
  // Mesas & Environments states
  const [environments, setEnvironments] = useState<any[]>([])
  const [selectedEnv, setSelectedEnv] = useState<any | null>(null)
  const [waiterCalls, setWaiterCalls] = useState<any[]>([])
  
  // Modals for Mesas
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false)
  const [envName, setEnvName] = useState("")
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [tableNumber, setTableNumber] = useState("")
  const [tableShape, setTableShape] = useState<'square' | 'circle' | 'rectangle'>('square')
  const [tableCapacity, setTableCapacity] = useState(4)
  const [isEditEnvModalOpen, setIsEditEnvModalOpen] = useState(false)
  const [editEnvName, setEditEnvName] = useState("")

  // Table Drawer/Modal Action state
  const [selectedTableForAction, setSelectedTableForAction] = useState<any | null>(null)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [actionTab, setActionTab] = useState<'details' | 'transfer' | 'merge' | 'split' | 'bill'>('details')
  const [transferTargetTableId, setTransferTargetTableId] = useState("")
  const [mergeTargetTableIds, setMergeTargetTableIds] = useState<string[]>([])
  
  // Split bill states
  const [splitCount, setSplitCount] = useState(2)
  
  // Pre-bill/closing states
  const [closingDiscount, setClosingDiscount] = useState("0")
  const [closingFee, setClosingFee] = useState("10")

  // Product addition state inside table drawer
  const [tableSearchProduct, setTableSearchProduct] = useState("")
  const [selectedProductForTable, setSelectedProductForTable] = useState<any | null>(null)
  const [productTableQty, setProductTableQty] = useState(1)
  const [productTableObs, setProductTableObs] = useState("")
  const [applyServiceFee, setApplyServiceFee] = useState(true)

  // Layout View & Drag states
  const [isEditingLayout, setIsEditingLayout] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'layout'>('grid')
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [layoutPositions, setLayoutPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [waiterNameInput, setWaiterNameInput] = useState("")
  const [tableNameInput, setTableNameInput] = useState("")
  const [tableEnvId, setTableEnvId] = useState("")
  const [customerNameInput, setCustomerNameInput] = useState("")
  
  // Comandas States
  const [isNewComandaModalOpen, setIsNewComandaModalOpen] = useState(false)
  const [newComandaNumber, setNewComandaNumber] = useState("")
  const [newComandaCustomerName, setNewComandaCustomerName] = useState("")
  const [newComandaCustomerPhone, setNewComandaCustomerPhone] = useState("")
  
  // Customer Edit Details States
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const [customerPhoneInput, setCustomerPhoneInput] = useState("")
  const [customerObsInput, setCustomerObsInput] = useState("")

  // Catalog States inside Drawer
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [catalogSelectedCategory, setCatalogSelectedCategory] = useState("Tudo")
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("")
  const [catalogConfigProduct, setCatalogConfigProduct] = useState<any | null>(null)
  const [catalogQty, setCatalogQty] = useState(1)
  const [catalogObs, setCatalogObs] = useState("")

  // Split Payment States
  const [paymentInputs, setPaymentInputs] = useState({
    pix: "",
    dinheiro: "",
    cartao_credito: "",
    cartao_debito: "",
    voucher: ""
  })

  // Drawer Options States
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false)

  // Real-time ticking ticker
  const [ticker, setTicker] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(t => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Helper functions
  const formatElapsedTime = (createdAtStr: string) => {
    if (!createdAtStr) return "00:00:00"
    const createdDate = new Date(createdAtStr)
    const now = new Date()
    const diffMs = now.getTime() - createdDate.getTime()
    if (diffMs <= 0) return "00:00:00"
    
    const diffSecs = Math.floor(diffMs / 1000)
    const hours = Math.floor(diffSecs / 3600)
    const minutes = Math.floor((diffSecs % 3600) / 60)
    const seconds = diffSecs % 60
    
    return [hours, minutes, seconds]
      .map(v => String(v).padStart(2, '0'))
      .join(':')
  }

  const getWaiterFromNotes = (notes: string) => {
    if (!notes) return ""
    const match = notes.match(/gar[cç]om:\s*([^\n\r]+)/i)
    return match ? match[1].trim() : ""
  }

  const handleUpdateCustomerName = async (order: any, newCustomerName: string) => {
    try {
      const updatedCustomer = {
        ...order.customer,
        name: newCustomerName.trim()
      }
      const { error } = await supabase
        .from('orders')
        .update({ customer: updatedCustomer })
        .eq('id', order.id)

      if (error) throw error
      toast.success("Cliente atualizado!")
      refetch()
    } catch (e: any) {
      toast.error("Erro ao atualizar cliente: " + e.message)
    }
  }

  const handleUpdateWaiterName = async (order: any, newWaiterName: string) => {
    try {
      let notes = order.notes || ""
      const waiterRegex = /gar[cç]om:\s*[^\n\r]*/i
      const cleanWaiterName = newWaiterName.trim()
      
      if (waiterRegex.test(notes)) {
        if (cleanWaiterName) {
          notes = notes.replace(waiterRegex, `Garçom: ${cleanWaiterName}`)
        } else {
          notes = notes.replace(waiterRegex, '').trim()
        }
      } else {
        if (cleanWaiterName) {
          notes = `${notes}\nGarçom: ${cleanWaiterName}`.trim()
        }
      }
      
      const { error } = await supabase
        .from('orders')
        .update({ notes })
        .eq('id', order.id)
      
      if (error) throw error
      toast.success("Garçom atualizado!")
      refetch()
    } catch (e: any) {
      toast.error("Erro ao atualizar garçom: " + e.message)
    }
  }

  // Pointer drag and drop events handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, tableId: string, currentX: number, currentY: number) => {
    if (!isEditingLayout) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDraggedTableId(tableId)
    setDragOffset({
      x: e.clientX - currentX,
      y: e.clientY - currentY
    })
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>, tableId: string) => {
    if (draggedTableId !== tableId) return
    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y
    
    const constrainedX = Math.max(0, Math.min(2000, newX))
    const constrainedY = Math.max(0, Math.min(2000, newY))

    setLayoutPositions(prev => ({
      ...prev,
      [tableId]: { x: constrainedX, y: constrainedY }
    }))
  }

  const handlePointerUp = async (e: React.PointerEvent<HTMLDivElement>, tableId: string) => {
    if (draggedTableId !== tableId) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDraggedTableId(null)

    const finalPos = layoutPositions[tableId]
    if (finalPos) {
      try {
        const { error } = await supabase
          .from('restaurant_tables')
          .update({
            x_position: Math.round(finalPos.x),
            y_position: Math.round(finalPos.y)
          })
          .eq('id', tableId)
        if (error) throw error
        toast.success("Layout atualizado!")
        fetchTables()
      } catch (err: any) {
        console.error("Erro ao salvar posição:", err)
        toast.error("Erro ao salvar posição: " + err.message)
      }
    }
  }

  // Sync waiter name, customer details and reset state when drawer opens/order changes
  useEffect(() => {
    if (selectedTableForAction) {
      const activeOrder = getTableActiveOrder(selectedTableForAction.table_number)
      if (activeOrder) {
        setWaiterNameInput(getWaiterFromNotes(activeOrder.notes || ""))
        setCustomerNameInput(activeOrder.customer?.name || "")
        setCustomerPhoneInput(activeOrder.customer?.phone || "")
        
        let notes = activeOrder.notes || ""
        const cleanNotes = notes
          .replace(/comanda:\s*\d+/i, "")
          .replace(/mesa:\s*[^\n\r]+/i, "")
          .trim()
        setCustomerObsInput(cleanNotes)
      } else {
        setWaiterNameInput("")
        setCustomerNameInput("")
        setCustomerPhoneInput("")
        setCustomerObsInput("")
      }
      
      // Reset inputs & options state
      setPaymentInputs({
        pix: "",
        dinheiro: "",
        cartao_credito: "",
        cartao_debito: "",
        voucher: ""
      })
      setIsCatalogOpen(false)
      setCatalogConfigProduct(null)
      setCatalogQty(1)
      setCatalogObs("")
      setIsMoreOptionsOpen(false)
    } else {
      setWaiterNameInput("")
      setCustomerNameInput("")
      setCustomerPhoneInput("")
      setCustomerObsInput("")
      setIsEditingCustomer(false)
      setIsMoreOptionsOpen(false)
    }
  }, [selectedTableForAction, orders])

  const getComandaNumber = (notes: string) => {
    const match = (notes || "").match(/comanda:\s*([^\n\r]+)/i)
    return match ? match[1].trim() : ""
  }

  const handleCreateComanda = async () => {
    if (!companyId || !newComandaNumber.trim()) {
      toast.error("Por favor, preencha o número da comanda.")
      return
    }
    if (!activeRegister) {
      toast.error("O caixa está fechado! Abra o caixa para abrir uma comanda.")
      return
    }

    const cleanNum = newComandaNumber.trim()
    const alreadyExists = orders.some((o: any) => {
      if (['finalizado', 'cancelado', 'cancelled', 'entregue', 'delivered'].includes(o.status)) return false
      if (o.delivery?.type !== 'comanda') return false
      const match = (o.notes || "").match(/comanda:\s*(\d+)/i)
      return match && match[1] === cleanNum
    })

    if (alreadyExists) {
      toast.error(`A Comanda ${cleanNum} já está ativa!`)
      return
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: companyId,
          customer: {
            name: newComandaCustomerName.trim() || `Comanda ${cleanNum}`,
            phone: newComandaCustomerPhone.trim() || '00000000000',
            email: `comanda${cleanNum}@docegestao.com`
          },
          address: {
            street: `Consumo Local - Comanda ${cleanNum}`,
            number: 'S/N',
            neighborhood: '',
            city: settings?.city || 'Local',
            complement: '',
            zip: ''
          },
          items: [],
          payment: {
            method: 'dinheiro',
            needs_change: false,
            change_for: 0
          },
          totals: {
            subtotal: 0,
            delivery_fee: 0,
            total: 0
          },
          order_type: 'salao',
          notes: `Comanda: ${cleanNum}`
        })
      })

      const result = await response.json()

      if (response.ok && !result.error) {
        toast.success(`Comanda ${cleanNum} aberta!`)
        setIsNewComandaModalOpen(false)
        setNewComandaNumber("")
        setNewComandaCustomerName("")
        setNewComandaCustomerPhone("")
        refetch()
      } else {
        toast.error("Erro ao abrir comanda: " + (result.error || "Erro desconhecido"))
      }
    } catch (e: any) {
      toast.error("Erro ao abrir comanda: " + e.message)
    }
  }

  const handleSaveCustomerData = async (order: any, name: string, phone: string, obs: string, waiter: string) => {
    try {
      const updatedCustomer = {
        ...order.customer,
        name: name.trim(),
        phone: phone.trim()
      }
      
      let updatedNotes = order.notes || ""
      const comandaMatch = updatedNotes.match(/comanda:\s*\d+/i)
      const mesaMatch = updatedNotes.match(/mesa:\s*[^\n\r]+/i)
      
      let prefix = ""
      if (comandaMatch) prefix = comandaMatch[0]
      else if (mesaMatch) prefix = mesaMatch[0]
      
      let finalNotes = prefix
      if (obs.trim()) {
        finalNotes = `${prefix}\n${obs.trim()}`.trim()
      }
      
      const cleanWaiter = waiter.trim()
      if (cleanWaiter) {
        finalNotes = finalNotes.replace(/gar[cç]om:\s*[^\n\r]*/i, '').trim()
        finalNotes = `${finalNotes}\nGarçom: ${cleanWaiter}`.trim()
      } else {
        finalNotes = finalNotes.replace(/gar[cç]om:\s*[^\n\r]*/i, '').trim()
      }
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          customer: updatedCustomer,
          notes: finalNotes
        })
        .eq('id', order.id)

      if (error) throw error
      toast.success("Dados atualizados!")
      setIsEditingCustomer(false)
      refetch()
    } catch (e: any) {
      toast.error("Erro ao atualizar dados: " + e.message)
    }
  }

  const handleCancelOrder = async (order: any, table: any) => {
    const confirm = window.confirm("Deseja mesmo cancelar esta comanda/consumo?")
    if (!confirm) return

    try {
      const { error: ordErr } = await supabase
        .from('orders')
        .update({ 
          order_status: 'cancelado',
          payment_status: 'cancelled'
        })
        .eq('id', order.id)
      if (ordErr) throw ordErr

      await supabase
        .from('payments')
        .update({ status: 'cancelled' })
        .eq('order_id', order.id)

      if (table && !table.id.startsWith('comanda-')) {
        await supabase
          .from('restaurant_tables')
          .update({ status: 'free' })
          .eq('id', table.id)
      }

      toast.success("Comanda/Consumo cancelado com sucesso!")
      setIsActionModalOpen(false)
      setSelectedTableForAction(null)
      fetchTables()
      refetch()
    } catch (e: any) {
      toast.error("Erro ao cancelar: " + e.message)
    }
  }


  const handleOpenTableComanda = async (table: any) => {
    if (!companyId) return
    if (!activeRegister) {
      toast.error("O caixa está fechado! Abra o caixa para abrir uma comanda.")
      return
    }
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: companyId,
          customer: {
            name: `Mesa ${table.table_number}`,
            phone: '00000000000',
            email: `mesa${table.table_number}@docegestao.com`
          },
          address: {
            street: `Consumo Local - Mesa ${table.table_number}`,
            number: 'S/N',
            neighborhood: '',
            city: settings?.city || 'Local',
            complement: '',
            zip: ''
          },
          items: [],
          payment: {
            method: 'dinheiro',
            needs_change: false,
            change_for: 0
          },
          totals: {
            subtotal: 0,
            delivery_fee: 0,
            total: 0
          },
          order_type: 'mesa',
          notes: `Mesa: ${table.table_number}`
        })
      })

      const result = await response.json()

      if (response.ok && !result.error) {
        const { error: tblErr } = await supabase
          .from('restaurant_tables')
          .update({ status: 'occupied' })
          .eq('id', table.id)
        if (tblErr) throw tblErr

        toast.success(`Comanda da Mesa ${table.table_number} aberta!`)
        fetchTables()
        refetch()
      } else {
        toast.error("Erro ao abrir comanda: " + (result.error || "Erro desconhecido"))
      }
    } catch (e: any) {
      toast.error("Erro ao abrir comanda: " + e.message)
    }
  }

  const updateTableOrderItemQty = async (order: any, item: any, newQty: number) => {
    try {
      if (newQty <= 0) {
        const { error: delErr } = await supabase
          .from('order_items')
          .delete()
          .eq('id', item.id)
        if (delErr) throw delErr
      } else {
        const unitPrice = item.price
        const totalPrice = unitPrice * newQty
        const { error: updErr } = await supabase
          .from('order_items')
          .update({
            quantity: newQty,
            total_price: totalPrice
          })
          .eq('id', item.id)
        if (updErr) throw updErr
      }

      const updatedItems = newQty <= 0 
        ? order.items.filter((i: any) => i.id !== item.id)
        : order.items.map((i: any) => i.id === item.id ? { ...i, quantity: newQty } : i)
      
      const newSubtotal = updatedItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0)
      const feePct = applyServiceFee ? 10 : 0
      const serviceFee = (newSubtotal * feePct) / 100
      const newTotal = newSubtotal + serviceFee

      const { error: ordErr } = await supabase
        .from('orders')
        .update({
          subtotal: newSubtotal,
          total: newTotal
        })
        .eq('id', order.id)
      if (ordErr) throw ordErr

      const { error: payErr } = await supabase
        .from('payments')
        .update({
          amount: newTotal
        })
        .eq('order_id', order.id)
      if (payErr) throw payErr

      toast.success("Comanda atualizada!")
      refetch()
    } catch (e: any) {
      toast.error("Erro ao atualizar item: " + e.message)
    }
  }

  const handleAddProductToTableComanda = async (order: any, product: any, qty: number, obs: string) => {
    try {
      const existingItem = order.items.find((i: any) => i.productId === product.id)
      if (existingItem) {
        await updateTableOrderItemQty(order, existingItem, existingItem.quantity + qty)
        return
      }

      const unitPrice = Number(product.price || 0)
      const totalPrice = unitPrice * qty
      const { error: insErr } = await supabase
        .from('order_items')
        .insert({
          tenant_id: companyId,
          order_id: order.id,
          product_id: product.id,
          name: product.name,
          quantity: qty,
          unit_price: unitPrice,
          total_price: totalPrice,
          observation: obs
        })
      if (insErr) throw insErr

      const newSubtotal = order.subtotal + totalPrice
      const feePct = applyServiceFee ? 10 : 0
      const serviceFee = (newSubtotal * feePct) / 100
      const newTotal = newSubtotal + serviceFee

      const { error: ordErr } = await supabase
        .from('orders')
        .update({
          subtotal: newSubtotal,
          total: newTotal
        })
        .eq('id', order.id)
      if (ordErr) throw ordErr

      const { error: payErr } = await supabase
        .from('payments')
        .update({
          amount: newTotal
        })
        .eq('order_id', order.id)
      if (payErr) throw payErr

      toast.success("Produto adicionado à comanda!")
      setSelectedProductForTable(null)
      setProductTableQty(1)
      setProductTableObs("")
      setTableSearchProduct("")
      refetch()
    } catch (e: any) {
      toast.error("Erro ao adicionar produto: " + e.message)
    }
  }

  const handleTransferTableComanda = async (order: any, sourceTable: any, targetTableNumber: string) => {
    if (!targetTableNumber) {
      toast.error("Por favor, selecione a mesa de destino.")
      return
    }
    
    const targetTable = tables.find(t => t.table_number === targetTableNumber)
    if (!targetTable) {
      toast.error("Mesa de destino não encontrada.")
      return
    }

    if (targetTable.status !== 'free') {
      toast.error("A mesa de destino está ocupada. Use a opção de Mesclar comandas.")
      return
    }

    try {
      let updatedNotes = order.notes || ""
      const mesaRegex = /mesa:?\s*[a-zA-Z0-9_-]+/gi
      if (mesaRegex.test(updatedNotes)) {
        updatedNotes = updatedNotes.replace(mesaRegex, `Mesa: ${targetTableNumber}`)
      } else {
        updatedNotes = `Mesa: ${targetTableNumber}\n${updatedNotes}`.trim()
      }

      const { error: ordErr } = await supabase
        .from('orders')
        .update({ notes: updatedNotes })
        .eq('id', order.id)
      if (ordErr) throw ordErr

      const { error: srcErr } = await supabase
        .from('restaurant_tables')
        .update({ status: 'free' })
        .eq('id', sourceTable.id)
      if (srcErr) throw srcErr

      const { error: trgErr } = await supabase
        .from('restaurant_tables')
        .update({ status: 'occupied' })
        .eq('id', targetTable.id)
      if (trgErr) throw trgErr

      toast.success(`Mesa transferida com sucesso para a Mesa ${targetTableNumber}!`)
      setIsActionModalOpen(false)
      setSelectedTableForAction(null)
      fetchTables()
      refetch()
    } catch (e: any) {
      toast.error("Erro ao transferir mesa: " + e.message)
    }
  }

  const handleMergeTableComandas = async (sourceTable: any, targetTableNumber: string) => {
    if (!targetTableNumber) {
      toast.error("Selecione a mesa para mesclar consumo.")
      return
    }

    const targetTable = tables.find(t => t.table_number === targetTableNumber)
    if (!targetTable) {
      toast.error("Mesa de destino não encontrada.")
      return
    }

    const sourceOrder = getTableActiveOrder(sourceTable.table_number)
    const targetOrder = getTableActiveOrder(targetTable.table_number)

    if (!sourceOrder) {
      toast.error("Mesa atual não possui comanda ativa.")
      return
    }

    if (!targetOrder) {
      toast.error("Mesa de destino não possui comanda ativa para mesclar.")
      return
    }

    try {
      for (const item of targetOrder.items) {
        const existingInSource = sourceOrder.items.find((i: any) => i.productId === item.productId)
        if (existingInSource) {
          const { error: updErr } = await supabase
            .from('order_items')
            .update({
              quantity: existingInSource.quantity + item.quantity,
              total_price: (existingInSource.price) * (existingInSource.quantity + item.quantity)
            })
            .eq('id', existingInSource.id)
          if (updErr) throw updErr

          const { error: delErr } = await supabase
            .from('order_items')
            .delete()
            .eq('id', item.id)
          if (delErr) throw delErr
        } else {
          const { error: mvErr } = await supabase
            .from('order_items')
            .update({ order_id: sourceOrder.id })
            .eq('id', item.id)
          if (mvErr) throw mvErr
        }
      }

      const { error: delPayErr } = await supabase
        .from('payments')
        .delete()
        .eq('order_id', targetOrder.id)
      if (delPayErr) throw delPayErr

      const { error: delOrdErr } = await supabase
        .from('orders')
        .delete()
        .eq('id', targetOrder.id)
      if (delOrdErr) throw delOrdErr

      const { data: sourceItems, error: itemsErr } = await supabase
        .from('order_items')
        .select('total_price')
        .eq('order_id', sourceOrder.id)
      if (itemsErr) throw itemsErr

      const newSubtotal = (sourceItems || []).reduce((sum, i) => sum + Number(i.total_price || 0), 0)
      const feePct = applyServiceFee ? 10 : 0
      const serviceFee = (newSubtotal * feePct) / 100
      const newTotal = newSubtotal + serviceFee

      const { error: updOrdErr } = await supabase
        .from('orders')
        .update({ subtotal: newSubtotal, total: newTotal })
        .eq('id', sourceOrder.id)
      if (updOrdErr) throw updOrdErr

      const { error: updPayErr } = await supabase
        .from('payments')
        .update({ amount: newTotal })
        .eq('order_id', sourceOrder.id)
      if (updPayErr) throw updPayErr

      const { error: tblErr } = await supabase
        .from('restaurant_tables')
        .update({ status: 'free' })
        .eq('id', targetTable.id)
      if (tblErr) throw tblErr

      toast.success(`Consumo da Mesa ${targetTableNumber} mesclado na Mesa ${sourceTable.table_number}!`)
      setIsActionModalOpen(false)
      setSelectedTableForAction(null)
      fetchTables()
      refetch()
    } catch (e: any) {
      toast.error("Erro ao mesclar mesas: " + e.message)
    }
  }

  const handleCloseTableBill = async (order: any, table: any, paymentMethod: string, customNotes?: string) => {
    if (!activeRegister) {
      toast.error("O caixa está fechado! Abra o caixa para finalizar a comanda.")
      return
    }

    try {
      const disc = parseFloat(closingDiscount) || 0
      const subtotal = Number(order.subtotal || 0)
      const feePct = applyServiceFee ? 10 : 0
      const serviceFee = (subtotal * feePct) / 100
      const finalTotal = subtotal + serviceFee - disc

      const { error: ordErr } = await supabase
        .from('orders')
        .update({ 
          payment_method: paymentMethod,
          payment_status: 'paid',
          discount: disc,
          total: finalTotal,
          notes: customNotes || order.notes
        })
        .eq('id', order.id)
      if (ordErr) throw ordErr

      const { error: payErr } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          method: paymentMethod,
          amount: finalTotal
        })
        .eq('order_id', order.id)
      if (payErr) throw payErr

      await updateStatus({ orderId: order.id, newStatus: 'finalizado' })

      if (table && !table.id.startsWith('comanda-')) {
        const { error: tblErr } = await supabase
          .from('restaurant_tables')
          .update({ status: 'free' })
          .eq('id', table.id)
        if (tblErr) throw tblErr
      }

      toast.success("Comanda fechada e mesa liberada com sucesso!")
      setIsActionModalOpen(false)
      setSelectedTableForAction(null)
      setClosingDiscount("0")
      fetchTables()
      refetch()
    } catch (e: any) {
      toast.error("Erro ao fechar comanda: " + e.message)
    }
  }

  const handleCloseTableBillSplit = async (order: any, table: any, changeDue: number) => {
    if (!activeRegister) {
      toast.error("O caixa está fechado! Abra o caixa para finalizar a comanda.")
      return
    }

    try {
      const disc = parseFloat(closingDiscount) || 0
      const subtotal = Number(order.subtotal || 0)
      const feePct = applyServiceFee ? 10 : 0
      const serviceFee = (subtotal * feePct) / 100
      const finalTotal = subtotal + serviceFee - disc

      // 1. Determine primary method
      let primaryMethod = 'dinheiro'
      let maxAmt = 0
      const methods = [
        { id: 'pix', amount: parseFloat(paymentInputs.pix) || 0 },
        { id: 'dinheiro', amount: parseFloat(paymentInputs.dinheiro) || 0 },
        { id: 'cartao_credito', amount: parseFloat(paymentInputs.cartao_credito) || 0 },
        { id: 'cartao_debito', amount: parseFloat(paymentInputs.cartao_debito) || 0 },
        { id: 'voucher', amount: parseFloat(paymentInputs.voucher) || 0 }
      ]
      methods.forEach(m => {
        if (m.amount > maxAmt) {
          maxAmt = m.amount
          primaryMethod = m.id === 'voucher' ? 'dinheiro' : m.id
        }
      })

      // 2. Build breakdown parts
      const breakdownParts: string[] = []
      if (parseFloat(paymentInputs.pix) > 0) breakdownParts.push(`Pix: R$ ${Number(paymentInputs.pix).toFixed(2)}`)
      if (parseFloat(paymentInputs.dinheiro) > 0) breakdownParts.push(`Dinheiro: R$ ${Number(paymentInputs.dinheiro).toFixed(2)}`)
      if (parseFloat(paymentInputs.cartao_credito) > 0) breakdownParts.push(`Crédito: R$ ${Number(paymentInputs.cartao_credito).toFixed(2)}`)
      if (parseFloat(paymentInputs.cartao_debito) > 0) breakdownParts.push(`Débito: R$ ${Number(paymentInputs.cartao_debito).toFixed(2)}`)
      if (parseFloat(paymentInputs.voucher) > 0) breakdownParts.push(`Voucher: R$ ${Number(paymentInputs.voucher).toFixed(2)}`)
      
      const breakdownText = `[Pagamento Múltiplo] ${breakdownParts.join(' | ')}`
      const finalNotes = order.notes ? `${order.notes}\n${breakdownText}`.trim() : breakdownText

      // 3. Update order in Supabase
      const { error: ordErr } = await supabase
        .from('orders')
        .update({ 
          payment_method: primaryMethod,
          payment_status: 'paid',
          discount: disc,
          total: finalTotal,
          notes: finalNotes
        })
        .eq('id', order.id)
      if (ordErr) throw ordErr

      // 4. Update payments database records
      await supabase.from('payments').delete().eq('order_id', order.id)
      
      const paymentsToInsert = []
      if (parseFloat(paymentInputs.pix) > 0) {
        paymentsToInsert.push({ tenant_id: companyId, order_id: order.id, amount: parseFloat(paymentInputs.pix), method: 'pix', status: 'paid' })
      }
      if (parseFloat(paymentInputs.dinheiro) > 0) {
        const cashAmount = Math.max(0, parseFloat(paymentInputs.dinheiro) - changeDue)
        if (cashAmount > 0) {
          paymentsToInsert.push({ tenant_id: companyId, order_id: order.id, amount: cashAmount, method: 'dinheiro', status: 'paid' })
        }
      }
      if (parseFloat(paymentInputs.cartao_credito) > 0) {
        paymentsToInsert.push({ tenant_id: companyId, order_id: order.id, amount: parseFloat(paymentInputs.cartao_credito), method: 'cartao_credito', status: 'paid' })
      }
      if (parseFloat(paymentInputs.cartao_debito) > 0) {
        paymentsToInsert.push({ tenant_id: companyId, order_id: order.id, amount: parseFloat(paymentInputs.cartao_debito), method: 'cartao_debito', status: 'paid' })
      }
      if (parseFloat(paymentInputs.voucher) > 0) {
        paymentsToInsert.push({ tenant_id: companyId, order_id: order.id, amount: parseFloat(paymentInputs.voucher), method: 'voucher', status: 'paid' })
      }
      
      const { error: insPayErr } = await supabase.from('payments').insert(paymentsToInsert)
      if (insPayErr) throw insPayErr

      // 5. Finalize order status
      await updateStatus({ orderId: order.id, newStatus: 'finalizado' })

      // 6. Free the table if applicable
      if (table && !table.id.startsWith('comanda-')) {
        const { error: tblErr } = await supabase
          .from('restaurant_tables')
          .update({ status: 'free' })
          .eq('id', table.id)
        if (tblErr) throw tblErr
      }

      toast.success("Pagamento concluído e conta fechada!")
      setIsActionModalOpen(false)
      setSelectedTableForAction(null)
      setClosingDiscount("0")
      setPaymentInputs({
        pix: "",
        dinheiro: "",
        cartao_credito: "",
        cartao_debito: "",
        voucher: ""
      })
      fetchTables()
      refetch()
    } catch (e: any) {
      toast.error("Erro ao finalizar pagamento: " + e.message)
    }
  }

  const handleResolveWaiterCall = async (tableNum: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_table_calls')
        .update({ status: 'resolved' })
        .eq('table_number', tableNum)
        .eq('company_id', companyId)
        .eq('status', 'pending')
      if (error) throw error
      toast.success("Chamada de garçom atendida!")
      fetchWaiterCalls()
    } catch (e: any) {
      toast.error("Erro ao atender chamada: " + e.message)
    }
  }

  const handlePrintPreBill = (order: any, tableNum: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Pop-up bloqueado. Ative pop-ups para imprimir.");
      return;
    }

    const itemsHtml = order.items.map((i: any) => `
      <tr>
        <td style="padding: 4px 0;">${i.quantity}x ${i.name}</td>
        <td style="text-align: right; padding: 4px 0;">R$ ${Number(i.price).toFixed(2)}</td>
        <td style="text-align: right; padding: 4px 0;">R$ ${Number(i.price * i.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const disc = parseFloat(closingDiscount) || 0
    const feePct = applyServiceFee ? 10 : 0
    const feeAmt = (Number(order.subtotal || 0) * feePct) / 100
    const total = Number(order.subtotal || 0) + feeAmt - disc;

    printWindow.document.write(`
      <html>
        <head>
          <title>Pré-Conta - Mesa ${tableNum}</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #333; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h2 { margin: 0; font-size: 18px; }
            .header p { margin: 5px 0 0 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { border-bottom: 1px dashed #000; text-align: left; padding-bottom: 5px; }
            .totals { margin-top: 15px; border-top: 1px dashed #000; padding-top: 5px; font-size: 13px; }
            .totals div { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .footer { text-align: center; margin-top: 30px; font-size: 11px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>DOCE GESTÃO</h2>
            <p>Pré-Conta - Mesa ${tableNum}</p>
            <p>Data: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: right;">Unit</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="totals">
            <div>
              <span>Subtotal:</span>
              <span>R$ ${Number(order.subtotal || 0).toFixed(2)}</span>
            </div>
            ${applyServiceFee ? `
            <div>
              <span>Taxa de Serviço (10%):</span>
              <span>R$ ${feeAmt.toFixed(2)}</span>
            </div>
            ` : ''}
            ${disc > 0 ? `
            <div>
              <span>Desconto:</span>
              <span>R$ ${disc.toFixed(2)}</span>
            </div>
            ` : ''}
            <div style="font-weight: bold; font-size: 15px; margin-top: 5px;">
              <span>Total Geral:</span>
              <span>R$ ${total.toFixed(2)}</span>
            </div>
          </div>
          <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p>Este documento não é um cupom fiscal.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success("Pré-conta enviada para impressão!");
  }

  console.log('Filtro Status:', activeFilter)
  console.log('Filtro Tipo:', activeTab)

  // Helper calculations for active register totals
  const suprimentosAmount = useMemo(() => {
    return transactions
      .filter(tx => tx.type === 'suprimento')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
  }, [transactions])

  const sangriasAmount = useMemo(() => {
    return transactions
      .filter(tx => tx.type === 'sangria')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
  }, [transactions])

  const fetchEnvironments = async () => {
    if (!companyId) return
    try {
      const { data, error } = await supabase
        .from('restaurant_environments')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true })
      if (!error && data) {
        setEnvironments(data)
      }
    } catch (e) {
      console.error("Erro ao buscar ambientes:", e)
    }
  }

  const fetchTables = async () => {
    if (!companyId) return
    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('company_id', companyId)
        .order('table_number', { ascending: true })
      if (!error) {
        setTables(data || [])
      }
    } catch (e) {
      console.error("Erro ao buscar mesas:", e)
    }
  }

  const fetchWaiterCalls = async () => {
    if (!companyId) return
    try {
      const { data, error } = await supabase
        .from('restaurant_table_calls')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      if (!error && data) {
        setWaiterCalls(data)
      }
    } catch (e) {
      console.error("Erro ao buscar chamadas de garçom:", e)
    }
  }

  const handleCreateEnv = async () => {
    if (!companyId || !envName.trim()) return
    try {
      const { data, error } = await supabase
        .from('restaurant_environments')
        .insert({
          company_id: companyId,
          name: envName.trim()
        })
        .select()
        .single()

      if (error) throw error
      toast.success("Ambiente criado com sucesso!")
      setEnvName("")
      setIsEnvModalOpen(false)
      fetchEnvironments()
      if (data) setSelectedEnv(data)
    } catch (e: any) {
      toast.error("Erro ao criar ambiente: " + e.message)
    }
  }

  const handleUpdateEnv = async () => {
    if (!selectedEnv || !editEnvName.trim()) return
    try {
      const { error } = await supabase
        .from('restaurant_environments')
        .update({ name: editEnvName.trim() })
        .eq('id', selectedEnv.id)

      if (error) throw error
      toast.success("Ambiente atualizado com sucesso!")
      setIsEditEnvModalOpen(false)
      fetchEnvironments()
    } catch (e: any) {
      toast.error("Erro ao atualizar ambiente: " + e.message)
    }
  }

  const handleDeleteEnv = async () => {
    if (!selectedEnv) return
    const confirm = window.confirm(`Tem certeza que deseja excluir o ambiente "${selectedEnv.name}"? Todas as mesas dele também serão excluídas.`)
    if (!confirm) return

    try {
      const { error } = await supabase
        .from('restaurant_environments')
        .delete()
        .eq('id', selectedEnv.id)

      if (error) throw error
      toast.success("Ambiente excluído com sucesso!")
      setSelectedEnv(null)
      fetchEnvironments()
    } catch (e: any) {
      toast.error("Erro ao excluir ambiente: " + e.message)
    }
  }

  const handleCreateTable = async () => {
    const targetEnvId = tableEnvId || selectedEnv?.id
    if (!companyId || !targetEnvId || !tableNumber.trim()) {
      toast.error("Por favor, preencha o número e selecione um ambiente.")
      return
    }

    try {
      const finalTableNumber = tableNameInput.trim() ? `${tableNumber.trim()} - ${tableNameInput.trim()}` : tableNumber.trim()
      
      const { error } = await supabase
        .from('restaurant_tables')
        .insert({
          environment_id: targetEnvId,
          company_id: companyId,
          table_number: finalTableNumber,
          status: 'free',
          shape: 'square',
          capacity: tableCapacity,
          x_position: 100,
          y_position: 100
        })

      if (error) throw error
      toast.success("Mesa adicionada com sucesso!")
      setTableNumber("")
      setTableNameInput("")
      setTableCapacity(4)
      setIsTableModalOpen(false)
      fetchTables()
    } catch (e: any) {
      toast.error("Erro ao adicionar mesa: " + e.message)
    }
  }

  const handleDeleteTable = async (table: any) => {
    const confirm = window.confirm(`Deseja mesmo remover a mesa ${table.table_number}?`)
    if (!confirm) return

    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', table.id)

      if (error) throw error
      toast.success("Mesa removida!")
      fetchTables()
    } catch (e: any) {
      toast.error("Erro ao remover mesa: " + e.message)
    }
  }

  const handleUpdateTableStatus = async (tableId: string, newStatus: 'free' | 'occupied' | 'reserved' | 'closing_pending' | 'blocked') => {
    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .update({ status: newStatus })
        .eq('id', tableId)

      if (error) throw error
      toast.success("Status da mesa atualizado!")
      fetchTables()
    } catch (e: any) {
      toast.error("Erro ao atualizar status: " + e.message)
    }
  }

  // Fetch active cash register
  const fetchActiveRegister = async () => {
    if (!companyId) return
    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'open')
        .order('openedAt', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error) {
        setActiveRegister(data || null)
      }
    } catch (err) {
      console.error("Erro ao buscar caixa ativo:", err)
    }
  }

  const fetchTransactionsAndCashSales = async (register: any) => {
    if (!companyId || !register) return
    try {
      // 1. Fetch transactions
      const { data: txs, error: txsErr } = await supabase
        .from('cash_transactions')
        .select('*')
        .eq('register_id', register.id)
        .order('created_at', { ascending: false })

      const txList = txs || []
      if (!txsErr) {
        setTransactions(txList)
      }

      // 2. Fetch all sales since openedAt with payments breakdown
      const { data: recentOrders, error: ordersErr } = await supabase
        .from('orders')
        .select(`
          total,
          payment_method,
          payments (
            amount,
            method
          )
        `)
        .eq('tenant_id', companyId)
        .in('order_status', ['finalizado', 'delivered'])
        .gte('created_at', register.openedAt)

      const ordersList = recentOrders || []
      
      let calculatedCashSales = 0
      let calculatedPixSales = 0
      let calculatedDebitSales = 0
      let calculatedCreditSales = 0

      ordersList.forEach((o: any) => {
        const orderPayments = o.payments || []
        if (orderPayments.length > 0) {
          orderPayments.forEach((p: any) => {
            const m = String(p.method || '').toLowerCase()
            const amt = Number(p.amount || 0)
            if (['dinheiro', 'cash', 'voucher'].includes(m)) {
              calculatedCashSales += amt
            } else if (['pix'].includes(m)) {
              calculatedPixSales += amt
            } else if (['cartao_debito', 'debito', 'debit'].includes(m)) {
              calculatedDebitSales += amt
            } else if (['cartao_credito', 'credito', 'credit'].includes(m)) {
              calculatedCreditSales += amt
            }
          })
        } else {
          const m = String(o.payment_method || '').toLowerCase()
          const amt = Number(o.total || 0)
          if (['dinheiro', 'cash', 'voucher'].includes(m)) {
            calculatedCashSales += amt
          } else if (['pix'].includes(m)) {
            calculatedPixSales += amt
          } else if (['cartao_debito', 'debito', 'debit'].includes(m)) {
            calculatedDebitSales += amt
          } else if (['cartao_credito', 'credito', 'credit'].includes(m)) {
            calculatedCreditSales += amt
          }
        }
      })

      setCashSalesAmount(calculatedCashSales)
      setPixSalesAmount(calculatedPixSales)
      setDebitSalesAmount(calculatedDebitSales)
      setCreditSalesAmount(calculatedCreditSales)

      // 3. Compute dynamic total
      const totalFlows = txList.reduce((sum, tx) => {
        if (tx.type === 'suprimento') return sum + Number(tx.amount)
        if (tx.type === 'sangria') return sum - Number(tx.amount)
        return sum
      }, 0)

      setCalculatedAmount(Number(register.initialAmount || 0) + totalFlows + calculatedCashSales)
    } catch (err) {
      console.error("Erro ao carregar movimentações do caixa:", err)
    }
  }

  useEffect(() => {
    if (companyId) {
      fetchActiveRegister()
      fetchEnvironments()
      fetchTables()
      fetchWaiterCalls()
    }
  }, [companyId])

  useEffect(() => {
    if (environments.length > 0) {
      if (!selectedEnv) {
        setSelectedEnv(environments[0])
      } else {
        const currentSelected = environments.find(e => e.id === selectedEnv.id)
        if (currentSelected) {
          setSelectedEnv(currentSelected)
        }
      }
    }
  }, [environments])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'mesas') {
      setActiveTab('mesas')
    } else if (tab === 'comandas') {
      setActiveTab('comandas')
    } else if (tab === 'caixa') {
      setActiveTab('caixa')
    } else if (tab === 'balcao') {
      setActiveTab('balcao')
    } else if (tab === 'historico') {
      setActiveTab('historico')
    } else {
      setActiveTab('delivery')
    }
  }, [searchParams])

  useEffect(() => {
    if (activeRegister) {
      fetchTransactionsAndCashSales(activeRegister)
    } else {
      setTransactions([])
      setCalculatedAmount(0)
      setCashSalesAmount(0)
      setPixSalesAmount(0)
      setDebitSalesAmount(0)
      setCreditSalesAmount(0)
    }
  }, [activeRegister, companyId])

  const handleOpenRegister = async () => {
    if (!companyId) return
    try {
      const amount = parseFloat(initialAmount) || 0
      const { data, error } = await supabase
        .from('cash_registers')
        .insert({
          company_id: companyId,
          status: 'open',
          openedAt: new Date().toISOString(),
          initialAmount: amount,
          operator_name: operatorName || 'Operador',
          notes: registerNotes
        })
        .select()
        .single()

      if (error) throw error
      setActiveRegister(data)
      setIsRegisterModalOpen(false)
      setInitialAmount("")
      setRegisterNotes("")
      toast.success("Caixa aberto com sucesso!")
    } catch (err) {
      console.error("Erro ao abrir caixa:", err)
      toast.error("Erro ao abrir caixa")
    }
  }

  const handleCreateTransaction = async () => {
    if (!activeRegister || !opAmount) return
    try {
      const amt = parseFloat(opAmount) || 0
      if (amt <= 0) {
        toast.error("Por favor, informe um valor válido maior que zero")
        return
      }

      const { data, error } = await supabase
        .from('cash_transactions')
        .insert({
          register_id: activeRegister.id,
          company_id: companyId,
          type: opType,
          amount: amt,
          description: opDescription || (opType === 'suprimento' ? 'Suprimento manual' : 'Sangria manual')
        })
        .select()
        .single()

      if (error) throw error

      toast.success(`${opType === 'suprimento' ? 'Suprimento' : 'Sangria'} realizado com sucesso!`)
      setOpAmount("")
      setOpDescription("")
      
      // Reload
      fetchTransactionsAndCashSales(activeRegister)
    } catch (err) {
      console.error("Erro ao realizar operação de caixa:", err)
      toast.error("Erro ao realizar operação de caixa")
    }
  }

  const handleCloseRegister = async () => {
    if (!activeRegister) return
    try {
      const finalAmt = parseFloat(closingAmount) || 0
      const { error } = await supabase
        .from('cash_registers')
        .update({
          status: 'closed',
          closedAt: new Date().toISOString(),
          closedAmount: finalAmt,
          cash_sales_amount: cashSalesAmount,
          pix_sales_amount: pixSalesAmount,
          debit_sales_amount: debitSalesAmount,
          credit_sales_amount: creditSalesAmount
        })
        .eq('id', activeRegister.id)

      if (error) throw error

      toast.success("Caixa fechado com sucesso!")
      setActiveRegister(null)
      setIsClosingConfirmOpen(false)
      setIsRegisterModalOpen(false)
      setClosingAmount("")
    } catch (err) {
      console.error("Erro ao fechar caixa:", err)
      toast.error("Erro ao fechar caixa")
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!companyId) return
    const interval = setInterval(() => {
      refetch()
    }, 30000)
    return () => clearInterval(interval)
  }, [companyId, refetch])

  // Realtime subscription for blinking new orders
  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel('orders-blink')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders',
        filter: `tenant_id=eq.${companyId}`
      }, (payload: any) => {
        const orderId = payload.new.id
        setNewOrderIds(prev => [...prev, orderId])
        setTimeout(() => {
          setNewOrderIds(prev => prev.filter(id => id !== orderId))
        }, 5000)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId])

  // Realtime subscription for tables and calls
  useEffect(() => {
    if (!companyId) return

    const tablesChannel = supabase
      .channel('realtime-tables')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'restaurant_tables',
        filter: `company_id=eq.${companyId}`
      }, () => {
        fetchTables()
      })
      .subscribe()

    const callsChannel = supabase
      .channel('realtime-calls')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'restaurant_table_calls',
        filter: `company_id=eq.${companyId}`
      }, () => {
        fetchWaiterCalls()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(tablesChannel)
      supabase.removeChannel(callsChannel)
    }
  }, [companyId])

  // Função para buscar pedido completo antes de abrir o painel
  const handleOpenDetails = async (order: any) => {
    try {
      setIsFetchingFullOrder(true)
      console.log("🔍 Buscando pedido completo:", order.id)
      
      const response = await fetch(`/api/orders/${order.id}`)
      if (!response.ok) throw new Error("Erro ao buscar detalhes do pedido")
      
      const fullOrder = await response.json()
      console.log("✅ Pedido completo recebido:", fullOrder)
      
      setSelectedOrder(fullOrder)
      setIsDetailsOpen(true)
    } catch (error) {
      console.error("❌ Erro ao buscar pedido completo:", error)
      toast.error("Erro ao carregar detalhes do pedido")
    } finally {
      setIsFetchingFullOrder(false)
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((o: any) => {
      const isHist = ['finalizado', 'cancelado', 'cancelled', 'entregue', 'delivered'].includes(o.status)
      
      if (activeTab === 'historico') {
        if (!isHist) return false
        
        // Filter by history period
        const orderDate = new Date(o.createdAt)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (historyFilter === 'hoje') {
          if (orderDate < today) return false
        } else if (historyFilter === 'semana') {
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          sevenDaysAgo.setHours(0, 0, 0, 0)
          if (orderDate < sevenDaysAgo) return false
        } else if (historyFilter === 'mes') {
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          thirtyDaysAgo.setHours(0, 0, 0, 0)
          if (orderDate < thirtyDaysAgo) return false
        }
      } else {
        // Operational: exclude history
        if (isHist) return false
        
        const type = o.delivery?.type || 'balcao'
        const matchesTab = 
          (activeTab === 'balcao' && type === 'balcao') ||
          (activeTab === 'mesas' && ['mesa', 'mesas'].includes(type)) ||
          (activeTab === 'delivery' && ['delivery', 'entrega', 'retirada', 'pickup'].includes(type))
        if (!matchesTab) return false
        
        let matchesFilter = true
        if (activeFilter === 'pendente') {
          matchesFilter = ['novo', 'pendente', 'pending'].includes(o.status)
        } else if (activeFilter === 'em_curso') {
          matchesFilter = ['pending', 'novo', 'confirmed', 'accepted', 'preparing', 'preparo', 'ready', 'pronto', 'assigned', 'atribuido', 'on_route', 'em_rota', 'a_caminho', 'saiu_entrega'].includes(o.status)
        } else if (activeFilter === 'pdv_web') {
          matchesFilter = ['pdv', 'web', 'checkout', 'menu'].includes(o.channel || 'web')
        } else if (activeFilter === 'aplicativos') {
          matchesFilter = ['app', 'ifood', 'delivery_app'].includes(o.channel || '')
        }
        if (!matchesFilter) return false
      }
      
      const matchesSearch = (o.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (o.customer?.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (o.delivery?.address || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (o.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (o.code || "").toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesSearch
    })
  }, [orders, activeTab, activeFilter, historyFilter, searchQuery])

  const totalValue = useMemo(() => {
    return orders
      .filter((o: any) => !['finalizado', 'cancelado', 'cancelled', 'entregue', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + (o.total || 0), 0)
  }, [orders])

  const environmentTables = useMemo(() => {
    if (!selectedEnv) return []
    return tables.filter(t => t.environment_id === selectedEnv.id)
  }, [tables, selectedEnv])

  const indicators = useMemo(() => {
    return {
      free: environmentTables.filter(t => t.status === 'free').length,
      occupied: environmentTables.filter(t => t.status === 'occupied').length,
      reserved: environmentTables.filter(t => t.status === 'reserved').length,
      closing_pending: environmentTables.filter(t => t.status === 'closing_pending').length,
      blocked: environmentTables.filter(t => t.status === 'blocked').length,
    }
  }, [environmentTables])

  const categories = useMemo(() => {
    const allCats = products.map((p: any) => p.category).filter(Boolean)
    return ['Tudo', ...Array.from(new Set(allCats))]
  }, [products])

  const getTableActiveOrder = (tableNum: string) => {
    const cleanNum = tableNum.replace(/\D/g, '')
    const isComanda = tableNum.toLowerCase().includes('comanda')
    
    return orders.find((o: any) => {
      if (['finalizado', 'cancelado', 'cancelled', 'entregue', 'delivered'].includes(o.status)) {
        return false
      }
      const type = o.delivery?.type
      const notes = (o.notes || "").toLowerCase()
      
      if (isComanda) {
        if (type !== 'comanda') return false
        const match = notes.match(/comanda:\s*(\d+)/)
        return match && match[1] === cleanNum
      } else {
        if (type !== 'mesa') return false
        const match = notes.match(/mesa:\s*([^\n\r]+)/)
        if (match) {
          return match[1].toLowerCase().trim() === tableNum.toLowerCase().trim()
        }
        return notes.includes(`mesa: ${tableNum.toLowerCase()}`) || 
               notes.includes(`mesa ${tableNum.toLowerCase()}`)
      }
    })
  }

  const renderTableCard = (table: any) => {
    const linkedOrder = getTableActiveOrder(table.table_number)
    const customerName = linkedOrder?.customer?.name || "Sem Nome"
    const elapsedTime = linkedOrder ? formatElapsedTime(linkedOrder.createdAt) : ""
    const consumptionAmount = linkedOrder ? (linkedOrder.total || 0) : 0
    const [tableNumPart, tableNamePart] = table.table_number.includes(' - ') 
      ? table.table_number.split(' - ') 
      : [table.table_number, '']

    let cardStyle = {}
    let cardContent = null

    if (table.status === 'occupied') {
      cardStyle = { backgroundColor: '#fff7ed', color: '#ea580c', borderColor: '#ffedd5' }
      cardContent = (
        <div className="flex flex-col justify-between h-full w-full p-4 text-left font-sans relative">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black uppercase tracking-wider truncate">Mesa {tableNumPart}</span>
            {tableNamePart && <span className="text-[9px] font-bold opacity-80 truncate">{tableNamePart}</span>}
          </div>
          <div className="flex flex-col gap-0.5 my-1 min-w-0">
            <span className="text-[9px] font-bold opacity-75 uppercase tracking-wider">Cliente:</span>
            <span className="text-xs font-black truncate">{customerName}</span>
          </div>
          <div className="flex flex-col gap-1 mt-auto">
            <span className="text-[9px] font-mono font-bold bg-[#ea580c]/10 px-1.5 py-0.5 rounded w-max">
              ⏱️ {elapsedTime}
            </span>
            <span className="text-xs font-black">
              R$ {Number(consumptionAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )
    } else if (table.status === 'closing_pending') {
      cardStyle = { backgroundColor: '#fefce8', color: '#ca8a04', borderColor: '#fef9c3' }
      cardContent = (
        <div className="flex flex-col justify-between h-full w-full p-4 text-left font-sans relative">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black uppercase tracking-wider truncate">Mesa {tableNumPart}</span>
            {tableNamePart && <span className="text-[9px] font-bold opacity-80 truncate">{tableNamePart}</span>}
          </div>
          <div className="flex flex-col gap-0.5 my-1 min-w-0">
            <span className="text-[9px] font-bold opacity-75 uppercase tracking-wider">Cliente:</span>
            <span className="text-xs font-black truncate">{customerName}</span>
          </div>
          <div className="flex flex-col gap-1 mt-auto">
            <span className="text-[9px] font-mono font-bold bg-[#ca8a04]/10 px-1.5 py-0.5 rounded w-max">
              ⏱️ {elapsedTime}
            </span>
            <span className="text-xs font-black">
              R$ {Number(consumptionAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )
    } else if (table.status === 'reserved') {
      cardStyle = { backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#dbeafe' }
      cardContent = (
        <div className="flex flex-col justify-between h-full w-full p-4 text-left font-sans relative">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black uppercase tracking-wider truncate">Mesa {tableNumPart}</span>
            {tableNamePart && <span className="text-[9px] font-bold opacity-80 truncate">{tableNamePart}</span>}
          </div>
          <div className="flex flex-col items-start mt-auto">
            <span className="text-xs font-black uppercase tracking-wider">Reservada</span>
          </div>
        </div>
      )
    } else if (table.status === 'blocked') {
      cardStyle = { backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fee2e2' }
      cardContent = (
        <div className="flex flex-col justify-between h-full w-full p-4 text-left font-sans relative">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black uppercase tracking-wider truncate">Mesa {tableNumPart}</span>
            {tableNamePart && <span className="text-[9px] font-bold opacity-80 truncate">{tableNamePart}</span>}
          </div>
          <div className="flex flex-col items-start mt-auto">
            <span className="text-xs font-black uppercase tracking-wider">Bloqueada</span>
          </div>
        </div>
      )
    } else {
      cardStyle = { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#e5e7eb' }
      cardContent = (
        <div className="flex flex-col justify-between h-full w-full p-4 text-left font-sans relative">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black uppercase tracking-wider truncate">Mesa {tableNumPart}</span>
            {tableNamePart && <span className="text-[9px] font-bold opacity-80 truncate">{tableNamePart}</span>}
          </div>
          <div className="flex flex-col items-start mt-auto">
            <span className="text-xs font-black uppercase tracking-wider">Livre</span>
          </div>
        </div>
      )
    }

    return (
      <div
        key={table.id}
        onClick={() => {
          setSelectedTableForAction(table);
          setActionTab('details');
          setTransferTargetTableId("");
          setMergeTargetTableIds([]);
          setIsActionModalOpen(true);
        }}
        style={cardStyle}
        className={cn(
          "aspect-square rounded-3xl border flex flex-col justify-between p-0 relative overflow-hidden transition-all hover:scale-105 cursor-pointer select-none shadow-sm hover:shadow-md"
        )}
      >
        {cardContent}

        {/* Alert dot for waiter calls */}
        {waiterCalls.some(c => c.table_number === table.table_number) && (
          <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </span>
        )}
      </div>
    )
  }

  // Filter Counts
  const counts = useMemo(() => {
    const tabOrders = orders.filter((o: any) => {
      // Exclude history from active operational counts
      if (['finalizado', 'cancelado', 'cancelled', 'entregue', 'delivered'].includes(o.status)) {
        return false
      }
      
      const type = o.delivery?.type || 'balcao'
      return (activeTab === 'balcao' && type === 'balcao') ||
             (activeTab === 'mesas' && ['mesa', 'mesas'].includes(type)) ||
             (activeTab === 'delivery' && ['delivery', 'entrega', 'retirada', 'pickup'].includes(type))
    })

    return {
      tudo: tabOrders.length,
      pendente: tabOrders.filter(o => ['novo', 'pendente', 'pending'].includes(o.status)).length,
      em_curso: tabOrders.filter(o => ['pending', 'novo', 'confirmed', 'accepted', 'preparing', 'preparo', 'ready', 'pronto', 'assigned', 'atribuido', 'on_route', 'em_rota', 'a_caminho', 'saiu_entrega'].includes(o.status)).length,
      pdv_web: tabOrders.filter(o => ['pdv', 'web', 'checkout', 'menu'].includes(o.channel || 'web')).length,
      aplicativos: tabOrders.filter(o => ['app', 'ifood', 'delivery_app'].includes(o.channel || '')).length,
    }
  }, [orders, activeTab])

  const historyCounts = useMemo(() => {
    const histOrders = orders.filter((o: any) => 
      ['finalizado', 'cancelado', 'cancelled', 'entregue', 'delivered'].includes(o.status)
    )
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    return {
      hoje: histOrders.filter(o => new Date(o.createdAt) >= today).length,
      semana: histOrders.filter(o => new Date(o.createdAt) >= sevenDaysAgo).length,
      mes: histOrders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo).length,
    }
  }, [orders])

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus({ orderId, newStatus })
      toast.success(`Pedido atualizado para: ${newStatus.toUpperCase()}`)

      // Disparar notificação WhatsApp automaticamente
      const order = orders.find((o: any) => o.id === orderId)
      if (order?.customer?.phone) {
        const typeMap: Record<string, string> = {
          preparo:    'received',
          pronto:     'ready',
          a_caminho:  'out_delivery',
          saiu:       'out_delivery',
          cancelado:  'cancelled',
        }
        const notifyType = typeMap[newStatus]
        if (notifyType) {
          fetch('/api/chatbot/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenantId: companyId,
              phone: order.customer.phone,
              type: notifyType,
              orderData: {
                codigo: order.code || order.id?.slice(-4).toUpperCase(),
                nome: order.customer.name || 'Cliente',
                total: order.total,
                tempo: 30,
                tipo_entrega: order.delivery?.type === 'delivery' ? 'Delivery' : 'Retirada',
                endereco: order.delivery?.address || '',
              }
            })
          }).catch(err => console.error('Erro ao enviar notificação whatsapp:', err))
        }
      }
    } catch (e) {
      toast.error("Erro ao atualizar pedido")
    }
  }

  const handleOpenPayment = (order: any) => {
    setOrderForPayment(order)
    setIsPaymentOpen(true)
  }


  const renderTabContent = () => {
    if (activeTab === 'caixa') {
      return (
             <div className="flex-1 flex flex-col overflow-y-auto bg-[#f9fafb] p-6 font-sans">
                <div className="max-w-6xl mx-auto w-full space-y-6">
                   
                   {/* Header */}
                   <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3">
                         <Wallet size={28} className={activeRegister ? "text-emerald-500" : "text-slate-400"} />
                         <div>
                            <h2 className="text-lg font-black text-slate-800 uppercase italic tracking-tight">Fluxo de Caixa Operacional</h2>
                            <p className="text-slate-400 text-xs font-semibold">Gerencie entradas, saídas e controle financeiro do dia.</p>
                         </div>
                      </div>
                      
                      {activeRegister ? (
                         <span className="bg-emerald-50 text-emerald-600 text-xs font-black uppercase italic px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Caixa Aberto
                         </span>
                      ) : (
                         <span className="bg-red-50 text-red-500 text-xs font-black uppercase italic px-3 py-1 rounded-full border border-red-100 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            Caixa Fechado
                         </span>
                      )}
                   </div>

                   {!activeRegister ? (
                      /* Caixa Fechado - Form to open cashier */
                      <div className="max-w-md mx-auto bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                         <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-wider flex items-center gap-2">
                            🔑 Abrir Novo Turno de Caixa
                         </h3>
                         
                         <div className="flex flex-col gap-2">
                            <label className="text-slate-400 text-[10px] font-black uppercase italic tracking-wider">Operador</label>
                            <input 
                              type="text"
                              value={operatorName}
                              onChange={(e) => setOperatorName(e.target.value)}
                              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-800 font-bold rounded-xl text-sm outline-none transition-all"
                              placeholder="Nome do Operador"
                            />
                         </div>
                         
                         <div className="flex flex-col gap-2">
                            <label className="text-slate-400 text-[10px] font-black uppercase italic tracking-wider">Fundo de Troco Inicial</label>
                            <div className="relative">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">R$</span>
                               <input 
                                 type="number"
                                 step="0.01"
                                 value={initialAmount}
                                 onChange={(e) => setInitialAmount(e.target.value)}
                                 className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-800 font-black rounded-xl text-sm outline-none transition-all"
                                 placeholder="0,00"
                               />
                            </div>
                         </div>

                         <div className="flex flex-col gap-2">
                            <label className="text-slate-400 text-[10px] font-black uppercase italic tracking-wider">Notas do Turno</label>
                            <textarea 
                              value={registerNotes}
                              onChange={(e) => setRegisterNotes(e.target.value)}
                              className="w-full h-20 p-3 bg-slate-50 border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-800 font-medium rounded-xl text-sm outline-none transition-all resize-none"
                              placeholder="Ex: Troco inicial em moedas e notas de menor valor..."
                            />
                         </div>

                         <Button 
                           onClick={handleOpenRegister}
                           className="w-full h-11 bg-[#1a56db] hover:bg-[#1e40af] text-white font-black text-xs uppercase italic tracking-widest rounded-xl transition-all shadow-lg shadow-blue-100"
                         >
                           ABRIR CAIXA E INICIAR VENDAS
                         </Button>
                      </div>
                   ) : (
                      /* Caixa Aberto Dashboard */
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         
                         {/* Col 1: Financial Dashboard Card */}
                         <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                               <h3 className="text-xs font-black text-slate-800 uppercase italic tracking-wider border-b border-slate-50 pb-3 flex items-center gap-2">
                                  📊 Resumo do Turno
                               </h3>
                               
                               <div className="space-y-3">
                                  <div className="flex justify-between items-center text-xs text-slate-500">
                                     <span>Fundo Inicial:</span>
                                     <span className="font-black text-slate-700">R$ {Number(activeRegister.initialAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-slate-500">
                                     <span>Vendas Dinheiro:</span>
                                     <span className="font-black text-emerald-600">+ R$ {cashSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-slate-500">
                                     <span>Vendas PIX:</span>
                                     <span className="font-black text-slate-700">+ R$ {pixSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-slate-500">
                                     <span>Vendas Débito:</span>
                                     <span className="font-black text-slate-700">+ R$ {debitSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-slate-500">
                                     <span>Vendas Crédito:</span>
                                     <span className="font-black text-slate-700">+ R$ {creditSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-slate-500">
                                     <span>Suprimentos:</span>
                                     <span className="font-black text-blue-600">+ R$ {suprimentosAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-slate-500">
                                     <span>Sangrias:</span>
                                     <span className="font-black text-red-500">- R$ {sangriasAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                               </div>

                               <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-2xl text-center space-y-1">
                                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic block">Dinheiro Esperado em Caixa</span>
                                  <span className="text-xl font-black text-emerald-700">R$ {calculatedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                               </div>

                               <div className="text-[10px] font-bold text-slate-400 italic leading-normal border-t border-slate-50 pt-3">
                                  Operador: <b>{activeRegister.operator_name || 'Operador'}</b><br />
                                  Aberto em: {new Date(activeRegister.openedAt).toLocaleString('pt-BR')}
                               </div>
                            </div>

                            {/* Fechamento Card */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                               {!isClosingConfirmOpen ? (
                                  <Button
                                    onClick={() => {
                                      setIsClosingConfirmOpen(true);
                                      setClosingAmount(calculatedAmount.toFixed(2));
                                    }}
                                    className="w-full h-11 bg-red-50 hover:bg-red-100 text-red-500 font-black text-xs uppercase italic tracking-widest rounded-xl transition-all border border-red-100"
                                  >
                                    FECHAR CAIXA DO DIA
                                  </Button>
                               ) : (
                                  <div className="space-y-4">
                                     <h4 className="text-xs font-black text-red-600 uppercase italic tracking-wider flex items-center gap-1.5">
                                       ⚠️ Confirmar Fechamento
                                     </h4>
                                     <div className="flex flex-col gap-1.5">
                                        <label className="text-slate-400 text-[9px] font-black uppercase italic tracking-wider">Valor Físico Contado</label>
                                        <div className="relative">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                                          <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0,00"
                                            value={closingAmount}
                                            onChange={(e) => setClosingAmount(e.target.value)}
                                            className="w-full h-10 pl-8 pr-2 bg-slate-50 border border-slate-200 focus:border-red-500 focus:ring-2 ring-red-100 text-slate-800 font-black rounded-xl text-xs outline-none transition-all"
                                          />
                                        </div>
                                     </div>
                                     <div className="flex gap-2">
                                        <button
                                          onClick={() => setIsClosingConfirmOpen(false)}
                                          className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-[9px] uppercase italic tracking-wider rounded-xl transition-all"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          onClick={handleCloseRegister}
                                          className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white font-black text-[9px] uppercase italic tracking-wider rounded-xl transition-all"
                                        >
                                          Confirmar Fechamento
                                        </button>
                                     </div>
                                  </div>
                               )}
                            </div>
                         </div>

                         {/* Col 2 & 3: Operations & History Logs */}
                         <div className="lg:col-span-2 space-y-6">
                            {/* Operations Tab bar */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                               <div className="flex border-b border-slate-100">
                                  <button
                                    onClick={() => setCashTab('operacoes')}
                                    className={cn(
                                      "flex-1 pb-3 text-[10px] font-black uppercase italic tracking-widest border-b-2 transition-all",
                                      cashTab === 'operacoes' ? "border-[#1a56db] text-[#1a56db]" : "border-transparent text-slate-400 hover:text-slate-600"
                                    )}
                                  >
                                    Lançamento Manual (Suprimento / Sangria)
                                  </button>
                                  <button
                                    onClick={() => setCashTab('historico')}
                                    className={cn(
                                      "flex-1 pb-3 text-[10px] font-black uppercase italic tracking-widest border-b-2 transition-all",
                                      cashTab === 'historico' ? "border-[#1a56db] text-[#1a56db]" : "border-transparent text-slate-400 hover:text-slate-600"
                                    )}
                                  >
                                    Log de Movimentações ({transactions.length})
                                  </button>
                               </div>

                               {cashTab === 'operacoes' ? (
                                  <div className="space-y-4">
                                     <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                       <button
                                         type="button"
                                         onClick={() => setOpType('suprimento')}
                                         className={cn(
                                           "flex-1 py-2.5 rounded-lg font-black text-[9px] uppercase italic tracking-wider transition-all",
                                           opType === 'suprimento' ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                                         )}
                                       >
                                         Suprimento (Entrada de Troco)
                                       </button>
                                       <button
                                         type="button"
                                         onClick={() => setOpType('sangria')}
                                         className={cn(
                                           "flex-1 py-2.5 rounded-lg font-black text-[9px] uppercase italic tracking-wider transition-all",
                                           opType === 'sangria' ? "bg-white text-red-500 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                                         )}
                                       >
                                         Sangria (Retirada de Caixa)
                                       </button>
                                     </div>

                                     <div className="grid grid-cols-3 gap-4">
                                       <div className="col-span-1 flex flex-col gap-1.5">
                                         <label className="text-slate-400 text-[9px] font-black uppercase italic tracking-wider">Valor do Lançamento</label>
                                         <div className="relative">
                                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                                           <input
                                             type="number"
                                             step="0.01"
                                             placeholder="0,00"
                                             value={opAmount}
                                             onChange={(e) => setOpAmount(e.target.value)}
                                             className="w-full h-11 pl-8 pr-2 bg-slate-50 border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-800 font-black rounded-xl text-xs outline-none transition-all"
                                           />
                                         </div>
                                       </div>
                                       <div className="col-span-2 flex flex-col gap-1.5">
                                         <label className="text-slate-400 text-[9px] font-black uppercase italic tracking-wider">Descrição / Motivo</label>
                                         <input
                                           type="text"
                                           placeholder="Descreva a operação..."
                                           value={opDescription}
                                           onChange={(e) => setOpDescription(e.target.value)}
                                           className="w-full h-11 px-3 bg-slate-50 border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-800 font-bold rounded-xl text-xs outline-none transition-all placeholder:text-slate-300"
                                         />
                                       </div>
                                     </div>

                                     <Button
                                       type="button"
                                       onClick={handleCreateTransaction}
                                       className={cn(
                                         "w-full h-11 font-black text-[10px] uppercase italic tracking-widest rounded-xl transition-all shadow-md gap-2",
                                         opType === 'suprimento' ? "bg-[#1a56db] hover:bg-[#1e40af] text-white shadow-blue-100" : "bg-red-500 hover:bg-red-600 text-white shadow-red-100"
                                       )}
                                     >
                                       Registrar {opType === 'suprimento' ? 'Suprimento' : 'Sangria'}
                                     </Button>
                                  </div>
                               ) : (
                                  <ScrollArea className="h-[300px] border border-slate-100 rounded-2xl bg-slate-50/30 p-4">
                                     {transactions.length === 0 ? (
                                       <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                                         <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-wider">Nenhuma movimentação registrada</span>
                                         <span className="text-[9px] text-slate-400 mt-1">Lançamentos de sangria e suprimento aparecerão neste log</span>
                                       </div>
                                     ) : (
                                       <div className="space-y-2">
                                         {transactions.map((tx) => (
                                           <div key={tx.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                                             <div className="flex flex-col min-w-0">
                                               <span className="text-xs font-black text-slate-700 truncate uppercase italic">{tx.description}</span>
                                               <span className="text-[9px] font-bold text-slate-400 mt-1">
                                                 Lançado às {new Date(tx.created_at).toLocaleString('pt-BR')}
                                               </span>
                                             </div>
                                             <span className={cn(
                                               "text-xs font-black italic tracking-tight whitespace-nowrap shrink-0 ml-3",
                                               tx.type === 'suprimento' ? "text-blue-600" : "text-red-500"
                                             )}>
                                               {tx.type === 'suprimento' ? '+' : '-'} R$ {Number(tx.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                             </span>
                                           </div>
                                         ))}
                                       </div>
                                     )}
                                  </ScrollArea>
                               )}
                            </div>
                         </div>
                      </div>
                   )}
                </div>
             </div>
      );
    }
    if (activeTab === 'mesas') {
      return (
             <div className="flex-1 flex flex-col overflow-y-auto bg-[#f9fafb]">
                {/* ☕ Status das Mesas */}
                <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-slate-100 shrink-0 select-none overflow-x-auto scrollbar-none">
                  <div 
                    style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase italic tracking-wider shadow-sm border border-slate-200"
                  >
                    <span>☕ Livre</span>
                    <span className="font-mono bg-[#374151] text-white rounded-full px-2 py-0.5 text-[10px] font-black">
                      {indicators.free}
                    </span>
                  </div>

                  <div 
                    style={{ backgroundColor: '#fff4e5', color: '#ea580c' }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase italic tracking-wider shadow-sm border border-[#ea580c]/10"
                  >
                    <span>🍽️ Ocupada</span>
                    <span className="font-mono bg-[#ea580c] text-white rounded-full px-2 py-0.5 text-[10px] font-black">
                      {indicators.occupied}
                    </span>
                  </div>

                  <div 
                    style={{ backgroundColor: '#fefce8', color: '#ca8a04' }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase italic tracking-wider shadow-sm border border-[#ca8a04]/10"
                  >
                    <span>🧾 Fechamento</span>
                    <span className="font-mono bg-[#ca8a04] text-white rounded-full px-2 py-0.5 text-[10px] font-black">
                      {indicators.closing_pending}
                    </span>
                  </div>

                  <div 
                    style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase italic tracking-wider shadow-sm border border-[#2563eb]/10"
                  >
                    <span>📅 Reservada</span>
                    <span className="font-mono bg-[#2563eb] text-white rounded-full px-2 py-0.5 text-[10px] font-black">
                      {indicators.reserved}
                    </span>
                  </div>

                  <div 
                    style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase italic tracking-wider shadow-sm border border-[#dc2626]/10"
                  >
                    <span>🚫 Bloqueada</span>
                    <span className="font-mono bg-[#dc2626] text-white rounded-full px-2 py-0.5 text-[10px] font-black">
                      {indicators.blocked || 0}
                    </span>
                  </div>
                </div>

                {/* 🏷️ Ambientes list bar */}
                <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0 overflow-x-auto select-none scrollbar-none gap-4">
                  <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1 w-full">
                    {environments.length === 0 ? (
                      <span className="text-[10px] text-slate-400 font-bold uppercase italic tracking-wider">Nenhum ambiente cadastrado.</span>
                    ) : (
                      environments.map((env, index) => {
                        const active = selectedEnv?.id === env.id
                        const envTables = tables.filter(t => t.environment_id === env.id)
                        const livres = envTables.filter(t => t.status === 'free').length
                        const ocupadas = envTables.filter(t => ['occupied', 'closing_pending', 'reserved', 'blocked'].includes(t.status)).length
                        
                        // Harmonious colors for environments
                        const colors = [
                          { border: 'border-blue-200', text: 'text-blue-700', bg: 'bg-blue-50', activeBg: 'bg-blue-600', dot: 'bg-blue-500' },
                          { border: 'border-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50', activeBg: 'bg-emerald-600', dot: 'bg-emerald-500' },
                          { border: 'border-purple-200', text: 'text-purple-700', bg: 'bg-purple-50', activeBg: 'bg-purple-600', dot: 'bg-purple-500' },
                          { border: 'border-amber-200', text: 'text-amber-700', bg: 'bg-amber-50', activeBg: 'bg-amber-600', dot: 'bg-amber-500' },
                          { border: 'border-rose-200', text: 'text-rose-700', bg: 'bg-rose-50', activeBg: 'bg-rose-600', dot: 'bg-rose-500' }
                        ]
                        const color = colors[index % colors.length]

                        return (
                          <button
                            key={env.id}
                            onClick={() => setSelectedEnv(env)}
                            className={cn(
                              "px-4 py-2.5 rounded-2xl flex flex-col items-start gap-1.5 transition-all shrink-0 border text-left min-w-[150px] shadow-sm",
                              active 
                                ? `${color.bg} ${color.border} ring-2 ring-offset-1 ring-blue-500/30` 
                                : "bg-white border-slate-100 hover:bg-slate-50"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn("h-2 w-2 rounded-full shrink-0", color.dot)} />
                              <span className="font-black text-xs text-slate-800 uppercase italic tracking-wide truncate max-w-[110px]">{env.name}</span>
                            </div>
                            <div className="flex flex-col gap-0.5 text-[9px] font-bold text-slate-500 uppercase italic">
                              <span className="flex items-center gap-1">
                                <span className="text-[10px]">🟢</span> {livres} livres
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="text-[10px]">🟠</span> {ocupadas} ocupadas
                              </span>
                            </div>
                          </button>
                        )
                      })
                    )}

                    <div className="w-[1px] h-10 bg-slate-100 mx-1 shrink-0" />

                    <button
                      onClick={() => setIsEnvModalOpen(true)}
                      className="px-4 py-3 rounded-2xl flex flex-col justify-center items-center gap-1.5 transition-all shrink-0 border border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-400 hover:text-slate-600 min-w-[150px] h-[66px] text-center"
                    >
                      <span className="font-black text-[10px] uppercase italic tracking-widest">+ Novo Ambiente</span>
                    </button>
                  </div>
                </div>

                {/* 📊 Grade de Mesas */}
                <div className="p-6 flex-1 bg-white">
                  {!selectedEnv ? (
                    <div className="text-center py-20 border-2 border-dashed border-slate-150 rounded-3xl p-8 max-w-sm mx-auto shadow-sm bg-slate-50/50">
                      <Layers size={40} className="text-slate-300 mx-auto mb-4 animate-pulse" />
                      <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-wider mb-2">Nenhum Ambiente Selecionado</h3>
                      <p className="text-slate-400 text-xs font-bold italic mb-6">Crie um ambiente para começar a adicionar mesas.</p>
                      <Button 
                        onClick={() => setIsEnvModalOpen(true)}
                        className="h-10 px-6 bg-[#1a56db] hover:bg-[#1e40af] text-white font-black uppercase italic text-xs tracking-widest rounded-xl shadow-xl shadow-blue-100 active:scale-95 transition-all"
                      >
                        Criar Ambiente
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Ambiente Header */}
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-slate-800 uppercase italic tracking-wider flex items-center gap-2">
                          📍 {selectedEnv.name}
                        </h2>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditEnvName(selectedEnv.name);
                              setIsEditEnvModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-slate-100"
                            title="Renomear Ambiente"
                          >
                            <Settings2 size={13} />
                          </button>
                          <button
                            onClick={handleDeleteEnv}
                            className="p-1.5 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
                            title="Excluir Ambiente"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {/* GRID DE MESAS POR SETORES */}
                      {(() => {
                        const renderTableCard = (table: any) => {
                          const linkedOrder = getTableActiveOrder(table.table_number)
                          const customerName = linkedOrder?.customer?.name || "Sem Nome"
                          const elapsedTime = linkedOrder ? formatElapsedTime(linkedOrder.createdAt) : ""
                          const consumptionAmount = linkedOrder ? (linkedOrder.total || 0) : 0
                          const [tableNumPart, tableNamePart] = table.table_number.includes(' - ') 
                            ? table.table_number.split(' - ') 
                            : [table.table_number, '']

                          let cardStyle = {}
                          let cardContent = null

                          if (table.status === 'occupied') {
                            cardStyle = { backgroundColor: '#fff4e5', color: '#ea580c', borderColor: '#ea580c20' }
                            cardContent = (
                              <div className="flex flex-col justify-between h-full w-full p-4 text-left font-sans relative">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-black uppercase tracking-wider truncate">Mesa {tableNumPart}</span>
                                  {tableNamePart && <span className="text-[9px] font-bold opacity-80 truncate">{tableNamePart}</span>}
                                </div>
                                <div className="flex flex-col gap-0.5 my-1 min-w-0">
                                  <span className="text-[9px] font-bold opacity-75 uppercase tracking-wider">Cliente:</span>
                                  <span className="text-xs font-black truncate">{customerName}</span>
                                </div>
                                <div className="flex flex-col gap-1 mt-auto">
                                  <span className="text-[9px] font-mono font-bold bg-[#ea580c]/10 px-1.5 py-0.5 rounded w-max">
                                    ⏱️ {elapsedTime}
                                  </span>
                                  <span className="text-xs font-black">
                                    R$ {Number(consumptionAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            )
                          } else if (table.status === 'closing_pending') {
                            cardStyle = { backgroundColor: '#fefce8', color: '#ca8a04', borderColor: '#ca8a0420' }
                            cardContent = (
                              <div className="flex flex-col justify-between h-full w-full p-4 text-left font-sans relative">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-black uppercase tracking-wider truncate">Mesa {tableNumPart}</span>
                                  {tableNamePart && <span className="text-[9px] font-bold opacity-80 truncate">{tableNamePart}</span>}
                                </div>
                                <div className="flex flex-col gap-0.5 my-1 min-w-0">
                                  <span className="text-[9px] font-bold opacity-75 uppercase tracking-wider">Cliente:</span>
                                  <span className="text-xs font-black truncate">{customerName}</span>
                                </div>
                                <div className="flex flex-col gap-1 mt-auto">
                                  <span className="text-[9px] font-mono font-bold bg-[#ca8a04]/10 px-1.5 py-0.5 rounded w-max">
                                    ⏱️ {elapsedTime}
                                  </span>
                                  <span className="text-xs font-black">
                                    R$ {Number(consumptionAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            )
                          } else if (table.status === 'reserved') {
                            cardStyle = { backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#2563eb20' }
                            cardContent = (
                              <div className="flex flex-col justify-between h-full w-full p-4 text-left font-sans relative">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-black uppercase tracking-wider truncate">Mesa {tableNumPart}</span>
                                  {tableNamePart && <span className="text-[9px] font-bold opacity-80 truncate">{tableNamePart}</span>}
                                </div>
                                <div className="flex flex-col items-start mt-auto">
                                  <span className="text-xs font-black uppercase tracking-wider">Reservada</span>
                                </div>
                              </div>
                            )
                          } else if (table.status === 'blocked') {
                            cardStyle = { backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#dc262620' }
                            cardContent = (
                              <div className="flex flex-col justify-between h-full w-full p-4 text-left font-sans relative">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-black uppercase tracking-wider truncate">Mesa {tableNumPart}</span>
                                  {tableNamePart && <span className="text-[9px] font-bold opacity-80 truncate">{tableNamePart}</span>}
                                </div>
                                <div className="flex flex-col items-start mt-auto">
                                  <span className="text-xs font-black uppercase tracking-wider">Bloqueada</span>
                                </div>
                              </div>
                            )
                          } else {
                            cardStyle = { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#e5e7eb' }
                            cardContent = (
                              <div className="flex flex-col justify-between h-full w-full p-4 text-left font-sans relative">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-black uppercase tracking-wider truncate">Mesa {tableNumPart}</span>
                                  {tableNamePart && <span className="text-[9px] font-bold opacity-80 truncate">{tableNamePart}</span>}
                                </div>
                                <div className="flex flex-col items-start mt-auto">
                                  <span className="text-xs font-black uppercase tracking-wider">Livre</span>
                                </div>
                              </div>
                            )
                          }

                          return (
                            <div
                              key={table.id}
                              onClick={() => {
                                setSelectedTableForAction(table);
                                setActionTab('details');
                                setTransferTargetTableId("");
                                setMergeTargetTableIds([]);
                                setIsActionModalOpen(true);
                              }}
                              style={cardStyle}
                              className={cn(
                                "aspect-square rounded-3xl border flex flex-col justify-between p-0 relative overflow-hidden transition-all hover:scale-105 cursor-pointer select-none shadow-sm hover:shadow-md"
                              )}
                            >
                              {cardContent}
                              {waiterCalls.some(c => c.table_number === table.table_number) && (
                                <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                                </span>
                              )}
                            </div>
                          )
                        }

                        const occupiedTables = environmentTables.filter(t => t.status === 'occupied')
                        const closingTables = environmentTables.filter(t => t.status === 'closing_pending')
                        const freeTables = environmentTables.filter(t => t.status === 'free')
                        const reservedTables = environmentTables.filter(t => t.status === 'reserved')
                        const blockedTables = environmentTables.filter(t => t.status === 'blocked')

                        return (
                          <div className="space-y-8 select-none">
                            {occupiedTables.length > 0 && (
                              <div className="space-y-3">
                                <h3 className="text-xs font-black text-[#ea580c] uppercase italic tracking-widest flex items-center gap-2">
                                  🍽️ Ocupadas ({occupiedTables.length})
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }} className="w-full">
                                  {occupiedTables.map(renderTableCard)}
                                </div>
                              </div>
                            )}

                            {closingTables.length > 0 && (
                              <div className="space-y-3">
                                <h3 className="text-xs font-black text-[#ca8a04] uppercase italic tracking-widest flex items-center gap-2">
                                  🧾 Em Fechamento ({closingTables.length})
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }} className="w-full">
                                  {closingTables.map(renderTableCard)}
                                </div>
                              </div>
                            )}

                            {reservedTables.length > 0 && (
                              <div className="space-y-3">
                                <h3 className="text-xs font-black text-[#2563eb] uppercase italic tracking-widest flex items-center gap-2">
                                  📅 Reservadas ({reservedTables.length})
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }} className="w-full">
                                  {reservedTables.map(renderTableCard)}
                                </div>
                              </div>
                            )}

                            {blockedTables.length > 0 && (
                              <div className="space-y-3">
                                <h3 className="text-xs font-black text-[#dc2626] uppercase italic tracking-widest flex items-center gap-2">
                                  🚫 Bloqueadas ({blockedTables.length})
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }} className="w-full">
                                  {blockedTables.map(renderTableCard)}
                                </div>
                              </div>
                            )}

                            <div className="space-y-3">
                              <h3 className="text-xs font-black text-slate-500 uppercase italic tracking-widest flex items-center gap-2">
                                🟢 Disponíveis ({freeTables.length})
                              </h3>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }} className="w-full">
                                {freeTables.map(renderTableCard)}
                                <button
                                  onClick={() => {
                                    setTableNumber("");
                                    setTableNameInput("");
                                    setTableCapacity(4);
                                    setTableEnvId(selectedEnv.id);
                                    setIsTableModalOpen(true);
                                  }}
                                  className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-slate-400 hover:text-blue-500 flex flex-col items-center justify-center p-3 transition-all hover:scale-105 outline-none font-sans"
                                >
                                  <Plus size={24} className="stroke-[3]" />
                                  <span className="text-xs font-black uppercase italic tracking-wider mt-1.5">Nova Mesa</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
             </div>
      );
    }
    if (activeTab === 'comandas') {
      return (
             <div className="flex-1 flex flex-col overflow-y-auto bg-[#f9fafb] p-6">
                <div className="max-w-6xl mx-auto w-full space-y-6">
                   <div className="flex items-center justify-between">
                      <div>
                         <h2 className="text-lg font-black text-slate-800 uppercase italic tracking-tight flex items-center gap-2">
                           📇 Comandas Ativas
                         </h2>
                         <p className="text-slate-400 text-xs font-semibold">Gerencie comandas individuais e consumos de clientes avulsos.</p>
                      </div>
                      
                      <div className="bg-slate-100/80 px-3 py-1.5 rounded-full text-slate-500 text-xs font-black uppercase italic tracking-wider flex items-center gap-2">
                        <span>Total Ativas:</span>
                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                          {orders.filter(o => o.delivery?.type === 'comanda' && !['finalizado', 'cancelado', 'cancelled', 'entregue', 'delivered'].includes(o.status)).length}
                        </span>
                      </div>
                   </div>

                   <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                     {(() => {
                       const renderComandaCard = (order: any) => {
                         const comandaNum = getComandaNumber(order.notes)
                         const customerName = order.customer?.name || "Sem Nome"
                         const elapsedTime = formatElapsedTime(order.createdAt)
                         const consumptionAmount = order.total || 0
                         const isClosing = (order.notes || "").toLowerCase().includes('[fechamento]')

                         let cardStyle = { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#e5e7eb' }
                         if (isClosing) {
                           cardStyle = { backgroundColor: '#fefce8', color: '#ca8a04', borderColor: '#ca8a0420' }
                         } else if (order.items && order.items.length > 0) {
                           cardStyle = { backgroundColor: '#fff4e5', color: '#ea580c', borderColor: '#ea580c20' }
                         }

                         return (
                           <div
                             key={order.id}
                             onClick={() => {
                               setSelectedTableForAction({
                                 id: 'comanda-' + order.id,
                                 table_number: 'Comanda ' + comandaNum,
                                 status: isClosing ? 'closing_pending' : 'occupied',
                                 capacity: 1
                               })
                               setActionTab('details')
                               setTransferTargetTableId("")
                               setMergeTargetTableIds([])
                               setIsActionModalOpen(true)
                             }}
                             style={cardStyle}
                             className={cn(
                               "aspect-square rounded-3xl border flex flex-col justify-between p-0 relative overflow-hidden transition-all hover:scale-105 cursor-pointer select-none shadow-sm hover:shadow-md"
                             )}
                           >
                             <div className="flex flex-col justify-between h-full w-full p-4 text-left font-sans relative">
                               <div className="flex flex-col min-w-0">
                                 <span className="text-xs font-black uppercase tracking-wider truncate">Comanda {comandaNum}</span>
                               </div>
                               <div className="flex flex-col gap-0.5 my-1 min-w-0">
                                 <span className="text-[9px] font-bold opacity-75 uppercase tracking-wider">Cliente:</span>
                                 <span className="text-xs font-black truncate">{customerName}</span>
                               </div>
                               <div className="flex flex-col gap-1 mt-auto">
                                 <span className="text-[9px] font-mono font-bold bg-black/5 px-1.5 py-0.5 rounded w-max">
                                   ⏱️ {elapsedTime}
                                 </span>
                                 <span className="text-xs font-black">
                                   R$ {Number(consumptionAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                 </span>
                               </div>
                             </div>

                             {waiterCalls.some(c => c.table_number === 'Comanda ' + comandaNum) && (
                               <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                               </span>
                             )}
                           </div>
                         )
                       }

                       const activeComandas = orders
                         .filter(o => o.delivery?.type === 'comanda' && !['finalizado', 'cancelado', 'cancelled', 'entregue', 'delivered'].includes(o.status))
                         .filter((o: any) => {
                           if (!searchQuery) return true
                           const comandaNum = getComandaNumber(o.notes)
                           const name = o.customer?.name || ""
                           return comandaNum.includes(searchQuery) || name.toLowerCase().includes(searchQuery.toLowerCase())
                         })

                       return (
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }} className="w-full">
                           {activeComandas.map(renderComandaCard)}

                           <button
                             onClick={() => {
                               setNewComandaNumber("")
                               setNewComandaCustomerName("")
                               setNewComandaCustomerPhone("")
                               setIsNewComandaModalOpen(true)
                             }}
                             className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-slate-400 hover:text-blue-500 flex flex-col items-center justify-center p-3 transition-all hover:scale-105 outline-none font-sans"
                           >
                             <Plus size={24} className="stroke-[3]" />
                             <span className="text-xs font-black uppercase italic tracking-wider mt-1.5">Nova Comanda</span>
                           </button>
                         </div>
                       )
                     })()}
                   </div>
                </div>
             </div>
      );
    }
    return (
             <>
               {/* 🔶 BARRA DE FILTROS (OlaClick Layout) */}
               <div className="bg-white border-b border-slate-100 px-6 h-[64px] flex items-center justify-between shrink-0 overflow-x-auto select-none scrollbar-none">
                   <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                     {activeTab === 'historico' ? (
                       [
                         { id: 'hoje', label: 'Hoje', colorClass: 'bg-[#eff6ff] text-[#1a56db] border border-[#bfdbfe]' },
                         { id: 'semana', label: 'Semana', colorClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
                         { id: 'mes', label: 'Mês', colorClass: 'bg-purple-50 text-purple-700 border border-purple-200' }
                       ].map((item) => {
                         const count = historyCounts[item.id as keyof typeof historyCounts]

                         return (
                           <button
                             key={item.id}
                             onClick={() => setHistoryFilter(item.id as any)}
                             className={cn(
                               "h-9 px-4 rounded-full font-black text-[10px] uppercase italic tracking-widest flex items-center gap-2 transition-all shrink-0",
                               historyFilter === item.id 
                                 ? item.colorClass 
                                 : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                             )}
                           >
                             {item.label}
                             <span className={cn(
                               "px-1.5 py-0.5 rounded-full text-[9px] font-black not-italic min-w-5 text-center leading-none",
                               historyFilter === item.id ? "bg-white/80 text-blue-600" : "bg-slate-200/80 text-slate-500"
                             )}>
                               {count}
                             </span>
                           </button>
                         )
                       })
                     ) : (
                       [
                         { id: 'tudo', label: 'Tudo', colorClass: 'bg-[#eff6ff] text-[#1a56db] border border-[#bfdbfe]' },
                         { id: 'pendente', label: 'Pendente', colorClass: 'bg-orange-50 text-[#f97316] border border-orange-200' },
                         { id: 'em_curso', label: 'Em Curso', colorClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
                         { id: 'pdv_web', label: 'PDV / WEB', colorClass: 'bg-indigo-50 text-indigo-600 border border-indigo-200' },
                         { id: 'aplicativos', label: 'Aplicativos', colorClass: 'bg-purple-50 text-purple-700 border border-purple-200' }
                       ].map((item) => {
                         const count = counts[item.id as keyof typeof counts]

                         return (
                           <button
                             key={item.id}
                             onClick={() => setActiveFilter(item.id as FilterType)}
                             className={cn(
                               "h-9 px-4 rounded-full font-black text-[10px] uppercase italic tracking-widest flex items-center gap-2 transition-all shrink-0",
                               activeFilter === item.id 
                                 ? item.colorClass 
                                 : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                             )}
                           >
                             {item.id === 'tudo' ? '✓ ' : ''}{item.label}
                             <span className={cn(
                               "px-1.5 py-0.5 rounded-full text-[9px] font-black not-italic min-w-5 text-center leading-none",
                               activeFilter === item.id ? "bg-white/80 text-blue-600" : "bg-slate-200/80 text-slate-500"
                             )}>
                               {count}
                             </span>
                           </button>
                         )
                       })
                     )}
                   </div>

                   <div className="flex items-center gap-6 shrink-0">
                      <span className="text-sm font-black text-slate-800 italic tracking-tighter">
                         Total: R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <button className="size-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#1a56db] transition-colors"><Eye size={20} /></button>
                   </div>
               </div>

               {/* 📦 TABLE CONTAINER WITH HORIZONTAL SCROLL FOR RESPONSIVENESS */}
               <div className="flex-1 flex flex-col overflow-x-auto bg-[#f9fafb]">
                 <div className="min-w-[1200px] flex flex-col flex-1">
                   
                   {activeTab === 'historico' && (
                     <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-center justify-between shrink-0">
                       <div className="flex items-center gap-2">
                         <span className="text-amber-500 font-bold">⚠️</span>
                         <span className="text-xs font-bold text-amber-800">
                           Você está visualizando o <b>Histórico de Pedidos</b>. Os pedidos exibidos aqui já foram finalizados ou cancelados e não estão na fila de preparação.
                         </span>
                       </div>
                       <button 
                         onClick={() => setActiveTab('delivery')}
                         className="h-7 px-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-[9px] uppercase italic tracking-wider rounded-lg transition-all active:scale-95 shadow-sm"
                       >
                         Voltar para Operação
                       </button>
                     </div>
                   )}

                   {/* 📊 TABELA HEADER */}
                   <div className="bg-slate-50/50 border-b border-slate-100 px-6 h-[48px] flex items-center shrink-0">
                       <div className="w-[160px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Data</div>
                       <div className="w-[140px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Estado</div>
                       <div className="w-[120px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Total</div>
                       <div className="w-[200px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Cliente</div>
                       <div className="w-[110px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Origem</div>
                       <div className="w-[140px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Pagamento</div>
                       <div className="w-[160px] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Entregador</div>
                       <div className="flex-1 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Ações</div>
                   </div>

                   <ScrollArea className="flex-1 bg-white">
                     <div className="flex flex-col min-h-full">
                        <AnimatePresence mode="popLayout" initial={false}>
                           {loading ? (
                             <div className="flex-1 flex flex-col items-center justify-center p-20 gap-4">
                               <RefreshCw size={32} className="text-[#1a56db] animate-spin" />
                               <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Carregando pedidos...</span>
                             </div>
                           ) : filteredOrders.length > 0 ? (
                             filteredOrders.map((order) => (
                               <OrderRow 
                                 key={order.id} 
                                 order={order}
                                 isNew={newOrderIds.includes(order.id)}
                                 onAccept={() => handleUpdateStatus(order.id, 'preparo')}
                                 onUpdateStatus={(newStatus) => handleUpdateStatus(order.id, newStatus)}
                                 onOpenPayment={() => handleOpenPayment(order)}
                                 onOpenDetails={() => handleOpenDetails(order)}
                               />
                             ))
                           ) : (
                             <motion.div 
                               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                               className="flex-1 flex flex-col items-center justify-center p-32 text-center"
                             >
                               <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                 <ShoppingBag size={32} className="text-slate-300 animate-pulse" />
                               </div>
                               <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-wider mb-2">Criar pedidos para cada tipo de serviço</h3>
                               <p className="text-slate-400 text-xs font-bold italic mb-6 max-w-[280px]">Nenhum pedido encontrado. Adicione um novo pedido manual.</p>
                               <Button 
                                 onClick={() => {
                                   const btn = document.querySelector('header button[class*="bg-[#1a56db]"]') as HTMLButtonElement;
                                   if (btn) btn.click();
                                 }}
                                 className="h-10 px-6 bg-[#1a56db] hover:bg-[#1e40af] text-white font-black uppercase italic text-xs tracking-widest rounded-2xl shadow-xl shadow-blue-100 active:scale-95 transition-all gap-2"
                               >
                                 <Plus size={16} strokeWidth={4} /> Novo pedido
                               </Button>
                             </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                   </ScrollArea>
                 </div>
               </div>
             </>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f9fafb] overflow-hidden font-sans">
        {/* 🚀 CABEÇALHO SUPERIOR (OlaClick Style) */}
        <header className="h-[64px] bg-white border-b border-slate-100 flex items-center shrink-0 z-40 px-4 gap-2">
            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100 h-11">
               {[
                  { id: 'balcao', label: 'Balcão', icon: ShoppingBag, count: orders.filter(o => o.delivery?.type === 'balcao' && !['finalizado', 'cancelado', 'cancelled', 'entregue', 'delivered'].includes(o.status)).length },
                  { id: 'delivery', label: 'Delivery', icon: Truck, count: orders.filter(o => ['delivery', 'entrega', 'retirada', 'pickup'].includes(o.delivery?.type) && !['finalizado', 'cancelado', 'cancelled', 'entregue', 'delivered'].includes(o.status)).length },
                  { id: 'mesas', label: 'Mesas', icon: UtensilsCrossed, count: orders.filter(o => ['mesa', 'mesas'].includes(o.delivery?.type) && !['finalizado', 'cancelado', 'cancelled', 'entregue', 'delivered'].includes(o.status)).length },
                  { id: 'comandas', label: 'Comandas', icon: Layers, count: orders.filter(o => o.delivery?.type === 'comanda' && !['finalizado', 'cancelado', 'cancelled', 'entregue', 'delivered'].includes(o.status)).length },
                  { id: 'caixa', label: 'Caixa', icon: Wallet, count: activeRegister ? "Aberto" : "Fechado" },
               ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={cn(
                       "flex items-center gap-2 px-4 h-9 rounded-lg transition-all font-black text-[10px] uppercase italic tracking-tight whitespace-nowrap",
                       activeTab === item.id 
                         ? "bg-[#1a56db] text-white shadow-md shadow-blue-100" 
                         : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                     <item.icon size={14} className={cn(activeTab === item.id ? "text-white" : "text-slate-300")} />
                     {item.label}
                     <span className={cn(
                       "px-1.5 h-4 min-w-[16px] rounded-full flex items-center justify-center text-[8px] font-black leading-none",
                       activeTab === item.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                     )}>
                        {item.count}
                     </span>
                  </button>
               ))}
            </div>

            <div className="w-[1px] h-6 bg-slate-100 mx-1" />

            <div className="flex items-center gap-2">
               <div className="flex flex-col items-center justify-center px-2 h-8 border border-slate-100 rounded leading-none text-[7px] font-black text-slate-300 uppercase italic bg-slate-50/50">
                  <span>NFC</span>
                  <span className="text-[5px]">OFFLINE</span>
               </div>

               {/* Indicator de Caixa (Abrir Caixa / Detalhes) */}
               {activeRegister ? (
                 <button 
                   onClick={() => {
                     setIsRegisterModalOpen(true);
                     setIsClosingConfirmOpen(false);
                   }}
                   title="Caixa Aberto. Clique para ver detalhes e movimentações."
                   className="flex items-center gap-2 px-3 h-8 rounded-lg border border-emerald-100 bg-[#f0fdf4] text-[#16a34a] font-sans text-xs font-bold hover:bg-[#e8fbf0] transition-colors shrink-0 outline-none cursor-pointer"
                 >
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <Wallet size={14} />
                    <div className="flex flex-col items-start leading-none gap-0.5">
                      <span className="text-[9px] font-black uppercase tracking-tight">🟢 CAIXA ABERTO</span>
                    </div>
                 </button>
               ) : (
                 <button 
                   onClick={() => setIsRegisterModalOpen(true)}
                   title="Caixa Fechado. Clique para abrir."
                   className="flex items-center gap-2 px-3 h-8 rounded-lg border border-red-100 bg-red-50 text-red-500 font-sans text-xs font-bold hover:bg-red-100 transition-colors shrink-0 outline-none cursor-pointer"
                 >
                    <div className="relative flex h-2 w-2">
                      <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </div>
                    <Wallet size={14} />
                    <div className="flex flex-col items-start leading-none gap-0.5">
                      <span className="text-[9px] font-black uppercase tracking-tight">🔴 CAIXA FECHADO</span>
                      <span className="text-[7px] text-red-400/80 font-semibold tracking-tighter">Clique para abrir</span>
                    </div>
                 </button>
               )}
            </div>
 
            <div className="flex items-center h-full ml-auto gap-3">
              <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input 
                      placeholder="BUSCAR PEDIDO..." 
                      className="h-10 pl-9 w-[180px] bg-slate-50 border-slate-100 text-[10px] font-black uppercase italic rounded-xl focus:ring-2 ring-blue-100 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
 
              <button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["orders", companyId] })}
                className="p-2 text-slate-300 hover:text-[#1a56db] hover:bg-blue-50 rounded-xl transition-colors"
                title="Sincronizar"
              >
                 <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
 
              <button 
                onClick={() => setIsSchedulerModalOpen(true)}
                className="p-2 text-slate-300 hover:text-[#1a56db] hover:bg-blue-50 rounded-xl transition-colors"
                title="Horários do Cardápio Digital"
              >
                 <Pause size={18} />
              </button>
 
              <div className="relative">
                 <button 
                   onClick={() => setIsQuickSettingsOpen(!isQuickSettingsOpen)}
                   className="h-10 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100/80 text-slate-600 font-black text-[10px] uppercase italic rounded-[12px] flex items-center gap-2 hover:border-slate-300 transition-all active:scale-95"
                 >
                    <Settings2 size={16} /> Configurações <ChevronDown size={14} />
                 </button>
                 {isQuickSettingsOpen && (
                   <>
                     <div 
                       className="fixed inset-0 z-50" 
                       onClick={() => setIsQuickSettingsOpen(false)} 
                     />
                     <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 z-[100] py-2">
                       <button
                         onClick={() => {
                           setIsQuickSettingsOpen(false);
                           toast.info("Configuração de Impressoras: Acesse as configurações da loja para gerenciar.");
                         }}
                         className="w-full px-4 py-2.5 text-left text-xs font-black uppercase italic text-slate-600 hover:bg-slate-50 hover:text-[#1a56db] flex items-center gap-3 transition-colors"
                       >
                         <Printer size={14} className="text-slate-400" />
                         Impressoras
                       </button>

                       <button
                         onClick={() => {
                           setIsQuickSettingsOpen(false);
                           setIsRegisterModalOpen(true);
                           setIsClosingConfirmOpen(false);
                         }}
                         className="w-full px-4 py-2.5 text-left text-xs font-black uppercase italic text-slate-600 hover:bg-slate-50 hover:text-[#1a56db] flex items-center gap-3 transition-colors"
                       >
                         <Wallet size={14} className="text-slate-400" />
                         Caixa
                       </button>

                       <button
                         onClick={() => {
                           setIsQuickSettingsOpen(false);
                           window.location.href = '/dashboard/equipe';
                         }}
                         className="w-full px-4 py-2.5 text-left text-xs font-black uppercase italic text-slate-600 hover:bg-slate-50 hover:text-[#1a56db] flex items-center gap-3 transition-colors"
                       >
                         <User size={14} className="text-slate-400" />
                         Entregadores
                       </button>

                       <button
                         onClick={() => {
                           setIsQuickSettingsOpen(false);
                           window.location.href = '/dashboard/mesas';
                         }}
                         className="w-full px-4 py-2.5 text-left text-xs font-black uppercase italic text-slate-600 hover:bg-slate-50 hover:text-[#1a56db] flex items-center gap-3 transition-colors"
                       >
                         <Layers size={14} className="text-slate-400" />
                         Ambientes
                       </button>

                       <button
                         onClick={() => {
                           setIsQuickSettingsOpen(false);
                           setActiveTab('historico');
                         }}
                         className="w-full px-4 py-2.5 text-left text-xs font-black uppercase italic text-slate-600 hover:bg-slate-50 hover:text-[#1a56db] flex items-center gap-3 transition-colors"
                       >
                         <History size={14} className="text-slate-400" />
                         Histórico
                       </button>

                       <button
                         onClick={() => {
                           setIsQuickSettingsOpen(false);
                           window.location.href = '/dashboard/configuracoes';
                         }}
                         className="w-full px-4 py-2.5 text-left text-xs font-black uppercase italic text-slate-600 hover:bg-slate-50 hover:text-[#1a56db] flex items-center gap-3 transition-colors border-t border-slate-100"
                       >
                         <Settings2 size={14} className="text-slate-400" />
                         Configurações rápidas
                       </button>
                     </div>
                   </>
                 )}
              </div>

              <div className="relative">
                 <button 
                   onClick={() => setIsManualOrderDropdownOpen(!isManualOrderDropdownOpen)}
                   className="h-10 px-5 bg-[#1a56db] text-white font-black text-[10px] uppercase italic rounded-[12px] flex items-center gap-2 hover:bg-[#1e40af] transition-all shadow-md shadow-blue-50 active:scale-95"
                 >
                    <Plus size={16} strokeWidth={4} /> Novo pedido <ChevronDown size={14} />
                 </button>
                 {isManualOrderDropdownOpen && (
                   <>
                     <div 
                       className="fixed inset-0 z-50" 
                       onClick={() => setIsManualOrderDropdownOpen(false)} 
                     />
                     <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-[100] py-2">
                       {[
                         { id: 'balcao', label: 'Balcão', icon: ShoppingBag },
                         { id: 'delivery', label: 'Delivery', icon: Truck },
                         { id: 'retirada', label: 'Retirada', icon: Package },
                         { id: 'mesa', label: 'Mesa', icon: UtensilsCrossed },
                       ].map((opt) => (
                         <button
                           key={opt.id}
                           onClick={() => {
                             if (!activeRegister) {
                               toast.error("O caixa está fechado! Abra o caixa para registrar pedidos.");
                               setIsManualOrderDropdownOpen(false);
                               return;
                             }
                             setNewOrderType(opt.id as any);
                             setNewOrderCustomerName("");
                             setNewOrderCustomerPhone("");
                             setNewOrderAddress("");
                             setNewOrderTableNumber("");
                             setNewOrderItems([]);
                             setNewOrderPaymentMethod("dinheiro");
                             setNewOrderNotes("");
                             setIsNewOrderModalOpen(true);
                             setIsManualOrderDropdownOpen(false);
                           }}
                           className="w-full px-4 py-2.5 text-left text-xs font-black uppercase italic text-slate-600 hover:bg-slate-50 hover:text-[#1a56db] flex items-center gap-3 transition-colors"
                         >
                           <opt.icon size={14} className="text-slate-400" />
                           {opt.label}
                         </button>
                       ))}
                     </div>
                   </>
                 )}
              </div>
            </div>
        </header>
          {renderTabContent()}

        <OrderDetailsPanel 
          order={selectedOrder}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onUpdateStatus={async (orderId, newStatus) => handleUpdateStatus(orderId, newStatus)}
        />

        <OrderPaymentPanel 
          order={orderForPayment}
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          onUpdateStatus={async ({ orderId, newStatus }) => handleUpdateStatus(orderId, newStatus)}
        />

        {/* 🔄 Overlay de carregamento do pedido completo */}
        <AnimatePresence>
          {isFetchingFullOrder && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-4"
            >
              <div className="relative">
                <RefreshCw size={40} className="text-[#1a56db] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="size-2 bg-[#1a56db] rounded-full animate-ping" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-black text-slate-800 uppercase italic tracking-tighter">Buscando detalhes</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest animate-pulse">Aguarde um instante...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isRegisterModalOpen && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 font-sans"
             >
               <motion.div 
                 initial={{ scale: 0.95, y: 20 }}
                 animate={{ scale: 1, y: 0 }}
                 exit={{ scale: 0.95, y: 20 }}
                 className={cn(
                   "bg-white rounded-3xl p-6 shadow-2xl w-full border border-slate-100 transition-all",
                   activeRegister ? "max-w-xl" : "max-w-md"
                 )}
               >
                 {!activeRegister ? (
                   <>
                     <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight mb-4 flex items-center gap-2">
                       <Wallet size={20} className="text-[#1a56db]" /> Abrir Caixa
                     </h3>

                     <div className="flex flex-col gap-2 mb-4">
                        <label className="text-slate-400 text-[10px] font-black uppercase italic tracking-wider">Operador</label>
                        <input 
                          type="text"
                          value={operatorName}
                          onChange={(e) => setOperatorName(e.target.value)}
                          className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-800 font-bold rounded-xl text-sm outline-none transition-all"
                          placeholder="Nome do Operador"
                        />
                     </div>
                     
                     <div className="flex flex-col gap-2 mb-4">
                        <label className="text-slate-400 text-[10px] font-black uppercase italic tracking-wider">Valor Inicial em Dinheiro</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">R$</span>
                           <input 
                             type="number"
                             step="0.01"
                             value={initialAmount}
                             onChange={(e) => setInitialAmount(e.target.value)}
                             className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-800 font-black rounded-xl text-sm outline-none transition-all"
                             placeholder="0,00"
                             autoFocus
                           />
                        </div>
                     </div>

                     <div className="flex flex-col gap-2 mb-6">
                        <label className="text-slate-400 text-[10px] font-black uppercase italic tracking-wider">Notas / Observações</label>
                        <textarea 
                          value={registerNotes}
                          onChange={(e) => setRegisterNotes(e.target.value)}
                          className="w-full h-20 p-3 bg-slate-50 border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-800 font-medium rounded-xl text-sm outline-none transition-all resize-none"
                          placeholder="Ex: Troco inicial, observações gerais..."
                        />
                     </div>

                     <div className="flex gap-3">
                        <button 
                          onClick={() => setIsRegisterModalOpen(false)}
                          className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-xs uppercase italic tracking-widest rounded-xl transition-all"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleOpenRegister}
                          className="flex-1 h-11 bg-[#1a56db] hover:bg-[#1e40af] text-white font-black text-xs uppercase italic tracking-widest rounded-xl transition-all shadow-lg shadow-blue-100"
                        >
                          Abrir Caixa
                        </button>
                     </div>
                   </>
                 ) : (
                   <div className="space-y-6">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Wallet size={20} className="text-emerald-500" />
                         <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight">
                           Painel do Caixa
                         </h3>
                         <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase italic px-1.5 py-0.5 rounded border border-emerald-100">
                           Aberto
                         </span>
                       </div>
                       <button
                         onClick={() => setIsRegisterModalOpen(false)}
                         className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                       >
                         <X size={18} />
                       </button>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                       <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Valor Inicial</span>
                         <span className="text-sm font-black text-slate-700 mt-0.5">R$ {Number(activeRegister.initialAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                       </div>
                       <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Vendas (Dinheiro)</span>
                         <span className="text-sm font-black text-emerald-600 mt-0.5">+ R$ {cashSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                       </div>
                       <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Vendas (PIX)</span>
                         <span className="text-sm font-black text-emerald-600 mt-0.5">+ R$ {pixSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                       </div>
                       <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Vendas (Débito)</span>
                         <span className="text-sm font-black text-emerald-600 mt-0.5">+ R$ {debitSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                       </div>
                       <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Vendas (Crédito)</span>
                         <span className="text-sm font-black text-emerald-600 mt-0.5">+ R$ {creditSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                       </div>
                       <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Suprimentos</span>
                         <span className="text-sm font-black text-blue-600 mt-0.5">+ R$ {suprimentosAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                       </div>
                       <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Sangrias</span>
                         <span className="text-sm font-black text-red-500 mt-0.5">- R$ {sangriasAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                       </div>
                       <div className="col-span-2 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                         <div className="flex flex-col">
                           <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic">Saldo Atual do Caixa (Dinheiro)</span>
                           <span className="text-lg font-black text-emerald-700 mt-0.5">R$ {calculatedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                         </div>
                         <div className="text-[9px] font-bold text-slate-500 italic text-right leading-normal">
                           Operador: <b>{activeRegister.operator_name || 'Operador'}</b><br />
                           Aberto às {new Date(activeRegister.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                         </div>
                       </div>
                     </div>

                     <div className="flex border-b border-slate-100">
                       <button
                         onClick={() => setCashTab('operacoes')}
                         className={cn(
                           "flex-1 pb-3 text-[10px] font-black uppercase italic tracking-widest border-b-2 transition-all",
                           cashTab === 'operacoes' ? "border-[#1a56db] text-[#1a56db]" : "border-transparent text-slate-400 hover:text-slate-600"
                         )}
                       >
                         Lançamento
                       </button>
                       <button
                         onClick={() => setCashTab('historico')}
                         className={cn(
                           "flex-1 pb-3 text-[10px] font-black uppercase italic tracking-widest border-b-2 transition-all",
                           cashTab === 'historico' ? "border-[#1a56db] text-[#1a56db]" : "border-transparent text-slate-400 hover:text-slate-600"
                         )}
                       >
                         Histórico
                       </button>
                     </div>

                     {cashTab === 'operacoes' ? (
                       <div className="space-y-4">
                         <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                           <button
                             type="button"
                             onClick={() => setOpType('suprimento')}
                             className={cn(
                               "flex-1 py-2 rounded-lg font-black text-[9px] uppercase italic tracking-wider transition-all",
                               opType === 'suprimento' ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                             )}
                           >
                             Suprimento (Entrada)
                           </button>
                           <button
                             type="button"
                             onClick={() => setOpType('sangria')}
                             className={cn(
                               "flex-1 py-2 rounded-lg font-black text-[9px] uppercase italic tracking-wider transition-all",
                               opType === 'sangria' ? "bg-white text-red-500 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                             )}
                           >
                             Sangria (Retirada)
                           </button>
                         </div>

                         <div className="grid grid-cols-3 gap-3">
                           <div className="col-span-1 flex flex-col gap-1.5">
                             <label className="text-slate-400 text-[9px] font-black uppercase italic tracking-wider">Valor</label>
                             <div className="relative">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                               <input
                                 type="number"
                                 step="0.01"
                                 placeholder="0,00"
                                 value={opAmount}
                                 onChange={(e) => setOpAmount(e.target.value)}
                                 className="w-full h-10 pl-8 pr-2 bg-slate-50 border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-800 font-black rounded-xl text-xs outline-none transition-all"
                               />
                             </div>
                           </div>
                           <div className="col-span-2 flex flex-col gap-1.5">
                             <label className="text-slate-400 text-[9px] font-black uppercase italic tracking-wider">Descrição / Motivo</label>
                             <input
                               type="text"
                               placeholder="Ex: Troco para caixa, Sangria..."
                               value={opDescription}
                               onChange={(e) => setOpDescription(e.target.value)}
                               className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-800 font-bold rounded-xl text-xs outline-none transition-all placeholder:text-slate-300"
                             />
                           </div>
                         </div>

                         <Button
                           type="button"
                           onClick={handleCreateTransaction}
                           className={cn(
                             "w-full h-10 font-black text-[10px] uppercase italic tracking-widest rounded-xl transition-all shadow-md gap-2",
                             opType === 'suprimento' ? "bg-[#1a56db] hover:bg-[#1e40af] text-white shadow-blue-100" : "bg-red-500 hover:bg-red-600 text-white shadow-red-100"
                           )}
                         >
                           Registrar {opType === 'suprimento' ? 'Suprimento' : 'Sangria'}
                         </Button>
                       </div>
                     ) : (
                       <ScrollArea className="h-[200px] border border-slate-100 rounded-2xl bg-slate-50/50 p-3">
                         {transactions.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                             <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-wider">Nenhuma movimentação</span>
                             <span className="text-[9px] text-slate-400 mt-1">Lançamentos de sangria e suprimento aparecerão aqui</span>
                           </div>
                         ) : (
                           <div className="space-y-2">
                             {transactions.map((tx) => (
                               <div key={tx.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                                 <div className="flex flex-col min-w-0">
                                   <span className="text-[10px] font-bold text-slate-700 truncate">{tx.description}</span>
                                   <span className="text-[8px] font-semibold text-slate-400 mt-0.5">
                                     {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                   </span>
                                 </div>
                                 <span className={cn(
                                   "text-[11px] font-black italic tracking-tight whitespace-nowrap shrink-0",
                                   tx.type === 'suprimento' ? "text-blue-600" : "text-red-500"
                                 )}>
                                   {tx.type === 'suprimento' ? '+' : '-'} R$ {Number(tx.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                 </span>
                               </div>
                             ))}
                           </div>
                         )}
                       </ScrollArea>
                     )}

                     <div className="pt-4 border-t border-slate-100">
                       {!isClosingConfirmOpen ? (
                         <Button
                           onClick={() => {
                             setIsClosingConfirmOpen(true);
                             setClosingAmount(calculatedAmount.toFixed(2));
                           }}
                           className="w-full h-11 bg-red-50 hover:bg-red-100 text-red-500 font-black text-xs uppercase italic tracking-widest rounded-xl transition-all border border-red-100"
                         >
                           Fechar Caixa
                         </Button>
                       ) : (
                         <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 space-y-4 text-left">
                           <h4 className="text-xs font-black text-red-600 uppercase italic tracking-wider flex items-center gap-1.5">
                             ⚠️ Confirmar Fechamento
                           </h4>

                           {/* Resumo de Fechamento */}
                           <div className="bg-white/85 rounded-2xl p-4 border border-red-100/50 text-[10px] font-sans text-slate-600 space-y-2">
                             <div className="flex justify-between">
                               <span>Valor Inicial (Dinheiro):</span>
                               <span className="font-bold text-slate-800">R$ {Number(activeRegister.initialAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Vendas (Dinheiro):</span>
                               <span className="font-bold text-emerald-600">+ R$ {cashSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Vendas (PIX):</span>
                               <span className="font-bold text-slate-800">+ R$ {pixSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Vendas (Débito):</span>
                               <span className="font-bold text-slate-800">+ R$ {debitSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Vendas (Crédito):</span>
                               <span className="font-bold text-slate-800">+ R$ {creditSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Suprimentos:</span>
                               <span className="font-bold text-blue-600">+ R$ {suprimentosAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Sangrias:</span>
                               <span className="font-bold text-red-500">- R$ {sangriasAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="border-t border-slate-100 my-1 pt-1 flex justify-between text-xs font-black text-slate-800">
                               <span>Dinheiro Esperado em Caixa:</span>
                               <span>R$ {calculatedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                             </div>
                           </div>

                           <div className="flex flex-col gap-1.5">
                             <label className="text-slate-400 text-[9px] font-black uppercase italic tracking-wider">Valor Físico no Caixa</label>
                             <div className="relative">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                               <input
                                 type="number"
                                 step="0.01"
                                 placeholder="0,00"
                                 value={closingAmount}
                                 onChange={(e) => setClosingAmount(e.target.value)}
                                 className="w-full h-10 pl-8 pr-2 bg-white border border-slate-200 focus:border-red-500 focus:ring-2 ring-red-100 text-slate-800 font-black rounded-xl text-xs outline-none transition-all"
                                 autoFocus
                                />
                             </div>
                           </div>
                           <div className="flex gap-2">
                             <button
                               onClick={() => setIsClosingConfirmOpen(false)}
                               className="flex-1 h-9 bg-white border border-slate-200 text-slate-500 font-black text-[9px] uppercase italic tracking-wider rounded-lg hover:bg-slate-50 transition-colors"
                             >
                               Voltar
                             </button>
                             <button
                               onClick={handleCloseRegister}
                               className="flex-1 h-9 bg-red-500 text-white font-black text-[9px] uppercase italic tracking-wider rounded-lg hover:bg-red-600 transition-colors shadow-md shadow-red-100"
                             >
                               Confirmar Fechamento
                             </button>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 )}
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>

        {/* ⏰ Modal de Horários do Cardápio Digital */}
        <AnimatePresence>
          {isSchedulerModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 font-sans"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md border border-slate-100 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="text-[#1a56db]" size={20} />
                    <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight">Horários do Cardápio</h3>
                  </div>
                  <button 
                    onClick={() => setIsSchedulerModalOpen(false)}
                    className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {(() => {
                  const statusInfo = getStoreStatus(settings)
                  const statusColors = {
                    OPEN: "bg-emerald-50 text-emerald-600 border-emerald-200",
                    PAUSED: "bg-orange-50 text-orange-600 border-orange-200",
                    CLOSED: "bg-red-50 text-red-600 border-red-200",
                    OUTSIDE_HOURS: "bg-slate-50 text-slate-600 border-slate-200",
                    CLOSED_TODAY: "bg-slate-50 text-slate-600 border-slate-200"
                  }
                  const colorClass = statusColors[statusInfo.status] || "bg-slate-50 text-slate-600 border-slate-200"
                  
                  return (
                    <div className={cn("p-4 rounded-2xl border flex flex-col gap-1", colorClass)}>
                      <span className="text-[10px] font-black uppercase tracking-wider italic">Status do Estabelecimento</span>
                      <span className="text-sm font-black uppercase italic">{statusInfo.message}</span>
                      <span className="text-[10px] opacity-80 font-semibold leading-relaxed mt-0.5">{statusInfo.reason}</span>
                    </div>
                  )
                })()}

                <div className="space-y-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic block">Canais de Atendimento</span>
                  
                  {[
                    { key: 'delivery_enabled', label: 'Delivery / Entrega', desc: 'Permite pedidos para entrega' },
                    { key: 'pickup_enabled', label: 'Retirada / Balcão', desc: 'Permite pedidos para buscar na loja' },
                    { key: 'dinein_enabled', label: 'Consumo Local / Mesas', desc: 'Permite pedidos nas mesas' },
                  ].map((service) => (
                    <div key={service.key} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-100 transition-all">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{service.label}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{service.desc}</span>
                      </div>
                      <Switch 
                        checked={settings?.[service.key] !== false}
                        onCheckedChange={async (checked) => {
                          await updateSettings({ [service.key]: checked })
                        }}
                        className="data-[state=checked]:bg-[#1a56db]"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic block">Forçar Status do Cardápio</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={async () => {
                        await updateSettings({
                          is_manual_override: true,
                          manual_status: 'open'
                        })
                      }}
                      className={cn(
                        "h-10 rounded-xl font-black text-[9px] uppercase italic tracking-wider border transition-all",
                        settings?.is_manual_override && settings?.manual_status === 'open'
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm"
                          : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      Forçar Aberto 🟢
                    </button>
                    <button
                      onClick={async () => {
                        await updateSettings({
                          is_manual_override: true,
                          manual_status: 'paused'
                        })
                      }}
                      className={cn(
                        "h-10 rounded-xl font-black text-[9px] uppercase italic tracking-wider border transition-all",
                        settings?.is_manual_override && settings?.manual_status === 'paused'
                          ? "bg-orange-50 border-orange-200 text-orange-600 shadow-sm"
                          : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      Pausar Agora 🟠
                    </button>
                    <button
                      onClick={async () => {
                        await updateSettings({
                          is_manual_override: true,
                          manual_status: 'closed'
                        })
                      }}
                      className={cn(
                        "h-10 rounded-xl font-black text-[9px] uppercase italic tracking-wider border transition-all col-span-2",
                        settings?.is_manual_override && settings?.manual_status === 'closed'
                          ? "bg-red-50 border-red-200 text-red-600 shadow-sm"
                          : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      Forçar Fechado 🔴
                    </button>
                  </div>

                  {settings?.is_manual_override && (
                    <button
                      onClick={async () => {
                        await updateSettings({
                          is_manual_override: false,
                          manual_status: null
                        })
                      }}
                      className="w-full h-10 mt-1 bg-blue-50 border border-blue-100 text-[#1a56db] font-black text-[9px] uppercase italic tracking-widest rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      Voltar ao Horário Automático
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🛍️ Modal Novo Pedido Manual */}
        <AnimatePresence>
          {isNewOrderModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 font-sans"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-4xl max-h-[90vh] border border-slate-100 flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <Plus className="text-[#1a56db]" size={20} />
                    <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight">
                      Novo Pedido Manual — {newOrderType === 'balcao' ? 'Balcão' : newOrderType === 'delivery' ? 'Delivery' : newOrderType === 'retirada' ? 'Retirada' : 'Mesa'}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setIsNewOrderModalOpen(false)}
                    className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 grid grid-cols-1 md:grid-cols-2 gap-6 pr-1">
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-50 pb-2">1. Informações do Cliente</h4>
                    
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-500 text-[10px] font-black uppercase italic tracking-wider">Nome do Cliente *</label>
                        <Input 
                          placeholder="Ex: Maria Oliveira"
                          value={newOrderCustomerName}
                          onChange={(e) => setNewOrderCustomerName(e.target.value)}
                          className="h-10 text-xs font-semibold rounded-xl border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-700 bg-slate-50/50"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-500 text-[10px] font-black uppercase italic tracking-wider">Telefone / WhatsApp *</label>
                        <Input 
                          placeholder="Ex: 11999998888"
                          value={newOrderCustomerPhone}
                          onChange={(e) => setNewOrderCustomerPhone(e.target.value)}
                          className="h-10 text-xs font-semibold rounded-xl border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-700 bg-slate-50/50"
                        />
                      </div>

                      {newOrderType === 'delivery' && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-500 text-[10px] font-black uppercase italic tracking-wider">Endereço Completo de Entrega *</label>
                          <Input 
                            placeholder="Rua, Número, Bairro, Cidade..."
                            value={newOrderAddress}
                            onChange={(e) => setNewOrderAddress(e.target.value)}
                            className="h-10 text-xs font-semibold rounded-xl border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-700 bg-slate-50/50"
                          />
                        </div>
                      )}

                      {newOrderType === 'mesa' && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-500 text-[10px] font-black uppercase italic tracking-wider">Mesa Selecionada *</label>
                          {tables.length > 0 ? (
                            <select
                              value={newOrderTableNumber}
                              onChange={(e) => setNewOrderTableNumber(e.target.value)}
                              className="h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-700 bg-slate-50/50 outline-none"
                            >
                              <option value="">Selecione uma mesa...</option>
                              {tables.map((t) => (
                                <option key={t.id} value={t.table_number}>Mesa {t.table_number} ({t.status === 'free' ? 'Livre' : t.status === 'occupied' ? 'Ocupada' : 'Fechamento Pendente'})</option>
                              ))}
                            </select>
                          ) : (
                            <Input 
                              placeholder="Digite o número da mesa (ex: 12)"
                              value={newOrderTableNumber}
                              onChange={(e) => setNewOrderTableNumber(e.target.value)}
                              className="h-10 text-xs font-semibold rounded-xl border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-700 bg-slate-50/50"
                            />
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-500 text-[10px] font-black uppercase italic tracking-wider">Observações do Pedido (Opcional)</label>
                        <textarea 
                          placeholder="Observações gerais para a cozinha ou entrega..."
                          value={newOrderNotes}
                          onChange={(e) => setNewOrderNotes(e.target.value)}
                          className="h-20 p-3 text-xs font-semibold rounded-xl border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-700 bg-slate-50/50 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 flex flex-col h-full">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-50 pb-2">2. Itens do Pedido</h4>
                    
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-500 text-[9px] font-black uppercase italic tracking-wider">Buscar Produto</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                          <Input 
                            placeholder="Digite o nome do produto..."
                            value={newOrderSearchProduct}
                            onChange={(e) => setNewOrderSearchProduct(e.target.value)}
                            className="h-9 pl-9 text-xs font-semibold rounded-xl border-slate-200 focus:border-[#1a56db] text-slate-700 bg-white"
                          />
                        </div>
                      </div>

                      {newOrderSearchProduct && (
                        <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-xl bg-white divide-y divide-slate-50 shadow-inner">
                          {products
                            .filter((p: any) => p.active !== false && p.name.toLowerCase().includes(newOrderSearchProduct.toLowerCase()))
                            .map((p: any) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedProductToAdd(p)
                                  setProductAddQty(1)
                                  setProductAddObs("")
                                  setNewOrderSearchProduct("")
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                              >
                                <span className="font-bold text-slate-700">{p.name}</span>
                                <span className="font-black text-slate-600">R$ {Number(p.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </button>
                            ))
                          }
                        </div>
                      )}

                      {selectedProductToAdd && (
                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-[#1a56db] uppercase italic truncate">{selectedProductToAdd.name}</span>
                            <button 
                              onClick={() => setSelectedProductToAdd(null)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden h-8">
                              <button 
                                type="button"
                                onClick={() => setProductAddQty(Math.max(1, productAddQty - 1))}
                                className="px-2 h-full text-slate-500 hover:bg-slate-50 font-bold"
                              >
                                -
                              </button>
                              <span className="px-3 text-xs font-black text-slate-700">{productAddQty}</span>
                              <button 
                                type="button"
                                onClick={() => setProductAddQty(productAddQty + 1)}
                                className="px-2 h-full text-slate-500 hover:bg-slate-50 font-bold"
                              >
                                +
                              </button>
                            </div>

                            <input 
                              placeholder="Observação (sem cebola, etc.)"
                              value={productAddObs}
                              onChange={(e) => setProductAddObs(e.target.value)}
                              className="flex-1 h-8 px-2 border border-slate-200 rounded-lg text-xs font-semibold outline-none bg-white placeholder:text-slate-300"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                const existsIndex = newOrderItems.findIndex(i => i.productId === selectedProductToAdd.id)
                                if (existsIndex > -1) {
                                  const updated = [...newOrderItems]
                                  updated[existsIndex].quantity += productAddQty
                                  if (productAddObs) {
                                    updated[existsIndex].observation = (updated[existsIndex].observation ? updated[existsIndex].observation + ", " : "") + productAddObs
                                  }
                                  setNewOrderItems(updated)
                                } else {
                                  setNewOrderItems([...newOrderItems, {
                                    productId: selectedProductToAdd.id,
                                    name: selectedProductToAdd.name,
                                    price: selectedProductToAdd.price,
                                    quantity: productAddQty,
                                    observation: productAddObs
                                  }])
                                }
                                setSelectedProductToAdd(null)
                              }}
                              className="h-8 px-3 bg-[#1a56db] text-white text-[10px] font-black uppercase italic rounded-lg hover:bg-[#1e40af]"
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 border border-slate-100 rounded-2xl p-3 bg-slate-50/50 min-h-[140px] flex flex-col justify-between">
                      {newOrderItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10">
                          <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-wider">Nenhum item adicionado</span>
                          <span className="text-[9px] text-slate-400 mt-1">Busque e adicione produtos acima</span>
                        </div>
                      ) : (
                        <div className="space-y-2 overflow-y-auto max-h-[160px] pr-1">
                          {newOrderItems.map((item, idx) => (
                            <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-slate-700">{item.quantity}x {item.name}</span>
                                {item.observation && (
                                  <span className="text-[9px] text-slate-400 italic font-semibold mt-0.5">Obs: {item.observation}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-black text-slate-600">R$ {Number(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <button 
                                  onClick={() => setNewOrderItems(newOrderItems.filter((_, i) => i !== idx))}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-1 bg-white p-3 rounded-xl border border-slate-100">
                        {(() => {
                          const subtotal = newOrderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
                          const fee = newOrderType === 'delivery' ? (settings?.delivery_fee || 0) : 0
                          const total = subtotal + fee
                          
                          return (
                            <>
                              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                <span>Subtotal</span>
                                <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              {newOrderType === 'delivery' && (
                                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                  <span>Taxa de Entrega</span>
                                  <span>R$ {fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-xs font-black text-slate-800 border-t border-slate-100 pt-1 mt-1">
                                <span>Total</span>
                                <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </div>

                    <div className="space-y-1.5 shrink-0">
                      <label className="text-slate-500 text-[9px] font-black uppercase italic tracking-wider">Forma de Pagamento</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'dinheiro', label: 'Dinheiro' },
                          { id: 'pix', label: 'Pix' },
                          { id: 'cartao_credito', label: 'C. Crédito' },
                          { id: 'cartao_debito', label: 'C. Débito' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setNewOrderPaymentMethod(m.id)}
                            className={cn(
                              "h-9 rounded-xl text-[9px] font-black uppercase italic border transition-all",
                              newOrderPaymentMethod === m.id
                                ? "bg-[#1a56db] text-white border-[#1a56db] shadow-sm shadow-blue-100"
                                : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                            )}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex gap-3 shrink-0">
                  <button 
                    onClick={() => setIsNewOrderModalOpen(false)}
                    className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-xs uppercase italic tracking-widest rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={async () => {
                      if (!newOrderCustomerName || !newOrderCustomerPhone) {
                        toast.error("Nome e telefone do cliente são obrigatórios")
                        return
                      }
                      if (newOrderType === 'delivery' && !newOrderAddress) {
                        toast.error("O endereço de entrega é obrigatório")
                        return
                      }
                      if (newOrderType === 'mesa' && !newOrderTableNumber) {
                        toast.error("O número da mesa é obrigatório")
                        return
                      }
                      if (newOrderItems.length === 0) {
                        toast.error("Adicione pelo menos um item ao pedido")
                        return
                      }

                      try {
                        const subtotal = newOrderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
                        const fee = newOrderType === 'delivery' ? (settings?.delivery_fee || 0) : 0
                        const total = subtotal + fee

                        const response = await fetch('/api/orders', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            tenant_id: companyId,
                            customer: {
                              name: newOrderCustomerName,
                              phone: newOrderCustomerPhone,
                              email: `${newOrderCustomerPhone}@docegestao.com`
                            },
                            address: {
                              street: newOrderType === 'delivery' ? newOrderAddress : 'Retirada em balcão',
                              number: 'S/N',
                              neighborhood: '',
                              city: settings?.city || 'Local',
                              complement: '',
                              zip: ''
                            },
                            items: newOrderItems.map(i => ({
                              name: i.name,
                              price: i.price,
                              quantity: i.quantity,
                              observation: i.observation
                            })),
                            payment: {
                              method: newOrderPaymentMethod,
                              needs_change: false,
                              change_for: 0
                            },
                            totals: {
                              subtotal,
                              delivery_fee: fee,
                              total
                            },
                            order_type: newOrderType === 'mesa' ? 'mesa' : newOrderType,
                            notes: newOrderNotes
                          })
                        })

                        const result = await response.json()

                        if (response.ok && !result.error) {
                          toast.success("Pedido manual registrado com sucesso!")
                          setIsNewOrderModalOpen(false)
                          refetch()
                        } else {
                          toast.error("Erro ao salvar pedido: " + (result.error || "Erro desconhecido"))
                        }
                      } catch (e: any) {
                        toast.error("Erro ao registrar pedido: " + e.message)
                      }
                    }}
                    className="flex-1 h-11 bg-[#1a56db] hover:bg-[#1e40af] text-white font-black text-xs uppercase italic tracking-widest rounded-xl transition-all shadow-lg shadow-blue-100"
                  >
                    Registrar Pedido
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🍽️ Table Action Drawer */}
        <AnimatePresence>
          {isActionModalOpen && selectedTableForAction && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/35 z-40 backdrop-blur-[1px]"
                onClick={() => setIsActionModalOpen(false)}
              />

              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed right-0 top-0 bottom-0 w-[400px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden font-sans border-l border-slate-100"
              >
                {/* Header */}
                {(() => {
                  const linkedOrder = getTableActiveOrder(selectedTableForAction.table_number)
                  
                  return (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white shrink-0 gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-black text-slate-800 text-sm uppercase italic truncate">
                          {selectedTableForAction.table_number}
                        </span>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 relative">
                        {linkedOrder && (
                          <>
                            <button
                              onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                              className={cn(
                                "h-7 px-2.5 rounded-lg border text-[9px] font-black uppercase italic tracking-wider transition-all",
                                isEditingCustomer 
                                  ? "bg-slate-100 border-slate-200 text-slate-700" 
                                  : "bg-blue-50 border-blue-100 text-[#1a56db] hover:bg-blue-100/50"
                              )}
                            >
                              {isEditingCustomer ? "Cancelar" : "Editar"}
                            </button>
                            
                            <button
                              onClick={() => handlePrintPreBill(linkedOrder, selectedTableForAction.table_number)}
                              className="h-7 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-[9px] font-black uppercase italic tracking-wider transition-all flex items-center gap-1"
                            >
                              <Printer size={10} /> Imprimir
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
                          className="h-7 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-[9px] font-black uppercase italic tracking-wider transition-all flex items-center gap-1"
                        >
                          Mais opções <ChevronDown size={10} />
                        </button>

                        {isMoreOptionsOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsMoreOptionsOpen(false)} />
                            <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1.5">
                              {!selectedTableForAction.table_number.toLowerCase().includes('comanda') && (
                                <>
                                  <button
                                    onClick={async () => {
                                      setIsMoreOptionsOpen(false)
                                      await handleUpdateTableStatus(selectedTableForAction.id, 'blocked')
                                      setIsActionModalOpen(false)
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-[10px] font-black uppercase italic text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors flex items-center gap-2"
                                  >
                                    <Lock size={12} /> Bloquear Mesa
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setIsMoreOptionsOpen(false)
                                      await handleUpdateTableStatus(selectedTableForAction.id, 'reserved')
                                      setIsActionModalOpen(false)
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-[10px] font-black uppercase italic text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                                  >
                                    <Calendar size={12} /> Reservar Mesa
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setIsMoreOptionsOpen(false)
                                      await handleUpdateTableStatus(selectedTableForAction.id, 'free')
                                      setIsActionModalOpen(false)
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-[10px] font-black uppercase italic text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors flex items-center gap-2"
                                  >
                                    <Unlock size={12} /> Liberar Mesa
                                  </button>
                                </>
                              )}
                              {linkedOrder && (
                                <button
                                  onClick={() => {
                                    setIsMoreOptionsOpen(false)
                                    handleCancelOrder(linkedOrder, selectedTableForAction)
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-[10px] font-black uppercase italic text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-slate-50"
                                >
                                  <Trash2 size={12} /> Cancelar Conta
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => setIsActionModalOpen(false)} 
                        className="size-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 shrink-0"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )
                })()}

                {/* Waiter calls alert if any */}
                {waiterCalls.some(c => c.table_number === selectedTableForAction.table_number) && (
                  <div className="bg-red-50 border-b border-red-100 px-4 py-2.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-bold animate-bounce">🔔</span>
                      <span className="text-[10px] font-black text-red-800 uppercase italic">Chamando Garçom!</span>
                    </div>
                    <button
                      onClick={() => handleResolveWaiterCall(selectedTableForAction.table_number)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-[8px] font-black uppercase italic tracking-wider hover:bg-red-700 transition-colors"
                    >
                      Atender
                    </button>
                  </div>
                )}

                {/* Main Viewport Content */}
                {(() => {
                  const linkedOrder = getTableActiveOrder(selectedTableForAction.table_number)
                  
                  if (!linkedOrder) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                        <div className="size-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100">
                          <UtensilsCrossed size={28} />
                        </div>
                        <h4 className="text-xs font-black text-slate-800 uppercase italic tracking-wider mb-1">Serviço Livre</h4>
                        <p className="text-[10px] text-slate-400 font-bold italic mb-6">Limpo e disponível para registrar consumos.</p>
                        
                        <div className="w-full space-y-2 max-w-[260px]">
                          <button
                            onClick={() => handleOpenTableComanda(selectedTableForAction)}
                            className="w-full h-11 bg-[#16a34a] hover:bg-[#15803d] text-white font-black text-xs uppercase italic tracking-widest rounded-xl transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                          >
                            🍳 ABRIR NOVA COMANDA
                          </button>
                          
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => handleUpdateTableStatus(selectedTableForAction.id, 'reserved')}
                              className="h-9 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 font-black text-[9px] uppercase italic tracking-widest rounded-lg transition-all"
                            >
                              📅 Reservar
                            </button>
                            <button
                              onClick={() => handleDeleteTable(selectedTableForAction)}
                              className="h-9 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 font-black text-[9px] uppercase italic tracking-widest rounded-lg transition-all"
                            >
                              🗑️ Excluir Mesa
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  const subtotal = Number(linkedOrder.subtotal || 0)
                  const feePct = applyServiceFee ? 10 : 0
                  const serviceFee = (subtotal * feePct) / 100
                  const disc = parseFloat(closingDiscount) || 0
                  const total = subtotal + serviceFee - disc
                  const elapsedTime = formatElapsedTime(linkedOrder.createdAt)

                  const totalPaid = (
                    (parseFloat(paymentInputs.pix) || 0) +
                    (parseFloat(paymentInputs.dinheiro) || 0) +
                    (parseFloat(paymentInputs.cartao_credito) || 0) +
                    (parseFloat(paymentInputs.cartao_debito) || 0) +
                    (parseFloat(paymentInputs.voucher) || 0)
                  )
                  const remainingBalance = Math.max(0, total - totalPaid)
                  const changeDue = Math.max(0, totalPaid - total)

                  const fillFullRemaining = (key: keyof typeof paymentInputs) => {
                    setPaymentInputs(prev => {
                      const currentPaid = Object.entries(prev)
                        .filter(([k]) => k !== key)
                        .reduce((sum, [, val]) => sum + (parseFloat(val) || 0), 0)
                      const left = Math.max(0, total - currentPaid)
                      return {
                        ...prev,
                        [key]: left > 0 ? left.toFixed(2) : ""
                      }
                    })
                  }

                  return (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Back to Details / Action Tab indicator if not in details */}
                      {actionTab !== 'details' && (
                        <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between shrink-0">
                          <button 
                            onClick={() => setActionTab('details')}
                            className="text-[10px] font-black text-[#1a56db] uppercase italic flex items-center gap-1"
                          >
                            ← Voltar para Consumo
                          </button>
                          <span className="text-[9px] font-bold text-slate-400 uppercase italic">
                            {actionTab === 'transfer' ? 'Transferir' : actionTab === 'merge' ? 'Juntar' : actionTab === 'split' ? 'Dividir' : 'Fechar'}
                          </span>
                        </div>
                      )}

                      {/* Content Panels */}
                      <div className="flex-1 flex flex-col overflow-hidden">
                        
                        {isCatalogOpen ? (
                          <div className="flex-1 flex flex-col overflow-hidden h-full p-4">
                            {/* Catalog Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 shrink-0">
                              <button
                                onClick={() => {
                                  setIsCatalogOpen(false)
                                  setCatalogConfigProduct(null)
                                }}
                                className="text-xs font-black text-[#1a56db] uppercase italic flex items-center gap-1"
                              >
                                ← Voltar
                              </button>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                Adicionar Itens
                              </span>
                            </div>

                            {catalogConfigProduct ? (
                              /* Product Configuration Overlay inside Catalog */
                              <div className="flex-1 flex flex-col justify-center items-center p-4 text-center bg-blue-50/25 rounded-2xl border border-blue-100/50 space-y-4 overflow-y-auto">
                                <div className="text-center">
                                  <h4 className="font-black text-sm text-[#1a56db] uppercase italic tracking-wide">
                                    {catalogConfigProduct.name}
                                  </h4>
                                  {catalogConfigProduct.description && (
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 max-w-[240px]">
                                      {catalogConfigProduct.description}
                                    </p>
                                  )}
                                  <span className="text-xs font-black text-slate-700 block mt-2">
                                    R$ {Number(catalogConfigProduct.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>

                                <div className="w-full max-w-[240px] space-y-3">
                                  <div className="flex flex-col gap-1 items-start">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Quantidade</label>
                                    <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden h-10 w-full justify-between shadow-sm">
                                      <button 
                                        type="button"
                                        onClick={() => setCatalogQty(Math.max(1, catalogQty - 1))}
                                        className="w-12 h-full text-slate-500 hover:bg-slate-50 font-bold text-lg"
                                      >
                                        -
                                      </button>
                                      <span className="text-sm font-black text-slate-700">{catalogQty}</span>
                                      <button 
                                        type="button"
                                        onClick={() => setCatalogQty(catalogQty + 1)}
                                        className="w-12 h-full text-slate-500 hover:bg-slate-50 font-bold text-lg"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1 items-start">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Observações</label>
                                    <input 
                                      placeholder="Ex: Sem cebola, bem passado..."
                                      value={catalogObs}
                                      onChange={(e) => setCatalogObs(e.target.value)}
                                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none bg-white focus:ring-1 focus:ring-blue-100 shadow-sm"
                                    />
                                  </div>

                                  <div className="flex gap-2 pt-2">
                                    <button
                                      type="button"
                                      onClick={() => setCatalogConfigProduct(null)}
                                      className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-black uppercase italic tracking-wider rounded-xl transition-all"
                                    >
                                      Voltar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await handleAddProductToTableComanda(linkedOrder, catalogConfigProduct, catalogQty, catalogObs)
                                        setIsCatalogOpen(false)
                                        setCatalogConfigProduct(null)
                                      }}
                                      className="flex-1 h-10 bg-[#1a56db] text-white text-[10px] font-black uppercase italic tracking-wider rounded-xl hover:bg-[#1e40af] transition-all shadow-md shadow-blue-100"
                                    >
                                      Confirmar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Products List & Search/Categories Selector */
                              <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                                {/* Search */}
                                <div className="relative shrink-0">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                  <Input 
                                    placeholder="Buscar produto pelo nome..."
                                    value={catalogSearchQuery}
                                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                                    className="h-10 pl-9 text-xs font-semibold rounded-xl border-slate-200 focus:border-[#1a56db] text-slate-700 bg-white"
                                  />
                                </div>

                                {/* Categories Selector */}
                                <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none shrink-0 select-none">
                                  {categories.map((cat) => (
                                    <button
                                      key={cat}
                                      onClick={() => setCatalogSelectedCategory(cat)}
                                      className={cn(
                                        "h-7 px-3 rounded-full text-[9px] font-black uppercase italic tracking-wider border transition-all whitespace-nowrap",
                                        catalogSelectedCategory === cat
                                          ? "bg-[#1a56db] text-white border-blue-600 shadow-sm"
                                          : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                                      )}
                                    >
                                      {cat}
                                    </button>
                                  ))}
                                </div>

                                {/* Products Grid/List */}
                                <ScrollArea className="flex-1 border border-slate-100 rounded-2xl bg-slate-50/50 p-2">
                                  {(() => {
                                    const filtered = products
                                      .filter((p: any) => p.active !== false)
                                      .filter((p: any) => {
                                        if (catalogSelectedCategory === "Tudo") return true
                                        return p.category === catalogSelectedCategory
                                      })
                                      .filter((p: any) => {
                                        if (!catalogSearchQuery) return true
                                        return p.name.toLowerCase().includes(catalogSearchQuery.toLowerCase())
                                      })

                                    if (filtered.length === 0) {
                                      return (
                                        <div className="py-20 text-center text-slate-400 font-bold italic text-[10px] uppercase">
                                          Nenhum produto encontrado
                                        </div>
                                      )
                                    }

                                    return (
                                      <div className="space-y-1.5">
                                        {filtered.map((p: any) => (
                                          <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => {
                                              setCatalogConfigProduct(p)
                                              setCatalogQty(1)
                                              setCatalogObs("")
                                            }}
                                            className="w-full p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-blue-50/30 flex items-center justify-between text-xs transition-all text-left shadow-sm active:scale-[0.99]"
                                          >
                                            <div className="flex flex-col min-w-0">
                                              <span className="font-bold text-slate-700 truncate">{p.name}</span>
                                              <span className="text-[8px] text-slate-400 font-black uppercase italic tracking-wider mt-0.5">{p.category}</span>
                                            </div>
                                            <span className="font-black text-slate-600 shrink-0 ml-2">
                                              R$ {Number(p.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    )
                                  })()}
                                </ScrollArea>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
                            
                            {actionTab === 'details' && (
                              <div className="flex flex-col overflow-hidden flex-1 space-y-4">
                                {isEditingCustomer ? (
                                  /* Customer Data Edit Form */
                                  <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 text-xs text-slate-700 space-y-3 shrink-0 shadow-sm">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-100/60 pb-1.5">Editar Dados do Cliente</span>
                                    
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Nome</span>
                                      <Input
                                        placeholder="Nome do Cliente..."
                                        value={customerNameInput}
                                        onChange={(e) => setCustomerNameInput(e.target.value)}
                                        className="h-8 text-xs font-semibold rounded-xl bg-white border-slate-200 focus:ring-1 focus:ring-blue-100"
                                      />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Telefone</span>
                                      <Input
                                        placeholder="Telefone..."
                                        value={customerPhoneInput}
                                        onChange={(e) => setCustomerPhoneInput(e.target.value)}
                                        className="h-8 text-xs font-semibold rounded-xl bg-white border-slate-200 focus:ring-1 focus:ring-blue-100"
                                      />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Observações</span>
                                      <textarea
                                        placeholder="Observações do atendimento..."
                                        value={customerObsInput}
                                        onChange={(e) => setCustomerObsInput(e.target.value)}
                                        className="w-full h-16 p-2 text-xs font-medium rounded-xl bg-white border border-slate-200 outline-none focus:ring-1 focus:ring-blue-100 resize-none"
                                      />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Garçom</span>
                                      <Input
                                        placeholder="Nome do Garçom..."
                                        value={waiterNameInput}
                                        onChange={(e) => setWaiterNameInput(e.target.value)}
                                        className="h-8 text-xs font-semibold rounded-xl bg-white border-slate-200 focus:ring-1 focus:ring-blue-100"
                                      />
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                      <button
                                        onClick={() => setIsEditingCustomer(false)}
                                        className="flex-1 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[9px] font-black uppercase italic tracking-wider rounded-lg transition-all"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={() => handleSaveCustomerData(linkedOrder, customerNameInput, customerPhoneInput, customerObsInput, waiterNameInput)}
                                        className="flex-1 h-8 bg-[#1a56db] hover:bg-[#1e40af] text-white text-[9px] font-black uppercase italic tracking-wider rounded-lg transition-all"
                                      >
                                        Salvar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Customer Data summary card */
                                  <div className="bg-slate-50/50 p-3 rounded-3xl border border-slate-100 text-xs text-slate-700 space-y-2 shrink-0 shadow-sm">
                                    <div className="flex justify-between items-center border-b border-slate-100/60 pb-1 flex-wrap gap-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Dados do Cliente</span>
                                      <span className="text-[8px] font-mono font-bold bg-black/5 px-1.5 py-0.5 rounded leading-none">⏱️ {elapsedTime}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <span className="text-[8px] font-black text-slate-400 uppercase italic tracking-wider block leading-none">Nome:</span>
                                        <span className="font-bold text-slate-800 mt-1 block truncate">{customerNameInput || "Não informado"}</span>
                                      </div>
                                      <div>
                                        <span className="text-[8px] font-black text-slate-400 uppercase italic tracking-wider block leading-none">Telefone:</span>
                                        <span className="font-bold text-slate-800 mt-1 block truncate">{customerPhoneInput || "Não informado"}</span>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="text-[8px] font-black text-slate-400 uppercase italic tracking-wider block leading-none">Observações:</span>
                                        <span className="font-semibold text-slate-500 mt-1 block italic text-[11px] leading-snug line-clamp-2">{customerObsInput || "Sem observações"}</span>
                                      </div>
                                      <div className="col-span-2 pt-1 border-t border-slate-100">
                                        <span className="text-[8px] font-black text-slate-400 uppercase italic tracking-wider block leading-none">Garçom Atendente:</span>
                                        <span className="font-bold text-slate-800 mt-1 block">{waiterNameInput || "Não definido"}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Consumed Items */}
                                <div className="space-y-1.5 flex flex-col flex-1 overflow-hidden min-h-[120px]">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic block shrink-0">Itens Consumidos</span>
                                  
                                  {linkedOrder.items.length === 0 ? (
                                    <div className="flex-1 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/30 flex flex-col items-center justify-center p-4">
                                      <span className="text-[10px] font-black text-slate-300 uppercase italic">Nenhum item lançado</span>
                                    </div>
                                  ) : (
                                    <ScrollArea className="flex-1 border border-slate-100 rounded-2xl bg-white p-2 shadow-inner">
                                      <div className="space-y-1.5">
                                        {linkedOrder.items.map((item: any, idx: number) => (
                                          <div key={item.id || idx} className="bg-white p-2 border border-slate-100 rounded-xl flex items-center justify-between text-xs shadow-sm gap-2">
                                            <div className="flex flex-col min-w-0">
                                              <span className="font-bold text-slate-700 truncate leading-tight">{item.name}</span>
                                              {item.observation && (
                                                <span className="text-[9px] text-slate-400 italic font-semibold mt-0.5 truncate">Obs: {item.observation}</span>
                                              )}
                                              <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                R$ {Number(item.price).toFixed(2)}
                                              </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 shrink-0">
                                              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-7 bg-slate-50">
                                                <button
                                                  type="button"
                                                  onClick={() => updateTableOrderItemQty(linkedOrder, item, item.quantity - 1)}
                                                  className="px-1.5 h-full text-slate-500 hover:bg-slate-100 font-bold text-xs"
                                                >
                                                  -
                                                </button>
                                                <span className="px-1.5 text-[9px] font-black text-slate-700">{item.quantity}x</span>
                                                <button
                                                  type="button"
                                                  onClick={() => updateTableOrderItemQty(linkedOrder, item, item.quantity + 1)}
                                                  className="px-1.5 h-full text-slate-500 hover:bg-slate-100 font-bold text-xs"
                                                >
                                                  +
                                                </button>
                                              </div>
                                              <span className="font-black text-slate-600 min-w-[50px] text-right text-[11px]">
                                                R$ {Number(item.price * item.quantity).toFixed(2)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  )}
                                </div>

                                {/* Service Fee Toggle & Launch Buttons */}
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 space-y-2 shrink-0 shadow-sm">
                                  <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl h-9">
                                    <span className="text-[10px] font-bold text-slate-700 uppercase">Taxa Serviço (10%)</span>
                                    <Switch
                                      checked={applyServiceFee}
                                      onCheckedChange={(checked) => {
                                        setApplyServiceFee(checked)
                                        const feeAmt = checked ? (subtotal * 0.1) : 0
                                        const nextTot = subtotal + feeAmt
                                        
                                        supabase
                                          .from('orders')
                                          .update({ total: nextTot })
                                          .eq('id', linkedOrder.id)
                                          .then(({ error: ordErr }) => {
                                            if (!ordErr) {
                                              supabase
                                                .from('payments')
                                                .update({ amount: nextTot })
                                                .eq('order_id', linkedOrder.id)
                                                .then(() => refetch())
                                            }
                                          })
                                      }}
                                      className="data-[state=checked]:bg-[#16a34a]"
                                    />
                                  </div>

                                  <div className="flex justify-between items-center text-xs font-black text-slate-800 px-1 border-t border-slate-200/50 pt-2">
                                    <span className="uppercase text-[9px] tracking-wider italic text-slate-400">Total Consumido</span>
                                    <span className="text-sm">R$ {Number(total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                </div>

                                {/* Ações da Mesa buttons */}
                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 shrink-0">
                                  <button
                                    onClick={() => {
                                      setIsCatalogOpen(true)
                                      setCatalogSearchQuery("")
                                      setCatalogConfigProduct(null)
                                    }}
                                    className="h-9 bg-blue-50 text-[#1a56db] border border-blue-200 rounded-xl text-[9px] font-black uppercase italic tracking-widest transition-all hover:bg-blue-100/50 shadow-sm"
                                  >
                                    ➕ Adicionar Item
                                  </button>
                                  <button
                                    onClick={() => setActionTab('transfer')}
                                    className="h-9 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-[9px] font-black uppercase italic tracking-widest transition-all hover:bg-slate-100 shadow-sm"
                                  >
                                    🔄 Transferir
                                  </button>
                                  <button
                                    onClick={() => setActionTab('merge')}
                                    className="h-9 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-[9px] font-black uppercase italic tracking-widest transition-all hover:bg-slate-100 shadow-sm"
                                  >
                                    🔗 Juntar Mesas
                                  </button>
                                  <button
                                    onClick={() => handlePrintPreBill(linkedOrder, selectedTableForAction.table_number)}
                                    className="h-9 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-[9px] font-black uppercase italic tracking-widest transition-all hover:bg-slate-100 shadow-sm"
                                  >
                                    🖨️ Imprimir
                                  </button>
                                  <button
                                    onClick={() => setActionTab('bill')}
                                    className="h-10 col-span-2 bg-[#ef4444] text-white rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all hover:bg-[#dc2626] shadow-md shadow-red-100"
                                  >
                                    🧾 Fechar Conta / Checkout
                                  </button>
                                </div>
                              </div>
                            )}

                            {actionTab === 'transfer' && (
                              <div className="space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Transferir Consumo</h4>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Transfere toda a comanda ativa para outra mesa livre.</p>
                                
                                <div className="flex flex-col gap-1.5 bg-white p-3 rounded-xl border border-slate-100">
                                  <label className="text-slate-500 text-[10px] font-black uppercase italic tracking-wider">Mesa de Destino</label>
                                  <select
                                    value={transferTargetTableId}
                                    onChange={(e) => setTransferTargetTableId(e.target.value)}
                                    className="w-full h-11 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-700 bg-white outline-none"
                                  >
                                    <option value="">Selecione uma mesa livre...</option>
                                    {tables
                                      .filter(t => t.status === 'free' && t.id !== selectedTableForAction.id)
                                      .map(t => (
                                        <option key={t.id} value={t.table_number}>Mesa {t.table_number.split(' - ')[0]}</option>
                                      ))
                                    }
                                  </select>
                                </div>

                                <button
                                  onClick={() => handleTransferTableComanda(linkedOrder, selectedTableForAction, transferTargetTableId)}
                                  className="w-full h-11 bg-[#1a56db] hover:bg-[#1e40af] text-white font-black text-xs uppercase italic tracking-widest rounded-xl transition-all shadow-lg shadow-blue-100"
                                >
                                  Confirmar Transferência
                                </button>
                              </div>
                            )}

                            {actionTab === 'merge' && (
                              <div className="space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Juntar Mesas</h4>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Mescla todos os itens consumidos de outra mesa ocupada nesta mesa.</p>
                                
                                <div className="flex flex-col gap-1.5 bg-white p-3 rounded-xl border border-slate-100">
                                  <label className="text-slate-500 text-[10px] font-black uppercase italic tracking-wider">Mesa de Origem (Juntar a esta)</label>
                                  <select
                                    value={transferTargetTableId}
                                    onChange={(e) => setTransferTargetTableId(e.target.value)}
                                    className="w-full h-11 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-700 bg-white outline-none"
                                  >
                                    <option value="">Selecione uma mesa ocupada...</option>
                                    {tables
                                      .filter(t => t.status === 'occupied' && t.id !== selectedTableForAction.id)
                                      .map(t => (
                                        <option key={t.id} value={t.table_number}>Mesa {t.table_number.split(' - ')[0]}</option>
                                      ))
                                    }
                                  </select>
                                </div>

                                <button
                                  onClick={() => handleMergeTableComandas(selectedTableForAction, transferTargetTableId)}
                                  className="w-full h-11 bg-[#1a56db] hover:bg-[#1e40af] text-white font-black text-xs uppercase italic tracking-widest rounded-xl transition-all shadow-lg shadow-blue-100"
                                >
                                  Confirmar e Juntar Consumos
                                </button>
                              </div>
                            )}

                            {actionTab === 'bill' && (
                              <div className="space-y-3 flex flex-col flex-1 overflow-y-auto pr-1">
                                {/* Totals Breakdown */}
                                <div className="bg-slate-50 p-3.5 border border-slate-100 rounded-3xl space-y-1.5 shadow-sm shrink-0">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic block mb-1">Resumo da Conta</span>
                                  
                                  <div className="flex justify-between text-xs text-slate-500">
                                    <span>Subtotal Consumo</span>
                                    <span className="font-bold text-slate-700">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  
                                  {applyServiceFee && (
                                    <div className="flex justify-between text-xs text-slate-500">
                                      <span>Taxa de Serviço (10%)</span>
                                      <span className="font-bold text-slate-700">R$ {serviceFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                  )}

                                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-200/60">
                                    <label className="text-slate-400 text-[8px] font-black uppercase italic tracking-wider">Desconto (R$)</label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                                      <input 
                                        type="number"
                                        step="0.01"
                                        value={closingDiscount}
                                        onChange={(e) => setClosingDiscount(e.target.value)}
                                        className="w-full h-8 pl-8 pr-2 bg-white border border-slate-200 focus:border-[#1a56db] text-slate-855 font-black rounded-xl text-xs outline-none transition-all"
                                        placeholder="0,00"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex justify-between text-xs font-black text-slate-800 border-t border-slate-200 pt-2 mt-1">
                                    <span>Total Geral</span>
                                    <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                </div>

                                {/* Split Payments Interface */}
                                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-3.5 space-y-3 shrink-0 shadow-sm">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic block">Métodos de Pagamento</span>
                                  
                                  <div className="space-y-2">
                                    {[
                                      { id: 'pix', label: 'Pix' },
                                      { id: 'dinheiro', label: 'Dinheiro (Din.)' },
                                      { id: 'cartao_credito', label: 'Cartão Crédito' },
                                      { id: 'cartao_debito', label: 'Cartão Débito' },
                                      { id: 'voucher', label: 'Voucher' }
                                    ].map((payMethod) => (
                                      <div key={payMethod.id} className="flex flex-col gap-1 bg-white border border-slate-100 rounded-xl p-2 shadow-sm">
                                        <label className="text-[8px] font-black text-slate-400 uppercase italic tracking-wider leading-none">{payMethod.label}</label>
                                        <div className="flex gap-2 items-center">
                                          <div className="relative flex-1">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">R$</span>
                                            <input
                                              type="number"
                                              step="0.01"
                                              placeholder="0,00"
                                              value={paymentInputs[payMethod.id as keyof typeof paymentInputs]}
                                              onChange={(e) => setPaymentInputs({...paymentInputs, [payMethod.id]: e.target.value})}
                                              className="w-full h-8 pl-7 pr-2 border border-slate-200 focus:border-[#1a56db] text-slate-700 font-black rounded-lg text-xs outline-none transition-all"
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => fillFullRemaining(payMethod.id as keyof typeof paymentInputs)}
                                            className="h-8 px-2 bg-blue-50 hover:bg-blue-100 text-[#1a56db] text-[9px] font-black uppercase italic rounded-lg tracking-wider border border-blue-100 whitespace-nowrap"
                                          >
                                            Pagar Tudo
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Payment Status Summary and Checkout Action */}
                                <div className="bg-white border border-slate-150 rounded-3xl p-3.5 space-y-2.5 shadow-sm mt-auto shrink-0">
                                  <div className="space-y-1 bg-slate-50/50 p-2 rounded-2xl text-[10px] font-bold border border-slate-100">
                                    <div className="flex justify-between items-center text-slate-500">
                                      <span>Total Geral:</span>
                                      <span className="font-black text-slate-800">R$ {total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-500">
                                      <span>Valor Pago:</span>
                                      <span className="font-black text-[#1a56db]">R$ {totalPaid.toFixed(2)}</span>
                                    </div>
                                    
                                    {remainingBalance > 0 && (
                                      <div className="flex justify-between items-center text-red-500 border-t border-slate-100 pt-1 mt-1">
                                        <span className="uppercase text-[9px] tracking-wide font-black">Saldo Restante:</span>
                                        <span className="font-black">R$ {remainingBalance.toFixed(2)}</span>
                                      </div>
                                    )}

                                    {changeDue > 0 && (
                                      <div className="flex justify-between items-center text-emerald-600 border-t border-slate-100 pt-1 mt-1 bg-emerald-50 px-1.5 py-0.5 rounded-lg">
                                        <span className="uppercase text-[9px] tracking-wide font-black">Troco Devido:</span>
                                        <span className="font-black">R$ {changeDue.toFixed(2)}</span>
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleCloseTableBillSplit(linkedOrder, selectedTableForAction, changeDue)}
                                    disabled={remainingBalance > 0}
                                    className={cn(
                                      "w-full h-11 text-white font-black text-xs uppercase italic tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2",
                                      remainingBalance > 0 
                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-50"
                                    )}
                                  >
                                    {remainingBalance > 0 ? "AGUARDANDO PAGAMENTO INTEGRAL" : "✅ CONCLUIR CHECKOUT"}
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        )}
                        
                      </div>
                    </div>
                  )
                })()}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 📁 Modal Criar Ambiente */}
        <AnimatePresence>
          {isEnvModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 font-sans"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md border border-slate-100 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight flex items-center gap-2">
                    <Layers size={20} className="text-[#1a56db]" /> Novo Ambiente
                  </h3>
                  <button 
                    onClick={() => setIsEnvModalOpen(false)}
                    className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-slate-400 text-[10px] font-black uppercase italic tracking-wider">Nome do Ambiente</label>
                  <input 
                    type="text"
                    value={envName}
                    onChange={(e) => setEnvName(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-800 font-bold rounded-xl text-sm outline-none transition-all"
                    placeholder="Ex: Salão Principal, Terraço..."
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsEnvModalOpen(false)}
                    className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-xs uppercase italic tracking-widest rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCreateEnv}
                    className="flex-1 h-11 bg-[#1a56db] hover:bg-[#1e40af] text-white font-black text-xs uppercase italic tracking-widest rounded-xl transition-all shadow-lg shadow-blue-100"
                  >
                    Criar Ambiente
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📁 Modal Editar Ambiente */}
        <AnimatePresence>
          {isEditEnvModalOpen && selectedEnv && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 font-sans"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md border border-slate-100 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight flex items-center gap-2">
                    <Settings2 size={20} className="text-[#1a56db]" /> Editar Ambiente
                  </h3>
                  <button 
                    onClick={() => setIsEditEnvModalOpen(false)}
                    className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-slate-400 text-[10px] font-black uppercase italic tracking-wider">Nome do Ambiente</label>
                  <input 
                    type="text"
                    value={editEnvName}
                    onChange={(e) => setEditEnvName(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-800 font-bold rounded-xl text-sm outline-none transition-all"
                    placeholder="Nome do ambiente..."
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleDeleteEnv}
                    className="h-11 px-4 bg-red-50 hover:bg-red-100 text-red-500 font-black text-xs uppercase italic tracking-widest rounded-xl transition-all border border-red-100"
                    title="Excluir Ambiente"
                  >
                    Excluir
                  </button>
                  <button 
                    onClick={() => setIsEditEnvModalOpen(false)}
                    className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-xs uppercase italic tracking-widest rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleUpdateEnv}
                    className="flex-1 h-11 bg-[#1a56db] hover:bg-[#1e40af] text-white font-black text-xs uppercase italic tracking-widest rounded-xl transition-all shadow-lg shadow-blue-100"
                  >
                    Salvar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🍽️ Modal Criar Mesa */}
        <AnimatePresence>
          {isTableModalOpen && selectedEnv && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 font-sans"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md border border-slate-100 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight flex items-center gap-2">
                    <Plus size={20} className="text-[#1a56db]" /> Adicionar Mesa
                  </h3>
                  <button 
                    onClick={() => setIsTableModalOpen(false)}
                    className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-[10px] font-black uppercase italic tracking-wider">Número</label>
                    <input 
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-800 font-black rounded-xl text-xs outline-none transition-all"
                      placeholder="Ex: 5, 12..."
                      autoFocus
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-[10px] font-black uppercase italic tracking-wider">Nome (Opcional)</label>
                    <input 
                      type="text"
                      value={tableNameInput}
                      onChange={(e) => setTableNameInput(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-[#1a56db] focus:ring-2 ring-blue-100 text-slate-800 font-bold rounded-xl text-xs outline-none transition-all"
                      placeholder="Ex: VIP, Janela..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-[10px] font-black uppercase italic tracking-wider">Capacidade</label>
                    <input 
                      type="number"
                      min="1"
                      value={tableCapacity}
                      onChange={(e) => setTableCapacity(parseInt(e.target.value) || 4)}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-[#1a56db] text-slate-800 font-black rounded-xl text-xs outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-[10px] font-black uppercase italic tracking-wider">Ambiente</label>
                    <select
                      value={tableEnvId}
                      onChange={(e) => setTableEnvId(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-[#1a56db] text-slate-800 font-bold rounded-xl text-xs outline-none"
                    >
                      <option value="">Selecione...</option>
                      {environments.map(env => (
                        <option key={env.id} value={env.id}>{env.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsTableModalOpen(false)}
                    className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-xs uppercase italic tracking-widest rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCreateTable}
                    className="flex-1 h-11 bg-[#1a56db] hover:bg-[#1e40af] text-white font-black text-xs uppercase italic tracking-widest rounded-xl transition-all shadow-lg shadow-blue-100"
                  >
                    Salvar Mesa
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  )
}
