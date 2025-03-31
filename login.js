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

document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    const forgotPasswordBtn = document.getElementById("forgotPassword");
    const result = document.getElementById("result");

    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!email || !password) {
                result.innerHTML = "<span style='color: red;'>Please enter both email and password.</span>";
                return;
            }

            try {
                // 🔥 Sign in with Firebase Authentication
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                console.log("✅ User logged in:", user.email);

                // 🔥 Fetch the team's saved level from Firestore (use `teams` instead of `players`)
                const teamRef = doc(db, "teams", user.uid);
                const teamSnap = await getDoc(teamRef);

                if (teamSnap.exists()) {
                    const teamData = teamSnap.data();
                    const lastLevel = teamData.level || 1;  // ✅ Start at Level 1 by default

                    console.log(`🔄 Fetching riddle for Level ${lastLevel}...`);
                    const riddle = await getRiddle(lastLevel);
                    console.log(`🧩 Riddle for Level ${lastLevel}:`, riddle);

                    // ✅ Update timestamp when user logs in
                    await updateDoc(teamRef, {
                        lastLogin: serverTimestamp()  // 🔥 Auto-updates login timestamp
                    });

                    // ✅ Store team info in Local Storage
                    localStorage.setItem("teamId", user.uid);
                    localStorage.setItem("teamName", teamData.teamName);

                    result.innerHTML = `<span class='success-text'>Login successful! Redirecting to Level ${lastLevel}...</span>`;
                    setTimeout(() => {
                        window.location.href = `level.html?level=${lastLevel}`;
                    }, 2000);
                } else {
                    console.warn("⚠ No team data found. Redirecting to Level 1...");

                    // ✅ Create new team entry if not found
                    await updateDoc(teamRef, {
                        level: 1,
                        lastLogin: serverTimestamp()
                    });

                    window.location.href = "level.html?level=1";
                }
            } catch (error) {
                console.error("❌ Login failed:", error);
                result.innerHTML = `<span style='color: red;'>Error: ${error.message}</span>`;
            }
        });
    }

    // ✅ Forgot Password Functionality
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener("click", async (event) => {
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
    }

    // ✅ Ensure Users Stay Logged In & Redirect to Their Level
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("✅ User is already logged in:", user.email);

            const teamRef = doc(db, "teams", user.uid);   // ✅ Reference `teams` collection
            const teamSnap = await getDoc(teamRef);

            if (teamSnap.exists()) {
                const lastLevel = teamSnap.data().level || 1;
                console.log(`🔄 Fetching riddle for Level ${lastLevel}...`);
                const riddle = await getRiddle(lastLevel);
                console.log(`🧩 Riddle for Level ${lastLevel}:`, riddle);

                // ✅ Update timestamp when user is already logged in
                await updateDoc(teamRef, {
                    lastLogin: serverTimestamp()
                });

                window.location.href = `level.html?level=${lastLevel}`;
            }
        }
    });

    // ✅ Force reload to get latest data on mobile
    window.onload = function () {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                });
            });
        }
    };
});
