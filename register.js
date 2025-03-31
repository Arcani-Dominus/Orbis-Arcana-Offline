import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { setDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// ✅ Wait for DOM to load before attaching event listeners
document.addEventListener("DOMContentLoaded", () => {

    const registerForm = document.getElementById("registerForm");
    const result = document.getElementById("result");

    if (!registerForm) {
        console.error("❌ Register form not found.");
        return;
    }

    // ✅ Handle form submission
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();  // 🔥 Prevent page refresh

        // 🔹 Get Form Values
        const teamName = document.getElementById("teamName").value.trim();
        const members = document.getElementById("members").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!teamName || !members || !email || !password) {
            result.innerHTML = `<span style='color: red;'>Please fill all fields.</span>`;
            return;
        }

        try {
            // ✅ Register team with Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log("✅ Account created:", user.uid);

            // ✅ Store team data in Firestore
            await setDoc(doc(db, "teams", user.uid), {
                teamName: teamName,
                members: members.split(',').map(name => name.trim()),  // ✅ Store members as an array
                email: email,
                level: 1,                   // ✅ Start at Level 1
                createdAt: serverTimestamp() // ✅ Store registration timestamp
            });

            console.log("✅ Team data stored in Firestore:", user.uid);

            // ✅ Store UID in localStorage
            localStorage.setItem("teamId", user.uid);
            localStorage.setItem("teamName", teamName);

            result.innerHTML = `<span class='success-text'>Registration successful! Redirecting...</span>`;

            // ✅ Delay redirection to ensure Firestore write is complete
            setTimeout(() => {
                console.log("🔄 Redirecting to level.html...");
                window.location.href = "level.html";
            }, 2000);  // ✅ Slight delay for stability

        } catch (error) {
            console.error("❌ Registration failed:", error);
            result.innerHTML = `<span style='color: red;'>Error: ${error.message}</span>`;
        }
    });

    // ✅ Background music setup
    const audio = new Audio("theme-music.mp3");  // 🔥 Use background sound
    audio.loop = true;                           // ✅ Loop continuously
    audio.volume = 0.4;                          // 🎵 Moderate volume

    // ✅ Handle autoplay restrictions
    document.addEventListener('click', () => {
        audio.play().catch((error) => {
            console.warn("⚠️ Audio autoplay blocked:", error);
        });
    });
});
