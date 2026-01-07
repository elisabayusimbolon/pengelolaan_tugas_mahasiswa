const API_URL = '/api';

// Variabel global untuk menyimpan ID Dummy (Biar gampang demonya)
let currentUserId = null;
let currentCourseId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await initDummyData(); // Buat data User/Matkul otomatis
    loadTasks(); // Ambil daftar tugas
});

// 1. FUNGSI INISIALISASI (Agar tidak error Relasi)
async function initDummyData() {
    try {
        // Cek User, kalau kosong buat baru
        let resUser = await fetch(`${API_URL}/users`);
        let users = await resUser.json();
        
        if (users.length === 0) {
            // Buat User Dummy
            const newUser = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    nama_lengkap: "Mahasiswa Teladan", 
                    nim: "12345678", 
                    jurusan: "Teknik Informatika", 
                    semester: 3 
                })
            });
            const createdUser = await newUser.json();
            currentUserId = createdUser._id;
        } else {
            currentUserId = users[0]._id; // Pakai user pertama yg ketemu
        }

        // Cek Matkul, kalau kosong buat baru
        let resCourse = await fetch(`${API_URL}/courses`);
        let courses = await resCourse.json();
        
        if (courses.length === 0) {
            const newCourse = await fetch(`${API_URL}/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    kode_mata_kuliah: "IF101", 
                    nama_mata_kuliah: "Pemrograman Web", 
                    semester: 3,
                    dosen_pengampu: "Pak Dosen"
                })
            });
            const createdCourse = await newCourse.json();
            currentCourseId = createdCourse._id;
        } else {
            currentCourseId = courses[0]._id;
        }

        console.log("Ready ID:", currentUserId, currentCourseId);

    } catch (error) {
        console.error("Gagal init data dummy:", error);
    }
}

// 2. LOAD TASKS (READ)
async function loadTasks() {
    const list = document.getElementById('taskList');
    const loading = document.getElementById('loading');
    
    loading.style.display = 'block';
    list.innerHTML = '';

    try {
        const res = await fetch(`${API_URL}/tasks`);
        const tasks = await res.json();
        
        tasks.forEach(task => {
            const item = document.createElement('li');
            item.className = 'task-item';
            
            // Format Tanggal
            const date = new Date(task.tenggat_waktu).toLocaleDateString('id-ID');
            
            item.innerHTML = `
                <div class="task-info">
                    <h3>${task.judul_tugas} <span class="badge badge-${task.prioritas}">${task.prioritas}</span></h3>
                    <div class="task-meta">
                        📅 Deadline: ${date} | 
                        📚 ${task.id_mata_kuliah ? task.id_mata_kuliah.nama_mata_kuliah : 'Umum'}
                    </div>
                </div>
                <button onclick="deleteTask('${task._id}')" class="btn-delete">Selesai</button>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading tasks:', error);
    } finally {
        loading.style.display = 'none';
    }
}

// 3. TAMBAH TUGAS (CREATE)
document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentUserId || !currentCourseId) {
        alert("Sedang memuat data user... Tunggu sebentar.");
        return;
    }

    const judul = document.getElementById('judul').value;
    const prioritas = document.getElementById('prioritas').value;
    const deadline = document.getElementById('deadline').value;

    const data = {
        id_pengguna: currentUserId,
        id_mata_kuliah: currentCourseId,
        judul_tugas: judul,
        tenggat_waktu: deadline,
        prioritas: prioritas,
        status_tugas: 'Belum'
    };

    await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    // Reset Form & Reload
    document.getElementById('taskForm').reset();
    loadTasks();
});

// 4. HAPUS TUGAS (DELETE)
async function deleteTask(id) {
    if (confirm('Yakin tugas ini sudah selesai?')) {
        await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
        loadTasks();
    }
}