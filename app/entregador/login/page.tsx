"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Truck, Lock, Mail, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export default function DriverLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos")
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Verify profile role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile || profile.role !== 'delivery_driver') {
        // Sign out if not a delivery driver
        await supabase.auth.signOut()
        throw new Error("Acesso restrito: Esta conta não possui permissão de entregador.")
      }

      toast.success("Login efetuado com sucesso!")
      router.push('/entregador')
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 bg-pink-500 rounded-3xl flex items-center justify-center text-white mb-3 shadow-lg shadow-pink-500/20">
            <Truck className="size-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
            Doce<span className="text-pink-500">Gestão</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.26em] mt-1.5 italic">
            Área do Entregador
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md rounded-[32px] overflow-hidden shadow-2xl p-6 sm:p-8">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl font-black text-white uppercase italic tracking-tight">Entrar no painel</CardTitle>
            <CardDescription className="text-slate-400 text-xs font-bold font-sans">
              Entre com seu e-mail e senha cadastrados pelo gerente.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-12 pl-12 rounded-xl bg-slate-950/60 border-slate-800 text-white font-bold placeholder-slate-600 focus-visible:ring-pink-500 focus-visible:border-pink-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 pl-12 pr-12 rounded-xl bg-slate-950/60 border-slate-800 text-white font-bold placeholder-slate-600 focus-visible:ring-pink-500 focus-visible:border-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl shadow-pink-500/10"
              >
                {loading ? "Entrando..." : "Acessar Painel"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
