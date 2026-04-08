"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

export function useAffiliateTracking() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      // Store reference code in localStorage for 30 days (simplified expiration)
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + 30)
      
      const affiliateData = {
        code: ref,
        expiry: expirationDate.getTime()
      }
      
      localStorage.setItem('affiliate_ref', JSON.stringify(affiliateData))
      console.log("Affiliate reference captured:", ref)
    }
  }, [searchParams])

  return null
}
