"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RestaurantTablesDashboard() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/dashboard/pedidos?tab=mesas")
  }, [router])

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1a56db] border-t-transparent"></div>
        <p className="text-xs font-bold text-slate-400 uppercase italic tracking-widest animate-pulse">Redirecionando para o Módulo Operacional...</p>
      </div>
    </div>
  )
}
