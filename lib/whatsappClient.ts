import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';

// Global scope to prevent multiple instances during hot-reloading in development
declare global {
  var whatsappClient: Client | undefined;
  var whatsappQR: string | null;
  var whatsappStatus: 'DISCONNECTED' | 'QR_READY' | 'AUTHENTICATING' | 'CONNECTED';
}

if (!global.whatsappStatus) {
  global.whatsappStatus = 'DISCONNECTED';
  global.whatsappQR = null;
}

export const getWhatsAppClient = () => {
  if (global.whatsappClient) {
    return global.whatsappClient;
  }

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
  });

  client.on('qr', async (qr) => {
    console.log('WhatsApp QR Code received');
    try {
      const qrDataUrl = await qrcode.toDataURL(qr);
      global.whatsappQR = qrDataUrl;
      global.whatsappStatus = 'QR_READY';
    } catch (err) {
      console.error('Failed to generate QR code', err);
    }
  });

  client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    global.whatsappStatus = 'CONNECTED';
    global.whatsappQR = null;
  });

  client.on('authenticated', () => {
    console.log('WhatsApp Authenticated!');
    global.whatsappStatus = 'AUTHENTICATING';
  });

  client.on('auth_failure', () => {
    console.error('WhatsApp Authentication failed');
    global.whatsappStatus = 'DISCONNECTED';
    global.whatsappQR = null;
  });

  client.on('disconnected', () => {
    console.log('WhatsApp Client disconnected');
    global.whatsappStatus = 'DISCONNECTED';
    global.whatsappQR = null;
    global.whatsappClient = undefined;
    
    // Optionally restart
    // setTimeout(() => getWhatsAppClient().initialize(), 5000);
  });

  global.whatsappClient = client;
  
  // Start the client
  client.initialize().catch(err => {
    console.error('Failed to initialize WhatsApp client:', err);
    global.whatsappStatus = 'DISCONNECTED';
  });

  return client;
};

export const getWhatsAppStatus = () => {
  return {
    status: global.whatsappStatus,
    qr: global.whatsappQR
  };
};

export const logoutWhatsApp = async () => {
  if (global.whatsappClient) {
    try {
      await global.whatsappClient.logout();
    } catch (e) {
      console.error(e);
    }
    global.whatsappStatus = 'DISCONNECTED';
    global.whatsappQR = null;
    global.whatsappClient = undefined;
  }
};
