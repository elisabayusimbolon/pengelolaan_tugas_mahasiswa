const API_URL = '/api';
let currentUser = null;
let isEditing = false;

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
    
    // Sidebar Navigation logic
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            const menuText = this.innerText.trim();
            // Simple view switcher logic
            if(menuText.includes('Dashboard')) {
                document.getElementById('view-dashboard').classList.remove('hidden');
                document.getElementById('view-matkul').classList.add('hidden');
                loadTasks(); 
            } else if(menuText.includes('Mata Kuliah')) {
                document.getElementById('view-dashboard').classList.add('hidden');
                document.getElementById('view-matkul').classList.remove('hidden');
                loadUserMatkul();
            }
        });
    });
});

function initDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.add('dashboard-active');
    
    // Set User Info
    document.getElementById('welcomeMsg').innerText = `Halo, ${currentUser.nama_lengkap.split(' ')[0]}! 👋`;
    document.getElementById('navName').innerText = currentUser.nama_lengkap;
    document.getElementById('navNpm').innerText = `NPM: ${currentUser.npm || '-'}`;
    
    // Load default view
    document.getElementById('view-dashboard').classList.remove('hidden');
    document.getElementById('view-matkul').classList.add('hidden');
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
    const btn = document.getElementById('btnLogin');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';

    try {
        const user = await apiRequest('/auth/login', 'POST', {
            email: document.getElementById('loginEmail').value,
            kata_sandi: document.getElementById('loginPass').value
        });
        localStorage.setItem('stm_user', JSON.stringify(user));
        currentUser = user;
        initDashboard();
        showToast('Login Berhasil!');
    } catch (e) {
        // Error handled by apiRequest
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnRegister');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

    try {
        await apiRequest('/auth/register', 'POST', {
            nama_lengkap: document.getElementById('regName').value,
            npm: document.getElementById('regNpm').value, // Menggunakan NPM
            email: document.getElementById('regEmail').value,
            kata_sandi: document.getElementById('regPass').value,
            jurusan: "Informatika",
            semester: document.getElementById('regSem').value
        });
        showToast('Registrasi Berhasil! Silakan Login.');
        toggleAuth('login');
        e.target.reset();
    } catch (e) {
        // Error handled by apiRequest
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// === FUNCTION LOADERS (MATA KULIAH & TUGAS) ===
// (Salin fungsi loadTasks, loadUserMatkul, deleteTask, deleteMatkul, prepEdit dari kode sebelumnya di sini)
// Pastikan fungsi-fungsi tersebut tetap ada agar dashboard berfungsi.
// Saya menyertakan kerangkanya agar script.js valid:

async function loadUserMatkul() { /* ...logic lama... */ }
async function loadTasks() { /* ...logic lama... */ }
async function deleteMatkul(id) { /* ...logic lama... */ }
async function deleteTask(id) { /* ...logic lama... */ }
window.prepEdit = function(t) { /* ...logic lama... */ };
window.resetForm = function() { /* ...logic lama... */ };

// TAMBAHKAN EVENT LISTENER UNTUK MATKUL DAN TUGAS FORM DARI KODE SEBELUMNYA DI BAWAH SINI