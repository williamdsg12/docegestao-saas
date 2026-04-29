"use client"

import { createContext, useContext, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useQuery, useQueryClient } from "@tanstack/react-query"

const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// ... interfaces remain the same
interface Company {
    id: string
    nome: string
    owner_id: string
    logo_url?: string
    primary_color?: string
    secondary_color?: string
    domain?: string
    instagram?: string
    website?: string
    description?: string
    endereco?: string
    telefone?: string
    address_street?: string
    address_number?: string
    address_complement?: string
    address_neighborhood?: string
    address_city?: string
    address_state?: string
    address_zip?: string
    address_lat?: number
    address_lng?: number
    delivery_radius?: number
    config?: any
    delivery_fee?: number
    min_order_value?: number
    accept_pix?: boolean
    accept_card?: boolean
    accept_cash?: boolean
    opening_hours?: any
    production_time?: string
    menu_slug?: string
    slug?: string
    status?: string
    phone?: string
    cnpj?: string
    whatsapp?: string
}

interface Profile {
    id: string
    owner_name: string
    business_name: string
    email: string
    plan: string
    tenant_id: string
    company_id?: string
    whatsapp?: string
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
    const queryClient = useQueryClient()

    const { data, isLoading: loadingBusiness } = useQuery({
        queryKey: ["business-content", user?.id],
        queryFn: async () => {
            if (!user) return null

            // 1. Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle()

            if (profileError) throw profileError
            if (!profileData) return null

            const tenantId = profileData.tenant_id || profileData.company_id
            if (!tenantId) return { profile: profileData, business: null }

            // 2. Fetch business sources in parallel
            const [resTenant, resEmpresa, resCompany, resDelivery, resMenu, resSettings] = await Promise.all([
                supabase.from('tenants').select('*').eq('id', tenantId).maybeSingle(),
                supabase.from('empresas').select('*').eq('id', tenantId).maybeSingle(),
                supabase.from('companies').select('*').eq('id', tenantId).maybeSingle(),
                supabase.from('delivery_settings').select('*').eq('tenant_id', tenantId).maybeSingle(),
                supabase.from('digital_menu_settings').select('*').eq('company_id', tenantId).maybeSingle(),
                supabase.from('store_settings').select('*').eq('store_id', tenantId).maybeSingle()
            ])

            const combinedData: Company = {
                id: tenantId,
                nome: resTenant.data?.nome || resEmpresa.data?.nome || resCompany.data?.name || profileData?.business_name || "",
                whatsapp: resMenu.data?.whatsapp || profileData?.whatsapp || resEmpresa.data?.telefone || resCompany.data?.phone || "",
                telefone: resEmpresa.data?.telefone || resCompany.data?.phone || profileData?.phone || "",
                endereco: resEmpresa.data?.endereco || (resCompany.data?.address_street ? `${resCompany.data.address_street}, ${resCompany.data.address_number || ""}` : ""),
                delivery_fee: resDelivery.data?.base_fee ?? resEmpresa.data?.delivery_fee ?? resCompany.data?.delivery_fee ?? 0,
                delivery_radius: resDelivery.data?.max_km ?? resEmpresa.data?.delivery_radius ?? resCompany.data?.delivery_radius ?? 0,
                min_order_value: resEmpresa.data?.min_order_value ?? resCompany.data?.min_order_value ?? 0,
                config: {
                    primary_color: resMenu.data?.primary_color || resCompany.data?.primary_color || resSettings.data?.primary_color,
                    instagram: resMenu.data?.instagram || profileData?.instagram || resCompany.data?.instagram,
                    rate_per_km: resDelivery.data?.fee_per_km ?? 0,
                    monthly_goal: 10000
                },
                opening_hours: resSettings.data?.opening_hours || resCompany.data?.opening_hours || resEmpresa.data?.opening_hours || {},
                is_manual_override: resSettings.data?.is_manual_override,
                manual_status: resSettings.data?.manual_status,
                logo_url: resMenu.data?.menu_logo || resEmpresa.data?.logo_url || resCompany.data?.logo_url || resSettings.data?.logo_url,
                owner_id: resTenant.data?.owner_id || resCompany.data?.owner_id || user.id,
                slug: resTenant.data?.slug || resCompany.data?.menu_slug || slugify(resTenant.data?.nome || resEmpresa.data?.nome || resCompany.data?.name || profileData?.business_name || "convidado"),
                address_city: resEmpresa.data?.address_city || resCompany.data?.address_city,
                address_state: resEmpresa.data?.address_state || resCompany.data?.address_state
            } as any

            return {
                profile: profileData as Profile,
                business: combinedData
            }
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 30, // 30 minutes cache for business data
    })

    const value = useMemo(() => ({
        business: data?.business || null,
        profile: data?.profile || null,
        loadingBusiness,
        refreshBusiness: async () => {
             await queryClient.invalidateQueries({ queryKey: ["business-content", user?.id] })
        }
    }), [data, loadingBusiness, queryClient, user?.id])

    return (
        <BusinessContext.Provider value={value}>
            {children}
        </BusinessContext.Provider>
    )
}

export const useBusiness = () => useContext(BusinessContext)
