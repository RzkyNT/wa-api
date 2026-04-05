# 🚀 WhatsApp REST API Sender with Baileys-Joss (Termux/Mobile Support)

API WhatsApp sederhana yang mendukung **Interactive Buttons**, **List Messages**, dan **Webhooks** menggunakan library khusus `baileys-joss`. Sangat ringan dan cocok dijalankan di **Termux (Android)** atau server VPS.

---

## 🛠️ Instalasi di Termux (Android)

Buka aplikasi Termux Anda, lalu jalankan perintah berikut secara beruntun:

1.  **Update packages & Install Node.js:**
    ```bash
    pkg update && pkg upgrade
    pkg install nodejs git -y
    ```

1.  Buka File `config.js`
2.  Ubah `use_pairing_code: true`
3.  Masukkan nomor HP pada `phone_number: '628xxxxxxxx'`.
4.  (Opsional) Masukkan kode impian Anda pada `custom_pairing_code` (harus 8 karakter, contoh: `ABCDEFGH`).
5.  Jalankan perintah ini di terminal:
```bash
npm install
npm start
```
5.  Tunggu beberapa detik, akan muncul kode **8 Karakter** di layar terminal.
6.  Buka WhatsApp di HP -> Perangkat Tertaut -> Tautkan Perangkat.
7.  Pilih **Tautkan dengan nomor telepon saja** (Link with phone number instead).
8.  Masukkan kode 8 karakter yang muncul di terminal tadi.
9.  Selesai! Anda sudah terhubung tanpa harus scan QR.

---

## 💻 Instalasi di Desktop (Windows / Linux / Mac)

Aplikasi ini bersifat cross-platform, Anda bisa menjalankannya di PC atau Laptop:

1.  **Install Node.js**: Download di [nodejs.org](https://nodejs.org/).
2.  **Buka Terminal/CMD/PowerShell**.
3.  **Masuk ke folder project**: `cd wa-api`.
4.  **Install dependencies**:
    ```bash
    npm install
    ```
5.  **Jalankan API**:
    ```bash
    npm start
    ```

---

## 🚀 Cara Menjalankan (Opsi Scan QR)

Jika ingin kembali menggunakan QR Code:
1.  Buka `config.js`, ubah `use_pairing_code: false`.
2.  Hapus folder `auth_session` jika ingin login ulang.
3.  `npm start`.

---

## 🔗 REST API Endpoints (cURL Examples)

Default port adalah `3000`.

### ⚠️ SINTAKSIS CURL (PENTING!)
Cara menulis perintah multi-baris di terminal berbeda-beda:
- **Termux / Linux / Git Bash**: Gunakan `\` di akhir baris.
- **Windows CMD**: Gunakan `^` di akhir baris atau tulis dalam satu baris.
- **Windows PowerShell**: Gunakan `` ` `` di akhir baris.

---

### 📋 CONTOH SIAP COPY (WINDOWS CMD / SATU BARIS)
Gunakan contoh ini jika Anda menggunakan **Command Prompt (CMD)** di Windows agar tidak error JSON:

**1. Kirim Pesan Teks**
```cmd
curl -X POST http://localhost:3000/api/send-message -H "Content-Type: application/json" -H "x-api-key: rahasia123" -d "{\"to\": \"628xxxxxxxx\", \"text\": \"Halo dari CMD!\"}"
```

**2. Kirim Pesan Button (Tombol)**
```cmd
curl -X POST http://localhost:3000/api/send-button -H "Content-Type: application/json" -H "x-api-key: rahasia123" -d "{\"to\": \"628xxxxxxxx\", \"text\": \"Pilih menu:\", \"buttons\": [{\"id\": \"b1\", \"displayText\": \"Makan\"}, {\"id\": \"b2\", \"displayText\": \"Minum\"}]}"
```

**3. Kirim List Message (Daftar Menu)**
```cmd
curl -X POST http://localhost:3000/api/send-list -H "Content-Type: application/json" -H "x-api-key: rahasia123" -d "{\"to\": \"628xxxxxxxx\", \"title\": \"Judul Menu\", \"buttonText\": \"Buka Menu\", \"sections\": [{\"title\": \"Kategori 1\", \"rows\": [{\"rowId\": \"id1\", \"title\": \"Pilihan 1\"}]}]}"
```

---

## 🔗 REST API Endpoints (cURL Linux / Termux)
(Gunakan contoh ini hanya jika Anda memakai **Termux** atau **Linux**)

### 1. Cek Status Koneksi
```bash
curl http://localhost:3000/api/status -H "x-api-key: rahasia123"
```

### 2. Kirim Pesan Teks Biasa
```bash
curl -X POST http://localhost:3000/api/send-message \
     -H "Content-Type: application/json" \
     -H "x-api-key: rahasia123" \
     -d '{
           "to": "628xxxxxxxx",
           "text": "Halo, ini pesan dari API Termux!"
         }'
```

## 🔔 Webhooks Configuration

Untuk mengaktifkan webhook (setiap pesan masuk akan dikirim ke server Anda), edit file `config.js`:

```javascript
export const config = {
  port: 3000,
  webhook_url: 'https://server-anda.com/webhook-receiver', // MASUKKAN URL ANDA DI SINI
  auth_folder: 'auth_session'
};
```

Setiap ada pesan masuk, server akan mengirimkan POST request ke URL tersebut dengan data pesan mentah (JSON).

---

## 🌐 Menghubungkan Termux ke Internet (Tunneling)

Agar URL API di Termux bisa diakses dari website/hosting luar, gunakan salah satu metode tunneling berikut:

### Opsi 1: Localhost.run (Paling Cepat)
Cukup buka tab baru di Termux dan jalankan:
```bash
ssh -R 80:localhost:3000 localhost.run
```
Salin URL `https://xxxx.lhr.life` yang muncul di log.

### Opsi 2: Cloudflare Tunnel (Paling Stabil)
Instalasi sekali saja:
```bash
pkg install cloudflared
cloudflared tunnel --url http://localhost:3000
```
Cari URL `...trycloudflare.com` di terminal.

---

## 🛡️ Tips Keamanan & Performa

### 1. Kunci Sesi Termux
Agar proses tidak dimatikan Android saat layar mati, jalankan perintah ini sebelum `npm start`:
```bash
termux-wake-lock
```

### 2. Autostart & Forever (PM2)
Gunakan `pm2` agar API otomatis restart jika terjadi error:
```bash
npm install pm2 -g
pm2 start index.js --name "wa-api"
pm2 save
```

### 3. Tambahkan API Key
Sangat disarankan menambahkan pengamanan (seperti Token Header) jika URL API Anda sudah dipublish secara online agar tidak disalahgunakan orang lain (sudah siap di `config.js`).

---

## 🔔 Webhooks & Integrasi (Chatbot Otomatis)

**Webhook** adalah cara Bot memberitahu website/server Anda jika ada pesan masuk secara real-time.

### 📋 Cara Konfigurasi di `config.js`:
```javascript
export const config = {
  // ... (setup kunci lain)
  webhook_url: 'https://script.google.com/macros/s/KODE_UNIQ_GAS/exec', // Ganti dengan URL Google Script Anda
};
```

---

## ☁️ Jembatan Webhook (Google Apps Script + Sheets)

Gunakan **Google Apps Script (GAS)** agar data chat otomatis masuk ke **Google Sheets** (Free & Tanpa Database). Ini sangat stabil sebagai jembatan jika website utama Anda di InfinityFree/Shared Hosting.

### 📋 Script Jembatan (Code.gs)
Buka [script.google.com](https://script.google.com), buat proyek baru, paste kode ini, dan Deploy sebagai **Web App (Anyone Access)**:

```javascript
// doPost(e) akan menerima data otomatis dari API WA Anda
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Simpan ke baris baru: Waktu, Pengirim, Isi Pesan, Tipe Pesan
    sheet.appendRow([new Date(), data.from, data.message, data.type]);

    // OPSI: Kirim balasan otomatis/Auto-Reply dari sini via UrlFetchApp
    return ContentService.createTextOutput("SUCCESS").setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput("ERROR: " + error.message).setMimeType(ContentService.MimeType.TEXT);
  }
}
```

---

## 🚀 Pilihan Deployment (ONLINE)

Karena API ini butuh **Node.js** dan koneksi persistent (Bukan Hosting PHP seperti InfinityFree), Anda bisa menggunakan:
1.  **Koyeb / Railway / Render**: Hosting khusus Node.js yang mendukung WebSocket.
2.  **Termux (Android)**: Gunakan HP lama Anda sebagai server WA yang hidup 24 jam gratis.
3.  **Tunneling (Localhost.run)**: Jika dijalankan di PC/Termux, gunakan tunnel agar bisa menerima webhook dari Google:
    ```bash
    ssh -R 80:localhost:3000 nokey@localhost.run
    ```

---
 