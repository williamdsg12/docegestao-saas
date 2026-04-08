"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { AuthProvider } from "@/hooks/useAuth"
import { BusinessProvider, useBusiness } from "@/hooks/useBusiness"
import { Toaster } from "@/components/ui/sonner"
import { useEffect } from "react"

function ColorProvider({ children }: { children: React.ReactNode }) {
    const { business } = useBusiness()
    
    // Default brand colors if not defined
    const primary = business?.primary_color || '#ec4899'
    const secondary = business?.secondary_color || '#1e293b'

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--primary', primary)
            document.documentElement.style.setProperty('--secondary', secondary)
            document.documentElement.style.setProperty('--ring', primary)
        }
    }, [primary, secondary])

    return <> {children} </>
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="data-theme"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
                <BusinessProvider>
                    <ColorProvider>
                        {children}
                        <Toaster position="bottom-right" />
                    </ColorProvider>
                </BusinessProvider>
            </AuthProvider>
        </NextThemesProvider>
    )
}
