import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAxfwlJWJP3Ku28-tTJgArOTZlWOmqPJ-U",
  authDomain: "cad-61e27.firebaseapp.com",
  projectId: "cad-61e27",
  storageBucket: "cad-61e27.firebasestorage.app",
  messagingSenderId: "299206224375",
  appId: "1:299206224375:web:f0b0e3c04abdc54f7566f2",
  measurementId: "G-PRV0C8EN44"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
