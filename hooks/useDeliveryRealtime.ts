"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export function useDeliveryRealtime(companyId: string) {
  const [newOrders, setNewOrders] = useState<any[]>([])
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const bell = new Audio("/sounds/novo-pedido.mp3")
      setAudio(bell)
    }
  }, [])

  const playNotification = useCallback(() => {
    if (audio) {
      console.log("Tentando reproduzir som de notificação...")
      audio.currentTime = 0
      audio.play().catch(e => {
        console.warn("Audio play blocked by browser. User must interact first.", e)
        toast.error("Áudio bloqueado! Clique em 'Ativar Som' no painel.")
      })
    } else {
      console.warn("Objeto de áudio não inicializado.")
    }
  }, [audio])

  const unlockAudio = useCallback(() => {
    if (audio) {
      audio.play().then(() => {
        audio.pause()
        audio.currentTime = 0
        toast.success("Áudio ativado com sucesso!")
      }).catch(e => console.error("Erro ao desbloquear áudio:", e))
    }
  }, [audio])

  useEffect(() => {
    if (!companyId || companyId === "") {
      console.log("useDeliveryRealtime: Aguardando ID da empresa...")
      return
    }

    const channel = supabase
      .channel("pedidos_v3_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pedidos",
          filter: `empresa_id=eq.${companyId}`,
        },
        (payload) => {
          if (payload.new.status === 'novo' || !payload.new.status) {
            playNotification()
            toast.success("🚨 NOVO PEDIDO RECEBIDO!", {
              description: `Cliente: ${payload.new.customer_name || 'Desconhecido'}. Verifique o painel.`,
              duration: 15000,
            })
          }
          setNewOrders((prev) => [payload.new, ...prev])
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: `empresa_id=eq.${companyId}`,
        },
        (payload) => {
          const oldStatus = payload.old?.status
          const newStatus = payload.new.status

          if (oldStatus !== newStatus) {
            toast.info(`Status Atualizado: ${newStatus.toUpperCase()}`, {
              description: `Pedido #${payload.new.id.slice(0, 8)}`,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, playNotification])

  return { newOrders, playNotification, unlockAudio }
}
