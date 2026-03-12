"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

interface Company {
    id: string
    name: string
    owner_id: string
    logo_url?: string
    instagram?: string
    website?: string
    description?: string
    address_street?: string
    address_number?: string
    address_complement?: string
    address_neighborhood?: string
    address_city?: string
    address_state?: string
    address_zip?: string
    delivery_radius?: number
    delivery_fee?: number
    min_order_value?: number
    accept_pix?: boolean
    accept_card?: boolean
    accept_cash?: boolean
    opening_hours?: any
    production_time?: string
    menu_slug?: string
    status?: string
}

interface Profile {
    id: string
    owner_name: string
    business_name: string
    email: string
    plan: string
    company_id: string
    is_admin: boolean
}

interface BusinessContextType {
    business: Company | null
    profile: Profile | null
    loadingBusiness: boolean
    refreshBusiness: () => Promise<void>
}

const BusinessContext = createContext<BusinessContextType>({
    business: null,
    profile: null,
    loadingBusiness: true,
    refreshBusiness: async () => { },
})

export const BusinessProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth()
    const [business, setBusiness] = useState<Company | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loadingBusiness, setLoadingBusiness] = useState(true)

    const fetchBusinessData = async () => {
        if (!user) {
            setBusiness(null)
            setProfile(null)
            setLoadingBusiness(false)
            return
        }

        try {
            setLoadingBusiness(true)
            
            // 1. Fetch Profile to get company_id
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle()

            if (profileError) throw profileError
            
            if (profileData) {
                setProfile(profileData as Profile)
                
                if (profileData.company_id) {
                    // 2. Fetch Company details
                    const { data: companyData, error: companyError } = await supabase
                        .from('companies')
                        .select('*')
                        .eq('id', profileData.company_id)
                        .maybeSingle()

                    if (companyError) throw companyError
                    setBusiness(companyData as Company)
                }
            }
        } catch (error) {
            console.error("Error fetching business context:", error)
        } finally {
            setLoadingBusiness(false)
        }
    }

    useEffect(() => {
        fetchBusinessData()
    }, [user])

    return (
        <BusinessContext.Provider value={{
            business,
            profile,
            loadingBusiness,
            refreshBusiness: fetchBusinessData
        }}>
            {children}
        </BusinessContext.Provider>
    )
}

export const useBusiness = () => useContext(BusinessContext)
