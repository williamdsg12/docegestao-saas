"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Hook to track and update courier GPS location
 * @param courierId The ID of the courier to track
 * @param companyId The ID of the company
 */
export function useCourierTracker(courierId: string | null, companyId: string | null) {
  const [tracking, setTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courierId || !companyId || !("geolocation" in navigator)) {
      return
    }

    let watchId: number

    const startTracking = () => {
      setTracking(true)
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords
          
          try {
            // Update location in Supabase
            // We use upsert or just insert into history
            const { error: dbError } = await supabase
              .from('entregador_localizacao')
              .insert({
                entregador_id: courierId,
                latitude,
                longitude,
                precisao: accuracy,
                updated_at: new Date().toISOString()
              })

            if (dbError) throw dbError

            // Optionally update the courier's current status if needed
          } catch (err: any) {
            console.error("Error updating location:", err.message)
            setError(err.message)
          }
        },
        (err) => {
          console.error("Geolocation error:", err.message)
          setError(err.message)
          setTracking(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    }

    startTracking()

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
      setTracking(false)
    }
  }, [courierId, companyId])

  return { tracking, error }
}
