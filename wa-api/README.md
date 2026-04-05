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
3.  Masukkan nomor HP pada `phone_number: '628xxxxxxxx'` (Ganti dengan nomor WhatsApp Anda yang aktif).
4.  Jalankan perintah ini di terminal:
```bash
npm start
```
5.  Tunggu beberapa detik, akan muncul kode **8 Karakter** di layar terminal.
6.  Buka WhatsApp di HP -> Perangkat Tertaut -> Tautkan Perangkat.
7.  Pilih **Tautkan dengan nomor telepon saja** (Link with phone number instead).
8.  Masukkan kode 8 karakter yang muncul di terminal tadi.
9.  Selesai! Anda sudah terhubung tanpa harus scan QR.

---

## 🚀 Cara Menjalankan (Opsi Scan QR)

Jika ingin kembali menggunakan QR Code:
1.  Buka `config.js`, ubah `use_pairing_code: false`.
2.  Hapus folder `auth_session` jika ingin login ulang.
3.  `npm start`.

---

## 🔗 REST API Endpoints (cURL Examples)

Default port adalah `3000`.

### 1. Cek Status Koneksi
```bash
curl http://localhost:3000/api/status
```

### 2. Kirim Pesan Teks Biasa
```bash
curl -X POST http://localhost:3000/api/send-message \
     -H "Content-Type: application/json" \
     -d '{
           "to": "628xxxxxxxx",
           "text": "Halo, ini pesan dari API Termux!"
         }'
```

### 3. Kirim Pesan Button (Baileys-Joss Style)
```bash
curl -X POST http://localhost:3000/api/send-button \
     -H "Content-Type: application/json" \
     -d '{
           "to": "628xxxxxxxx",
           "text": "Pilih salah satu:",
           "title": "Halo Bosku",
           "footer": "Powered by Baileys-Joss",
           "buttons": [
             { "id": "btn1", "displayText": "👍 Mantap" },
             { "id": "btn2", "displayText": "👎 Kurang" }
           ]
         }'
```

### 4. Kirim List Message
```bash
curl -X POST http://localhost:3000/api/send-list \
     -H "Content-Type: application/json" \
     -d '{
           "to": "628xxxxxxxx",
           "title": "Menu Kantin",
           "buttonText": "Lihat Daftar Makanan",
           "description": "Silahkan pilih menu favoritmu!",
           "footer": "Buka jam 8 pagi - 9 malam",
           "sections": [
             {
               "title": "Makanan",
               "rows": [
                 { "rowId": "m1", "title": "Nasi Goreng", "description": "Rp 15.000" },
                 { "rowId": "m2", "title": "Mie Ayam", "description": "Rp 12.000" }
               ]
             }
           ]
         }'
```

---

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
Sangat disarankan menambahkan pengamanan (seperti Token Header) jika URL API Anda sudah dipublish secara online agar tidak disalahgunakan orang lain.

---
*Dibuat oleh Antigravity AI*
