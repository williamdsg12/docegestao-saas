"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function TrackerContent() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')

  useEffect(() => {
    if (ref) {
      console.log("[AffiliateTracker] Capturing referral code:", ref)
      
      const expiryDays = 30
      const expiry = new Date().getTime() + (expiryDays * 24 * 60 * 60 * 1000)
      
      const data = {
        code: ref,
        expiry: expiry
      }
      
      localStorage.setItem('affiliate_ref', JSON.stringify(data))
    }
  }, [ref])

  return null
}

export function AffiliateTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerContent />
    </Suspense>
  )
}
