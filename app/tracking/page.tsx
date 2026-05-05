"use client"

import { useSearchParams } from "next/navigation"
import TrackingContent from "@/components/tracking/TrackingContent"

export default function TrackingPage() {
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
