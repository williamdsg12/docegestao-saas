"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function StripeSuccessPage() {
    const router = useRouter()

    useEffect(() => {
        // Efeito de celebração
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3B82F6', '#10B981', '#F59E0B']
        })
    }, [])

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-none shadow-2xl overflow-hidden rounded-[32px]">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex justify-center">
                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
                        <CheckCircle2 className="size-16 text-white" />
                    </div>
                </div>
                <CardContent className="p-8 text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Conta Conectada!
                        </h1>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Sua conta Stripe foi vinculada com sucesso ao <span className="text-blue-600 font-bold">Doce Gestão</span>. 
                            Você já pode começar a receber pagamentos online.
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button 
                            onClick={() => router.push('/dashboard/financeiro/pagamentos')}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 transition-all group"
                        >
                            Ir para o Painel
                            <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>

                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
                        Configuração Finalizada • Stripe Connect
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
