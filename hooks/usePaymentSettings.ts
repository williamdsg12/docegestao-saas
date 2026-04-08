import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { toast } from "sonner"

export function usePaymentSettings() {
  const { profile } = useBusiness()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    tuna_client_id: "",
    tuna_client_secret: "",
    tuna_connected: false,
    pix_enabled: false,
    pix_key: ""
  })

  const tenantId = profile?.tenant_id || profile?.company_id

  useEffect(() => {
    if (tenantId) {
      fetchSettings()
    }
  }, [tenantId])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle()

      if (data) {
        setSettings({
          tuna_client_id: data.tuna_client_id || "",
          tuna_client_secret: data.tuna_client_secret || "",
          tuna_connected: data.tuna_connected || false,
          pix_enabled: data.pix_enabled || false,
          pix_key: data.pix_key || ""
        })
      }
    } catch (err) {
      console.error("Error fetching payment settings:", err)
    } finally {
      setLoading(false)
    }
  }

  const connectTuna = async (clientId: string, clientSecret: string) => {
    try {
      setSaving(true)
      const res = await fetch("/api/payments/tuna/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, tenantId }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Erro ao conectar à Tuna")

      toast.success(data.message || "Tuna conectada com sucesso!")
      await fetchSettings()
      return { success: true }
    } catch (err: any) {
      toast.error(err.message)
      return { success: false, error: err.message }
    } finally {
      setSaving(false)
    }
  }

  const updateTunaSettings = async (updates: Partial<typeof settings>) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from("payment_settings")
        .upsert({
          tenant_id: tenantId,
          ...updates,
          updated_at: new Date().toISOString()
        }, { onConflict: 'tenant_id' })

      if (error) throw error

      setSettings(prev => ({ ...prev, ...updates }))
      toast.success("Configurações atualizadas!")
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  return {
    settings,
    loading,
    saving,
    connectTuna,
    updateTunaSettings,
    refresh: fetchSettings
  }
}
