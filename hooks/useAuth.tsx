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
    loadingSubscription: boolean
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    subscription: null,
    isAdmin: false,
    loadingSubscription: true,
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
    const [loadingSubscription, setLoadingSubscription] = useState(true)

    const fetchSubscription = async (userId: string) => {
        setLoadingSubscription(true)
        try {
            // Fetch Subscription
            const subscriptionPromise = supabase
                .from('subscriptions')
                .select('*, plans(*)')
                .eq('user_id', userId)
                .maybeSingle()

            // Fetch Admin Status from profiles
            const profilePromise = supabase
                .from('profiles')
                .select('is_admin')
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
                console.log("DEBUG AUTH: Profile found, is_admin:", profRes.data.is_admin)
                setIsAdmin(profRes.data.is_admin)
            } else {
                console.warn("DEBUG AUTH: No profile found for user ID:", userId)
                setIsAdmin(false)
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
            }
            setLoading(false)
        })

        return () => authListener.unsubscribe()
    }, [])

    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
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
            // Ensure we have a valid session before updating auth metadata
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            
            if (!currentSession) {
                console.warn("DEBUG AUTH: updateProfile called without session, attempting to recover...")
            }

            // Update Auth User Metadata
            const { data, error: authError } = await supabase.auth.updateUser({
                data: metadata
            })

            if (authError) {
                console.error("DEBUG AUTH: Auth metadata update failed:", authError.message)
                return { error: authError }
            }

            if (data?.user) {
                setUser(data.user)
                
                // Sync important fields to profile table for redundancy and standard DB access
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
            console.error("DEBUG AUTH: updateProfile exception:", error.message || error)
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

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            subscription,
            isAdmin,
            loadingSubscription,
            signInWithGoogle,
            signInWithEmail,
            signUp,
            updateProfile,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
