const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeWithAxios(url) {
    try {
        console.log(`Fetching HTML from: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            }
        });

        const html = response.data;
        console.log(`Received HTML size: ${html.length} bytes`);

        const $ = cheerio.load(html);
        const nextDataScript = $('#__NEXT_DATA__').html();

        if (nextDataScript) {
            console.log('✅ Found __NEXT_DATA__ script!');
            const nextData = JSON.parse(nextDataScript);
            
            // Analyze the props
            const props = nextData.props?.pageProps || nextData.props?.initialProps?.pageProps;
            const state = props?.initialState;
            
            if (state) {
                const menuData = Object.keys(state).find(k => k.includes('menu') || k.includes('catalog') || k.includes('restaurant'));
                console.log('Keys in initial state:', Object.keys(state).slice(0, 10), '...');
                
                if (state.restaurant?.menu) {
                     console.log(`Found menu with ${state.restaurant.menu.length} categories!`);
                     return state.restaurant.menu;
                }
            }
            
            require('fs').writeFileSync('ifood_axios_dump.json', JSON.stringify(nextData, null, 2));
            console.log('Saved raw next data to ifood_axios_dump.json');
        } else {
            console.log('❌ __NEXT_DATA__ not found in HTML.');
        }

    } catch (e) {
        console.error('Error fetching URL:', e.message);
        if (e.response) {
            console.error('Status code:', e.response.status);
        }
    }
}

// Test URL
const testUrl = 'https://www.ifood.com.br/delivery/sao-paulo-sp/bacio-di-latte---itaim-bibi-itaim-bibi/2b62dff9-abdf-4d69-a1b7-4a0b387cf0ff';
scrapeWithAxios(testUrl);
