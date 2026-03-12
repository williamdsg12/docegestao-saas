"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"

export interface PlanLimits {
  max_orders: number
  max_products: number
  max_clients: number
  current_orders: number
  current_products: number
  current_clients: number
  plan_name: string
}

export function usePlanLimits() {
  const { profile } = useBusiness()
  const [limits, setLimits] = useState<PlanLimits>({
    max_orders: 100,
    max_products: 50,
    max_clients: 100,
    current_orders: 0,
    current_products: 0,
    current_clients: 0,
    plan_name: 'Iniciante'
  })
  const [loading, setLoading] = useState(true)

  const checkLimits = async () => {
    if (!profile?.company_id) {
        setLoading(false)
        return
    }
    
    setLoading(true)
    try {
      // 1. Fetch Subscription & Plan
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('company_id', profile.company_id)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // 2. Fetch Current Usage
      const [ordersCount, productsCount, clientsCount] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact' }).eq('company_id', profile.company_id),
        supabase.from('products').select('id', { count: 'exact' }).eq('company_id', profile.company_id),
        supabase.from('clients').select('id', { count: 'exact' }).eq('company_id', profile.company_id)
      ])

      const planData = sub?.plans

      setLimits({
        max_orders: planData?.max_orders || 100,
        max_products: planData?.max_products || 50,
        max_clients: planData?.max_clients || 100,
        current_orders: ordersCount.count || 0,
        current_products: productsCount.count || 0,
        current_clients: clientsCount.count || 0,
        plan_name: planData?.name || 'Iniciante'
      })
    } catch (e) {
      console.error("Error checking plan limits:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile?.company_id) {
        checkLimits()
    }
  }, [profile])

  const canAddOrder = () => limits.current_orders < limits.max_orders
  const canAddProduct = () => limits.current_products < limits.max_products
  const canAddClient = () => limits.current_clients < limits.max_clients

  return { 
    limits, 
    loading, 
    canAddOrder, 
    canAddProduct, 
    canAddClient, 
    refreshLimits: checkLimits 
  }
}
