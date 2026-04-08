"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { supabase } from "@/lib/supabase"
import { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    signInWithEmail: (email: string, password: string) => Promise<{ error: any }>
    signUp: (email: string, password: string, metadata: any) => Promise<{ error: any }>
    updateProfile: (metadata: any) => Promise<{ error: any }>
    subscription: any | null
    isAdmin: boolean
    role: string | null
    loadingSubscription: boolean
    hasAccess: boolean
    isTrial: boolean
    daysLeft: number
    plan: string | null
    trial_ends_at: string | null
    subscription_status: string | null
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    subscription: null,
    isAdmin: false,
    role: null,
    loadingSubscription: true,
    hasAccess: false,
    isTrial: false,
    daysLeft: 0,
    plan: null,
    trial_ends_at: null,
    subscription_status: null,
    signInWithGoogle: async () => { },
    signInWithEmail: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    updateProfile: async () => ({ error: null }),
    logout: async () => { },
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [subscription, setSubscription] = useState<any | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [role, setRole] = useState<string | null>(null)
    const [loadingSubscription, setLoadingSubscription] = useState(true)
    const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
    const [userPlan, setUserPlan] = useState<string | null>(null)
    const [subStatus, setSubStatus] = useState<string | null>(null)

    const fetchSubscription = async (userId: string) => {
        setLoadingSubscription(true)
        try {
            // Fetch Subscription
            const subscriptionPromise = supabase
                .from('subscriptions')
                .select('*, plans(*)')
                .eq('user_id', userId)
                .maybeSingle()

            // Fetch Admin Status and Role from profiles
            const profilePromise = supabase
                .from('profiles')
                .select('is_admin, role, trial_ends_at, plan, subscription_status')
                .eq('id', userId)
                .maybeSingle()

            const [subRes, profRes] = await Promise.all([subscriptionPromise, profilePromise])

            if (subRes.error) {
                // Se o relacionamento plans(*) falhar, tentamos buscar apenas subscriptions
                console.warn("Relationship 'subscriptions' -> 'plans' might be missing, falling back...")
                const retrySub = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle()
                
                if (retrySub.data) {
                    setSubscription(retrySub.data)
                } else {
                    console.error("Error fetching subscription:", subRes.error.message)
                    setSubscription(null)
                }
            } else {
                setSubscription(subRes.data)
            }

            if (profRes.data) {
                console.log("DEBUG AUTH: Profile found, role:", profRes.data.role)
                const isSystemAdmin = profRes.data.is_admin === true
                setIsAdmin(isSystemAdmin)
                setRole(profRes.data.role || (isSystemAdmin ? 'admin' : 'user'))
                setTrialEndsAt(profRes.data.trial_ends_at)
                setUserPlan(profRes.data.plan)
                setSubStatus(profRes.data.subscription_status)
            } else {
                console.warn("DEBUG AUTH: No profile found for user ID:", userId)
                setIsAdmin(false)
                setRole(null)
                setTrialEndsAt(null)
                setUserPlan(null)
                setSubStatus(null)
            }
        } catch (error: any) {
            console.error("Error fetching auth data:", error.message || error)
            setSubscription(null)
            setIsAdmin(false)
        } finally {
            setLoadingSubscription(false)
        }
    }

    useEffect(() => {
        // Synchronize session to cookie for server-side access (getServerUser)
        if (session) {
            const expiration = new Date()
            expiration.setTime(expiration.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days
            document.cookie = `supabase-session=${session.access_token}; Path=/; Expires=${expiration.toUTCString()}; SameSite=Lax`
        } else {
            document.cookie = `supabase-session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
        }
    }, [session])

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchSubscription(session.user.id)
            } else {
                setLoadingSubscription(false)
            }
            setLoading(false)
        })

        // Listen for changes
        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            if (session?.user) {
                setLoadingSubscription(true)
            }
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchSubscription(session.user.id)
            } else {
                setSubscription(null)
                setLoadingSubscription(false)
                setIsAdmin(false)
                setRole(null)
                setTrialEndsAt(null)
                setUserPlan(null)
                setSubStatus(null)
            }
            setLoading(false)
        })

        return () => authListener.unsubscribe()
    }, [])

    const signInWithGoogle = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
            const redirectTo = typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? `${window.location.origin}/dashboard`
                : `${baseUrl}/dashboard`

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo
                }
            })
            if (error) throw error
        } catch (error) {
            console.error("Error signing in with Google", error)
        }
    }

    const signInWithEmail = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            return { error }
        } catch (error: any) {
            return { error }
        }
    }

    const signUp = async (email: string, password: string, metadata: any) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata,
                    emailRedirectTo: `${window.location.origin}/dashboard`
                }
            })
            return { error }
        } catch (error: any) {
            return { error }
        }
    }

    const updateProfile = async (metadata: any) => {
        try {
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            const { data, error: authError } = await supabase.auth.updateUser({
                data: metadata
            })

            if (authError) return { error: authError }

            if (data?.user) {
                setUser(data.user)
                const profileUpdates: any = {}
                if (metadata.store_name) profileUpdates.business_name = metadata.store_name
                if (metadata.full_name) profileUpdates.owner_name = metadata.full_name
                
                if (Object.keys(profileUpdates).length > 0) {
                    await supabase
                        .from('profiles')
                        .update(profileUpdates)
                        .eq('id', data.user.id)
                }
            }
            
            return { error: null }
        } catch (error: any) {
            return { error }
        }
    }

    const logout = async () => {
        try {
            await supabase.auth.signOut()
        } catch (error) {
            console.error("Error signing out", error)
        }
    }

    // Calcular acesso real
    const now = new Date()
    const trialDate = trialEndsAt ? new Date(trialEndsAt) : null
    const isTrialActive = !!(trialDate && trialDate > now)
    const hasPaidPlan = !!(userPlan && !['free', 'inactive'].includes(userPlan.toLowerCase()))
    
    const hasAccess = !!(isAdmin || isTrialActive || hasPaidPlan)
    const daysLeft = trialDate 
        ? Math.max(0, Math.ceil((trialDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            signInWithGoogle,
            signInWithEmail,
            signUp,
            updateProfile,
            subscription,
            isAdmin,
            role,
            loadingSubscription,
            hasAccess,
            isTrial: isTrialActive,
            daysLeft,
            plan: userPlan,
            trial_ends_at: trialEndsAt,
            subscription_status: subStatus,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
