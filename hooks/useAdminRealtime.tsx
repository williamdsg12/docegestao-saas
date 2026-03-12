"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export function useAdminRealtime(onUpdate: () => void) {
    useEffect(() => {
        console.log("DEBUG REALTIME: Subscribing to global changes...")

        // Subscribe to critical tables for admin real-time updates
        const channel = supabase
            .channel('admin-dashboard-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'profiles' },
                (payload: any) => {
                    console.log("DEBUG REALTIME: New profile registered!", payload)
                    toast.info("Novo usuário registrado!", { 
                        description: payload.new.owner_name || "Uma nova confeiteira se juntou à plataforma." 
                    })
                    onUpdate()
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'payments' },
                (payload: any) => {
                    console.log("DEBUG REALTIME: New payment received!", payload)
                    toast.success("Novo pagamento confirmado!", {
                        description: `Recebido: R$ ${payload.new.amount}`
                    })
                    onUpdate()
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'companies' },
                (payload: any) => {
                    console.log("DEBUG REALTIME: New company registered!", payload)
                    toast.success("Nova empresa cadastrada!", { 
                        description: payload.new.name || "Uma nova confeitaria iniciou sua jornada." 
                    })
                    onUpdate()
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'support_tickets' },
                (payload: any) => {
                    console.log("DEBUG REALTIME: New support ticket!", payload)
                    toast.message("Novo chamado de suporte", {
                        description: payload.new.subject
                    })
                    onUpdate()
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'subscriptions' },
                (payload: any) => {
                    console.log("DEBUG REALTIME: Subscription updated!", payload)
                    onUpdate()
                }
            )
            .subscribe((status: any) => {
                console.log("DEBUG REALTIME: Subscription status:", status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [onUpdate])
}
