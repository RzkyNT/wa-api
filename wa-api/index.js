import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateQuickReplyButtons,
    generateInteractiveListMessage,
    generateCombinedButtons,
    generateUrlButtonMessage,
    generateCopyCodeButton
} from 'baileys-joss';
import express from 'express';
import axios from 'axios';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { config } from './config.js';

const app = express();
app.use(express.json());

// --- MIDDLEWARE KEAMANAN (API KEY) ---
const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (config.api_key && apiKey !== config.api_key) {
        return res.status(401).json({ error: 'Unauthorized: API Key tidak valid atau tidak ditemukan' });
    }
    next();
};

app.use('/api', verifyApiKey); // Terapkan keamanan pada semua route /api/*

const logger = pino({ level: 'info' });
let sock = null;
let isConnected = false;
let isPairingRequested = false;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(config.auth_folder);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: config.use_pairing_code ? false : true,
        logger: logger.child({ class: 'baileys' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    if (config.use_pairing_code && !sock.authState.creds.registered && !isPairingRequested) {
        if (!config.phone_number || config.phone_number === '628xxxxxxxx') {
            console.error('❌ ERROR: Masukkan nomor HP di config.js untuk menggunakan Pairing Code!');
        } else {
            isPairingRequested = true; // Tandai agar tidak dipanggil ulang
            const phoneNumber = config.phone_number.replace(/[^0-9]/g, '');
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phoneNumber);
                    console.log('---------------------------------------');
                    console.log(`🔐 YOUR PAIRING CODE: ${code}`);
                    console.log('---------------------------------------');
                } catch (err) {
                    console.error('❌ Gagal mendapatkan pairing code:', err.message);
                    isPairingRequested = false; // Reset jika gagal agar bisa coba lagi
                }
            }, 3000);
        }
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !config.use_pairing_code) {
            console.log('--- SCAN QR CODE DI BAWAH INI ---');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            isConnected = false;
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('🔴 Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            isConnected = true;
            console.log('✅ WhatsApp Connected!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Kirim pesan ke webhook jika ada pesan masuk
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify' && messages.length > 0) {
            const msg = messages[0];
            if (!msg.key.fromMe && config.webhook_url) {
                try {
                    await axios.post(config.webhook_url, {
                        ...msg,
                        receivedAt: new Date().toISOString()
                    });
                    console.log('🔔 Webhook sent for message from', msg.key.remoteJid);
                } catch (err) {
                    console.error('❌ Webhook error:', err.message);
                }
            }
        }
    });

    return sock;
}

// --- REST API Endpoints ---

// Check Status
app.get('/api/status', (req, res) => {
    res.json({ connected: isConnected });
});

// Send Simple Text
app.post('/api/send-message', async (req, res) => {
    const { to, text } = req.body;
    if (!isConnected) return res.status(500).json({ error: 'WhatsApp not connected' });
    if (!to || !text) return res.status(400).json({ error: 'Missing "to" or "text"' });

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    try {
        await sock.sendMessage(jid, { text });
        res.json({ status: 'success', message: 'Sent!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Send Button (Baileys-Joss Style)
app.post('/api/send-button', async (req, res) => {
    const { to, text, buttons, footer, title } = req.body;
    if (!isConnected) return res.status(500).json({ error: 'WhatsApp not connected' });
    
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    try {
        const buttonMsg = generateQuickReplyButtons(
            text,
            buttons || [
                { id: 'id1', displayText: 'Button 1' },
                { id: 'id2', displayText: 'Button 2' }
            ],
            { footer, title }
        );
        await sock.sendMessage(jid, buttonMsg);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Send List (Baileys-Joss Style)
app.post('/api/send-list', async (req, res) => {
    const { to, title, buttonText, description, footer, sections } = req.body;
    if (!isConnected) return res.status(500).json({ error: 'WhatsApp not connected' });
    
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    try {
        const listMsg = generateInteractiveListMessage({
            title,
            buttonText,
            description,
            footer,
            sections
        });
        await sock.sendMessage(jid, listMsg);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Send Combined (URL, Call, Copy, Reply)
app.post('/api/send-combined', async (req, res) => {
    const { to, text, title, footer, actions } = req.body;
    // actions: [{ type: 'url', displayText: 'Buka Web', url: '...' }, { type: 'call', displayText: 'Panggil', phoneNumber: '...' }]
    if (!isConnected) return res.status(500).json({ error: 'WhatsApp not connected' });

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    try {
        const combined = generateCombinedButtons(text, actions, { title, footer });
        await sock.sendMessage(jid, combined);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server & Connect
app.listen(config.port, async () => {
    console.log(`🚀 REST API Server running on port ${config.port}`);
    await connectToWhatsApp();
});
