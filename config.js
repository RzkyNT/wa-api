export const config = {
  port: process.env.PORT || 3000,
  webhook_url: process.env.WEBHOOK_URL || '',
  auth_folder: 'auth_session',
  // --- PAIRING CODE CONFIG ---
  use_pairing_code: true, // Ubah ke false jika ingin gunakan QR Scan
  phone_number: '', // Masukkan nomor HP (format internasional, tanpa +)
  custom_pairing_code: '', // KOSONGKAN jika ingin random, atau ISI (8 karakter) jika ingin custom
  force_fresh_session: false, // SET KE TRUE jika ingin selalu hapus sesi lama saat start
  api_key: '' // TOKEN PENGAMAN: Ganti dengan kode rahasia Anda sendiri
};
