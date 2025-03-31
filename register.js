import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { setDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// ✅ Wait for DOM to load before attaching event listeners
document.addEventListener("DOMContentLoaded", () => {

    const registerBtn = document.getElementById("registerBtn");
    const result = document.getElementById("result");

    if (!registerBtn) {
        console.error("❌ Register button not found.");
        return;
    }

    // ✅ Attach the click event listener after DOM is fully loaded
    registerBtn.addEventListener("click", async () => {
        // 🔹 Get Form Values
        const teamName = document.getElementById("teamName").value.trim();
        const members = document.getElementById("members").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!teamName || !members || !email || !password) {
            result.innerHTML = `<span style='color: red;'>Please enter all details.</span>`;
            return;
        }

        try {
            // 🔥 Register the Team with Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 🔥 Store team data in Firestore with registration timestamp
            await setDoc(doc(db, "teams", user.uid), {
                teamName: teamName,
                members: members.split(',').map(name => name.trim()),  // ✅ Store members as an array
                email: email,
                level: 1,                   // ✅ Start at Level 1
                createdAt: serverTimestamp() // ✅ Store registration timestamp
            });

            // ✅ Store UID in localStorage for tracking during gameplay
            localStorage.setItem("teamId", user.uid);
            localStorage.setItem("teamName", teamName);

            result.innerHTML = `<span class='success-text'>Registration successful! Redirecting...</span>`;

            // 🔹 Redirect to the game page after registration
            setTimeout(() => {
                window.location.href = "level.html";  // ✅ Redirect to game
            }, 2000);

        } catch (error) {
            console.error("❌ Registration failed:", error);
            result.innerHTML = `<span style='color: red;'>Error: ${error.message}</span>`;
        }
    });

    // ✅ Background music setup
    const audio = new Audio("theme-music.mp3");  // 🔥 Use the background sound
    audio.loop = true;                           // ✅ Loop the music continuously
    audio.volume = 0.4;                          // 🎵 Set moderate volume
    audio.play().catch((error) => {
        console.warn("⚠️ Audio autoplay blocked:", error);
    });

});
