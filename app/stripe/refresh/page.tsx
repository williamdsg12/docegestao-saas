"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCcw, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function RefreshContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const accountId = searchParams.get('account_id')
    const [loading, setLoading] = useState(false)

    const handleRefresh = async () => {
        if (!accountId) {
            toast.error("ID da conta não encontrado")
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/stripe/onboarding-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ account_id: accountId })
            })

            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error(data.error || "Erro ao gerar link")
            }
        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    return (
        <Card className="max-w-md w-full border-none shadow-2xl overflow-hidden rounded-[32px]">
            <div className="bg-amber-500 p-12 flex justify-center">
                <AlertCircle className="size-16 text-white" />
            </div>
            <CardContent className="p-8 text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Link Expirado
                    </h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        O link de segurança da Stripe expirou ou já foi utilizado. 
                        Clique abaixo para gerar um novo link e continuar seu onboarding.
                    </p>
                </div>

                <div className="pt-4">
                    <Button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg transition-all group"
                    >
                        {loading ? (
                            <Loader2 className="mr-2 size-5 animate-spin" />
                        ) : (
                            <RefreshCcw className="mr-2 size-5 group-hover:rotate-180 transition-transform duration-500" />
                        )}
                        Gerar Novo Link
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function StripeRefreshPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Suspense fallback={<Loader2 className="size-10 animate-spin text-blue-600" />}>
                <RefreshContent />
            </Suspense>
        </div>
    )
}
