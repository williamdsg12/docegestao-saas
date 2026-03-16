"use client"

import { useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Hook to automatically update courier GPS location
 * @param courierId - The ID of the authenticated courier
 * @param intervalMs - Update frequency (defaults to 5000ms as per requirements)
 */
export function useCourierGPS(courierId: string | undefined, intervalMs: number = 5000) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!courierId) return

    const updateLocation = () => {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser.")
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords
          
          try {
            const { error } = await supabase
              .from('entregador_localizacao')
              .upsert({
                entregador_id: courierId,
                latitude,
                longitude,
                precisao: accuracy,
                updated_at: new Date().toISOString()
              }, { onConflict: 'entregador_id' })
            
            if (error) throw error
          } catch (err) {
            console.error("Error updating GPS location:", err)
          }
        },
        (error) => {
          console.error("Error getting geolocation:", error.message)
        }
      )
    }

    // Initial update
    updateLocation()

    // Setup interval
    intervalRef.current = setInterval(updateLocation, intervalMs)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [courierId, intervalMs])

  return null
}
