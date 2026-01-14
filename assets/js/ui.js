export const ui = {
    renderQuote(data) {
        // Quote is now hidden in sidebar-based layout, but keep for compatibility
        const el = document.getElementById('quote-display');
        if (!el) return;

        const content = data.content || data.quote || "Membaca adalah jendela dunia.";
        const author = data.author || "Anonim";
        el.innerHTML = `
            <blockquote>"${content}"</blockquote>
            <cite>— ${author}</cite>
        `;
    },

    toggleLoading(show) {
        const loader = document.getElementById('global-loader');
        loader.style.display = show ? 'flex' : 'none';
    },

    updateDashboardStats(totalBooks, totalBorrowed) {
        const totalBooksEl = document.getElementById('total-books');
        const totalBorrowedEl = document.getElementById('total-borrowed');
        const subtitleEl = document.getElementById('dashboard-subtitle');
        const weeklyBorrowedEl = document.getElementById('weekly-borrowed');

        if (totalBooksEl) totalBooksEl.textContent = totalBooks.toLocaleString();
        if (totalBorrowedEl) totalBorrowedEl.textContent = totalBorrowed.toLocaleString();
        if (subtitleEl) subtitleEl.textContent = `Mengelola ${totalBooks.toLocaleString()} judul buku dalam koleksi.`;
        if (weeklyBorrowedEl) weeklyBorrowedEl.textContent = `${totalBorrowed} Dipinjam`;
    },

    updateFeaturedBook(book) {
        const featuredCard = document.getElementById('featured-book');
        if (!featuredCard || !book) return;

        const bg = featuredCard.querySelector('.featured-bg');
        const title = featuredCard.querySelector('.featured-title');
        const desc = featuredCard.querySelector('.featured-desc');

        if (bg) bg.style.backgroundImage = `url('${book.gambar_buku || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800'}')`;
        if (title) title.textContent = book.judul || 'Featured Book';
        if (desc) desc.textContent = `By ${book.penulis || 'Unknown Author'} (${book.tahun_terbit || 'N/A'}) - ${book.kategori_buku || 'General'}`;
    },

    // mode: 'admin' (edit/delete), 'katalog' (pinjamkan), 'view' (stock only)
    renderBukuList(books, containerId, mode = 'view') {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (books.length === 0) {
            const emptyMessage = mode === 'admin'
                ? '<p style="margin-top: 0.5rem; font-size: 0.875rem;">Klik tombol "Add New Book" untuk menambahkan koleksi baru.</p>'
                : mode === 'katalog'
                    ? '<p style="margin-top: 0.5rem; font-size: 0.875rem;">Tidak ada buku tersedia untuk dipinjam.</p>'
                    : '';

            container.innerHTML = `
                <div class="empty-state">
                    <span>Belum ada data buku.</span>
                    ${emptyMessage}
                </div>
            `;
            return;
        }

        books.forEach(buku => {
            const card = document.createElement('div');
            card.className = 'card-buku';

            // Determine book status from status_buku field (default to 'tersedia' if not set)
            const statusBuku = buku.status_buku || 'tersedia';
            const isAvailable = statusBuku === 'tersedia';
            let statusClass = isAvailable ? 'available' : 'borrowed';
            let statusText = isAvailable ? 'Tersedia' : 'Tidak Tersedia';

            // Generate hover action buttons for admin mode
            let hoverActions = '';
            if (mode === 'admin') {
                hoverActions = `
                    <div class="card-hover-actions">
                        <button class="card-hover-btn" data-id="${buku.id}" data-action="edit" title="Edit buku">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button class="card-hover-btn delete" data-id="${buku.id}" data-action="delete" title="Hapus buku">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                `;
            }

            // Generate card actions based on mode
            let cardActions = '';
            if (mode === 'katalog') {
                cardActions = `
                    <div class="card-actions">
                        <button class="btn-primary btn-pinjam full-width" data-id="${buku.id}" data-title="${buku.judul}">
                            <span class="material-symbols-outlined">person_add</span>
                            <span>Pinjamkan Buku</span>
                        </button>
                    </div>
                `;
            }

            // Status meta item
            const statusMetaClass = isAvailable ? 'status-available' : 'status-unavailable';
            const stockCount = buku.stok || 0;

            card.innerHTML = `
                <div class="card-img">
                    <img src="${buku.gambar_buku || 'https://via.placeholder.com/200x300?text=No+Cover'}" alt="${buku.judul}" loading="lazy">
                    ${hoverActions}
                    <span class="book-status ${statusClass}">${statusText}</span>
                </div>
                <div class="card-body">
                    <h3 title="${buku.judul}">${buku.judul}</h3>
                    <p class="author">${buku.penulis}</p>
                    <div class="card-meta">
                        <span class="card-meta-item">
                            <span class="material-symbols-outlined">calendar_month</span>
                            ${buku.tahun_terbit}
                        </span>
                        <span class="card-meta-item">
                            <span class="material-symbols-outlined">category</span>
                            ${buku.kategori_buku}
                        </span>
                        <span class="card-meta-item">
                            <span class="material-symbols-outlined">inventory_2</span>
                            Stok: ${stockCount}
                        </span>
                        <span class="card-meta-item ${statusMetaClass}">
                            <span class="material-symbols-outlined">${isAvailable ? 'check_circle' : 'cancel'}</span>
                            ${statusText}
                        </span>
                    </div>
                    ${cardActions}
                </div>
            `;

            // Add event listeners for admin actions
            if (mode === 'admin') {
                const editBtn = card.querySelector('[data-action="edit"]');
                const deleteBtn = card.querySelector('[data-action="delete"]');

                if (editBtn) {
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const event = new CustomEvent('book-edit', { detail: { id: buku.id, book: buku } });
                        document.dispatchEvent(event);
                    });
                }

                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const event = new CustomEvent('book-delete', { detail: { id: buku.id, title: buku.judul } });
                        document.dispatchEvent(event);
                    });
                }
            }

            container.appendChild(card);
        });
    },

    renderPeminjamList(loans) {
        const container = document.getElementById('list-peminjam');
        container.innerHTML = '';

        if (loans.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>Tidak ada peminjaman aktif.</span>
                    <p style="margin-top: 0.5rem; font-size: 0.875rem;">Semua buku sudah dikembalikan. 🎉</p>
                </div>
            `;
            return;
        }

        loans.forEach(loan => {
            const card = document.createElement('div');
            card.className = 'card-peminjam';

            // Format Tanggal
            const tglKembali = loan.tanggal_pengembalian.toDate().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Check if overdue
            const isOverdue = loan.tanggal_pengembalian.toDate() < new Date();

            if (isOverdue) {
                card.style.borderLeftColor = 'var(--danger)';
            }

            card.innerHTML = `
                <div class="loan-info">
                    <h4>
                        <span class="material-symbols-outlined" style="vertical-align: middle; margin-right: 6px; font-size: 1.25rem;">person</span>
                        ${loan.nama_peminjam}
                    </h4>
                    <p>
                        <span class="material-symbols-outlined" style="vertical-align: middle; margin-right: 4px; font-size: 1rem;">menu_book</span>
                        Meminjam: <strong>${loan.judul_buku}</strong>
                    </p>
                    <p class="meta">
                        <span>
                            <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 0.875rem;">credit_card</span>
                            Jaminan: ${loan.jaminan}
                        </span>
                        <span style="margin-left: 1rem; ${isOverdue ? 'color: var(--danger); font-weight: 600;' : ''}">
                            <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 0.875rem;">schedule</span>
                            ${isOverdue ? '⚠️ TERLAMBAT - ' : ''}Kembali: ${tglKembali}
                        </span>
                    </p>
                </div>
                <button class="btn-success btn-kembalikan" data-id="${loan.id}" data-bukuid="${loan.buku_id}">
                    <span class="material-symbols-outlined">check_circle</span>
                    <span>Kembalikan</span>
                </button>
            `;

            container.appendChild(card);
        });
    },

    renderHistoryList(loans) {
        const container = document.getElementById('list-history');
        container.innerHTML = '';

        if (loans.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>Belum ada riwayat peminjaman.</span>
                </div>
            `;
            return;
        }

        loans.forEach(loan => {
            const card = document.createElement('div');
            card.className = 'card-history';

            // Format Tanggal
            const tglKembali = loan.tanggal_pengembalian ? loan.tanggal_pengembalian.toDate().toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : '-';

            // Calculate Status (Late or On Time)
            const dueDate = loan.tanggal_pengembalian.toDate();
            const realReturnDate = loan.tanggal_dikembalikan_real ? loan.tanggal_dikembalikan_real.toDate() : new Date();

            // Format Real Return Date
            const tglReal = realReturnDate.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            // Check delay
            const dueDay = new Date(dueDate.toDateString());
            const returnDay = new Date(realReturnDate.toDateString());
            const isLate = returnDay > dueDay;

            // Calculate days late
            const diffTime = Math.abs(returnDay - dueDay);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let statusBadge = '';
            if (isLate) {
                statusBadge = `<span style="color: var(--danger); font-weight: 700;">⚠️ Terlambat ${diffDays} Hari</span>`;
            } else {
                statusBadge = `<span style="color: var(--success); font-weight: 700;">✅ Tepat Waktu</span>`;
            }

            card.innerHTML = `
                <div class="loan-info">
                    <h4>
                        <span class="material-symbols-outlined" style="vertical-align: middle; margin-right: 6px; font-size: 1.25rem;">person</span>
                        ${loan.nama_peminjam}
                    </h4>
                    <p>
                        <span class="material-symbols-outlined" style="vertical-align: middle; margin-right: 4px; font-size: 1rem;">menu_book</span>
                        Meminjam: <strong>${loan.judul_buku}</strong>
                    </p>
                    <p class="meta">
                        <span>Batas: ${tglKembali}</span>
                        <span style="margin-left: 1rem;">Dikembalikan: ${tglReal}</span>
                    </p>
                    <p class="meta" style="margin-top: 0.5rem; border: none;">
                        ${statusBadge}
                    </p>
                </div>
                <div class="card-chip">
                    <span class="material-symbols-outlined" style="font-size: 1rem;">check</span>
                    <span>Selesai</span>
                </div>
            `;
            container.appendChild(card);
        });
    },

    switchTab(tabId) {
        // Remove active from all tabs and contents
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

        // Add active to target
        const targetContent = document.getElementById(tabId);
        const targetNav = document.querySelector(`[data-target="${tabId}"]`);

        if (targetContent) targetContent.classList.add('active');
        if (targetNav) targetNav.classList.add('active');
    },

    showConfirm(message, onConfirm) {
        const modal = document.getElementById('modal-confirm');
        const msgEl = document.getElementById('confirm-message');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnCancel = document.getElementById('btn-confirm-cancel');

        msgEl.textContent = message;
        modal.classList.add('active');

        // Clean up previous listeners
        const safeOnConfirm = async () => {
            modal.classList.remove('active');
            await onConfirm();
        };

        const safeOnCancel = () => {
            modal.classList.remove('active');
        };

        // Clone buttons to strip old listeners
        const newBtnYes = btnYes.cloneNode(true);
        const newBtnCancel = btnCancel.cloneNode(true);

        btnYes.parentNode.replaceChild(newBtnYes, btnYes);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);

        newBtnYes.addEventListener('click', safeOnConfirm);
        newBtnCancel.addEventListener('click', safeOnCancel);
    }
};