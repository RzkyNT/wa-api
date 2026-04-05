import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateQuickReplyButtons,
    generateInteractiveListMessage,
    generateCombinedButtons,
    generateUrlButtonMessage,
    generateCopyCodeButton,
    generateWAMessageFromContent,
    prepareWAMessageMedia
} from 'baileys-joss';
import express from 'express';
import axios from 'axios';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
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

const clearAuthSession = () => {
    if (fs.existsSync(config.auth_folder)) {
        console.log('🧹 Menghapus sesi lama yang bermasalah...');
        fs.rmSync(config.auth_folder, { recursive: true, force: true });
    }
};

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(config.auth_folder);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: config.use_pairing_code ? false : true,
        logger: logger.child({ level: 'error', class: 'baileys' }),
        browser: ['Windows', 'Edge', '110.0.1587.57']
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            if (config.use_pairing_code) {
                if (!sock.authState.creds.registered && !isPairingRequested) {
                    isPairingRequested = true;
                    const phoneNumber = config.phone_number.replace(/[^0-9]/g, '');
                    const customCode = config.custom_pairing_code ? config.custom_pairing_code.trim().toUpperCase().replace(/-/g, '') : null;
                    
                    setTimeout(async () => {
                        try {
                            let code;
                            if (customCode && customCode.length === 8) {
                                code = await sock.requestPairingCode(phoneNumber, customCode);
                            } else {
                                code = await sock.requestPairingCode(phoneNumber);
                            }
                            console.log('---------------------------------------');
                            console.log(`🔐 YOUR PAIRING CODE: ${code}`);
                            console.log('---------------------------------------');
                        } catch (err) {
                            console.error('❌ Gagal mendapatkan pairing code:', err.message);
                            isPairingRequested = false;
                        }
                    }, 3000);
                }
            } else {
                console.log('--- SCAN QR CODE DI BAWAH INI ---');
                qrcode.generate(qr, { small: true });
            }
        }

        if (connection === 'close') {
            isConnected = false;
            isPairingRequested = false;
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log('🔴 Connection closed. Reconnecting:', shouldReconnect);

            if (!shouldReconnect) {
                console.log('⚠️ Sesi telah Keluar (Logged Out).');
                clearAuthSession(); // Hapus otomatis folder session
            } else if (statusCode === 401 || statusCode === 403) {
                // Biasanya 401 atau 403 berarti session corrupt/expired
                console.log('⚠️ Sesi rusak atau kadaluarsa (Conflict/Expired).');
                clearAuthSession();
            }

            if (shouldReconnect) {
                console.log('🔄 Reconnecting in 3 seconds...');
                setTimeout(() => connectToWhatsApp(), 3000);
            }
        } else if (connection === 'open') {
            isConnected = true;
            isPairingRequested = false;
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
        // Hasilkan pesan interaktif mentah
        const buttonMsg = generateQuickReplyButtons(
            text,
            buttons || [
                { id: 'btn1', displayText: 'Button 1' },
                { id: 'btn2', displayText: 'Button 2' }
            ],
            { footer, title }
        );

        // Bungkus ulang secara manual untuk memastikan TIDAK dianggap media
        const finalMsg = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: { title: title || '', hasMediaAttachment: false },
                        body: { text: text },
                        footer: { text: footer || '' },
                        nativeFlowMessage: buttonMsg.message?.interactiveMessage?.nativeFlowMessage || {
                            buttons: buttons?.map(b => ({
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({ display_text: b.displayText, id: b.id })
                            })) || []
                        }
                    }
                }
            }
        };

        const result = await sock.relayMessage(jid, finalMsg, { messageId: sock.generateMessageTag() });
        res.json({ status: 'success', messageId: result });
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

        // Paksa sebagai viewOnce agar tidak error Media
        await sock.sendMessage(jid, { 
            viewOnceMessage: { 
                message: { 
                    ...listMsg.message 
                } 
            } 
        });

        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Send Combined (URL, Call, Copy, Reply)
app.post('/api/send-combined', async (req, res) => {
    const { to, text, title, footer, actions } = req.body;
    if (!isConnected) return res.status(500).json({ error: 'WhatsApp not connected' });

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    try {
        const combined = generateCombinedButtons(text, actions, { title, footer });
        await sock.sendMessage(jid, combined, { viewOnce: true });
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server & Connect
app.listen(config.port, async () => {
    console.log(`🚀 REST API Server running on port ${config.port}`);
    if (config.force_fresh_session) {
        clearAuthSession();
    }
    await connectToWhatsApp();
});
