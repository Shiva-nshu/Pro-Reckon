import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCM2Goj3O-_b65VQE5CZ1M2AOcMrB_W_9A",
  authDomain: "spark-9c925.firebaseapp.com",
  databaseURL: "https://spark-9c925-default-rtdb.firebaseio.com",
  projectId: "spark-9c925",
  storageBucket: "spark-9c925.firebasestorage.app",
  messagingSenderId: "504498585087",
  appId: "1:504498585087:web:bfbc9c7a1ac0c47edcfbca",
  measurementId: "G-NBFVWSTTKM",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics only in browser
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Firestore (for optional client-side use)
export const db = getFirestore(app);

export default app;
