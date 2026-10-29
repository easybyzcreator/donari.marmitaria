import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9VBhqxSSSx9cpQNUtBPY6T10OEtW6d7c",
  authDomain: "app-oliva-marmitaria.firebaseapp.com",
  projectId: "app-oliva-marmitaria",
  storageBucket: "app-oliva-marmitaria.firebasestorage.app",
  messagingSenderId: "1079864674208",
  appId: "1:1079864674208:web:c70e7e7f269fb6460546c5",
  measurementId: "G-K49Q60ZVT6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn("Analytics not initialized:", e);
      }
    }
  }).catch(() => {});
}

