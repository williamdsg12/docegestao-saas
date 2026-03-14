const { chromium } = require('playwright');

async function scrapeIfood(url) {
  console.log(`Buscando dados de: ${url}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    geolocation: { longitude: -46.655881, latitude: -23.561414 },
    permissions: ['geolocation']
  });
  const page = await context.newPage();

  let catalogData = null;

  // Intercept network requests
  page.on('response', async (response) => {
    const resUrl = response.url();
    if (resUrl.includes('ifood.com.br') || resUrl.includes('graphql')) {
        try {
            const body = await response.json();
            if (body && (body.data?.catalog || body.categories || body.items || body.menu)) {
                console.log(`\n🍔 ENCONTROU DADOS NO ENDPOINT: ${resUrl} 🍔`);
                catalogData = body;
            } else if (resUrl.includes('catalog') || resUrl.includes('merchants')) {
                console.log(`🔍 Investigando endpoint: ${resUrl}`);
            }
        } catch(e) {
            // ignore
        }
    }
  });

  try {
    // Navigate to the home page first
    console.log('Obtendo sessão inicial e configurando endereço...');
    await page.goto('https://www.ifood.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for address input and type
    await page.waitForSelector('input.search-input', { timeout: 10000 }).catch(() => null);
    
    // Some iFood versions have a different address input, let's try a generic approach
    try {
        await page.click('[data-test-id="address-button"]', { timeout: 5000 });
    } catch(e) {}
    
    try {
        await page.fill('input[placeholder*="endereço"], input[type="text"]', 'Avenida Paulista, 1578');
        await page.waitForTimeout(1000);
        
        // Wait for suggestions and click the first one
        await page.waitForSelector('[data-test-id="address-suggestion"]', { timeout: 5000 });
        await page.click('[data-test-id="address-suggestion"]');
        await page.waitForTimeout(2000);
        
        // Sometimes there's a confirm button for number
        await page.fill('input[name="addressNumber"]', '1578');
        await page.click('button:has-text("Confirmar"), button:has-text("Salvar")');
        await page.waitForTimeout(2000);
    } catch(e) {
        console.log('Não foi possível fazer o fluxo completo de endereço via UI, prosseguindo...', e.message);
    }

    console.log('Navigating to restaurant page...');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Give it time to load the catalog
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 4));
    await page.waitForTimeout(3000);

    // Check for SSR data if network interception missed it
    if (!catalogData) {
        const nextData = await page.$eval('script#__NEXT_DATA__', el => el.textContent).catch(() => null);
        if (nextData) {
            console.log('📦 ENCONTROU DADOS SSR (__NEXT_DATA__) 📦');
            const parsed = JSON.parse(nextData);
            const props = parsed.props?.pageProps || parsed.props?.initialProps?.pageProps;
            if (props && props.initialState) {
                const state = props.initialState;
                const menuData = Object.keys(state).find(k => k.includes('menu') || k.includes('catalog'));
                if (menuData) {
                    catalogData = state[menuData];
                } else {
                    catalogData = state;
                }
            } else {
                catalogData = parsed;
            }
        }
    }

  } catch (err) {
    console.error('Error during navigation:', err.message);
  } finally {
    console.log('Current URL:', page.url());
    console.log('Page Title:', await page.title());
    await page.screenshot({ path: 'ifood_debug_2.png' });
    console.log('📸 Screenshot saved as ifood_debug_2.png');
    await browser.close();
  }

  if (catalogData) {
      console.log('✅ SUCESSO! Dados brutos capturados.');
      const strData = JSON.stringify(catalogData);
      console.log('Tamanho do JSON:', strData.length, 'caracteres');
      require('fs').writeFileSync('ifood_dump.json', strData);
      console.log('Salvo em ifood_dump.json para inspeção.');
      return catalogData;
  } else {
      console.log('❌ FALHA! Não foi possível extrair dados.');
      return null;
  }
}

const testUrl = 'https://www.ifood.com.br/delivery/sao-paulo-sp/bacio-di-latte---itaim-bibi-itaim-bibi/2b62dff9-abdf-4d69-a1b7-4a0b387cf0ff';
scrapeIfood(testUrl).then(data => {
    if(data) {
        console.log("Teste finalizado.");
    }
});
