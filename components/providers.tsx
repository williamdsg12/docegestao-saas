"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { AuthProvider, useAuth } from "@/hooks/useAuth"
import { BusinessProvider, useBusiness } from "@/hooks/useBusiness"
import { Toaster } from "@/components/ui/sonner"
import { useEffect } from "react"

function ColorProvider({ children }: { children: React.ReactNode }) {
    const { business } = useBusiness()
    const color = business?.config?.primary_color || '#ec4899'

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--primary', color)
            // Also update ring and other related variables if needed
            document.documentElement.style.setProperty('--ring', color)
        }
    }, [color])

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
