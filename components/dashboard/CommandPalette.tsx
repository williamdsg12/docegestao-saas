"use client"

import * as React from "react"
import {
  Calendar,
  Calculator,
  ShoppingBag,
  Plus,
  Search,
  Settings,
  UtensilsCrossed,
  Package,
  ArrowRight,
  TrendingUp,
  Users,
} from "lucide-react"
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
import { supabase } from "@/lib/supabase"
import { useBusiness } from "@/hooks/useBusiness"
import { useAuth } from "@/hooks/useAuth"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = React.useState("")
  const [recipes, setRecipes] = React.useState<any[]>([])
  const [ingredients, setIngredients] = React.useState<any[]>([])
  const [orders, setOrders] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()
  const { profile } = useBusiness()
  const { user } = useAuth()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Basic initial fetch for recent items
  React.useEffect(() => {
    if (open && profile?.tenant_id) {
       fetchData()
    }
  }, [open, profile])

  async function fetchData() {
    const tenantId = profile?.tenant_id || profile?.company_id
    if (!tenantId) return

    setLoading(true)
    try {
      const [resRecipes, resIng, resOrders] = await Promise.all([
        supabase.from("receitas").select("id, nome").eq("user_id", user?.id).limit(5),
        supabase.from("ingredientes").select("id, nome").eq("user_id", user?.id).limit(5),
        supabase.from("orders").select("id, product_name, customers(name)").eq("tenant_id", tenantId).order('created_at', { ascending: false }).limit(5)
      ])

      setRecipes(resRecipes.data || [])
      setIngredients(resIng.data || [])
      setOrders(resOrders.data || [])
    } finally {
      setLoading(false)
    }
  }

  const runCommand = React.useCallback((command: () => void) => {
    onOpenChange(false)
    command()
  }, [onOpenChange])

  return (
    <>
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput 
          placeholder="O que você precisa agora? (Ex: Bolo, Brigadeiro, Pedidos...)" 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList className="max-h-[450px] scrollbar-thin scrollbar-thumb-slate-200">
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
          <CommandGroup heading="Ações Rápidas">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/pedidos"))}>
              <Plus className="mr-2 h-4 w-4 text-rose-500" />
              <span>Novo Pedido</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/precificacao-inteligente"))}>
              <Calculator className="mr-2 h-4 w-4 text-blue-500" />
              <span>Calcular Preço / Ficha Técnica</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/estoque"))}>
              <Package className="mr-2 h-4 w-4 text-emerald-500" />
              <span>Adicionar ao Estoque</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navegação">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
               <TrendingUp className="mr-2 h-4 w-4" />
               <span>Dashboard Principal</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/pedidos"))}>
               <ShoppingBag className="mr-2 h-4 w-4" />
               <span>Gerenciar Pedidos</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/clientes"))}>
               <Users className="mr-2 h-4 w-4" />
               <span>Lista de Clientes</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/financeiro"))}>
               <ArrowRight className="mr-2 h-4 w-4" />
               <span>Fluxo de Caixa</span>
            </CommandItem>
          </CommandGroup>

          {recipes.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Suas Receitas">
                {recipes.map((recipe) => (
                  <CommandItem
                    key={recipe.id}
                    onSelect={() => runCommand(() => router.push(`/dashboard/precificacao-inteligente?id=${recipe.id}`))}
                  >
                    <UtensilsCrossed className="mr-2 h-4 w-4 text-orange-500" />
                    <span>{recipe.nome}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {orders.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Pedidos Recentes">
                {orders.map((order) => (
                  <CommandItem
                    key={order.id}
                    onSelect={() => runCommand(() => router.push("/dashboard/pedidos"))}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4 text-rose-400" />
                    <div className="flex flex-col">
                       <span className="font-bold">{order.product_name}</span>
                       <span className="text-[10px] text-slate-400 font-medium">Cliente: {order.customers?.name || 'Comum'}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          
          <CommandGroup heading="Configurações">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings/profile"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações do Perfil</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/assinatura"))}>
              <ArrowRight className="mr-2 h-4 w-4" />
              <span>Minha Assinatura / Upgrade</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>

        <div className="flex items-center justify-between border-t border-slate-100 p-3 bg-slate-50/50">
           <p className="text-[9px] font-black uppercase text-slate-400 italic">Doce Gestão • Intelligent Search</p>
           <div className="flex gap-2">
              <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[8px] font-black text-slate-500 shadow-sm">ESC fechar</span>
              <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[8px] font-black text-slate-500 shadow-sm">ENTER selecionar</span>
           </div>
        </div>
      </CommandDialog>
    </>
  )
}
