import { auth, db } from './firebase-config.js';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updateEmail,
    updatePassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { fetchDailyQuote } from './api.js';
import { bukuService } from './db-buku.js';
import { peminjamService } from './db-peminjam.js';
import { ui } from './ui.js';
import { showToast } from './notifications.js';

let currentUser = null;
let currentBukuIdToLoan = null; // Temp storage for modal
let currentEditBukuId = null; // Temp storage for edit

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load Quote (optional, hidden in new design)
    const quote = await fetchDailyQuote();
    ui.renderQuote(quote);

    // 2. Auth Listener
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('dashboard-section').style.display = 'flex';

            // Update user name in sidebar
            const userNameEl = document.getElementById('user-name');
            if (userNameEl) {
                userNameEl.textContent = user.email ? user.email.split('@')[0] : 'Admin';
            }

            // Update user email in sidebar
            const userEmailEl = document.getElementById('user-email');
            if (userEmailEl) {
                userEmailEl.textContent = user.email || 'user@email.com';
            }

            loadMasterData(); // Default load
        } else {
            document.getElementById('auth-section').style.display = 'flex';
            document.getElementById('dashboard-section').style.display = 'none';
        }
    });

    setupEventListeners();
});

// --- Data Loaders ---
async function loadMasterData() {
    ui.toggleLoading(true);
    try {
        const books = await bukuService.getAllBuku();
        const activeLoans = await peminjamService.getActiveLoans();

        // Update dashboard stats
        ui.updateDashboardStats(books.length, activeLoans.length);

        // Update featured book with first book
        if (books.length > 0) {
            ui.updateFeaturedBook(books[0]);
        }

        ui.renderBukuList(books, 'list-buku', 'admin'); // admin mode: edit/delete only
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        ui.toggleLoading(false);
    }
}

async function loadPeminjamData() {
    ui.toggleLoading(true);
    try {
        const loans = await peminjamService.getActiveLoans();
        ui.renderPeminjamList(loans);
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        ui.toggleLoading(false);
    }
}

async function loadKatalogData() {
    ui.toggleLoading(true);
    try {
        // Get all books and filter only those with status 'tersedia'
        const allBooks = await bukuService.getAllBuku();
        const availableBooks = allBooks.filter(book => (book.status_buku || 'tersedia') === 'tersedia');
        ui.renderBukuList(availableBooks, 'list-katalog', 'katalog'); // katalog mode: pinjamkan button
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        ui.toggleLoading(false);
    }
}

async function loadHistoryData() {
    ui.toggleLoading(true);
    try {
        const loans = await peminjamService.getLoanHistory();
        ui.renderHistoryList(loans);
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        ui.toggleLoading(false);
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const pass = e.target.password.value;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            showToast('Login Berhasil');
        } catch (error) {
            showToast('Login Gagal: ' + error.message, 'error');
        }
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => signOut(auth));

    // Tab Navigation (for new sidebar nav-items)
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            const target = navItem.dataset.target;
            if (!target) return;

            ui.switchTab(target);
            if (target === 'tab-master') loadMasterData();
            if (target === 'tab-peminjam') loadPeminjamData();
            if (target === 'tab-katalog') loadKatalogData();
            if (target === 'tab-history') loadHistoryData();
        });
    });

    // Modal: Add Buku (Reset mode) - using new btn-add-buku ID
    document.getElementById('btn-add-buku').addEventListener('click', () => {
        currentEditBukuId = null;
        document.querySelector('#modal-buku h2').textContent = '📖 Tambah Buku Baru';
        document.getElementById('form-buku').reset();
        document.getElementById('modal-buku').classList.add('active');
    });

    // Form: Submit Buku (Add or Update)
    document.getElementById('form-buku').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            judul: e.target.judul.value,
            penulis: e.target.penulis.value,
            tahun_terbit: e.target.tahun.value,
            stok: e.target.stok.value,
            kategori_buku: e.target.kategori.value,
            gambar_buku: e.target.gambar.value,
            status_buku: e.target.status_buku.value
        };
        try {
            if (currentEditBukuId) {
                // Mode: Edit
                await bukuService.updateBuku(currentEditBukuId, formData);
                showToast('Buku berhasil diperbarui');
            } else {
                // Mode: Add
                await bukuService.tambahBuku(formData, currentUser.uid);
                showToast('Buku berhasil ditambahkan');
            }

            document.getElementById('modal-buku').classList.remove('active');
            e.target.reset();
            currentEditBukuId = null; // Reset
            loadMasterData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // 1. Master List Actions (Edit & Delete) - Updated for new card structure
    document.getElementById('list-buku').addEventListener('click', async (e) => {
        // Edit Action - new structure uses data-action="edit"
        const editBtn = e.target.closest('[data-action="edit"]');
        if (editBtn) {
            try {
                const id = editBtn.dataset.id;
                ui.toggleLoading(true);
                const book = await bukuService.getBukuById(id);

                // Populate Form
                currentEditBukuId = id;
                const form = document.getElementById('form-buku');
                form.judul.value = book.judul;
                form.penulis.value = book.penulis;
                form.tahun.value = book.tahun_terbit;
                form.stok.value = book.stok || 1;
                form.kategori.value = book.kategori_buku;
                form.gambar.value = book.gambar_buku;
                form.status_buku.value = book.status_buku || 'tersedia';

                document.querySelector('#modal-buku h2').textContent = '✏️ Edit Buku';
                document.getElementById('modal-buku').classList.add('active');
            } catch (err) {
                showToast(err, 'error');
            } finally {
                ui.toggleLoading(false);
            }
            return;
        }

        // Delete Action - new structure uses data-action="delete"
        const deleteBtn = e.target.closest('[data-action="delete"]');
        if (deleteBtn) {
            ui.showConfirm('Apakah Anda yakin ingin menghapus buku ini dari koleksi?', async () => {
                await bukuService.hapusBuku(deleteBtn.dataset.id);
                loadMasterData();
                showToast('Buku berhasil dihapus');
            });
        }
    });

    // Listen for custom book events from ui.js
    document.addEventListener('book-edit', async (e) => {
        const { id, book } = e.detail;
        try {
            currentEditBukuId = id;
            const form = document.getElementById('form-buku');
            form.judul.value = book.judul;
            form.penulis.value = book.penulis;
            form.tahun.value = book.tahun_terbit;
            form.stok.value = book.stok || 1;
            form.kategori.value = book.kategori_buku;
            form.gambar.value = book.gambar_buku;
            form.status_buku.value = book.status_buku || 'tersedia';

            document.querySelector('#modal-buku h2').textContent = '✏️ Edit Buku';
            document.getElementById('modal-buku').classList.add('active');
        } catch (err) {
            showToast(err, 'error');
        }
    });

    document.addEventListener('book-delete', (e) => {
        const { id, title } = e.detail;
        ui.showConfirm(`Apakah Anda yakin ingin menghapus "${title}" dari koleksi?`, async () => {
            await bukuService.hapusBuku(id);
            loadMasterData();
            showToast('Buku berhasil dihapus');
        });
    });

    // 2. Katalog List Actions (Pinjamkan)
    document.getElementById('list-katalog').addEventListener('click', async (e) => {
        const pinjamBtn = e.target.closest('.btn-pinjam');
        if (pinjamBtn && !pinjamBtn.disabled) {
            currentBukuIdToLoan = pinjamBtn.dataset.id;
            document.getElementById('modal-pinjam').classList.add('active');
        }
    });

    // 3. Submit Pinjaman
    document.getElementById('form-pinjam').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            nama_peminjam: e.target.nama_peminjam.value,
            jaminan: e.target.jaminan.value,
            tanggal_kembali: e.target.tgl_kembali.value
        };
        try {
            await peminjamService.pinjamBuku(data, currentBukuIdToLoan);
            showToast('Peminjaman berhasil dicatat');
            document.getElementById('modal-pinjam').classList.remove('active');
            e.target.reset();
            loadKatalogData(); // Refresh katalog display
            loadMasterData(); // Also refresh master for stock update
        } catch (err) {
            showToast(err, 'error');
        }
    });

    // 4. Kembalikan Buku Action
    document.getElementById('list-peminjam').addEventListener('click', async (e) => {
        const kembalikanBtn = e.target.closest('.btn-kembalikan');
        if (kembalikanBtn) {
            const loanId = kembalikanBtn.dataset.id;
            const bukuCustomId = kembalikanBtn.dataset.bukuid;

            ui.showConfirm('Apakah buku benar-benar sudah dikembalikan?', async () => {
                try {
                    await peminjamService.kembalikanBuku(loanId, bukuCustomId);
                    showToast('Buku berhasil dikembalikan');
                    loadPeminjamData();
                    loadMasterData();
                    loadKatalogData();
                } catch (err) {
                    showToast(err, 'error');
                }
            });
        }
    });

    // Close Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').classList.remove('active');
        });
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length < 2) {
                // Reload default data
                loadMasterData();
                return;
            }

            try {
                const books = await bukuService.getAllBuku();
                const filtered = books.filter(book =>
                    book.judul.toLowerCase().includes(query) ||
                    book.penulis.toLowerCase().includes(query) ||
                    book.kategori_buku.toLowerCase().includes(query)
                );
                ui.renderBukuList(filtered, 'list-buku', 'admin');
            } catch (err) {
                showToast(err.message, 'error');
            }
        }, 300));
    }

    // ========================================
    // Profile Actions: Change Password
    // ========================================

    // Open Change Password Modal
    const btnChangePassword = document.getElementById('btn-change-password');
    if (btnChangePassword) {
        btnChangePassword.addEventListener('click', () => {
            document.getElementById('form-change-password').reset();
            document.getElementById('modal-change-password').classList.add('active');
        });
    }

    // Handle Change Password Form
    document.getElementById('form-change-password').addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = e.target.current_password.value;
        const newPassword = e.target.new_password.value;
        const confirmPassword = e.target.confirm_password.value;

        if (!currentUser) {
            showToast('Anda harus login terlebih dahulu', 'error');
            return;
        }

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            showToast('Password baru dan konfirmasi tidak cocok!', 'error');
            return;
        }

        ui.toggleLoading(true);
        try {
            // Re-authenticate user
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // Update password
            await updatePassword(currentUser, newPassword);

            showToast('Password berhasil diperbarui!');
            document.getElementById('modal-change-password').classList.remove('active');
            e.target.reset();
        } catch (error) {
            let errorMessage = 'Gagal memperbarui password: ';
            if (error.code === 'auth/wrong-password') {
                errorMessage += 'Password saat ini salah!';
            } else if (error.code === 'auth/weak-password') {
                errorMessage += 'Password terlalu lemah (min. 6 karakter)!';
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage += 'Sesi sudah lama, silakan logout dan login kembali.';
            } else {
                errorMessage += error.message;
            }
            showToast(errorMessage, 'error');
        } finally {
            ui.toggleLoading(false);
        }
    });
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}