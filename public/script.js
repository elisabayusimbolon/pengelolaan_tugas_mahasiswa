const API_URL = '/api';
let currentUser = null;
let isEditing = false;
let isEditingMk = false;
let globalTasks = []; // Menyimpan data lokal untuk statistik
let globalMatkul = [];

// === TOAST NOTIFICATION ===
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="font-size:1.2rem;">${type === 'success' ? '<i class="fas fa-check-circle" style="color:var(--success)"></i>' : '<i class="fas fa-exclamation-circle" style="color:var(--danger)"></i>'}</div>
        <div>
            <div class="toast-title">${type === 'success' ? 'Berhasil' : 'Gagal'}</div>
            <div class="toast-msg">${message}</div>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem('stm_user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        initDashboard();
    } else {
        showAuth();
    }
    
    // Sidebar Navigation Logic
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            // Active State
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Hide all Views
            document.querySelectorAll('.view-section').forEach(view => view.classList.add('hidden'));
            
            // Show Target View
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');

            // Load Data based on view
            if(targetId === 'view-dashboard') loadTasks();
            if(targetId === 'view-matkul') loadUserMatkul();
            if(targetId === 'view-stats') calculateStats();
            if(targetId === 'view-deadline') loadUpcomingDeadlines();
            if(targetId === 'view-profile') loadProfile();
        });
    });
});

function initDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.add('dashboard-active');
    
    // Set Header Info
    document.getElementById('welcomeMsg').innerText = `Halo, ${currentUser.nama_lengkap.split(' ')[0]}! 👋`;
    document.getElementById('navName').innerText = currentUser.nama_lengkap;
    document.getElementById('navNpm').innerText = `NPM: ${currentUser.npm || '-'}`;
    
    // Load Initial Data
    loadTasks();
    loadUserMatkul();
}

function showAuth() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.remove('dashboard-active');
}

function logout() {
    localStorage.removeItem('stm_user');
    location.reload();
}

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

// === API HELPERS ===
async function apiRequest(endpoint, method, body = null) {
    try {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(API_URL + endpoint, options);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan server');
        return data;
    } catch (err) {
        showToast(err.message, 'error');
        throw err;
    }
}

// === AUTH LOGIC (UNCHANGED) ===
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnLogin');
    const originalText = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';
    try {
        const user = await apiRequest('/auth/login', 'POST', {
            email: document.getElementById('loginEmail').value,
            kata_sandi: document.getElementById('loginPass').value
        });
        localStorage.setItem('stm_user', JSON.stringify(user));
        currentUser = user;
        initDashboard();
        showToast('Login Berhasil!');
    } catch (e) { } 
    finally { btn.disabled = false; btn.innerHTML = originalText; }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnRegister');
    const originalText = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    try {
        await apiRequest('/auth/register', 'POST', {
            nama_lengkap: document.getElementById('regName').value,
            npm: document.getElementById('regNpm').value,
            email: document.getElementById('regEmail').value,
            kata_sandi: document.getElementById('regPass').value,
            jurusan: "Informatika",
            semester: document.getElementById('regSem').value
        });
        showToast('Registrasi Berhasil! Silakan Login.');
        toggleAuth('login');
        e.target.reset();
    } catch (e) { } 
    finally { btn.disabled = false; btn.innerHTML = originalText; }
});

// === FEATURE 1: MATA KULIAH (CRUD LENGKAP) ===
async function loadUserMatkul() {
    try {
        const data = await apiRequest(`/mata-kuliah?userId=${currentUser._id}`, 'GET');
        globalMatkul = data;
        
        // 1. Populate Dropdown di Form Tugas
        const select = document.getElementById('matkulSelect');
        if(select) {
            select.innerHTML = '<option value="">-- Pilih Mata Kuliah --</option>';
            if(data.length === 0) select.innerHTML += '<option disabled>Belum ada data</option>';
            data.forEach(m => {
                select.innerHTML += `<option value="${m._id}">${m.nama_mata_kuliah} (${m.kode_mata_kuliah})</option>`;
            });
        }

        // 2. Populate List di Halaman Matkul
        const listDiv = document.getElementById('matkulList');
        if(listDiv) {
            listDiv.innerHTML = '';
            if(data.length === 0) listDiv.innerHTML = '<p>Belum ada mata kuliah.</p>';
            data.forEach(m => {
                listDiv.innerHTML += `
                <div class="card" style="padding: 15px; border-left: 4px solid var(--accent); margin-bottom:0; position:relative;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <h4 style="color:var(--primary); font-size:1rem; font-weight:700;">${m.nama_mata_kuliah}</h4>
                            <div style="color:var(--text-gray); font-size:0.85rem; margin-top:5px;">
                                <i class="fas fa-code"></i> ${m.kode_mata_kuliah} <br>
                                <i class="fas fa-chalkboard-teacher"></i> ${m.dosen_pengampu || '-'}
                            </div>
                        </div>
                        <div style="display:flex; gap:5px;">
                            <button onclick='prepEditMatkul(${JSON.stringify(m).replace(/'/g, "&#39;")})' style="background:var(--bg-light); border:none; color:var(--info); width:30px; height:30px; border-radius:50%; cursor:pointer;"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteMatkul('${m._id}')" style="background:var(--bg-light); border:none; color:var(--danger); width:30px; height:30px; border-radius:50%; cursor:pointer;"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>`;
            });
        }
    } catch (e) { console.error(e); }
}

document.getElementById('matkulForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        id_pengguna: currentUser._id,
        kode_mata_kuliah: document.getElementById('mkKode').value,
        nama_mata_kuliah: document.getElementById('mkNama').value,
        dosen_pengampu: document.getElementById('mkDosen').value
    };
    
    try {
        if(isEditingMk) {
            const id = document.getElementById('mkId').value;
            await apiRequest(`/mata-kuliah/${id}`, 'PUT', payload);
            showToast('Mata Kuliah diperbarui!');
        } else {
            await apiRequest('/mata-kuliah', 'POST', payload);
            showToast('Mata Kuliah ditambahkan!');
        }
        resetMatkulForm();
        loadUserMatkul();
    } catch (e) {}
});

window.prepEditMatkul = function(m) {
    isEditingMk = true;
    document.getElementById('mkId').value = m._id;
    document.getElementById('mkKode').value = m.kode_mata_kuliah;
    document.getElementById('mkNama').value = m.nama_mata_kuliah;
    document.getElementById('mkDosen').value = m.dosen_pengampu;
    
    document.getElementById('btnSaveMk').innerHTML = '<i class="fas fa-edit"></i> Simpan';
    document.getElementById('btnSaveMk').style.background = 'var(--warning)';
    document.getElementById('mkFormTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Mata Kuliah';
    document.getElementById('btnCancelMk').style.display = 'inline-block';
};

window.resetMatkulForm = function() {
    isEditingMk = false;
    document.getElementById('matkulForm').reset();
    document.getElementById('btnSaveMk').innerHTML = '<i class="fas fa-plus"></i> Tambah';
    document.getElementById('btnSaveMk').style.background = 'var(--accent)';
    document.getElementById('mkFormTitle').innerHTML = '<i class="fas fa-university"></i> Kelola Mata Kuliah';
    document.getElementById('btnCancelMk').style.display = 'none';
};

window.deleteMatkul = async function(id) {
    if(confirm("Yakin hapus? Tugas terkait mata kuliah ini akan kehilangan referensi.")) {
        try {
            await apiRequest(`/mata-kuliah/${id}`, 'DELETE');
            loadUserMatkul();
            showToast('Mata Kuliah dihapus.');
        } catch (e) {}
    }
}

// === FEATURE 2: TUGAS (CRUD LENGKAP) ===
async function loadTasks() {
    const list = document.getElementById('taskList');
    list.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Memuat...</div>';
    
    try {
        const tasks = await apiRequest(`/tugas?userId=${currentUser._id}`, 'GET');
        globalTasks = tasks; // Save for stats
        list.innerHTML = '';

        if(tasks.length === 0) {
            list.innerHTML = `
                <div style="text-align:center; padding:40px; color:#cbd5e1;">
                    <i class="fas fa-clipboard-check" style="font-size:3rem; margin-bottom:10px;"></i>
                    <p>Tidak ada tugas aktif.</p>
                </div>`;
            return;
        }

        tasks.forEach(t => {
            const date = new Date(t.tenggat_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            const matkulName = t.id_mata_kuliah ? t.id_mata_kuliah.nama_mata_kuliah : '<span style="color:red; font-style:italic;">(MK Terhapus)</span>';
            const statusClass = `status-${t.status_tugas.split(' ')[0]}`;
            
            // Badge color logic
            let priorityColor = 'bg-gray';
            if(t.prioritas === 'Tinggi') priorityColor = 'bg-red';
            if(t.prioritas === 'Sedang') priorityColor = 'bg-yellow';

            list.innerHTML += `
            <div class="task-card ${statusClass}">
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
                        <div>
                            <span class="badge bg-blue" style="margin-bottom:5px; display:inline-block;">${t.jenis_tugas}</span>
                            <span class="badge ${priorityColor}">${t.prioritas}</span>
                        </div>
                    </div>
                    <h4 style="margin:0 0 5px 0; color:var(--primary); font-size:1.1rem; font-weight:700;">${t.judul_tugas}</h4>
                    <div style="font-size:0.9rem; color:var(--text-gray); margin-bottom:12px; line-height:1.5;">
                        ${t.deskripsi_tugas ? t.deskripsi_tugas : '-'}
                    </div>
                    <div style="font-size:0.85rem; display:flex; gap:15px; flex-wrap:wrap; align-items:center; color:var(--secondary);">
                        <span><i class="fas fa-book" style="color:var(--accent)"></i> ${matkulName}</span>
                        <span><i class="far fa-calendar-alt" style="color:var(--danger)"></i> ${date}</span>
                        <span><i class="fas fa-tasks"></i> ${t.status_tugas}</span>
                    </div>
                </div>
                <div style="margin-left:15px; display:flex; flex-direction:column; gap:5px;">
                    <button onclick='prepEdit(${JSON.stringify(t).replace(/'/g, "&#39;")})' style="border:none; background:var(--bg-light); color:var(--accent); width:35px; height:35px; border-radius:6px; cursor:pointer; transition:0.2s;"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteTask('${t._id}')" style="border:none; background:var(--bg-light); color:var(--danger); width:35px; height:35px; border-radius:6px; cursor:pointer; transition:0.2s;"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        });
    } catch(err) { list.innerHTML = 'Gagal memuat data.'; }
}

document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSaveTask');
    const originalBtnText = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    const payload = {
        id_pengguna: currentUser._id,
        judul_tugas: document.getElementById('judul').value,
        deskripsi_tugas: document.getElementById('deskripsi').value,
        id_mata_kuliah: document.getElementById('matkulSelect').value,
        jenis_tugas: document.getElementById('jenisTugas').value,
        tenggat_waktu: document.getElementById('deadline').value,
        prioritas: document.getElementById('prioritas').value,
        status_tugas: document.getElementById('status').value
    };

    try {
        if(isEditing) {
            await apiRequest(`/tugas/${document.getElementById('taskId').value}`, 'PUT', payload);
            showToast('Tugas diperbarui!');
        } else {
            await apiRequest('/tugas', 'POST', payload);
            showToast('Tugas disimpan!');
        }
        resetForm();
        loadTasks(); // Reload List
    } catch (e) { } 
    finally { btn.disabled = false; btn.innerHTML = originalBtnText; }
});

window.prepEdit = function(t) {
    isEditing = true;
    document.getElementById('taskId').value = t._id;
    document.getElementById('judul').value = t.judul_tugas;
    document.getElementById('deskripsi').value = t.deskripsi_tugas || '';
    if(t.id_mata_kuliah) document.getElementById('matkulSelect').value = t.id_mata_kuliah._id || t.id_mata_kuliah;
    document.getElementById('jenisTugas').value = t.jenis_tugas;
    document.getElementById('deadline').value = new Date(t.tenggat_waktu).toISOString().split('T')[0];
    document.getElementById('prioritas').value = t.prioritas;
    document.getElementById('status').value = t.status_tugas;

    document.getElementById('btnSaveTask').innerHTML = '<i class="fas fa-edit"></i> UPDATE TUGAS';
    document.getElementById('btnSaveTask').style.background = 'var(--warning)';
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Tugas';
    document.getElementById('btnCancel').style.display = 'inline-flex';
    document.querySelector('.main-content').scrollTop = 0;
};

window.deleteTask = async function(id) {
    if(confirm("Hapus tugas ini?")) {
        try {
            await apiRequest(`/tugas/${id}`, 'DELETE');
            loadTasks();
            showToast('Tugas dihapus.');
        } catch (e) {}
    }
};

window.resetForm = function() {
    isEditing = false;
    document.getElementById('taskForm').reset();
    document.getElementById('btnSaveTask').innerHTML = '<i class="fas fa-save"></i> SIMPAN TUGAS';
    document.getElementById('btnSaveTask').style.background = 'var(--accent)';
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Input Tugas Baru';
    document.getElementById('btnCancel').style.display = 'none';
};

// === FEATURE 3: STATISTIK & DEADLINE & PROFILE ===

function calculateStats() {
    // Pastikan data terbaru
    if(!globalTasks) return;

    const total = globalTasks.length;
    const selesai = globalTasks.filter(t => t.status_tugas === 'Selesai').length;
    const urgent = globalTasks.filter(t => t.prioritas === 'Tinggi' && t.status_tugas !== 'Selesai').length;
    const pending = total - selesai;

    // Animate numbers
    document.getElementById('statTotal').innerText = total;
    document.getElementById('statSelesai').innerText = selesai;
    document.getElementById('statPending').innerText = pending;
    document.getElementById('statUrgent').innerText = urgent;
}

function loadUpcomingDeadlines() {
    const list = document.getElementById('deadlineList');
    list.innerHTML = '';
    
    // Filter H-7
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const deadlines = globalTasks.filter(t => {
        const d = new Date(t.tenggat_waktu);
        return d >= now && d <= nextWeek && t.status_tugas !== 'Selesai';
    }).sort((a,b) => new Date(a.tenggat_waktu) - new Date(b.tenggat_waktu));

    if(deadlines.length === 0) {
        list.innerHTML = `<div class="card" style="text-align:center; padding:30px;"><i class="fas fa-smile" style="font-size:2rem; color:var(--success); margin-bottom:10px;"></i><p>Aman! Tidak ada deadline mendesak.</p></div>`;
        return;
    }

    deadlines.forEach(t => {
        const d = new Date(t.tenggat_waktu);
        const daysLeft = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        
        list.innerHTML += `
        <div class="card" style="border-left:4px solid var(--danger); display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h4 style="color:var(--primary);">${t.judul_tugas}</h4>
                <p style="font-size:0.9rem; color:var(--text-gray);">${t.id_mata_kuliah ? t.id_mata_kuliah.nama_mata_kuliah : 'MK Umum'}</p>
            </div>
            <div style="text-align:right;">
                <div style="font-weight:700; color:var(--danger); font-size:1.2rem;">${daysLeft} Hari Lagi</div>
                <small>${d.toLocaleDateString('id-ID')}</small>
            </div>
        </div>`;
    });
}

function loadProfile() {
    if(!currentUser) return;
    document.getElementById('profileName').innerText = currentUser.nama_lengkap;
    document.getElementById('profileNpm').innerText = currentUser.npm;
    document.getElementById('profileEmail').innerText = currentUser.email;
    document.getElementById('profileSem').innerText = currentUser.semester;
    document.getElementById('profileInitial').innerText = currentUser.nama_lengkap.charAt(0).toUpperCase();
}
