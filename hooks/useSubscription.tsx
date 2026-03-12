"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"

export interface Subscription {
  id: string
  company_id: string
  plan_id: string
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid'
  current_period_end: string
  plans?: {
    name: string
    price: number
    billing_cycle: string
    max_orders: number
    max_products: number
    max_clients: number
    features: string[]
  }
}

export function useSubscription() {
  const { profile } = useBusiness()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSubscription = async () => {
    if (!profile?.company_id) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      setSubscription(data)
    } catch (e) {
      console.error("Error fetching subscription:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile?.company_id) {
        fetchSubscription()
    }
  }, [profile])

  return { subscription, loading, refreshSubscription: fetchSubscription }
}
