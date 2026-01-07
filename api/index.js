const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// 1. KONEKSI DATABASE
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Database Connected"))
  .catch(err => console.error("❌ Database Error:", err));

// 2. DEFINISI SCHEMA (3 TABEL)

// A. Tabel User (Pengguna)
const userSchema = new mongoose.Schema({
  nama_lengkap: String,
  nim: String,
  jurusan: String,
  semester: Number
});
const User = mongoose.model('User', userSchema);

// B. Tabel Course (Mata Kuliah)
const courseSchema = new mongoose.Schema({
  kode_mata_kuliah: String,
  nama_mata_kuliah: String,
  dosen_pengampu: String,
  semester: Number
});
const Course = mongoose.model('Course', courseSchema);

// C. Tabel Task (Tugas) - Punya RELASI (Foreign Key)
const taskSchema = new mongoose.Schema({
  id_pengguna: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Relasi ke User
  id_mata_kuliah: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // Relasi ke Course
  judul_tugas: String,
  deskripsi_tugas: String,
  tenggat_waktu: Date,
  prioritas: { type: String, enum: ['Rendah', 'Sedang', 'Tinggi'] },
  status_tugas: { type: String, default: 'Belum' }, // Belum/Selesai
  createdAt: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', taskSchema);

// 3. MIDDLEWARE
app.use(cors());
app.use(express.json());

// 4. ROUTES (CRUD LENGKAP)

app.get('/api', (req, res) => res.send("Server Academic System Ready!"));

// --- ROUTES USER (Untuk Init Data) ---
app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});
app.post('/api/users', async (req, res) => {
  const newUser = new User(req.body);
  await newUser.save();
  res.json(newUser);
});

// --- ROUTES COURSES (Untuk Dropdown Matkul) ---
app.get('/api/courses', async (req, res) => {
  const courses = await Course.find();
  res.json(courses);
});
app.post('/api/courses', async (req, res) => {
  const newCourse = new Course(req.body);
  await newCourse.save();
  res.json(newCourse);
});

// --- ROUTES TASKS (INTI CRUD) ---

// READ (Ambil tugas + Data Matkulnya)
app.get('/api/tasks', async (req, res) => {
  try {
    // .populate() adalah cara Mongoose melakukan JOIN tabel
    const tasks = await Task.find()
      .populate('id_mata_kuliah') // Ambil detail matkul
      .populate('id_pengguna')    // Ambil detail user
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE (Tambah Tugas)
app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = new Task(req.body);
    await newTask.save();
    res.json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE (Edit Tugas) - FITUR BARU!
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // { new: true } agar data yg dikembalikan adalah data yg sudah diedit
    const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE (Hapus Tugas)
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Task.findByIdAndDelete(id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;