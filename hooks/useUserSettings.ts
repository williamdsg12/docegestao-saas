import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface UserSettings {
    theme: 'light' | 'dark'
    language: string
    currency: string
    timezone: string
    whatsapp_default: string
}

export function useUserSettings() {
    const { user } = useAuth()
    const [settings, setSettings] = useState<UserSettings | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchSettings()
        }
    }, [user])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user?.id)
                .maybeSingle()

            if (error) throw error

            if (data) {
                setSettings(data)
            } else {
                // If not found, it might be due to race condition with trigger, 
                // but let's assume it should have been created.
                // We don't initialize here to avoid multiple calls, the setup script handles it.
            }
        } catch (error) {
            console.error('Error fetching user settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateSettings = async (newSettings: Partial<UserSettings>) => {
        if (!user) return { error: new Error('User not authenticated') }

        try {
            setLoading(true)
            const { error } = await supabase
                .from('user_settings')
                .update({
                    ...newSettings,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id)

            if (error) throw error

            setSettings(prev => prev ? { ...prev, ...newSettings } : null)
            return { error: null }
        } catch (error: any) {
            console.error('Error updating user settings:', error)
            return { error }
        } finally {
            setLoading(false)
        }
    }

    return {
        settings,
        loading,
        updateSettings,
        refresh: fetchSettings
    }
}
