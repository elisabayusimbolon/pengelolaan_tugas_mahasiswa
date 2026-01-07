const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- KONEKSI DATABASE (VERSI FIX UNTUK MONGOOSE BARU) ---
let isConnected = false; // Variable untuk track status koneksi

const connectDB = async () => {
  // Jika sudah connect, pakai koneksi yang lama (Cache)
  if (isConnected) {
    console.log("=> Menggunakan koneksi database yang sudah ada.");
    return;
  }

  try {
    // FIX: Tidak perlu pakai useNewUrlParser / useUnifiedTopology lagi di Mongoose versi baru
    const db = await mongoose.connect(process.env.MONGODB_URI);
    
    isConnected = db.connections[0].readyState;
    console.log("=> Database terhubung baru.");
  } catch (error) {
    console.error("=> Gagal koneksi database:", error);
    // Lempar error agar route tau kalau DB gagal
    throw error; 
  }
};
// ---------------------------------------------------------

// --- DEFINISI MODEL (SCHEMA) ---
// Pastikan field di sini sesuai dengan kebutuhan frontend Anda

// 1. Model User
const userSchema = new mongoose.Schema({
  username: String,
  // Tambahkan field lain jika ada (misal: email, password)
});
// Cek apakah model sudah ada (mencegah error OverwriteModelError)
const User = mongoose.models.User || mongoose.model('User', userSchema);

// 2. Model Task
const taskSchema = new mongoose.Schema({
  title: String,
  priority: String,
  deadline: String,
  userId: String // Relasi ke User (opsional, sesuaikan kebutuhan)
});
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

// --- ROUTES API ---

// GET: Ambil semua user
app.get('/api/users', async (req, res) => {
  try {
    await connectDB(); // Wajib tunggu koneksi
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data user", details: err.message });
  }
});

// GET: Ambil semua tasks
app.get('/api/tasks', async (req, res) => {
  try {
    await connectDB(); // Wajib tunggu koneksi
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data tasks", details: err.message });
  }
});

// POST: Tambah task baru
app.post('/api/tasks', async (req, res) => {
  try {
    await connectDB(); // Wajib tunggu koneksi
    
    // Validasi sederhana
    if (!req.body.title) {
        return res.status(400).json({ error: "Judul tugas wajib diisi" });
    }

    const newTask = new Task(req.body);
    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menyimpan task", details: err.message });
  }
});

// Route Check Server (Halaman Depan API)
app.get('/', (req, res) => {
  res.send('Server Student Task Manager is Running correctly!');
});

// Export app untuk Vercel (PENTING)
module.exports = app;

// Listen port (Hanya jalan di local, di Vercel ini diabaikan)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}