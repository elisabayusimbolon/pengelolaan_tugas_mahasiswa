const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// GANTI STRING INI DENGAN CONNECTION STRING MONGODB ATLAS ANDA SENDIRI
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Database Terhubung"))
  .catch(err => console.error("❌ Gagal Terhubung Database:", err));

// --- SCHEMA DATABASE ---

const penggunaSchema = new mongoose.Schema({
  nama_lengkap: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  kata_sandi: { type: String, required: true },
  nim: String,
  jurusan: String,
  semester: Number,
  dihapus_pada: { type: Date, default: null }
});
const Pengguna = mongoose.model('Pengguna', penggunaSchema);

const mataKuliahSchema = new mongoose.Schema({
  id_pengguna: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  kode_mata_kuliah: String,
  nama_mata_kuliah: { type: String, required: true },
  dosen_pengampu: String,
  dihapus_pada: { type: Date, default: null }
});
const MataKuliah = mongoose.model('MataKuliah', mataKuliahSchema);

// UPDATE: Penambahan Field Baru pada Tugas
const tugasSchema = new mongoose.Schema({
  id_pengguna: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  id_mata_kuliah: { type: mongoose.Schema.Types.ObjectId, ref: 'MataKuliah', required: true },
  judul_tugas: { type: String, required: true },
  deskripsi_tugas: { type: String }, // Baru
  jenis_tugas: { type: String, required: true }, // Baru (Individu, Kelompok, Ujian, dll)
  tenggat_waktu: { type: Date, required: true },
  prioritas: { type: String, default: 'Sedang' },
  status_tugas: { type: String, default: 'Belum Dikerjakan' },
  catatan_pribadi: { type: String }, // Baru
  dihapus_pada: { type: Date, default: null }
});
const Tugas = mongoose.model('Tugas', tugasSchema);

// --- ROUTES ---

// AUTH
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email } = req.body;
    const existing = await Pengguna.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email sudah terdaftar" });
    const user = new Pengguna(req.body);
    await user.save();
    res.json(user);
  } catch (e) { res.status(500).json({ error: "Gagal Registrasi: " + e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, kata_sandi } = req.body;
    const user = await Pengguna.findOne({ email, kata_sandi, dihapus_pada: null });
    if (!user) return res.status(401).json({ error: "Email atau Kata Sandi salah" });
    res.json(user);
  } catch (e) { res.status(500).json({ error: "Gagal Login: " + e.message }); }
});

// MATA KULIAH
app.get('/api/mata-kuliah', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "ID Pengguna wajib disertakan" });
    const courses = await MataKuliah.find({ id_pengguna: userId, dihapus_pada: null });
    res.json(courses);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/mata-kuliah', async (req, res) => {
  try {
    const newCourse = new MataKuliah(req.body);
    await newCourse.save();
    res.json(newCourse);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/mata-kuliah/:id', async (req, res) => {
  try {
    await MataKuliah.findByIdAndUpdate(req.params.id, { dihapus_pada: new Date() });
    res.json({ message: "Berhasil dihapus" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// TUGAS
app.get('/api/tugas', async (req, res) => {
  try {
    const { userId } = req.query;
    const tasks = await Tugas.find({ id_pengguna: userId, dihapus_pada: null })
      .populate('id_mata_kuliah')
      .sort({ tenggat_waktu: 1 });
    res.json(tasks);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tugas', async (req, res) => {
  try {
    const task = new Tugas(req.body);
    await task.save();
    res.json(task);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/tugas/:id', async (req, res) => {
  try {
    const updated = await Tugas.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/tugas/:id', async (req, res) => {
  try {
    await Tugas.findByIdAndUpdate(req.params.id, { dihapus_pada: new Date() });
    res.json({ message: "Berhasil dihapus" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));

module.exports = app;