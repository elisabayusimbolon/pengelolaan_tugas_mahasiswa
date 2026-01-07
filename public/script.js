const API_URL = '/api';
let currentUser = null;
let isEditing = false;

// === 1. SESSION MANAGEMENT ===
document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem('stm_user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showDashboard();
    } else {
        showAuth();
    }
});

function toggleAuth(view) {
    const loginCard = document.getElementById('loginCard');
    const regCard = document.getElementById('registerCard');
    
    if (view === 'register') {
        loginCard.classList.add('hidden');
        regCard.classList.remove('hidden');
    } else {
        regCard.classList.add('hidden');
        loginCard.classList.remove('hidden');
    }
}

function logout() {
    localStorage.removeItem('stm_user');
    currentUser = null;
    showAuth();
}

function showAuth() {
    document.getElementById('auth-section').classList.remove('auth-hidden');
    document.getElementById('dashboard-section').classList.remove('dashboard-active');
}

function showDashboard() {
    document.getElementById('auth-section').classList.add('auth-hidden');
    document.getElementById('dashboard-section').classList.add('dashboard-active');
    
    // Set Header Info
    document.getElementById('welcomeMsg').innerText = `Halo, ${currentUser.nama_lengkap.split(' ')[0]}! 👋`;
    document.getElementById('navName').innerText = currentUser.nama_lengkap;
    document.getElementById('navNim').innerText = currentUser.nim;
    document.getElementById('navAvatar').innerText = currentUser.nama_lengkap.charAt(0);

    // Load Data
    loadMatkul();
    loadTasks();
}

// === 2. AUTHENTICATION LOGIC ===

// REGISTER
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nama_lengkap: document.getElementById('regName').value,
        nim: document.getElementById('regNim').value,
        email: document.getElementById('regEmail').value,
        kata_sandi: document.getElementById('regPass').value,
        jurusan: "Informatika",
        semester: document.getElementById('regSem').value
    };

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if (res.ok) {
            alert("Registrasi Berhasil! Silakan Login.");
            toggleAuth('login');
            e.target.reset();
        } else {
            alert(result.error);
        }
    } catch (err) { alert("Error koneksi server"); }
});

// LOGIN
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, kata_sandi: pass })
        });
        const user = await res.json();

        if (res.ok) {
            localStorage.setItem('stm_user', JSON.stringify(user));
            currentUser = user;
            showDashboard();
        } else {
            alert(user.error);
        }
    } catch (err) { alert("Error Login"); }
});

// === 3. CORE FEATURES (CRUD) ===

async function loadMatkul() {
    try {
        const res = await fetch(`${API_URL}/mata-kuliah`);
        const data = await res.json();
        const select = document.getElementById('matkulSelect');
        select.innerHTML = '<option value="">-- Pilih Mata Kuliah --</option>';
        data.forEach(m => {
            select.innerHTML += `<option value="${m._id}">${m.kode_mata_kuliah} - ${m.nama_mata_kuliah}</option>`;
        });
    } catch (err) { console.error("Gagal load matkul"); }
}

async function loadTasks() {
    const list = document.getElementById('taskList');
    list.innerHTML = '<div style="text-align:center; padding:20px;"><div class="loading-spinner"></div></div>';

    try {
        // Fetch tasks spesifik user yang sedang login
        const res = await fetch(`${API_URL}/tugas?userId=${currentUser._id}`);
        const tasks = await res.json();

        document.getElementById('taskCount').innerText = tasks.length;
        list.innerHTML = '';

        if (tasks.length === 0) {
            list.innerHTML = `<div style="text-align:center; padding:40px; color:#94a3b8;">
                <i class="fas fa-check-circle" style="font-size:2rem; margin-bottom:10px;"></i>
                <p>Tidak ada tugas. Selamat bersantai!</p>
            </div>`;
            return;
        }

        tasks.forEach(t => {
            const date = new Date(t.tenggat_waktu).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
            const statusClass = `status-${t.status_tugas.split(' ')[0]}`; // Ambil kata pertama
            
            const html = `
            <li class="task-card ${statusClass}">
                <div class="task-info">
                    <h4>${t.judul_tugas}</h4>
                    <div class="task-meta">
                        <span class="badge bg-matkul"><i class="fas fa-book"></i> ${t.id_mata_kuliah?.nama_mata_kuliah || 'N/A'}</span>
                        <span><i class="far fa-calendar-alt"></i> ${date}</span>
                        <span class="badge bg-prio-${t.prioritas}">${t.prioritas}</span>
                    </div>
                </div>
                <div class="actions">
                    <button onclick="editTask('${t._id}', '${t.judul_tugas}', '${t.id_mata_kuliah?._id}', '${t.tenggat_waktu}', '${t.prioritas}', '${t.status_tugas}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-del" onclick="deleteTask('${t._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </li>
            `;
            list.innerHTML += html;
        });

    } catch (err) { console.error(err); }
}

// SAVE & UPDATE TUGAS
document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSaveTask');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="loading-spinner"></div> Saving...';
    btn.disabled = true;

    const data = {
        id_pengguna: currentUser._id,
        judul_tugas: document.getElementById('judul').value,
        id_mata_kuliah: document.getElementById('matkulSelect').value,
        tenggat_waktu: document.getElementById('deadline').value,
        prioritas: document.getElementById('prioritas').value,
        status_tugas: document.getElementById('status').value
    };

    try {
        let url = `${API_URL}/tugas`;
        let method = 'POST';

        if (isEditing) {
            url = `${API_URL}/tugas/${document.getElementById('taskId').value}`;
            method = 'PUT';
        }

        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        resetForm();
        loadTasks();
    } catch (err) { alert("Gagal menyimpan data"); }
    finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// Helper Functions
window.editTask = function(id, judul, matkulId, date, prio, status) {
    isEditing = true;
    document.getElementById('taskId').value = id;
    document.getElementById('judul').value = judul;
    document.getElementById('matkulSelect').value = matkulId;
    document.getElementById('prioritas').value = prio;
    document.getElementById('status').value = status;
    
    // Format Date for Input
    if(date) {
        const d = new Date(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        document.getElementById('deadline').value = `${yyyy}-${mm}-${dd}`;
    }

    document.getElementById('btnSaveTask').innerHTML = '<i class="fas fa-sync"></i> UPDATE TUGAS';
    document.getElementById('btnCancel').style.display = 'block';
    
    // Scroll to top mobile
    if(window.innerWidth < 1000) window.scrollTo(0,0);
}

window.deleteTask = async function(id) {
    if(confirm("Hapus tugas ini?")) {
        await fetch(`${API_URL}/tugas/${id}`, { method: 'DELETE' });
        loadTasks();
    }
}

window.resetForm = function() {
    isEditing = false;
    document.getElementById('taskForm').reset();
    document.getElementById('btnSaveTask').innerHTML = '<i class="fas fa-save"></i> SIMPAN TUGAS';
    document.getElementById('btnCancel').style.display = 'none';
}