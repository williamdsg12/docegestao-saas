const axios = require('axios');

async function testApi(merchantId) {
    const endpoints = [
        `https://marketplace.ifood.com.br/v2/merchants/${merchantId}/menu`,
        `https://marketplace.ifood.com.br/v1/merchants/${merchantId}/catalog`
    ];

    for (const url of endpoints) {
        console.log(`Testing API: ${url}`);
        try {
            const res = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*'
                }
            });
            console.log(`✅ Success for ${url}!`);
            const dataStr = JSON.stringify(res.data);
            console.log(`Payload size: ${dataStr.length}`);
            require('fs').writeFileSync('ifood_api_dump.json', dataStr);
            console.log('Saved to ifood_api_dump.json');
            return true;
        } catch(e) {
            console.log(`❌ Failed: ${e.message}`);
            if (e.response && e.response.status === 401) {
                console.log('Requires Authentication.');
            }
        }
    }
}

const merchantId = '2b62dff9-abdf-4d69-a1b7-4a0b387cf0ff';
testApi(merchantId);
