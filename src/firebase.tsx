// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB68ihFnjn1B0PsnFkfkW74UENa373dzFg",
  authDomain: "hrms-b8ccd.firebaseapp.com",
  databaseURL: "https://hrms-b8ccd-default-rtdb.firebaseio.com",
  projectId: "hrms-b8ccd",
  storageBucket: "hrms-b8ccd.firebasestorage.app",
  messagingSenderId: "17207169442",
  appId: "1:17207169442:web:1df94cec187c1b684b62fb",
  measurementId: "G-MGEK45172B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database ,app};