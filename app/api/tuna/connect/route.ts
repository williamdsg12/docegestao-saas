import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabaseAuth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
  }

  const client_id = process.env.TUNA_CLIENT_ID;
  const redirect_uri = process.env.TUNA_REDIRECT_URI;

  if (!client_id || !redirect_uri) {
    return NextResponse.json({ error: "Configuração Tuna ausente (Client ID ou Redirect URI)" }, { status: 500 });
  }

  // Tuna OAuth Auth Page
  // We pass the tenantId in the 'state' parameter to retrieve it in the callback
  const url = `https://api.tuna.com.br/oauth/authorize?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&state=${tenantId}`;

  return NextResponse.redirect(url);
}
