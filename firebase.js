// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth, signInAnonymously } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA2xTzOJ_fvAIMEjBBWQSxDIZIw8Inp-ww",
  authDomain: "simulacroesfms2026.firebaseapp.com",
  projectId: "simulacroesfms2026",
  storageBucket: "simulacroesfms2026.firebasestorage.app",
  messagingSenderId: "1076674602133",
  appId: "1:1076674602133:web:d0b010c9dfbee969d7e79c",
  measurementId: "G-N1FYQ17Z90"
};

// 🚀 INIT APP
const app = initializeApp(firebaseConfig);

// 🔥 FIRESTORE
export const db = getFirestore(app);

// 🔥 AUTH (PRIMERO se declara)
const auth = getAuth(app);

// 🔥 PROMESA DE AUTENTICACIÓN
export const authReady = signInAnonymously(auth)
  .then(() => {
    console.log("✅ Auth anónimo listo");
  })
  .catch((error) => {
    console.error("❌ Error auth:", error);
  });