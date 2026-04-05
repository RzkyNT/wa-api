export const config = {
  port: process.env.PORT || 3000,
  webhook_url: process.env.WEBHOOK_URL || '', 
  auth_folder: 'auth_session',
  // --- PAIRING CODE CONFIG ---
  use_pairing_code: true, // Ubah ke false jika ingin gunakan QR Scan
  phone_number: '17427779802', // Masukkan nomor HP (format internasional, tanpa +)
  api_key: 'rahasia123' // TOKEN PENGAMAN: Ganti dengan kode rahasia Anda sendiri
};
