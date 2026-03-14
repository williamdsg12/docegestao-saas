import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import axios from 'axios';
// Using nodejs runtime to allow heavy operations like scraping
export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Deterministic iFood Scraper
 * Tries to fetch the SSR payload containing the exact menu catalog.
 */
async function scrapeIfoodCatalog(url: string) {
  try {
    // Attempt 1: Fast Axios fetch to parse __NEXT_DATA__
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const nextDataScript = $('#__NEXT_DATA__').html();

    if (nextDataScript) {
      const parsed = JSON.parse(nextDataScript);
      const props = parsed.props?.pageProps || parsed.props?.initialProps?.pageProps;
      const state = props?.initialState;
      
      if (state && state.restaurant?.menu) {
        // Exclude huge useless data, just return the menu and restaurant details
        return {
           restaurant: state.restaurant.details?.name || 'Restaurante',
           menu: state.restaurant.menu,
        };
      }
    }
  } catch (error: any) {
    console.warn(`Scrape Warning: Axios failed to fetch iFood page (${error.message})`);
  }

  // Attempt 2: Playwright Headless 
  // (Note: Requires playwright to be installed. We'll try to require it dynamically)
  try {
     const { chromium } = require('playwright');
     if (chromium) {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();
        
        let catalog = null;
        page.on('response', async (res: any) => {
            if (res.url().includes('ifood.com.br') || res.url().includes('graphql')) {
                try {
                    const body = await res.json();
                    if (body && (body.data?.catalog || body.categories || body.items || body.menu)) {
                        catalog = body;
                    }
                } catch(e) {}
            }
        });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
        
        const nextData = await page.$eval('script#__NEXT_DATA__', (el: any) => el.textContent).catch(() => null);
        if (nextData && !catalog) {
             const parsed = JSON.parse(nextData);
             const props = parsed.props?.pageProps || parsed.props?.initialProps?.pageProps;
             if (props?.initialState?.restaurant?.menu) {
                 catalog = { menu: props.initialState.restaurant.menu };
             }
        }
        await browser.close();
        
        if (catalog) return catalog;
     }
  } catch(err: any) {
      console.warn(`Scrape Warning: Playwright fallback failed (${err.message})`);
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const { content: link } = await req.json();

    if (!link || typeof link !== 'string' || !link.includes('ifood.com.br')) {
      return NextResponse.json({ error: 'Link do iFood inválido' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Chave da API da OpenAI não configurada.' },
        { status: 500 }
      );
    }

    // 1. DETERMINISTIC SCRAPE (Passo 1 a 4 do plano)
    const rawCatalogJson = await scrapeIfoodCatalog(link);

    // Se o scrape falhou ou iFood bloqueou (Passo 5 - Regra Crítica)
    if (!rawCatalogJson) {
      console.error("iFood import failed: No valid menu JSON found (blocked or empty).");
      return NextResponse.json(
        { error: 'NO_PRODUCTS_FOUND', message: 'Não foi possível extrair os dados reais do iFood no momento. O acesso foi bloqueado ou a loja não possui produtos visíveis.' },
        { status: 422 }
      );
    }

    // 2. AI NORMALIZATION (Passo 5 - Proteção contra alucinação)
    // Opcional: limitar o JSON para não exceder limites de token caso seja massivo
    const jsonString = JSON.stringify(rawCatalogJson).substring(0, 100000); 

    const systemPrompt = `Você é um excelente formatador de dados JSON.
Sua ÚNICA missão é converter o JSON bruto de cardápio do iFood fornecido para o formato estruturado do nosso sistema interno.

REGRAS OBRIGATÓRIAS DE PROTEÇÃO CONTRA ALUCINAÇÃO:
1 - Use EXATAMENTE E APENAS os dados presentes no JSON extraído fornecido pelo usuário.
2 - NUNCA, sob nenhuma hipótese, crie produtos novos ou invente categorias.
3 - NUNCA altere nomes de produtos, categorias ou descrições (traduza nulo para vazio).
4 - NUNCA invente preços ou imagens. Use apenas os valores presentes no JSON bruto.
5 - Se o JSON estiver vazio ou não contiver itens/produtos, você DEVE retornar o texto exato: "NO_PRODUCTS_FOUND".

A saída DEVE ser estritamente esse formato JSON:
{
  "is_bulk": true,
  "categories": [
    {
      "name": "Nome da Categoria Existente",
      "products": [
        {
          "name": "Nome exato",
          "description": "Descrição exata",
          "price": 24.50,
          "image_url": "URL da foto se existir no json, senao mande vazio"
        }
      ]
    }
  ]
}

- A chave raiz deve ser \`categories\`, que é um array.
- Não inclua markdown (como \`\`\`json). Retorne apenas o JSON limpo.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Aqui está o JSON cru interceptado no iFood:\n\n${jsonString}` 
        }
      ],
      temperature: 0.0, // Strict adherence to instructions
      max_tokens: 4000,
    });

    const gptContent = response.choices[0].message.content?.trim() || '';

    // Verifica a regra de fallback da IA
    if (gptContent.includes('NO_PRODUCTS_FOUND') || gptContent === 'NO_PRODUCTS_FOUND') {
         return NextResponse.json(
            { error: 'NO_PRODUCTS_FOUND', message: 'Nenhum produto real encontrado no link informado.' },
            { status: 422 }
         );
    }

    let extractedData;
    try {
      extractedData = JSON.parse(gptContent);
      return NextResponse.json({ data: extractedData });
    } catch (parseError) {
      console.error("OpenAI não retornou um JSON válido:", gptContent);
      return NextResponse.json({ error: 'Erro ao formatar catálogo extraído' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro na rota de importação determinística:', error);
    return NextResponse.json(
      { error: 'Erro interno no processamento', details: error.message },
      { status: 500 }
    );
  }
}
