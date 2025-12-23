import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCeH07VfmjuMl8Ut_ehiVkedjsaeA4WkMk",
  authDomain: "createstory-75f28.firebaseapp.com",
  projectId: "createstory-75f28",
  storageBucket: "createstory-75f28.firebasestorage.app",
  messagingSenderId: "281778648448",
  appId: "1:281778648448:web:03c36bdd712b8e2253bd65",
  measurementId: "G-HPQCW3JVS4"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;