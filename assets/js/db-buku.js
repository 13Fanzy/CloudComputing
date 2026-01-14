import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const COLLECTION_NAME = 'buku';

export const bukuService = {
    // Create
    async tambahBuku(data, userId) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...data,
                created_at: serverTimestamp(),
                user_uid: userId,
                stok: Number(data.stok) || 1, // Use stock from form data
                tahun_terbit: Number(data.tahun_terbit),
                buku_id: Date.now().toString() // Simple ID gen
            });
            return docRef.id;
        } catch (e) {
            throw e;
        }
    },

    // Get Single (for Edit)
    async getBukuById(id) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw "Buku tidak ditemukan";
        }
    },

    // Read All
    async getAllBuku() {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        let books = [];
        querySnapshot.forEach((doc) => {
            books.push({ id: doc.id, ...doc.data() });
        });
        return books;
    },

    // Read Available (Stok > 0)
    async getAvailableBuku() {
        const all = await this.getAllBuku();
        return all.filter(b => b.stok > 0);
    },

    // Update
    async updateBuku(docId, data) {
        const ref = doc(db, COLLECTION_NAME, docId);
        await updateDoc(ref, data);
    },

    // Delete
    async hapusBuku(docId) {
        await deleteDoc(doc(db, COLLECTION_NAME, docId));
    }
};