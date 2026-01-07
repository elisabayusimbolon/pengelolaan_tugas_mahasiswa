const API_URL = '/api';

// Variabel Global untuk menyimpan State
let currentUserId = null;
let isEditing = false;

document.addEventListener('DOMContentLoaded', async () => {
    await initSystem(); // Cek User & Matkul dulu
    loadTasks();        // Baru load tugas
});

// 1. INISIALISASI SISTEM (Auto-Seed Data)
async function initSystem() {
    try {
        // A. Cek User
        let resUser = await fetch(`${API_URL}/users`);
        let users = await resUser.json();

        if (users.length === 0) {
            // Jika kosong, buat User Mahasiswa Dummy
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
            const created = await newUser.json();
            currentUserId = created._id;
            users = [created];
        } else {
            currentUserId = users[0]._id;
        }

        // Tampilkan Data User di UI
        const activeUser = users[0];
        document.getElementById('userName').innerText = activeUser.nama_lengkap;
        document.getElementById('userNim').innerText = `NIM: ${activeUser.nim} | ${activeUser.jurusan}`;

        // B. Cek & Isi Dropdown Mata Kuliah
        let resCourse = await fetch(`${API_URL}/courses`);
        let courses = await resCourse.json();

        if (courses.length === 0) {
            // Buat 3 Matkul Dummy Otomatis
            const dummyCourses = [
                { kode_mata_kuliah: "IF101", nama_mata_kuliah: "Pemrograman Web", semester: 3 },
                { kode_mata_kuliah: "IF102", nama_mata_kuliah: "Basis Data", semester: 3 },
                { kode_mata_kuliah: "IF103", nama_mata_kuliah: "Algoritma", semester: 1 }
            ];

            for (let c of dummyCourses) {
                await fetch(`${API_URL}/courses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(c)
                });
            }
            // Fetch ulang setelah buat baru
            resCourse = await fetch(`${API_URL}/courses`);
            courses = await resCourse.json();
        }

        // Masukkan ke Dropdown HTML
        const select = document.getElementById('matkulSelect');
        courses.forEach(c => {
            const option = document.createElement('option');
            option.value = c._id; // Value-nya adalah ID Matkul (Relasi)
            option.text = `${c.kode_mata_kuliah} - ${c.nama_mata_kuliah}`;
            select.appendChild(option);
        });

    } catch (error) {
        console.error("Gagal init sistem:", error);
    }
}

// 2. LOAD TASKS (READ)
async function loadTasks() {
    const list = document.getElementById('taskList');
    document.getElementById('loading').style.display = 'block';
    list.innerHTML = '';

    try {
        const res = await fetch(`${API_URL}/tasks`);
        const tasks = await res.json();

        tasks.forEach(task => {
            const item = document.createElement('li');
            item.className = 'task-item';
            
            // Handle tanggal & null check
            const date = task.tenggat_waktu ? new Date(task.tenggat_waktu).toLocaleDateString('id-ID') : '-';
            const matkulName = task.id_mata_kuliah ? task.id_mata_kuliah.nama_mata_kuliah : 'Umum';

            item.innerHTML = `
                <div class="task-details">
                    <h3>${task.judul_tugas} <span class="badge badge-${task.prioritas}">${task.prioritas}</span></h3>
                    <div class="task-meta">
                        📚 ${matkulName} | 📅 Deadline: ${date}
                    </div>
                </div>
                <div class="actions">
                    <button onclick="deleteTask('${task._id}')" class="btn-delete">Hapus</button>
                    <button onclick="prepareEdit('${task._id}', '${task.judul_tugas}', '${task.id_mata_kuliah?._id}', '${task.prioritas}', '${task.tenggat_waktu}')" class="btn-edit">Edit</button>
                </div>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error(error);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// 3. HANDLE SUBMIT (CREATE & UPDATE)
document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('taskId').value;
    const judul = document.getElementById('judul').value;
    const matkul = document.getElementById('matkulSelect').value;
    const prioritas = document.getElementById('prioritas').value;
    const deadline = document.getElementById('deadline').value;

    const payload = {
        id_pengguna: currentUserId,
        id_mata_kuliah: matkul,
        judul_tugas: judul,
        prioritas: prioritas,
        tenggat_waktu: deadline
    };

    try {
        let url = `${API_URL}/tasks`;
        let method = 'POST';

        // Jika sedang Edit, ubah URL dan Method
        if (isEditing) {
            url = `${API_URL}/tasks/${id}`;
            method = 'PUT'; // Method Update
        }

        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        resetForm(); // Bersihkan form
        loadTasks(); // Reload data
    } catch (error) {
        alert("Gagal menyimpan data");
    }
});

// 4. PREPARE EDIT (Mengisi Form dengan Data Lama)
window.prepareEdit = function(id, judul, idMatkul, prioritas, deadline) {
    isEditing = true;
    
    // Ubah Tampilan Form
    document.getElementById('formTitle').innerText = "Edit Tugas";
    document.getElementById('btnSubmit').innerText = "Update Data";
    document.getElementById('btnSubmit').style.backgroundColor = "#ffc107"; // Kuning
    document.getElementById('btnSubmit').style.color = "#333";
    document.getElementById('btnCancel').style.display = "inline-block";

    // Isi Input
    document.getElementById('taskId').value = id;
    document.getElementById('judul').value = judul;
    document.getElementById('matkulSelect').value = idMatkul || "";
    document.getElementById('prioritas').value = prioritas;
    
    // Format tanggal untuk input type="date" (YYYY-MM-DD)
    if(deadline) {
        const dateObj = new Date(deadline);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        document.getElementById('deadline').value = `${yyyy}-${mm}-${dd}`;
    }
    
    // Scroll ke atas agar user lihat form
    window.scrollTo(0,0);
}

// 5. BATAL EDIT / RESET FORM
window.resetForm = function() {
    isEditing = false;
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = "";
    
    document.getElementById('formTitle').innerText = "Tambah Tugas Baru";
    document.getElementById('btnSubmit').innerText = "Simpan Tugas";
    document.getElementById('btnSubmit').style.backgroundColor = "#28a745"; // Hijau
    document.getElementById('btnSubmit').style.color = "white";
    document.getElementById('btnCancel').style.display = "none";
}

// 6. DELETE TUGAS
window.deleteTask = async function(id) {
    if (confirm('Yakin hapus?')) {
        await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
        loadTasks();
    }
}