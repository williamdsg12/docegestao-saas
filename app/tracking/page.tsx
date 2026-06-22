"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import TrackingContent from "@/components/tracking/TrackingContent"

function TrackingPageContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold">ID do pedido não fornecido.</h1>
      </div>
    )
  }

  return <TrackingContent orderId={orderId} />
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <TrackingPageContent />
    </Suspense>
  )
}
