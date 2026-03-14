const axios = require('axios');

async function testApi() {
    try {
        const res = await axios.post('http://localhost:3000/api/menu/import-product', {
            content: 'https://www.ifood.com.br/delivery/sao-paulo-sp/bacio-di-latte---itaim-bibi-itaim-bibi/not-real-id'
        });
        console.log("Success:", res.data);
    } catch(err) {
        console.log("Error status:", err.response?.status);
        console.log("Error data:", err.response?.data);
    }
}
testApi();
