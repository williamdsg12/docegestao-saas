import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { 
        userId, 
        companyId, 
        tenantId, 
        items, 
        total, 
        supplier, 
        date, 
        documentId 
    } = await req.body ? await req.json() : {}

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Dados de itens inválidos' }, { status: 400 })
    }

    console.log(`Finalizing import for company ${companyId}...`);

    // 1. Update/Add Ingredients in Stock
    for (const item of items) {
      if (!item.name) continue;

      // Check if ingredient exists by name (case-insensitive) for this tenant
      const { data: existing } = await supabaseAdmin
        .from('ingredients')
        .select('id, current_quantity')
        .ilike('name', item.name)
        .eq('company_id', companyId)
        .maybeSingle();

      if (existing) {
        // Update existing ingredient
        const newQty = (existing.current_quantity || 0) + (item.quantity || 0);
        await supabaseAdmin
            .from('ingredients')
            .update({ 
                current_quantity: newQty,
                purchase_price: item.price_total / (item.quantity || 1) // Store unit price
            })
            .eq('id', existing.id);
      } else {
        // Create new ingredient
        await supabaseAdmin
            .from('ingredients')
            .insert({
                company_id: companyId,
                tenant_id: tenantId,
                name: item.name,
                current_quantity: item.quantity || 0,
                unit: item.unit || 'un',
                purchase_price: (item.price_total || 0) / (item.quantity || 1),
                category: 'Importado via Nota'
            });
      }
    }

    // 2. Create Financial Record (Transaction)
    await supabaseAdmin
        .from('transactions')
        .insert({
            user_id: userId,
            company_id: companyId,
            description: `Compra: ${supplier || 'Nota Fiscal'}`,
            amount: total || 0,
            type: 'saida',
            category: 'Ingredientes',
            transaction_date: date || new Date().toISOString().split('T')[0]
        });

    // 3. Update Purchase Document Status
    if (documentId) {
        await supabaseAdmin
            .from('purchase_documents')
            .update({ status: 'completed' })
            .eq('id', documentId);
    }

    return NextResponse.json({
        success: true,
        message: 'Estoque e financeiro atualizados com sucesso!'
    })

  } catch (error: any) {
    console.error('CONFIRM IMPORT ERROR:', error)
    return NextResponse.json({ 
      error: 'Erro ao confirmar importação',
      details: error.message 
    }, { status: 500 })
  }
}
