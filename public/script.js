const API_URL = '/api';

// Variabel global
let currentUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await initDummyData(); // Cek user dulu
    loadTasks(); // Baru ambil tugas
});

// 1. FUNGSI INISIALISASI (Cek User Saja)
// Saya menghapus bagian "Courses/Matkul" karena di backend api/index.js sebelumnya
// kita belum membuat route untuk Courses. Jika dipaksakan, akan error 404.
async function initDummyData() {
    try {
        // Cek apakah ada user di database
        let resUser = await fetch(`${API_URL}/users`);
        
        // Handle jika backend belum siap/error
        if (!resUser.ok) throw new Error("Gagal mengambil data user");
        
        let users = await resUser.json();
        
        if (users.length === 0) {
            // Jika kosong, buat User Dummy baru
            console.log("User kosong, membuat user baru...");
            const newUser = await fetch(`${API_URL}/users`, { // Pastikan ada route POST /api/users di backend jika ingin fitur ini jalan
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: "Mahasiswa Demo" // Sesuaikan dengan Schema Backend (username)
                })
            });
            
            // Fallback jika route POST user belum dibuat di backend
            if(newUser.ok) {
                const createdUser = await newUser.json();
                currentUserId = createdUser._id;
            } else {
                console.warn("Backend tidak support buat user otomatis. Menggunakan ID dummy lokal.");
                currentUserId = "user_demo_123"; 
            }
        } else {
            currentUserId = users[0]._id; // Pakai user pertama yg ketemu
        }

        console.log("=> Login sebagai User ID:", currentUserId);

    } catch (error) {
        console.error("Gagal init user:", error);
        // Fallback agar aplikasi tetap jalan meski gagal fetch user
        currentUserId = "user_fallback_id";
    }
}

// 2. LOAD TASKS (READ)
async function loadTasks() {
    const list = document.getElementById('taskList');
    const loading = document.getElementById('loading'); // Pastikan ada elemen id="loading" di HTML
    
    if(loading) loading.style.display = 'block';
    list.innerHTML = '';

    try {
        const res = await fetch(`${API_URL}/tasks`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const tasks = await res.json();
        
        // Jika data kosong
        if (tasks.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:gray;">Belum ada tugas.</p>';
            return;
        }

        tasks.forEach(task => {
            const item = document.createElement('li');
            item.className = 'task-item';
            
            // Format Tanggal (Handle jika deadline kosong)
            const dateStr = task.deadline ? new Date(task.deadline).toLocaleDateString('id-ID', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }) : '-';
            
            // Menyesuaikan warna badge berdasarkan prioritas
            let badgeColor = 'secondary';
            if(task.priority === 'Tinggi') badgeColor = 'danger';
            if(task.priority === 'Sedang') badgeColor = 'warning';
            if(task.priority === 'Rendah') badgeColor = 'success';

            // PERHATIKAN: Menggunakan properti bahasa Inggris (title, priority, deadline)
            // Sesuai dengan backend api/index.js
            item.innerHTML = `
                <div class="task-info">
                    <h3>${task.title || '(Tanpa Judul)'} 
                        <span class="badge bg-${badgeColor}">${task.priority || 'Normal'}</span>
                    </h3>
                    <div class="task-meta">
                        📅 Deadline: ${dateStr}
                    </div>
                </div>
                <button onclick="deleteTask('${task._id}')" class="btn-delete" style="background-color: #ff4d4d; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Hapus</button>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading tasks:', error);
        list.innerHTML = `<p style="color:red; text-align:center;">Gagal memuat tugas. <br> <small>${error.message}</small></p>`;
    } finally {
        if(loading) loading.style.display = 'none';
    }
}

// 3. TAMBAH TUGAS (CREATE)
const taskForm = document.getElementById('taskForm');
if (taskForm) {
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const judul = document.getElementById('judul').value;
        const prioritas = document.getElementById('prioritas').value;
        const deadline = document.getElementById('deadline').value;
        const btnSubmit = taskForm.querySelector('button[type="submit"]');

        // Validasi sederhana
        if(!judul) {
            alert("Judul tugas wajib diisi!");
            return;
        }

        // Ubah tombol jadi loading
        const originalText = btnSubmit.innerText;
        btnSubmit.innerText = "Menyimpan...";
        btnSubmit.disabled = true;

        // PERHATIKAN: Key objek harus bahasa INGGRIS (title, priority, deadline)
        // Agar cocok dengan Mongoose Schema di backend
        const data = {
            title: judul,          // Frontend: judul -> Backend: title
            priority: prioritas,   // Frontend: prioritas -> Backend: priority
            deadline: deadline,    // Frontend: deadline -> Backend: deadline
            userId: currentUserId  // ID User
        };

        try {
            const res = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Gagal menyimpan");
            }

            // Reset Form & Reload
            taskForm.reset();
            loadTasks(); 

        } catch (error) {
            console.error("Gagal submit:", error);
            alert("Terjadi kesalahan: " + error.message);
        } finally {
            // Kembalikan tombol
            btnSubmit.innerText = originalText;
            btnSubmit.disabled = false;
        }
    });
}

// 4. HAPUS TUGAS (DELETE)
// Fungsi ini harus ada di global scope (window) agar bisa dipanggil onclick di HTML
window.deleteTask = async function(id) {
    if (confirm('Yakin ingin menghapus tugas ini?')) {
        try {
            const res = await fetch(`${API_URL}/tasks?id=${id}`, { // Vercel terkadang butuh query param atau path param tergantung config
                method: 'DELETE',
                // Opsional: support body untuk backend tertentu, tapi DELETE biasanya lewat URL
            });
            
            // Coba cara kedua jika cara pertama gagal (karena struktur route express /:id)
            if(res.status === 404) {
                 await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
            }

            loadTasks();
        } catch (error) {
            console.error("Gagal hapus:", error);
            alert("Gagal menghapus tugas.");
        }
    }
}