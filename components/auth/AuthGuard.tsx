"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { LoadingScreen } from "@/components/ui/LoadingScreen"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, loading, isAdmin, loadingSubscription } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Se ainda está carregando a sessão ou subscrição, não faz nada
    if (loading || loadingSubscription) return

    // 1. Se não houver usuário, redireciona para login
    if (!user) {
      console.log("[AuthGuard] Sem usuário, redirecionando para /login")
      router.replace(`/login?redirect=${pathname}`)
      return
    }

    // 2. Se exigir Admin e o usuário não for admin
    if (requireAdmin && !isAdmin) {
      console.log("[AuthGuard] Acesso negado: Requer Admin. Redirecionando para /dashboard")
      router.replace("/dashboard")
      return
    }

    // 3. Caso contrário, está autorizado
    setAuthorized(true)
  }, [user, loading, isAdmin, loadingSubscription, requireAdmin, router, pathname])

  // Se ainda estiver carregando ou não autorizado, mostra a tela de loading
  if (loading || loadingSubscription || !authorized) {
    return <LoadingScreen />
  }

  // Se for admin tentando acessar dashboard comum e quisermos redirecionar (opcional)
  // Mas geralmente admins podem ver o dashboard comum.

  return <>{children}</>
}
