import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase configuration
const firebaseConfig = {

  apiKey: "AIzaSyDIOZDK8UMreSOseQD2OeyRs1eP06yxyeY",
  authDomain: "food-delivery2-eafda.firebaseapp.com",
  projectId: "food-delivery2-eafda",
  storageBucket: "food-delivery2-eafda.firebasestorage.app",
  messagingSenderId: "65581289842",
  appId: "1:65581289842:web:f327d0326c4ea38f1f8deb",
  measurementId: "G-EK0Q002ZDF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;