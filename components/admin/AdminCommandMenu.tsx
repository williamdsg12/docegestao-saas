"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import {
    Building2,
    Users,
    ShoppingCart,
    CreditCard,
    Settings,
    Search,
    LayoutDashboard,
    ShieldCheck,
    History,
    Package,
    Award,
    Headset,
    Bell
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export function AdminCommandMenu() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<{
        companies: any[]
        users: any[]
        orders: any[]
    }>({
        companies: [],
        users: [],
        orders: []
    })
    const [loading, setLoading] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        const toggle = () => setOpen((open) => !open)

        document.addEventListener("keydown", down)
        window.addEventListener("toggle-admin-search", toggle)
        
        return () => {
            document.removeEventListener("keydown", down)
            window.removeEventListener("toggle-admin-search", toggle)
        }
    }, [])

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false)
        command()
    }, [])

    React.useEffect(() => {
        if (!query || query.length < 2) {
            setResults({ companies: [], users: [], orders: [] })
            return
        }

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                // Search Companies
                const { data: companies } = await supabase
                    .from('empresas')
                    .select('id, name')
                    .ilike('name', `%${query}%`)
                    .limit(5)

                // Search Users
                const { data: users } = await supabase
                    .from('profiles')
                    .select('id, owner_name, email')
                    .or(`owner_name.ilike.%${query}%,email.ilike.%${query}%`)
                    .limit(5)

                // Search Orders
                const { data: orders } = await supabase
                    .from('pedidos')
                    .select('id, cliente_nome, status')
                    .or(`id.ilike.%${query}%,cliente_nome.ilike.%${query}%`)
                    .limit(5)

                setResults({
                    companies: companies || [],
                    users: users || [],
                    orders: orders || []
                })
            } catch (err) {
                console.error("Search error:", err)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    return (
        <CommandDialog 
            open={open} 
            onOpenChange={setOpen}
            title="Painel de Controle Admin"
            description="Navegação global e busca em tempo real de parceiros, usuários e transações."
        >
            <CommandInput 
                placeholder="Busque empresas, usuários, pedidos ou comandos..." 
                value={query}
                onValueChange={setQuery}
            />
            <CommandList className="max-h-[60vh] scrollbar-hide">
                <CommandEmpty>
                    {loading ? (
                        <div className="flex items-center justify-center py-6">
                            <div className="size-5 border-2 border-slate-800 border-t-primary rounded-full animate-spin" />
                            <span className="ml-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando...</span>
                        </div>
                    ) : (
                        "Nenhum resultado encontrado."
                    )}
                </CommandEmpty>
                
                {/* Quick Shortcuts */}
                <CommandGroup heading="Acesso Rápido">
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin"))} className="py-3">
                        <LayoutDashboard className="mr-3 h-4 w-4 text-indigo-400" />
                        <span className="font-bold uppercase italic text-xs tracking-tight">Dashboard Global</span>
                        <CommandShortcut>⌘D</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin/companies"))} className="py-3">
                        <Building2 className="mr-3 h-4 w-4 text-amber-500" />
                        <span className="font-bold uppercase italic text-xs tracking-tight">Gestão de Empresas</span>
                        <CommandShortcut>⌘E</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin/payments"))} className="py-3">
                        <CreditCard className="mr-3 h-4 w-4 text-emerald-500" />
                        <span className="font-bold uppercase italic text-xs tracking-tight">Financeiro / Pagamentos</span>
                        <CommandShortcut>⌘F</CommandShortcut>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator className="bg-white/5" />

                {/* Search Results */}
                {results.companies.length > 0 && (
                    <CommandGroup heading="Resultados: Empresas">
                        {results.companies.map((c) => (
                            <CommandItem key={c.id} onSelect={() => runCommand(() => router.push(`/admin/companies/${c.id}`))}>
                                <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center mr-3">
                                    <Building2 className="h-4 w-4 text-amber-500" />
                                </div>
                                <span className="font-black italic uppercase text-xs">{c.name}</span>
                                <CommandShortcut className="text-[10px]">Empresa</CommandShortcut>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {results.users.length > 0 && (
                    <CommandGroup heading="Resultados: Usuários">
                        {results.users.map((u) => (
                            <CommandItem key={u.id} onSelect={() => runCommand(() => router.push(`/admin/users/${u.id}`))}>
                                <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mr-3">
                                    <Users className="h-4 w-4 text-emerald-500" />
                                </div>
                                <span className="font-black italic uppercase text-xs">{u.owner_name}</span>
                                <CommandShortcut className="text-[10px] opacity-50">{u.email}</CommandShortcut>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {results.orders.length > 0 && (
                    <CommandGroup heading="Resultados: Pedidos">
                        {results.orders.map((o) => (
                            <CommandItem key={o.id} onSelect={() => runCommand(() => router.push(`/admin/orders/${o.id}`))}>
                                <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center mr-3">
                                    <ShoppingCart className="h-4 w-4 text-indigo-500" />
                                </div>
                                <span className="font-black italic uppercase text-xs">#{o.id.split('-')[0]} - {o.cliente_nome}</span>
                                <CommandShortcut className="text-[10px] uppercase font-black text-indigo-400">{o.status}</CommandShortcut>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                <CommandSeparator className="bg-white/5" />

                {/* Modules */}
                <CommandGroup heading="Módulos do Sistema">
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin/support"))}>
                        <Headset className="mr-3 h-4 w-4 text-pink-500" />
                        <span className="font-bold uppercase italic text-[11px]">Suporte / Tickets</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin/plans"))}>
                        <Package className="mr-3 h-4 w-4 text-purple-400" />
                        <span className="font-bold uppercase italic text-[11px]">Gestão de Planos</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin/afiliados"))}>
                        <Award className="mr-3 h-4 w-4 text-amber-400" />
                        <span className="font-bold uppercase italic text-[11px]">Programa de Afiliados</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin/settings"))}>
                        <Settings className="mr-3 h-4 w-4 text-slate-400" />
                        <span className="font-bold uppercase italic text-[11px]">Configurações Globais</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
