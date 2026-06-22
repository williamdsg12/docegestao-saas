"use client"

import { useParams } from "next/navigation"
import TrackingContent from "@/components/tracking/TrackingContent"

export default function TrackingOrderIdPage() {
  const { orderId } = useParams()
  const id = Array.isArray(orderId) ? orderId[0] : orderId

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold">ID do pedido não fornecido.</h1>
      </div>
    )
  }

  return <TrackingContent orderId={id} />
}
