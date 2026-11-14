# MIQAT Daily

Website statis (tanpa framework) untuk berita, carousel, dan video MIQAT. Dibuat oleh `build.mjs`, di-deploy ke Vercel.

## Tambah tulisan baru (alur harian)
1. Buat folder `content/posts/<slug>/` berisi:
   - `post.json`: slug, title, deck, category, date (YYYY-MM-DD), slides (jumlah), video (true/false), sources [{label,url}], source_note
   - `article.md`: isi artikel (## judul bagian, - daftar, 1. daftar angka, tabel |, **tebal**)
   - `slide-1.jpg ... slide-N.jpg`: carousel 4:5, lebar 720 px
   - opsional: `video.mp4` dan `poster.jpg` (9:16)
2. Commit dan push. Vercel build otomatis (`node build.mjs`, output `dist/`).
3. Cek lokal: `node build.mjs` lalu buka `dist/index.html` lewat server statis.

## Catatan
- Tulisan terbaru (berdasarkan `date`) otomatis jadi berita utama, masuk ticker TERKINI, daftar berita, carousel, dan video.
- Rubrik dibuat otomatis dari field `category`.
- Tulisan arsip (selain 14 Nov) diambil dari caption pack MIQAT sebelumnya; tanggalnya dari baris "Pembaruan" di caption.
