"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

export function AdminBreadcrumbs() {
    const pathname = usePathname()
    const paths = pathname.split('/').filter(Boolean)

    if (paths.length === 0) return null

    return (
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 overflow-hidden whitespace-nowrap">
            <Link 
                href="/admin" 
                className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 shrink-0"
            >
                <Home className="size-3.5" />
                <span className="hidden sm:inline">Admin</span>
            </Link>

            {paths.slice(1).map((path, index) => {
                const href = `/${paths.slice(0, index + 2).join('/')}`
                const isLast = index === paths.length - 2
                const label = path === 'companies' ? 'Empresas' : 
                              path === 'users' ? 'Usuários' :
                              path === 'payments' ? 'Financeiro' :
                              path === 'subscriptions' ? 'Assinaturas' :
                              path === 'plans' ? 'Planos' :
                              path === 'support' ? 'Suporte' :
                              path === 'stats' ? 'Estatísticas' :
                              path.charAt(0).toUpperCase() + path.slice(1)

                return (
                    <div key={path} className="flex items-center gap-2 shrink-0">
                        <ChevronRight className="size-3 opacity-30" />
                        {isLast ? (
                            <span className="text-white italic truncate max-w-[150px]">{label}</span>
                        ) : (
                            <Link 
                                href={href} 
                                className="hover:text-indigo-400 transition-colors truncate max-w-[100px]"
                            >
                                {label}
                            </Link>
                        )}
                    </div>
                )
            })}
        </nav>
    )
}
