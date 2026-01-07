const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. KONEKSI DATABASE
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Database Connected"))
  .catch(err => console.error("❌ Database Error:", err));

// 2. SCHEMA DATABASE (3 Tabel Utama)

// A. Tabel Pengguna (User)
const penggunaSchema = new mongoose.Schema({
  nama_lengkap: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  kata_sandi: { type: String, required: true }, // Simple text for demo (Gunakan bcrypt di real app)
  nim: String,
  jurusan: String,
  semester: Number,
  tanggal_daftar: { type: Date, default: Date.now },
  dihapus_pada: { type: Date, default: null }
});
const Pengguna = mongoose.model('Pengguna', penggunaSchema);

// B. Tabel Mata Kuliah (Course)
const mataKuliahSchema = new mongoose.Schema({
  kode_mata_kuliah: String,
  nama_mata_kuliah: String,
  dosen_pengampu: String,
  semester: Number,
  dihapus_pada: { type: Date, default: null }
});
const MataKuliah = mongoose.model('MataKuliah', mataKuliahSchema);

// C. Tabel Tugas (Task) - RELASI UTAMA
const tugasSchema = new mongoose.Schema({
  id_pengguna: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  id_mata_kuliah: { type: mongoose.Schema.Types.ObjectId, ref: 'MataKuliah', required: true },
  judul_tugas: { type: String, required: true },
  deskripsi_tugas: String,
  tenggat_waktu: { type: Date, required: true },
  status_tugas: { type: String, enum: ['Belum Dikerjakan', 'Sedang Dikerjakan', 'Selesai'], default: 'Belum Dikerjakan' },
  prioritas: { type: String, enum: ['Rendah', 'Sedang', 'Tinggi'], default: 'Sedang' },
  tanggal_dibuat: { type: Date, default: Date.now },
  tanggal_diperbarui: { type: Date, default: Date.now },
  dihapus_pada: { type: Date, default: null }
});
const Tugas = mongoose.model('Tugas', tugasSchema);

// 3. AUTHENTICATION ROUTES

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await Pengguna.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email sudah terdaftar!" });

    const newUser = new Pengguna(req.body);
    await newUser.save();
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, kata_sandi } = req.body;
    // Cari user aktif (tidak dihapus)
    const user = await Pengguna.findOne({ email, dihapus_pada: null });
    
    if (!user || user.kata_sandi !== kata_sandi) {
      return res.status(401).json({ error: "Email atau Password salah!" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. DATA ROUTES

// Get Mata Kuliah (Auto Seed if Empty)
app.get('/api/mata-kuliah', async (req, res) => {
  let courses = await MataKuliah.find({ dihapus_pada: null });
  
  // Auto-seed jika kosong (untuk kemudahan demo)
  if (courses.length === 0) {
    const seeds = [
      { kode_mata_kuliah: "IF201", nama_mata_kuliah: "Pemrograman Web Lanjut", dosen_pengampu: "Dr. Budi Santoso", semester: 4 },
      { kode_mata_kuliah: "IF202", nama_mata_kuliah: "Basis Data II", dosen_pengampu: "Prof. Siti Aminah", semester: 4 },
      { kode_mata_kuliah: "IF203", nama_mata_kuliah: "Kecerdasan Buatan", dosen_pengampu: "Dr. Rahmat", semester: 4 },
      { kode_mata_kuliah: "IF204", nama_mata_kuliah: "Jaringan Komputer", dosen_pengampu: "Ir. Joko", semester: 4 }
    ];
    await MataKuliah.insertMany(seeds);
    courses = await MataKuliah.find({ dihapus_pada: null });
  }
  res.json(courses);
});

// --- CRUD TUGAS (User Specific) ---

// GET Tugas (Filtered by User ID)
app.get('/api/tugas', async (req, res) => {
  try {
    const { userId } = req.query; // Ambil ID User dari query params
    if (!userId) return res.status(400).json({ error: "User ID diperlukan" });

    const tasks = await Tugas.find({ id_pengguna: userId, dihapus_pada: null })
      .populate('id_mata_kuliah')
      .sort({ tenggat_waktu: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Tugas
app.post('/api/tugas', async (req, res) => {
  try {
    const newTask = new Tugas(req.body);
    await newTask.save();
    res.json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT Tugas
app.put('/api/tugas/:id', async (req, res) => {
  try {
    req.body.tanggal_diperbarui = new Date();
    const updatedTask = await Tugas.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE Tugas (Soft Delete)
app.delete('/api/tugas/:id', async (req, res) => {
  try {
    // Soft delete: update field dihapus_pada
    await Tugas.findByIdAndUpdate(req.params.id, { dihapus_pada: new Date() });
    res.json({ message: "Berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Server Init
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;