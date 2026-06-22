"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { useDashboardStats } from "@/hooks/useDashboardStats"

export interface RevenueInsight {
    title: string
    description: string
    impact: 'alto' | 'medio' | 'baixo'
    type: 'upsell' | 'promotion' | 'recovery'
}

export function useRevenueEngine() {
    const { profile, business } = useBusiness()
    const { totalMes, ticketMedio } = useDashboardStats()
    const [insights, setInsights] = useState<RevenueInsight[]>([])
    const [achievements, setAchievements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const tenantId = profile?.tenant_id || profile?.company_id

    const fetchRevenueData = useCallback(async () => {
        if (!tenantId) return

        try {
            const { data: ach } = await supabase
                .from('revenue_achievements')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })

            if (ach) setAchievements(ach)

            // --- Generate REAL AI Insights based on data ---
            const newInsights: RevenueInsight[] = []
            
            // 1. Ticket Médio Insight
            if (ticketMedio > 0 && ticketMedio < 60) {
                newInsights.push({
                    title: "Aumente seu Ticket Médio",
                    description: `Seu ticket médio de R$ ${ticketMedio.toFixed(2)} está abaixo da média do setor (R$ 80). Tente criar combos "Doce + Bebida" para subir esse valor.`,
                    impact: 'alto',
                    type: 'promotion'
                })
            } else if (ticketMedio >= 60) {
                newInsights.push({
                    title: "Excelente Ticket Médio!",
                    description: `Seu ticket de R$ ${ticketMedio.toFixed(2)} está ótimo. Foque em fidelizar esses clientes com um programa de pontos.`,
                    impact: 'medio',
                    type: 'upsell'
                })
            }

            // 2. Volume de Vendas e Plano
            if (totalMes > 3000 && (profile as any)?.plan_type !== 'premium') {
                newInsights.push({
                    title: "Escalabilidade Detectada",
                    description: "Seu volume de vendas este mês justifica o uso de automações de marketing. O plano Premium pode economizar 5h do seu atendimento por semana.",
                    impact: 'alto',
                    type: 'upsell'
                })
            }

            // 3. Goal Progress Insight
            const goal = business?.config?.monthly_goal || 10000
            const progress = (totalMes / goal) * 100
            
            if (progress < 30 && new Date().getDate() > 15) {
                newInsights.push({
                    title: "Alerta de Meta Mensal",
                    description: `Você atingiu apenas ${progress.toFixed(1)}% da sua meta. Considere disparar uma promoção relâmpago no WhatsApp para os clientes inativos.`,
                    impact: 'alto',
                    type: 'recovery'
                })
            } else if (progress > 80) {
                newInsights.push({
                    title: "Meta Quase Batida!",
                    description: `Faltam apenas ${(100 - progress).toFixed(1)}% para sua meta mensal. Que tal um brinde especial para os próximos 5 pedidos?`,
                    impact: 'alto',
                    type: 'promotion'
                })
            }

            setInsights(newInsights)
        } catch (e) {
            console.error("Error fetching revenue data:", e)
        } finally {
            setLoading(false)
        }
    }, [tenantId, totalMes, ticketMedio, profile, business])

    const logChurnAttempt = async (reason: string, feedback: string, offerAccepted: string) => {
        if (!tenantId) return
        await supabase.from('revenue_churn_logs').insert({
            tenant_id: tenantId,
            user_id: profile?.id,
            reason,
            feedback,
            offer_accepted: offerAccepted
        })
    }

    const checkDailyGoal = async (currentTotal: number) => {
        if (!tenantId || !business?.config?.daily_goal) return
        
        const goal = business.config.daily_goal
        if (currentTotal >= goal) {
            // Log achievement if not already done today
            const today = new Date().toISOString().split('T')[0]
            const { data: existing } = await supabase
                .from('revenue_achievements')
                .select('id')
                .eq('tenant_id', tenantId)
                .eq('achievement_type', 'daily_goal')
                .gte('created_at', today)
                .maybeSingle()

            if (!existing) {
                await supabase.from('revenue_achievements').insert({
                    tenant_id: tenantId,
                    achievement_type: 'daily_goal',
                    target_value: goal,
                    current_value: currentTotal,
                    is_completed: true,
                    completed_at: new Date().toISOString()
                })
            }
        }
    }

    useEffect(() => {
        if (tenantId) {
            fetchRevenueData()
        }
    }, [tenantId, fetchRevenueData])

    return {
        insights,
        achievements,
        loading,
        logChurnAttempt,
        checkDailyGoal,
        refreshRevenue: fetchRevenueData
    }
}
