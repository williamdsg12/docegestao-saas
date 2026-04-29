"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { AuthProvider } from "@/hooks/useAuth"
import { BusinessProvider, useBusiness } from "@/hooks/useBusiness"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/query-client"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "@/components/ui/sonner"
import { useEffect } from "react"

function ColorProvider({ children }: { children: React.ReactNode }) {
    const { business } = useBusiness()
    
    useEffect(() => {
        if (typeof document !== 'undefined' && business) {
            // Only apply custom colors if explicitly set in business and not in dark mode 
            // (or let theme handles it). For now, we prioritize the user's premium palette.
            if (business.primary_color) {
                document.documentElement.style.setProperty('--primary-custom', business.primary_color)
            }
            if (business.secondary_color) {
                document.documentElement.style.setProperty('--secondary-custom', business.secondary_color)
            }
        }
    }, [business])

    return <> {children} </>
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <NextThemesProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange={false}
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
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}
