import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDz5BReSYA9d7MpKb8n5mAnY_81ZNV5NYA",
  authDomain: "bukuperpustakaan-d7759.firebaseapp.com",
  projectId: "bukuperpustakaan-d7759",
  storageBucket: "bukuperpustakaan-d7759.firebasestorage.app",
  messagingSenderId: "477549919238",
  appId: "1:477549919238:web:4e64eff7e8c39472eb5787",
  measurementId: "G-TKXS709ST3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };