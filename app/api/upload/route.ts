import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Use service role key to bypass RLS for admin uploads if needed, 
// or standard key if the bucket is public and user is authenticated.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload to 'receitas' bucket
    const { data, error } = await supabase.storage
      .from('receitas')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('receitas')
      .getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrl })

  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
