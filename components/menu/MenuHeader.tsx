"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle, Share2, Globe, AlertCircle, Clock, DollarSign, ChevronRight } from "lucide-react"

interface Store {
  name: string
  logo_url?: string
  cover_url?: string
  isOpen: boolean
  deliveryTime?: string
  minOrder?: number
}

export function MenuHeader({ store }: { store: Store }) {
  return (
    <div className="relative w-full bg-white">
      {/* 🖼️ IMAGEM DE CAPA — full width */}
      <div className="w-full h-[230px] overflow-hidden bg-gray-100 relative">
        {store.cover_url ? (
          <img
            src={store.cover_url}
            alt={store.name}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-50 to-amber-100 flex items-center justify-center text-gray-300 text-6xl">
            🍰
          </div>
        )}
      </div>

      {/* 🏪 INFO CONTENT — Centralized */}
      <div className="flex flex-col items-center -mt-10 px-4 relative z-20 pb-6">
        {/* LOGO — centralizado, sobreposto à capa */}
        <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-2xl">
              🎂
            </div>
          )}
        </div>

        {/* NOME DA LOJA */}
        <h1 className="mt-2 text-xl font-semibold text-center text-slate-900">
          {store.name}
        </h1>

        {/* BADGE STATUS */}
        <div className="mt-1">
          {store.isOpen ? (
            <span className="inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              ● Aberto
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              ● Fechado
            </span>
          )}
        </div>

        {/* INFO: tempo • mínimo • Ver mais */}
        <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
          <Clock className="size-3.5" /> 
          35-50 min • 💰 Mínimo R$ {store.minOrder?.toFixed(2)} •{' '}
          <span className="text-red-500 cursor-pointer hover:underline">Ver mais</span>
        </p>
      </div>
    </div>
  )
}
