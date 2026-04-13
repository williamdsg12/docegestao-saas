import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export function useStoreSettings() {
    const { profile } = useAuth()
    const [settings, setSettings] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const tenantId = profile?.tenant_id || profile?.company_id

    useEffect(() => {
        if (!tenantId) return
        
        // 1. Initial Fetch
        fetchSettings()

        // 2. Real-time Subscription for SSoT
        const channel = supabase
            .channel(`store-settings-sync-${tenantId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'store_settings',
                filter: `store_id=eq.${tenantId}`
            }, (payload) => {
                console.log("Real-time settings update received:", payload.new)
                setSettings(payload.new)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [tenantId])

    async function fetchSettings() {
        try {
            setLoading(true)
            
            // Try to fetch from the new unified table
            const { data, error } = await supabase
                .from('store_settings')
                .select('*')
                .eq('store_id', tenantId)
                .maybeSingle()

            if (!error && data) {
                setSettings(data)
                return
            }

            // Fallback: If table doesn't exist or record is missing, try to fetch from companies/empresas
            console.log("Store settings not found/ready, trying fallback to empresas...")
            const { data: legacyData, error: legacyError } = await supabase
                .from('empresas')
                .select('*')
                .eq('company_id', tenantId)
                .maybeSingle()

            if (legacyError) {
                console.error("Fallback to empresas failed:", legacyError)
                // Set default empty settings to let the page load
                setSettings({ 
                    store_id: tenantId,
                    name: profile?.name || "",
                })
            } else if (legacyData) {
                // Map legacy data to new schema
                setSettings({
                    store_id: tenantId,
                    name: legacyData.nome || legacyData.name,
                    logo_url: legacyData.logo_url,
                    instagram: legacyData.instagram,
                    description: legacyData.description,
                    delivery_fee: legacyData.delivery_fee,
                    delivery_radius: legacyData.delivery_radius,
                    opening_hours: legacyData.opening_hours,
                    accept_pix: legacyData.accept_pix,
                    accept_card: legacyData.accept_card,
                    accept_cash: legacyData.accept_cash,
                    is_open: legacyData.status === 'open',
                })
            } else {
                // No data anywhere, set defaults
                setSettings({ store_id: tenantId })
            }
        } catch (error: any) {
            console.error('Error fetching settings:', error)
            setSettings({ store_id: tenantId }) // Ensure page loads
        } finally {
            setLoading(false)
        }
    }

    async function updateSettings(updates: any) {
        try {
            const { error } = await supabase
                .from('store_settings')
                .upsert({
                    store_id: tenantId,
                    ...updates,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'store_id' })

            if (error) throw error
            setSettings((prev: any) => ({ ...prev, ...updates }))
            return { success: true }
        } catch (error: any) {
            toast.error('Erro ao atualizar: ' + error.message)
            return { success: false, error }
        }
    }

    return { settings, loading, updateSettings, refresh: fetchSettings }
}
