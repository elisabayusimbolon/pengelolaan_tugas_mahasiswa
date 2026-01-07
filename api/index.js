// api/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// 1. Koneksi Database (PENTING: Pastikan MONGODB_URI ada di Vercel Environment Variables)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Database Connected"))
  .catch(err => console.error("❌ Database Error:", err));

// 2. Definisi Schema (Struktur Data)
// Harus cocok dengan script.js: title, priority, deadline
const taskSchema = new mongoose.Schema({
  title: String,
  priority: String,
  deadline: Date,
  userId: String, // Opsional: untuk membedakan user nanti
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// 3. Middleware
app.use(cors());
app.use(express.json());

// 4. ROUTES (Jalur Lalu Lintas Data)

// A. TEST ROUTE (Untuk cek server nyala)
app.get('/api', (req, res) => {
  res.send("Server Student Task Manager is Running!");
});

// B. GET: Ambil semua tugas
app.get('/api/tasks', async (req, res) => {
  try {
    // Urutkan dari yang terbaru (descending)
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// C. POST: Simpan tugas baru
app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = new Task(req.body);
    await newTask.save();
    res.json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// D. DELETE: Hapus tugas (INI YANG SEBELUMNYA HILANG)
// Menangkap request ke /api/tasks/ID_TUGAS
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);
    
    if (!deletedTask) {
      return res.status(404).json({ error: "Tugas tidak ditemukan di database" });
    }
    
    res.json({ message: "Berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route User (Dummy agar script.js tidak error saat init)
app.get('/api/users', (req, res) => res.json([]));
app.post('/api/users', (req, res) => res.json({ _id: "dummy_user" }));

// Jalankan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;