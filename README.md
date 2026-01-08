

---

````markdown
📚 Manajer Tugas Mahasiswa  
**Status:** Final Release  
**Stack:** MERN (MongoDB, Express, Node, *React-concept / Vanilla*)  

Aplikasi manajemen akademik berbasis web yang dirancang khusus untuk mahasiswa Program Studi Informatika.  
Membantu mengelola jadwal kuliah, daftar tugas, serta memantau deadline dengan antarmuka modern dan responsif.

---

## 👥 Tim Pengembang

| Nama | NPM | Peran |
|------|-----|-------|
| [Nama Developer 1] | [NPM] | [Frontend / Backend / Fullstack] |
| [Nama Developer 2] | [NPM] | [Frontend / Backend / Fullstack] |
| [Nama Developer 3] | [NPM] | [Frontend / Backend / Fullstack] |

---

## 🧠 Tentang Proyek

Proyek ini dikembangkan sebagai pemenuhan tugas **Pemrograman Web Lanjut**.  
Fokus utama pengembangan meliputi:

- Implementasi **CRUD (Create, Read, Update, Delete)** secara lengkap  
- Sistem **autentikasi pengguna**  
- Penyajian **data statistik akademik**  
- Arsitektur **RESTful API**

Aplikasi dibangun dengan pendekatan **Fullstack JavaScript** tanpa framework frontend. Seluruh interaksi antarmuka dilakukan menggunakan **Vanilla JavaScript dan DOM Manipulation** untuk memastikan pemahaman konsep web yang mendasar dan performa yang ringan.

---

## 🧩 Arsitektur Teknologi

| Komponen | Teknologi | Penjelasan |
|---------|-----------|------------|
| **Bahasa Pemrograman** | JavaScript (ES6+) | Fullstack JavaScript. Frontend dan Backend sama-sama menggunakan JS sehingga pertukaran data JSON lebih konsisten. |
| **Frontend** | HTML5, CSS3, Vanilla JS | Tanpa framework (React/Vue). Manipulasi DOM manual untuk pemahaman fundamental web. |
| **Backend** | Node.js, Express.js | Server REST API dengan Express sebagai router dan handler HTTP request. |
| **Database** | MongoDB (NoSQL) | Penyimpanan berbasis dokumen (JSON) yang fleksibel. |
| **ODM / Library** | Mongoose | Validasi data dan skema sebelum data masuk ke MongoDB. |
| **Arsitektur API** | RESTful API | Menggunakan metode standar: GET, POST, PUT, DELETE dengan format JSON. |

---

## 🚀 Fitur Utama

### 🔐 Autentikasi Pengguna
- **Register:** Pendaftaran akun mahasiswa (Nama, NPM, Semester)  
- **Login:** Validasi email dan password  
- **Session:** Manajemen sesi menggunakan LocalStorage  

### 📝 Manajemen Tugas (Task Manager)
- **Create:** Tambah tugas (Judul, Deskripsi, Deadline, Prioritas, Jenis Tugas)  
- **Read:** Daftar tugas dengan indikator warna berdasarkan status dan prioritas  
- **Update:** Edit detail tugas dan status pengerjaan (Belum / Sedang / Selesai)  
- **Delete:** Hapus tugas yang tidak diperlukan  

### 📚 Manajemen Mata Kuliah
- Input data mata kuliah, kode MK, dan dosen pengampu  
- Edit dan hapus data mata kuliah  
- Integrasi dropdown mata kuliah saat input tugas  

---

## ⭐ Fitur Unggulan (Bonus)

- **Dashboard Statistik:** Ringkasan jumlah tugas total, selesai, dan pending  
- **Deadline Warning:** Notifikasi visual untuk tugas mendekati tenggat waktu (H-7)  
- **Profil Mahasiswa:** Kartu identitas digital mahasiswa  
- **Modern UI:** Desain bersih dengan animasi transisi halus  

---

## ⚙️ Cara Instalasi & Menjalankan

### 1️⃣ Clone Repository
```bash
git clone [URL_REPOSITORY]
````

### 2️⃣ Instal Dependensi

```bash
npm install
```

### 3️⃣ Konfigurasi Database

Buka file:

```
api/index.js
```

Cari bagian:

```js
mongoose.connect("MONGODB_URI_ANDA")
```

Ganti dengan URI MongoDB Anda (local atau MongoDB Atlas).

### 4️⃣ Jalankan Server

```bash
node api/index.js
```

Server akan berjalan di port **3000**.

### 5️⃣ Buka Aplikasi

Buka file berikut di browser:

```
index.html
```

---

## 🔌 Dokumentasi API

### 🔐 AUTH

| Method | Endpoint             | Deskripsi                  |
| ------ | -------------------- | -------------------------- |
| POST   | `/api/auth/register` | Mendaftarkan pengguna baru |
| POST   | `/api/auth/login`    | Login ke sistem            |

### 📝 TUGAS

| Method | Endpoint         | Deskripsi                      |
| ------ | ---------------- | ------------------------------ |
| GET    | `/api/tugas`     | Mengambil semua tugas pengguna |
| POST   | `/api/tugas`     | Membuat tugas baru             |
| PUT    | `/api/tugas/:id` | Update data tugas              |
| DELETE | `/api/tugas/:id` | Menghapus tugas                |

### 📚 MATA KULIAH

| Method | Endpoint               | Deskripsi                   |
| ------ | ---------------------- | --------------------------- |
| GET    | `/api/mata-kuliah`     | Mengambil semua mata kuliah |
| POST   | `/api/mata-kuliah`     | Menambah mata kuliah        |
| PUT    | `/api/mata-kuliah/:id` | Update mata kuliah          |
| DELETE | `/api/mata-kuliah/:id` | Menghapus mata kuliah       |

---

## 📌 Catatan Pengembangan

* Frontend dibangun **tanpa framework** untuk memaksimalkan pemahaman DOM dan JavaScript murni.
* Seluruh komunikasi data menggunakan **JSON via Fetch API**.
* Struktur backend mengikuti pola REST standar dengan Express.

---

## 🏫 Informasi Akademik

**Mata Kuliah:** Pemrograman Web Lanjut
**Fakultas:** Fakultas Ilmu Komputer
**Program Studi:** Informatika

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan akademik. Silakan gunakan sebagai referensi pembelajaran.

```

---

Kalau kamu mau:
- versi **lebih formal** buat dosen,
- versi **lebih teknis** buat GitHub publik,
- atau mau ditambahkan **diagram arsitektur (ASCII)**,

tinggal bilang. Saya sudah siap ngerapikan lagi tanpa drama.
```
