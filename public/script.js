const API_URL = '/api';
let currentUser = null;
let isEditing = false;

// === UTILITIES ===
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
    
    // Sidebar Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            const menuText = this.innerText.trim();
            if(menuText.includes('Dashboard')) switchView('dashboard');
            else if(menuText.includes('Mata Kuliah')) switchView('matkul');
        });
    });
});

function initDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.add('dashboard-active');
    document.getElementById('welcomeMsg').innerText = `Halo, ${currentUser.nama_lengkap.split(' ')[0]}! 👋`;
    document.getElementById('navName').innerText = currentUser.nama_lengkap;
    
    switchView('dashboard');
    loadUserMatkul(); 
}

function switchView(viewName) {
    const dashboardView = document.getElementById('view-dashboard');
    const matkulView = document.getElementById('view-matkul');

    if (viewName === 'dashboard') {
        dashboardView.classList.remove('hidden');
        matkulView.classList.add('hidden');
        loadTasks();
        loadUserMatkul(); 
    } else {
        dashboardView.classList.add('hidden');
        matkulView.classList.remove('hidden');
        loadUserMatkul();
    }
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
    document.getElementById('loginCard').classList.toggle('hidden', view === 'register');
    document.getElementById('registerCard').classList.toggle('hidden', view === 'login');
}

// === API HELPERS ===
async function apiRequest(endpoint, method, body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
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

// === AUTH LOGIC ===
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const user = await apiRequest('/auth/login', 'POST', {
            email: document.getElementById('loginEmail').value,
            kata_sandi: document.getElementById('loginPass').value
        });
        localStorage.setItem('stm_user', JSON.stringify(user));
        currentUser = user;
        initDashboard();
        showToast('Login Berhasil!');
    } catch (e) {}
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await apiRequest('/auth/register', 'POST', {
            nama_lengkap: document.getElementById('regName').value,
            nim: document.getElementById('regNim').value,
            email: document.getElementById('regEmail').value,
            kata_sandi: document.getElementById('regPass').value,
            jurusan: "Informatika",
            semester: document.getElementById('regSem').value
        });
        showToast('Registrasi Berhasil! Silakan Login.');
        toggleAuth('login');
    } catch (e) {}
});

// === MATA KULIAH LOGIC ===
async function loadUserMatkul() {
    try {
        const data = await apiRequest(`/mata-kuliah?userId=${currentUser._id}`, 'GET');
        
        // Populate Dropdown Tugas
        const select = document.getElementById('matkulSelect');
        select.innerHTML = '<option value="">-- Pilih Mata Kuliah --</option>';
        if(data.length === 0) select.innerHTML += '<option disabled>Belum ada data</option>';
        
        // Populate List Manajemen Matkul
        const listDiv = document.getElementById('matkulList');
        listDiv.innerHTML = '';

        data.forEach(m => {
            select.innerHTML += `<option value="${m._id}">${m.kode_mata_kuliah} - ${m.nama_mata_kuliah}</option>`;
            
            listDiv.innerHTML += `
            <div class="card" style="padding: 15px; border-left: 4px solid var(--accent); margin-bottom:0;">
                <div style="display:flex; justify-content:space-between;">
                    <div>
                        <h4 style="color:var(--primary);">${m.nama_mata_kuliah}</h4>
                        <small style="color:var(--text-gray);">${m.kode_mata_kuliah} • ${m.dosen_pengampu || '-'}</small>
                    </div>
                    <button onclick="deleteMatkul('${m._id}')" style="background:none; border:none; color:var(--danger); cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
        });
    } catch (e) {}
}

document.getElementById('matkulForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await apiRequest('/mata-kuliah', 'POST', {
            id_pengguna: currentUser._id,
            kode_mata_kuliah: document.getElementById('mkKode').value,
            nama_mata_kuliah: document.getElementById('mkNama').value,
            dosen_pengampu: document.getElementById('mkDosen').value
        });
        e.target.reset();
        loadUserMatkul();
        showToast('Mata Kuliah ditambahkan!');
    } catch (e) {}
});

async function deleteMatkul(id) {
    if(confirm("Yakin hapus? Tugas terkait mungkin error.")) {
        try {
            await apiRequest(`/mata-kuliah/${id}`, 'DELETE');
            loadUserMatkul();
            showToast('Mata Kuliah dihapus.');
        } catch (e) {}
    }
}

// === TUGAS LOGIC (COMPREHENSIVE) ===
async function loadTasks() {
    const list = document.getElementById('taskList');
    list.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Memuat...</div>';
    
    try {
        const tasks = await apiRequest(`/tugas?userId=${currentUser._id}`, 'GET');
        document.getElementById('taskCount').innerText = tasks.length;
        list.innerHTML = '';

        if(tasks.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:#cbd5e1; padding:20px;">Belum ada tugas. Rajin sekali!</p>';
            return;
        }

        tasks.forEach(t => {
            const date = new Date(t.tenggat_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            const matkulName = t.id_mata_kuliah ? t.id_mata_kuliah.nama_mata_kuliah : '<span style="color:red;">(Terhapus)</span>';
            const statusClass = `status-${t.status_tugas.split(' ')[0]}`; // Ambil kata pertama untuk class css

            list.innerHTML += `
            <li class="task-card ${statusClass}">
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <h4 style="margin-bottom:5px;">${t.judul_tugas}</h4>
                        <span class="badge bg-gray">${t.jenis_tugas}</span>
                    </div>
                    <div style="font-size:0.85rem; color:var(--text-gray); margin-bottom:8px;">
                        ${t.deskripsi_tugas ? t.deskripsi_tugas.substring(0, 60) + (t.deskripsi_tugas.length > 60 ? '...' : '') : 'Tidak ada deskripsi'}
                    </div>
                    <div style="font-size:0.8rem; display:flex; gap:10px; flex-wrap:wrap;">
                        <span class="badge bg-blue"><i class="fas fa-book"></i> ${matkulName}</span>
                        <span><i class="far fa-calendar-alt"></i> ${date}</span>
                        <span style="color:${t.prioritas === 'Tinggi' ? 'red' : 'green'}">Prioritas: ${t.prioritas}</span>
                    </div>
                </div>
                <div style="margin-left:15px; display:flex; flex-direction:column; gap:5px;">
                    <button onclick='prepEdit(${JSON.stringify(t).replace(/'/g, "&#39;")})' style="border:none; background:none; color:var(--accent); cursor:pointer;"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteTask('${t._id}')" style="border:none; background:none; color:var(--danger); cursor:pointer;"><i class="fas fa-trash"></i></button>
                </div>
            </li>`;
        });
    } catch(err) { list.innerHTML = 'Gagal memuat data.'; }
}

document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSaveTask');
    const originalBtnText = btn.innerHTML;
    
    // UI Loading
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    const payload = {
        id_pengguna: currentUser._id,
        judul_tugas: document.getElementById('judul').value,
        deskripsi_tugas: document.getElementById('deskripsi').value,
        id_mata_kuliah: document.getElementById('matkulSelect').value,
        jenis_tugas: document.getElementById('jenisTugas').value,
        tenggat_waktu: document.getElementById('deadline').value,
        prioritas: document.getElementById('prioritas').value,
        status_tugas: document.getElementById('status').value,
        catatan_pribadi: document.getElementById('catatan').value
    };

    try {
        if(isEditing) {
            await apiRequest(`/tugas/${document.getElementById('taskId').value}`, 'PUT', payload);
            showToast('Tugas berhasil diperbarui!');
        } else {
            await apiRequest('/tugas', 'POST', payload);
            showToast('Tugas baru berhasil disimpan!');
        }
        resetForm();
        loadTasks();
    } catch (e) {
        // Error handled by apiRequest
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
    }
});

// Fungsi Persiapan Edit (Memasukkan data lama ke form)
window.prepEdit = function(t) {
    isEditing = true;
    document.getElementById('taskId').value = t._id;
    document.getElementById('judul').value = t.judul_tugas;
    document.getElementById('deskripsi').value = t.deskripsi_tugas || '';
    document.getElementById('matkulSelect').value = t.id_mata_kuliah?._id || t.id_mata_kuliah;
    document.getElementById('jenisTugas').value = t.jenis_tugas;
    document.getElementById('deadline').value = new Date(t.tenggat_waktu).toISOString().split('T')[0];
    document.getElementById('prioritas').value = t.prioritas;
    document.getElementById('status').value = t.status_tugas;
    document.getElementById('catatan').value = t.catatan_pribadi || '';

    // Ubah UI Tombol
    document.getElementById('btnSaveTask').innerHTML = '<i class="fas fa-edit"></i> UPDATE TUGAS';
    document.getElementById('btnCancel').style.display = 'block';
    
    // Scroll ke form
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
    document.getElementById('btnCancel').style.display = 'none';
};