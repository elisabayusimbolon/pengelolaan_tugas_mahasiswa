const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- KONEKSI DATABASE ---
const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.log('⚠️  PERINGATAN: Connection String belum ada di .env');
        console.log('⚠️  (Database belum aktif, tapi Server tetap jalan)');
        return;
    }
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Terhubung ke MongoDB');
    } catch (err) {
        console.error('❌ Gagal koneksi MongoDB:', err);
    }
};
connectDB();

// ==========================================
// 1. DEFINISI SCHEMA (STRUKTUR DATA)
// ==========================================

// A. Schema Pengguna
const PenggunaSchema = new mongoose.Schema({
    nama_lengkap: { type: String, required: true },
    nim: { type: String, required: true }, // unique dihapus sementara biar gak error duplikat saat testing
    jurusan: String,
    semester: Number,
    dihapus_pada: { type: Date, default: null }
});
// Pakai nama collection 'users' biar sinkron sama temanmu nanti
const Pengguna = mongoose.model('Pengguna', PenggunaSchema, 'users');

// B. Schema Mata Kuliah
const MataKuliahSchema = new mongoose.Schema({
    kode_mata_kuliah: { type: String, required: true },
    nama_mata_kuliah: { type: String, required: true },
    dosen_pengampu: String,
    dihapus_pada: { type: Date, default: null }
});
// Pakai nama collection 'courses'
const MataKuliah = mongoose.model('MataKuliah', MataKuliahSchema, 'courses');

// C. Schema Tugas
const TugasSchema = new mongoose.Schema({
    id_pengguna: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
    id_mata_kuliah: { type: mongoose.Schema.Types.ObjectId, ref: 'MataKuliah', required: true },
    judul_tugas: { type: String, required: true },
    deskripsi_tugas: String,
    tenggat_waktu: { type: Date, required: true },
    status_tugas: { 
        type: String, 
        enum: ['Belum', 'Proses', 'Selesai'], 
        default: 'Belum' 
    },
    prioritas: { 
        type: String, 
        enum: ['Rendah', 'Sedang', 'Tinggi'], 
        default: 'Sedang' 
    },
    dihapus_pada: { type: Date, default: null }
}, { timestamps: { createdAt: 'tanggal_dibuat', updatedAt: 'tanggal_diperbarui' } });
// Pakai nama collection 'tasks'
const Tugas = mongoose.model('Tugas', TugasSchema, 'tasks');


// ==========================================
// 2. API ROUTES (JALUR AKSES DATA)
// ==========================================

app.get('/', (req, res) => res.send('Student Task Manager API is Running!'));

// --- ROUTES PENGGUNA ---
app.post('/api/users', async (req, res) => {
    try {
        const user = new Pengguna(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/users', async (req, res) => {
    const users = await Pengguna.find({ dihapus_pada: null });
    res.json(users);
});

// --- ROUTES MATA KULIAH ---
app.post('/api/courses', async (req, res) => {
    try {
        const course = new MataKuliah(req.body);
        await course.save();
        res.status(201).json(course);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/courses', async (req, res) => {
    const courses = await MataKuliah.find({ dihapus_pada: null });
    res.json(courses);
});

// --- ROUTES TUGAS (INTI APLIKASI) ---

// 1. GET: Ambil Semua Tugas
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Tugas.find({ dihapus_pada: null })
            .populate('id_pengguna', 'nama_lengkap nim')
            .populate('id_mata_kuliah', 'nama_mata_kuliah dosen_pengampu');
        res.json(tasks);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. POST: Buat Tugas Baru
app.post('/api/tasks', async (req, res) => {
    try {
        const task = new Tugas(req.body);
        await task.save();
        res.status(201).json(task);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// 3. DELETE: Soft Delete Tugas
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        await Tugas.findByIdAndUpdate(req.params.id, { dihapus_pada: new Date() });
        res.json({ message: 'Tugas berhasil dihapus' });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// PENTING UNTUK VERCEL
module.exports = app;

// PENTING UNTUK LOKAL (Laptop)
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Server BERHASIL jalan di http://localhost:${PORT}`);
});