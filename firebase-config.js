import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1T0aeLmHt3cEppYkSFJijsgAbKWdq3ks",
  authDomain: "orbis-arcana-offline.firebaseapp.com",
  projectId: "orbis-arcana-offline",
  storageBucket: "orbis-arcana-offline.firebasestorage.app",
  messagingSenderId: "125346575338",
  appId: "1:125346575338:web:b1b82b69e71f35b146b893"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // ✅ Enable Firebase Authentication

export { db, auth };
