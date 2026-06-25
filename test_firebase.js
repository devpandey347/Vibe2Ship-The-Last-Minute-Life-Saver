import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, deleteDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log("Testing connection for project:", firebaseConfig.projectId);

try {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  async function testConnection() {
    try {
      const testRef = collection(db, 'test_connection');
      const docRef = await addDoc(testRef, { timestamp: new Date() });
      console.log('Firebase connection SUCCESS: Wrote document with ID:', docRef.id);
      await deleteDoc(docRef);
      console.log('Firebase connection SUCCESS: Deleted test document.');
      process.exit(0);
    } catch (error) {
      console.error('Firebase connection FAILED:', error.message || error);
      process.exit(1);
    }
  }
  
  testConnection();
} catch (error) {
  console.error('Firebase initialization FAILED:', error.message || error);
  process.exit(1);
}
