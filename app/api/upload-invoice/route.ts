import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const companyId = formData.get('companyId') as string
    const tenantId = formData.get('tenantId') as string

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    console.log('1. Starting upload to Supabase Storage...');
    const fileName = `${companyId || 'global'}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('invoices')
      .upload(fileName, file)

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return NextResponse.json({ error: `Erro no upload: ${uploadError.message}` }, { status: 500 })
    }
    console.log('2. Upload success:', uploadData.path);

    // 2. Prepare Base64 for OpenAI (More reliable than Public URL)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = file.type;
    console.log(`3. Base64 Prepared (${mimeType})`);

    console.log('4. Calling OpenAI Vision (Model: gpt-4o)...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest model with vision support
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analise esta nota fiscal e extraia os dados estruturados. 
              Retorne APENAS um objeto JSON válido seguindo este formato:
              {
                "supplier": "Nome do estabelecimento",
                "date": "YYYY-MM-DD",
                "total": 123.45,
                "items": [
                  {
                    "name": "Nome do produto/insumo",
                    "quantity": 10.5,
                    "unit": "un|g|kg|ml|l",
                    "price_total": 50.00
                  }
                ]
              }
              Regras:
              - Se o item for por peso, converta para a unidade mais próxima (g ou kg).
              - Se for por unidade, use 'un'.
              - Se não conseguir identificar a unidade, use 'un'.
              - O campo price_total é o valor total daquela linha (quantidade * preço unitário).` 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" }
    })
    console.log('5. OpenAI Response Received.');

    const parsedContent = JSON.parse(response.choices[0].message.content || '{}')
    console.log('6. OpenAI Parsed Result:', JSON.stringify(parsedContent, null, 2));

    // 5. Get Public URL for storage reference
    const { data: { publicUrl } } = supabaseAdmin.storage
        .from('invoices')
        .getPublicUrl(fileName)

    // 4. Save to purchase_documents (metadata)
    console.log('7. Logging to purchase_documents...');
    try {
        const { error: dbErr } = await supabaseAdmin.from('purchase_documents').insert({
            user_id: userId,
            company_id: companyId,
            tenant_id: tenantId,
            image_url: publicUrl,
            extracted_text: response.choices[0].message.content,
            parsed_json: parsedContent,
            total_amount: parsedContent.total,
            supplier: parsedContent.supplier,
            purchase_date: parsedContent.date ? new Date(parsedContent.date).toISOString() : new Date().toISOString(),
            status: 'processed'
        });
        if (dbErr) console.warn('⚠️ DB Log Warn:', dbErr.message);
    } catch (dbErr) {
        console.warn('⚠️ DB Log Catch:', dbErr);
    }
    console.log('8. Done!');

    return NextResponse.json({
        success: true,
        data: parsedContent,
        imageUrl: publicUrl
    })

  } catch (error: any) {
    console.error('CRITICAL OCR ERROR:', error)
    return NextResponse.json({ 
      error: 'Erro ao processar a nota fiscal',
      details: error.message 
    }, { status: 500 })
  }
}
