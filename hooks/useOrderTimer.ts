"use client"

import { useState, useEffect } from "react"

interface TimerResult {
  display: string   // "00:22 seg" | "08:52 min" | "1:23:10 h"
  seconds: number   // total de segundos decorridos
  isLate: boolean   // true se > 15 minutos
  isVeryLate: boolean // true se > 30 minutos
}

export function useOrderTimer(createdAt: string): TimerResult {
  const [elapsed, setElapsed] = useState<TimerResult>({
    display: "00:00 seg",
    seconds: 0,
    isLate: false,
    isVeryLate: false,
  })

  useEffect(() => {
    if (!createdAt) return

    const updateTimer = () => {
      const now = Date.now()

      // Garante parse correto mesmo sem sufixo Z (banco pode retornar sem timezone)
      const rawDate = createdAt.includes("Z") || createdAt.includes("+")
        ? createdAt
        : createdAt + "Z" // assume UTC se não tiver timezone

      const created = new Date(rawDate).getTime()

      // Proteção contra data inválida
      if (isNaN(created)) return

      // Sempre crescente — nunca negativo
      const seconds = Math.max(0, Math.floor((now - created) / 1000))

      let display: string
      if (seconds < 60) {
        display = `${String(seconds).padStart(2, "0")}:00 seg`
      } else if (seconds < 3600) {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} min`
      } else {
        const hours = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        display = `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} h`
      }

      setElapsed({
        display,
        seconds,
        isLate: seconds > 15 * 60,      // > 15 min = laranja
        isVeryLate: seconds > 30 * 60,  // > 30 min = vermelho
      })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [createdAt])

  return elapsed
}
