const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- KONEKSI DATABASE OPTIMAL UNTUK VERCEL ---
let isConnected = false; // Track status koneksi

const connectDB = async () => {
  if (isConnected) {
    console.log("=> Menggunakan koneksi database yang sudah ada.");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = db.connections[0].readyState;
    console.log("=> Database terhubung baru.");
  } catch (error) {
    console.error("=> Gagal koneksi database:", error);
    throw error; // Biar Vercel tau kalau ini error fatal
  }
};
// ----------------------------------------------

// Skema & Model (User & Task)
// Pastikan skema Anda ada disini atau di-import
const userSchema = new mongoose.Schema({
  username: String,
  // ... tambahkan field lain sesuai kebutuhan
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const taskSchema = new mongoose.Schema({
  title: String,
  priority: String,
  deadline: String,
  userId: String
});
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

// --- ROUTES ---

// PENTING: Panggil connectDB() di DALAM setiap route
app.get('/api/users', async (req, res) => {
  try {
    await connectDB(); // Tunggu connect dulu!
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    await connectDB(); // Tunggu connect dulu!
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    await connectDB(); // Tunggu connect dulu!
    const newTask = new Task(req.body);
    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route utama untuk cek server nyala
app.get('/', (req, res) => {
  res.send('Server Student Task Manager is Running!');
});

// Export app untuk Vercel
module.exports = app;

// Listen hanya untuk local (Vercel tidak butuh ini, tapi aman dibiarkan)
if (require.main === module) {
  app.listen(3000, () => console.log('Server running on port 3000'));
}