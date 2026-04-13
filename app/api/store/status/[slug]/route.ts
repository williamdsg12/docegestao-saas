import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getStoreStatus } from "@/lib/storeStatus";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Fetch store settings by slug (joining with tenants or companies)
    // We try multiple lookups to ensure we find it.
    
    // First: by companies.menu_slug
    const { data: company } = await supabase
      .from('companies')
      .select('id, menu_slug')
      .eq('menu_slug', slug)
      .maybeSingle();

    let targetId = company?.id;

    // Second: by tenants.slug
    if (!targetId) {
        const { data: tenant } = await supabase
            .from('tenants')
            .select('id, slug')
            .eq('slug', slug)
            .maybeSingle();
        targetId = tenant?.id;
    }

    if (!targetId) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // 2. Fetch the calculated settings from store_settings
    const { data: settings, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('store_id', targetId)
      .maybeSingle();

    if (error) throw error;

    // 3. Calculate status using the centralized logic
    const statusResult = getStoreStatus(settings);

    // 4. Return the synchronized status
    return NextResponse.json(statusResult);

  } catch (error: any) {
    console.error("API Status Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
