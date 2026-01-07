const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- KONEKSI DATABASE (VERSI FIX) ---
// Variable untuk menyimpan status koneksi agar tidak connect ulang terus-menerus
let isConnected = false;

const connectDB = async () => {
  // 1. Cek jika sudah connect, pakai yang lama
  if (isConnected) {
    console.log("=> Menggunakan koneksi database yang sudah ada.");
    return;
  }

  try {
    // 2. Connect ke MongoDB
    // PENTING: Jangan tambahkan opsi { useNewUrlParser, ... } disini. 
    // Cukup process.env.MONGODB_URI saja agar tidak error.
    const db = await mongoose.connect(process.env.MONGODB_URI);

    isConnected = db.connections[0].readyState;
    console.log("=> Database berhasil terhubung!");
  } catch (error) {
    console.error("=> Gagal koneksi database:", error);
    // Lempar error agar API berhenti jika DB mati
    throw error;
  }
};

// --- DEFINISI MODEL (SCHEMA) ---

// 1. Model User
const userSchema = new mongoose.Schema({
  username: String,
});
// Cek model existing agar tidak error "OverwriteModelError"
const User = mongoose.models.User || mongoose.model('User', userSchema);

// 2. Model Task
const taskSchema = new mongoose.Schema({
  title: String,
  priority: String,
  deadline: String,
  userId: String 
});
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

// --- ROUTES API ---

// Route Cek Server
app.get('/', (req, res) => {
  res.send('Server Student Task Manager is Running!');
});

// Route GET Users
app.get('/api/users', async (req, res) => {
  try {
    await connectDB(); // Wajib connect dulu
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal ambil users", details: err.message });
  }
});

// Route GET Tasks
app.get('/api/tasks', async (req, res) => {
  try {
    await connectDB(); // Wajib connect dulu
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal ambil tasks", details: err.message });
  }
});

// Route POST Task (Simpan Tugas)
app.post('/api/tasks', async (req, res) => {
  try {
    await connectDB(); // Wajib connect dulu
    
    // Validasi
    if (!req.body.title) {
        return res.status(400).json({ error: "Judul tugas wajib diisi" });
    }

    const newTask = new Task(req.body);
    await newTask.save();
    
    res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal simpan task", details: err.message });
  }
});

// --- EXPORT APP ---
module.exports = app;

// --- LISTEN (HANYA UNTUK LOCAL) ---
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}