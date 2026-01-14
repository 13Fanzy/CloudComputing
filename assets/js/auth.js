import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { showToast } from './notifications.js';

export const loginUser = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Login Berhasil!', 'success');
        return true;
    } catch (error) {
        showToast('Login Gagal: ' + error.message, 'error');
        return false;
    }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
        showToast('Berhasil Logout', 'success');
    } catch (error) {
        console.error(error);
    }
};

export const monitorAuthState = (onLogin, onLogout) => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            onLogin(user);
        } else {
            onLogout();
        }
    });
};