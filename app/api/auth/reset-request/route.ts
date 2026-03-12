import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()
        if (!email) {
            return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // No Supabase, a solicitação de redefinição de senha é feita nativamente por email
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${new URL(req.url).origin}/recuperar-senha`,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ message: "Link de redefinição enviado para seu email!" })
    } catch (err) {
        console.error("Reset request error:", err)
        return NextResponse.json({ error: "Erro ao processar sua solicitação." }, { status: 500 })
    }
}
