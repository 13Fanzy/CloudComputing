export const ui = {
    renderQuote(data) {
        // Quote is now hidden in sidebar-based layout, but keep for compatibility
        const el = document.getElementById('quote-display');
        if (!el) return;

        const content = data.content || data.quote || "Membaca adalah jendela dunia.";
        const author = data.author || "Anonim";
        el.innerHTML = `
            <blockquote class="text-base sm:text-lg italic text-slate-300">"${content}"</blockquote>
            <cite class="text-xs sm:text-sm text-slate-500">— ${author}</cite>
        `;
    },

    toggleLoading(show) {
        const loader = document.getElementById('global-loader');
        if (show) {
            loader.classList.remove('hidden');
            loader.classList.add('flex');
        } else {
            loader.classList.add('hidden');
            loader.classList.remove('flex');
        }
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
                ? '<p class="mt-2 text-xs sm:text-sm">Klik tombol "Add New Book" untuk menambahkan koleksi baru.</p>'
                : mode === 'katalog'
                    ? '<p class="mt-2 text-xs sm:text-sm">Tidak ada buku tersedia untuk dipinjam.</p>'
                    : '';

            container.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12 sm:py-16 text-slate-400">
                    <span class="material-symbols-outlined text-5xl sm:text-6xl mb-3 sm:mb-4 text-slate-600">library_books</span>
                    <span class="text-base sm:text-lg font-medium">Belum ada data buku.</span>
                    ${emptyMessage}
                </div>
            `;
            return;
        }

        books.forEach(buku => {
            const card = document.createElement('div');
            card.className = 'group bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-2 sm:p-3 flex flex-col transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-1.5 hover:border-cyan-500/30 relative overflow-hidden';

            // Determine book status from status_buku field (default to 'tersedia' if not set)
            const statusBuku = buku.status_buku || 'tersedia';
            const isAvailable = statusBuku === 'tersedia';
            let statusClass = isAvailable 
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                : 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400';
            let statusText = isAvailable ? 'Tersedia' : 'Tidak Tersedia';

            // Generate hover action buttons for admin mode
            let hoverActions = '';
            if (mode === 'admin') {
                hoverActions = `
                    <div class="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button class="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-slate-900/80 backdrop-blur-sm border-none text-white flex items-center justify-center cursor-pointer transition-colors hover:text-cyan-400" data-id="${buku.id}" data-action="edit" title="Edit buku">
                            <span class="material-symbols-outlined text-xs sm:text-sm">edit</span>
                        </button>
                        <button class="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-slate-900/80 backdrop-blur-sm border-none text-white flex items-center justify-center cursor-pointer transition-colors hover:text-red-400" data-id="${buku.id}" data-action="delete" title="Hapus buku">
                            <span class="material-symbols-outlined text-xs sm:text-sm">delete</span>
                        </button>
                    </div>
                `;
            }

            // Generate card actions based on mode
            let cardActions = '';
            if (mode === 'katalog') {
                cardActions = `
                    <div class="mt-3 sm:mt-4">
                        <button class="w-full py-2 sm:py-2.5 px-3 sm:px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm" data-id="${buku.id}" data-title="${buku.judul}">
                            <span class="material-symbols-outlined text-base sm:text-lg">person_add</span>
                            <span>Pinjamkan</span>
                        </button>
                    </div>
                `;
            }

            // Status meta item
            const stockCount = buku.stok || 0;

            card.innerHTML = `
                <div class="relative aspect-[2/3] rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-3 bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg">
                    <img src="${buku.gambar_buku || 'https://via.placeholder.com/200x300?text=No+Cover'}" alt="${buku.judul}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                    ${hoverActions}
                    <span class="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase backdrop-blur-lg border ${statusClass}">${statusText}</span>
                </div>
                <div class="flex-1 flex flex-col">
                    <h3 class="text-xs sm:text-sm font-semibold text-white mb-0.5 line-clamp-1" title="${buku.judul}">${buku.judul}</h3>
                    <p class="text-slate-400 text-[10px] sm:text-xs mb-1.5 sm:mb-2 line-clamp-1">${buku.penulis}</p>
                    <div class="flex flex-wrap gap-0.5 sm:gap-1 mt-auto">
                        <span class="inline-flex items-center gap-0.5 text-[8px] sm:text-[10px] text-slate-400 bg-white/5 px-1 sm:px-1.5 py-0.5 rounded">
                            <span class="material-symbols-outlined text-[9px] sm:text-[11px]">calendar_month</span>
                            ${buku.tahun_terbit}
                        </span>
                        <span class="inline-flex items-center gap-0.5 text-[8px] sm:text-[10px] text-slate-400 bg-white/5 px-1 sm:px-1.5 py-0.5 rounded">
                            <span class="material-symbols-outlined text-[9px] sm:text-[11px]">category</span>
                            ${buku.kategori_buku}
                        </span>
                        <span class="inline-flex items-center gap-0.5 text-[8px] sm:text-[10px] text-slate-400 bg-white/5 px-1 sm:px-1.5 py-0.5 rounded">
                            <span class="material-symbols-outlined text-[9px] sm:text-[11px]">inventory_2</span>
                            ${stockCount}
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
                <div class="flex flex-col items-center justify-center py-12 sm:py-16 text-slate-400">
                    <span class="material-symbols-outlined text-5xl sm:text-6xl mb-3 sm:mb-4 text-slate-600">group</span>
                    <span class="text-base sm:text-lg font-medium">Tidak ada peminjaman aktif.</span>
                    <p class="mt-2 text-xs sm:text-sm">Semua buku sudah dikembalikan. 🎉</p>
                </div>
            `;
            return;
        }

        loans.forEach(loan => {
            const card = document.createElement('div');
            
            // Format Tanggal
            const tglKembali = loan.tanggal_pengembalian.toDate().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Check if overdue
            const isOverdue = loan.tanggal_pengembalian.toDate() < new Date();
            const borderColor = isOverdue ? 'border-l-red-500' : 'border-l-cyan-500';

            card.className = `bg-white/[0.03] backdrop-blur-xl border border-white/10 ${borderColor} border-l-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row flex-wrap justify-between items-stretch sm:items-center gap-3 sm:gap-4 transition-all duration-300 hover:translate-x-0.5 sm:hover:translate-x-1 hover:bg-white/[0.05]`;

            card.innerHTML = `
                <div class="flex-1 min-w-0">
                    <h4 class="text-base sm:text-lg font-semibold text-white mb-1 flex items-center gap-1.5 sm:gap-2">
                        <span class="material-symbols-outlined text-lg sm:text-xl">person</span>
                        <span class="truncate">${loan.nama_peminjam}</span>
                    </h4>
                    <p class="text-slate-300 text-xs sm:text-sm flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm sm:text-base">menu_book</span>
                        <span>Meminjam: </span>
                        <strong class="text-white truncate">${loan.judul_buku}</strong>
                    </p>
                    <div class="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/5 text-[10px] sm:text-xs text-slate-400 flex flex-col xs:flex-row flex-wrap gap-2 sm:gap-4">
                        <span class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs sm:text-sm">credit_card</span>
                            Jaminan: ${loan.jaminan}
                        </span>
                        <span class="flex items-center gap-1 ${isOverdue ? 'text-red-400 font-semibold' : ''}">
                            <span class="material-symbols-outlined text-xs sm:text-sm">schedule</span>
                            ${isOverdue ? '⚠️ TERLAMBAT - ' : ''}Kembali: ${tglKembali}
                        </span>
                    </div>
                </div>
                <button class="py-2 sm:py-2.5 px-4 sm:px-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto" data-id="${loan.id}" data-bukuid="${loan.buku_id}">
                    <span class="material-symbols-outlined text-base sm:text-lg">check_circle</span>
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
                <div class="flex flex-col items-center justify-center py-12 sm:py-16 text-slate-400">
                    <span class="material-symbols-outlined text-5xl sm:text-6xl mb-3 sm:mb-4 text-slate-600">history</span>
                    <span class="text-base sm:text-lg font-medium">Belum ada riwayat peminjaman.</span>
                </div>
            `;
            return;
        }

        loans.forEach(loan => {
            const card = document.createElement('div');
            card.className = 'bg-white/[0.03] backdrop-blur-xl border border-white/10 border-l-4 border-l-emerald-500 p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row flex-wrap justify-between items-stretch sm:items-center gap-3 sm:gap-4 transition-all duration-300 hover:bg-white/[0.05]';

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
                statusBadge = `<span class="text-red-400 font-bold text-[10px] sm:text-xs">⚠️ Terlambat ${diffDays} Hari</span>`;
            } else {
                statusBadge = `<span class="text-emerald-400 font-bold text-[10px] sm:text-xs">✅ Tepat Waktu</span>`;
            }

            card.innerHTML = `
                <div class="flex-1 min-w-0">
                    <h4 class="text-base sm:text-lg font-semibold text-white mb-1 flex items-center gap-1.5 sm:gap-2">
                        <span class="material-symbols-outlined text-lg sm:text-xl">person</span>
                        <span class="truncate">${loan.nama_peminjam}</span>
                    </h4>
                    <p class="text-slate-300 text-xs sm:text-sm flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm sm:text-base">menu_book</span>
                        <span>Meminjam: </span>
                        <strong class="text-white truncate">${loan.judul_buku}</strong>
                    </p>
                    <div class="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/5 text-[10px] sm:text-xs text-slate-400 flex flex-col xs:flex-row flex-wrap gap-2 sm:gap-4">
                        <span>Batas: ${tglKembali}</span>
                        <span>Dikembalikan: ${tglReal}</span>
                    </div>
                    <div class="mt-1.5 sm:mt-2">
                        ${statusBadge}
                    </div>
                </div>
                <div class="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/15 text-emerald-400 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold w-full sm:w-auto">
                    <span class="material-symbols-outlined text-sm sm:text-base">check</span>
                    <span>Selesai</span>
                </div>
            `;
            container.appendChild(card);
        });
    },

    switchTab(tabId) {
        // Remove active from all tabs and contents
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active', 'bg-cyan-500/15', 'text-cyan-400', 'border-r-4', 'border-cyan-400', 'rounded-l-xl', 'font-semibold');
            el.classList.add('text-slate-400');
        });

        // Add active to target
        const targetContent = document.getElementById(tabId);
        const targetNav = document.querySelector(`[data-target="${tabId}"]`);

        if (targetContent) targetContent.classList.add('active');
        if (targetNav) {
            targetNav.classList.add('active', 'bg-cyan-500/15', 'text-cyan-400', 'border-r-4', 'border-cyan-400', 'rounded-l-xl', 'font-semibold');
            targetNav.classList.remove('text-slate-400');
        }
    },

    showConfirm(message, onConfirm) {
        const modal = document.getElementById('modal-confirm');
        const msgEl = document.getElementById('confirm-message');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnCancel = document.getElementById('btn-confirm-cancel');

        msgEl.textContent = message;
        modal.classList.remove('hidden');
        modal.classList.add('!flex');

        // Clean up previous listeners
        const safeOnConfirm = async () => {
            modal.classList.add('hidden');
            modal.classList.remove('!flex');
            await onConfirm();
        };

        const safeOnCancel = () => {
            modal.classList.add('hidden');
            modal.classList.remove('!flex');
        };

        // Clone buttons to strip old listeners
        const newBtnYes = btnYes.cloneNode(true);
        const newBtnCancel = btnCancel.cloneNode(true);

        btnYes.parentNode.replaceChild(newBtnYes, btnYes);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);

        newBtnYes.addEventListener('click', safeOnConfirm);
        newBtnCancel.addEventListener('click', safeOnCancel);
    },

    // Helper to open modal with Tailwind classes
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('!flex');
        }
    },

    // Helper to close modal with Tailwind classes
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('!flex');
        }
    }
};