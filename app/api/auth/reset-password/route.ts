import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const { password } = await req.json()
        if (!password)
            return NextResponse.json({ error: "Nova senha é obrigatória" }, { status: 400 })

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Atualiza o usuário com a nova senha
        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ message: "Sua senha foi redefinida com sucesso!" })
    } catch (err) {
        console.error("Reset password error:", err)
        return NextResponse.json({ error: "Erro ao redefinir sua senha. Tente novamente." }, { status: 500 })
    }
}
