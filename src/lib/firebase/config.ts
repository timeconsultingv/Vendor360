import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAPohlOCzL0vdRIEvaEXYhuQKoMdW0N8So",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "vendor360-78944.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vendor360-78944",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "vendor360-78944.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "826251909989",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:826251909989:web:76aa2e83c65f2d157f9f8c"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
