import { db } from './firebase-config.js';
import { collection, getDocs, doc, runTransaction, query, where, Timestamp, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const COL_PEMINJAM = 'peminjam';
const COL_BUKU = 'buku';

export const peminjamService = {
    // Action: Pinjamkan (Transaction)
    async pinjamBuku(dataPeminjam, bukuDocId) {
        try {
            await runTransaction(db, async (transaction) => {
                // 1. Get Buku untuk cek stok
                const bukuRef = doc(db, COL_BUKU, bukuDocId);
                const bukuSf = await transaction.get(bukuRef);

                if (!bukuSf.exists()) throw "Buku tidak ditemukan!";

                const newStok = bukuSf.data().stok - 1;
                if (newStok < 0) throw "Stok habis!";

                // 2. Create Peminjam Doc Ref
                const peminjamRef = doc(collection(db, COL_PEMINJAM));

                // 3. Set Peminjam Data
                transaction.set(peminjamRef, {
                    ...dataPeminjam,
                    status: 'di pinjam',
                    tanggal_pinjam: Timestamp.now(),
                    tanggal_pengembalian: Timestamp.fromDate(new Date(dataPeminjam.tanggal_kembali)),
                    buku_id: bukuSf.data().buku_id // Simpan Custom ID buku
                });

                // 4. Update Stok Buku
                transaction.update(bukuRef, { stok: newStok });
            });
        } catch (e) {
            throw e;
        }
    },

    // Get Active Loans with Book Details (Manual Join)
    async getActiveLoans() {
        const q = query(collection(db, COL_PEMINJAM), where("status", "==", "di pinjam"));
        const snapshot = await getDocs(q);
        const loans = [];

        // Fetch all books to map details (Optimization: Could be cached)
        const booksSnap = await getDocs(collection(db, COL_BUKU));
        const booksMap = {};
        booksSnap.forEach(d => booksMap[d.data().buku_id] = d.data());

        snapshot.forEach((doc) => {
            const data = doc.data();
            const bookDetail = booksMap[data.buku_id] || { judul: 'Unknown Book', gambar_buku: '' };
            loans.push({
                id: doc.id,
                ...data,
                judul_buku: bookDetail.judul,
                gambar_buku: bookDetail.gambar_buku
            });
        });
        return loans;
    },

    // Get Loan History (Status: dikembalikan)
    async getLoanHistory() {
        const q = query(collection(db, COL_PEMINJAM), where("status", "==", "dikembalikan"));
        const snapshot = await getDocs(q);
        const loans = [];

        // Fetch all books to map details
        const booksSnap = await getDocs(collection(db, COL_BUKU));
        const booksMap = {};
        booksSnap.forEach(d => booksMap[d.data().buku_id] = d.data());

        snapshot.forEach((doc) => {
            const data = doc.data();
            const bookDetail = booksMap[data.buku_id] || { judul: 'Unknown Book', gambar_buku: '' };
            loans.push({
                id: doc.id,
                ...data,
                judul_buku: bookDetail.judul,
                gambar_buku: bookDetail.gambar_buku
            });
        });
        return loans;
    },

    // Action: Kembalikan (Transaction: Update Status + Tambah Stok)
    async kembalikanBuku(peminjamDocId, bukuCustomId) {
        try {
            await runTransaction(db, async (transaction) => {
                const peminjamRef = doc(db, COL_PEMINJAM, peminjamDocId);

                // Cari Doc ID buku berdasarkan field custom 'buku_id'
                const qBook = query(collection(db, COL_BUKU), where("buku_id", "==", bukuCustomId));
                const bookQuerySnap = await getDocs(qBook);

                if (bookQuerySnap.empty) {
                    // Fallback: Coba cari sebagai Number (bila data lama disimpan sebagai number)
                    const numericId = Number(bukuCustomId);
                    if (!isNaN(numericId)) {
                        const qBookNum = query(collection(db, COL_BUKU), where("buku_id", "==", numericId));
                        bookQuerySnap = await getDocs(qBookNum);
                    }
                }

                if (bookQuerySnap.empty) throw "Data buku master hilang!";

                const bukuRef = bookQuerySnap.docs[0].ref;
                const currentStok = bookQuerySnap.docs[0].data().stok;

                transaction.update(peminjamRef, {
                    status: 'dikembalikan',
                    tanggal_dikembalikan_real: Timestamp.now()
                });
                transaction.update(bukuRef, { stok: currentStok + 1 });
            });
        } catch (e) {
            throw e;
        }
    }
};