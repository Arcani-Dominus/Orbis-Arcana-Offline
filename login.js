import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { getDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

async function getRiddle(level) {
    try {
        const levelRef = doc(db, "levels", level.toString());
        const levelSnap = await getDoc(levelRef);

        if (levelSnap.exists()) {
            return levelSnap.data().riddle;
        } else {
            console.warn(`⚠️ No riddle found for Level ${level}`);
            return "Riddle not found!";
        }
    } catch (error) {
        console.error("❌ Firestore error while fetching riddle:", error);
        return "Error loading riddle!";
    }
}

document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const result = document.getElementById("result");

    if (!email || !password) {
        result.innerHTML = "<span style='color: red;'>Please enter both email and password.</span>";
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("✅ User logged in:", user.email);

        // ✅ Fetch the player's saved level from Firestore
        const playerRef = doc(db, "players", user.uid);
        const playerSnap = await getDoc(playerRef);

        if (playerSnap.exists()) {
            const playerData = playerSnap.data();
            const lastLevel = playerData.level || 2; // ✅ Default to Level 2 if no data found

            console.log(`🔄 Fetching riddle for Level ${lastLevel}...`);
            const riddle = await getRiddle(lastLevel);
            console.log(`🧩 Riddle for Level ${lastLevel}:`, riddle);

            // ✅ Update timestamp when user logs in
            await updateDoc(playerRef, {
                lastLogin: serverTimestamp() // 🔥 Auto-updates login timestamp
            });

            result.innerHTML = `<span class='success-text'>Login successful! Redirecting to Level ${lastLevel}...</span>`;
            setTimeout(() => {
                window.location.href = `level.html?level=${lastLevel}`;
            }, 2000);
        } else {
            console.warn("⚠ No player data found. Redirecting to Level 2...");

            // ✅ Create new player entry if not found
            await updateDoc(playerRef, {
                level: 2,
                lastLogin: serverTimestamp()
            });

            window.location.href = "level.html?level=2";
        }
    } catch (error) {
        console.error("❌ Login failed:", error);
        result.innerHTML = `<span style='color: red;'>Error: ${error.message}</span>`;
    }
});

// ✅ Ensure Users Stay Logged In & Redirect to Their Level
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ User is already logged in:", user.email);

        const playerRef = doc(db, "players", user.uid);
        const playerSnap = await getDoc(playerRef);

        if (playerSnap.exists()) {
            const lastLevel = playerSnap.data().level || 2;
            console.log(`🔄 Fetching riddle for Level ${lastLevel}...`);
            const riddle = await getRiddle(lastLevel);
            console.log(`🧩 Riddle for Level ${lastLevel}:`, riddle);

            // ✅ Update timestamp when user is already logged in
            await updateDoc(playerRef, {
                lastLogin: serverTimestamp()
            });

            window.location.href = `level.html?level=${lastLevel}`;
        }
    }
});

// ✅ Forgot Password Functionality
document.getElementById("forgotPassword").addEventListener("click", async (event) => {
    event.preventDefault();

    const email = prompt("Enter your email to reset the password:");
    
    if (!email) {
        alert("❌ Please enter a valid email.");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert("✅ Password reset link sent! Check your email.");
    } catch (error) {
        console.error("❌ Failed to send reset email:", error);
        alert(`❌ Error: ${error.message}`);
    }
});


// ✅ Force reload to get latest data on mobile
window.onload = function() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.unregister();
            });
        });
    }
};
