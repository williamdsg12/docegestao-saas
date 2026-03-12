"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { AuthProvider, useAuth } from "@/hooks/useAuth"
import { Toaster } from "@/components/ui/sonner"
import { useEffect } from "react"

function ColorProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const color = user?.user_metadata?.primary_color || '#FF2F81'

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--primary', color)
        }
    }, [color])

    return <> {children} </>
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
                <ColorProvider>
                    {children}
                    <Toaster position="bottom-right" />
                </ColorProvider>
            </AuthProvider>
        </NextThemesProvider>
    )
}
