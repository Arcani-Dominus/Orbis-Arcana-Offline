import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// ✅ Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChs_NAolpqRZ-dV22bZ5KXhqXa5XuNJTI",
  authDomain: "orbis-arcana.firebaseapp.com",
  projectId: "orbis-arcana",
  storageBucket: "orbis-arcana.firebasestorage.app",
  messagingSenderId: "474107878031",
  appId: "1:474107878031:web:0869ada48ff6a446356efa"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // ✅ Enable Firebase Authentication

export { db, auth };
