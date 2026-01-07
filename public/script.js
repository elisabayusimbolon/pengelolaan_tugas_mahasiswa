const API_URL = '/api';
let currentUser = null;
let isEditing = false;

// === 1. SESSION & NAVIGATION ===
document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem('stm_user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        initDashboard();
    } else {
        showAuth();
    }
    
    // Setup Sidebar Click Events
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            // Add active to clicked
            this.classList.add('active');
            
            // Get view name from text content or attribute
            const menuText = this.innerText.trim();
            if(menuText.includes('Dashboard')) switchView('dashboard');
            else if(menuText.includes('Mata Kuliah')) switchView('matkul');
        });
    });
});

function initDashboard() {
    document.getElementById('auth-section').classList.add('auth-hidden');
    document.getElementById('dashboard-section').classList.add('dashboard-active');
    
    // Set Profile Info
    document.getElementById('welcomeMsg').innerText = `Halo, ${currentUser.nama_lengkap.split(' ')[0]}! 👋`;
    document.getElementById('navName').innerText = currentUser.nama_lengkap;
    document.getElementById('navNim').innerText = currentUser.nim;
    document.getElementById('navAvatar').innerText = currentUser.nama_lengkap.charAt(0);

    // Initial Load
    switchView('dashboard'); // Default view
    loadUserMatkul(); // Load matkul data for dropdown & list
}

function switchView(viewName) {
    const dashboardView = document.getElementById('view-dashboard');
    const matkulView = document.getElementById('view-matkul');
    const pageDesc = document.getElementById('pageDesc');

    if (viewName === 'dashboard') {
        dashboardView.classList.remove('hidden');
        matkulView.classList.add('hidden');
        pageDesc.innerText = "Berikut daftar tugas akademik Anda hari ini.";
        loadTasks(); // Refresh tasks
        loadUserMatkul(); // Refresh dropdown
    } else if (viewName === 'matkul') {
        dashboardView.classList.add('hidden');
        matkulView.classList.remove('hidden');
        pageDesc.innerText = "Kelola data Kartu Rencana Studi (KRS) semester ini.";
        loadUserMatkul(); // Refresh list
    }
}

function showAuth() {
    document.getElementById('auth-section').classList.remove('auth-hidden');
    document.getElementById('dashboard-section').classList.remove('dashboard-active');
}

function logout() {
    localStorage.removeItem('stm_user');
    currentUser = null;
    showAuth();
}

function toggleAuth(view) {
    if (view === 'register') {
        document.getElementById('loginCard').classList.add('hidden');
        document.getElementById('registerCard').classList.remove('hidden');
    } else {
        document.getElementById('registerCard').classList.add('hidden');
        document.getElementById('loginCard').classList.remove('hidden');
    }
}

// === 2. AUTHENTICATION ===
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    handleAuth('/auth/login', {
        email: document.getElementById('loginEmail').value,
        kata_sandi: document.getElementById('loginPass').value
    });
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    handleAuth('/auth/register', {
        nama_lengkap: document.getElementById('regName').value,
        nim: document.getElementById('regNim').value,
        email: document.getElementById('regEmail').value,
        kata_sandi: document.getElementById('regPass').value,
        jurusan: "Informatika",
        semester: document.getElementById('regSem').value
    });
});

async function handleAuth(endpoint, data) {
    try {
        const res = await fetch(API_URL + endpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) {
            if (endpoint.includes('register')) {
                alert("Registrasi Berhasil! Silakan Login.");
                toggleAuth('login');
            } else {
                localStorage.setItem('stm_user', JSON.stringify(result));
                currentUser = result;
                initDashboard();
            }
        } else { alert(result.error); }
    } catch (err) { alert("Server Error"); }
}

// === 3. MANAJEMEN MATA KULIAH (NEW LOGIC) ===

// Load Matkul (Dipakai untuk Dropdown Tugas & List Matkul)
async function loadUserMatkul() {
    try {
        const res = await fetch(`${API_URL}/mata-kuliah?userId=${currentUser._id}`);
        const data = await res.json();
        
        // A. Update Dropdown di Form Tugas
        const select = document.getElementById('matkulSelect');
        select.innerHTML = '<option value="">-- Pilih Mata Kuliah --</option>';
        if(data.length === 0) {
             select.innerHTML += '<option disabled>Belum ada matkul, input di menu Mata Kuliah</option>';
        }
        
        // B. Update List di Halaman Matkul
        const listDiv = document.getElementById('matkulList');
        listDiv.innerHTML = '';

        data.forEach(m => {
            // Populate Dropdown
            select.innerHTML += `<option value="${m._id}">${m.kode_mata_kuliah} - ${m.nama_mata_kuliah}</option>`;

            // Populate View List
            listDiv.innerHTML += `
            <div class="card" style="padding: 20px; border-left: 5px solid var(--accent);">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div>
                        <h3 style="font-size:1.1rem; color:var(--primary);">${m.nama_mata_kuliah}</h3>
                        <div style="font-size:0.9rem; color:var(--text-gray); margin-top:5px;">
                            <i class="fas fa-code"></i> ${m.kode_mata_kuliah} <br>
                            <i class="fas fa-user-tie"></i> ${m.dosen_pengampu || '-'}
                        </div>
                    </div>
                    <button onclick="deleteMatkul('${m._id}')" style="background:none; border:none; color:var(--danger); cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
        });

    } catch (err) { console.error("Gagal load matkul"); }
}

// Tambah Matkul
document.getElementById('matkulForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        id_pengguna: currentUser._id,
        kode_mata_kuliah: document.getElementById('mkKode').value,
        nama_mata_kuliah: document.getElementById('mkNama').value,
        dosen_pengampu: document.getElementById('mkDosen').value
    };

    await fetch(`${API_URL}/mata-kuliah`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    
    e.target.reset();
    loadUserMatkul(); // Refresh list realtime
    alert("Mata Kuliah berhasil ditambahkan!");
});

async function deleteMatkul(id) {
    if(confirm("Hapus mata kuliah ini? Tugas terkait mungkin akan error tampilan.")) {
        await fetch(`${API_URL}/mata-kuliah/${id}`, { method: 'DELETE' });
        loadUserMatkul();
    }
}

// === 4. MANAJEMEN TUGAS ===

async function loadTasks() {
    const list = document.getElementById('taskList');
    list.innerHTML = '<div class="loading-spinner" style="margin:20px;"></div>';
    
    try {
        const res = await fetch(`${API_URL}/tugas?userId=${currentUser._id}`);
        const tasks = await res.json();
        
        document.getElementById('taskCount').innerText = tasks.length;
        list.innerHTML = '';

        if(tasks.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding:20px; color:#cbd5e1;">Belum ada tugas.</p>';
            return;
        }

        tasks.forEach(t => {
            const date = new Date(t.tenggat_waktu).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
            // Handle if matkul deleted
            const matkulName = t.id_mata_kuliah ? t.id_mata_kuliah.nama_mata_kuliah : '<span style="color:red;">(Matkul Terhapus)</span>';
            const statusClass = `status-${t.status_tugas.split(' ')[0]}`;

            list.innerHTML += `
            <li class="task-card ${statusClass}">
                <div class="task-info">
                    <h4>${t.judul_tugas}</h4>
                    <div class="task-meta">
                        <span class="badge bg-matkul">${matkulName}</span>
                        <span><i class="far fa-calendar-alt"></i> ${date}</span>
                        <span class="badge bg-prio-${t.prioritas}">${t.prioritas}</span>
                    </div>
                </div>
                <div class="actions">
                    <button onclick="editTask('${t._id}', '${t.judul_tugas}', '${t.id_mata_kuliah?._id}', '${t.tenggat_waktu}', '${t.prioritas}', '${t.status_tugas}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-del" onclick="deleteTask('${t._id}')"><i class="fas fa-trash"></i></button>
                </div>
            </li>`;
        });
    } catch(err) { console.error(err); }
}

document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        id_pengguna: currentUser._id,
        judul_tugas: document.getElementById('judul').value,
        id_mata_kuliah: document.getElementById('matkulSelect').value,
        tenggat_waktu: document.getElementById('deadline').value,
        prioritas: document.getElementById('prioritas').value,
        status_tugas: document.getElementById('status').value
    };

    let url = isEditing ? `${API_URL}/tugas/${document.getElementById('taskId').value}` : `${API_URL}/tugas`;
    let method = isEditing ? 'PUT' : 'POST';

    await fetch(url, {
        method: method, headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });

    resetForm();
    loadTasks();
});

window.editTask = function(id, judul, matkulId, date, prio, status) {
    isEditing = true;
    document.getElementById('taskId').value = id;
    document.getElementById('judul').value = judul;
    document.getElementById('matkulSelect').value = matkulId; // Dropdown auto select
    document.getElementById('prioritas').value = prio;
    document.getElementById('status').value = status;
    if(date) document.getElementById('deadline').value = new Date(date).toISOString().split('T')[0];
    
    document.getElementById('btnSaveTask').innerText = "UPDATE TUGAS";
    document.getElementById('btnCancel').style.display = 'block';
};

window.deleteTask = async function(id) {
    if(confirm("Hapus tugas?")) {
        await fetch(`${API_URL}/tugas/${id}`, { method: 'DELETE' });
        loadTasks();
    }
};

window.resetForm = function() {
    isEditing = false;
    document.getElementById('taskForm').reset();
    document.getElementById('btnSaveTask').innerText = "SIMPAN TUGAS";
    document.getElementById('btnCancel').style.display = 'none';
};