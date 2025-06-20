import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD7O1-SFhY3XUc4ZL2MWo83nl-DfvGq3LI",
  authDomain: "erp-system-24f05.firebaseapp.com",
  projectId: "erp-system-24f05",
  storageBucket: "erp-system-24f05.firebasestorage.app",
  messagingSenderId: "1015081257227",
  appId: "1:1015081257227:web:ab95b6dbe9b678ef4cba0e",
  measurementId: "G-3VH3396ZDG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
