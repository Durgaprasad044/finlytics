import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBJ0j4VjJCc1VG7kWGGPQD5O1RXpmd7C3g",
  authDomain: "agentic-ai-975d4.firebaseapp.com",
  projectId: "agentic-ai-975d4",
  storageBucket: "agentic-ai-975d4.firebasestorage.app",
  messagingSenderId: "299372568976",
  appId: "1:299372568976:web:dcdf3a554b9e10e9ea1315",
  measurementId: "G-7J474MCCZE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;