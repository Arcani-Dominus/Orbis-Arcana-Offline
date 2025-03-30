import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { getDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

export async function getRiddle(level) {
    try {
        const levelRef = doc(db, "answers", level.toString());
        const levelSnap = await getDoc(levelRef);

        if (levelSnap.exists()) {
            return levelSnap.data().riddle;
        } else {
            console.warn(`⚠️ No riddle found for Level ${level}`);
            return null;
        }
    } catch (error) {
        console.error("❌ Firestore error while fetching riddle:", error);
        return null;
    }
}

export async function getAnswer(level) {
    try {
        const levelRef = doc(db, "answers", level.toString());
        const levelSnap = await getDoc(levelRef);

        if (levelSnap.exists()) {
            return levelSnap.data().answer.toLowerCase();
        } else {
            console.warn(`⚠️ No answer found for Level ${level}`);
            return null;
        }
    } catch (error) {
        console.error("❌ Firestore error while fetching answer:", error);
        return null;
    }
}

export async function getAnnouncement() {
    try {
        const announcementRef = doc(db, "announcements", "latest");
        const announcementSnap = await getDoc(announcementRef);

        if (announcementSnap.exists()) {
            return announcementSnap.data().message;
        } else {
            console.warn("⚠️ No announcement found in Firestore.");
            return "No announcements available.";
        }
    } catch (error) {
        console.error("❌ Firestore error while fetching announcement:", error);
        return "Error loading announcements.";
    }
}

async function submitAnswer() {
    const user = auth.currentUser;
    const feedback = document.getElementById("feedback");

    if (!user) {
        feedback.innerHTML = "<span style='color: red;'>Error: You need to log in first.</span>";
        return;
    }

    const studentID = user.uid;
    const urlParams = new URLSearchParams(window.location.search);
    const level = parseInt(urlParams.get("level")) || 2;
    const answerInput = document.getElementById("answerInput").value.trim().toLowerCase();

    try {
        const correctAnswer = await getAnswer(level);
        
        if (correctAnswer && answerInput === correctAnswer) {
            feedback.innerHTML = "<span class='success-text'>Correct! Proceeding to next level...</span>";
            const playerRef = doc(db, "players", studentID);
            
            // ✅ Update level and timestamp in Firestore
            await updateDoc(playerRef, { 
                level: level + 1,
                timestamp: serverTimestamp() // ✅ Auto-updates the timestamp
            });

            setTimeout(() => {
                window.location.href = `level.html?level=${level + 1}`;
            }, 2000);
        } else {
            feedback.innerHTML = "<span style='color: red;'>Wrong answer! Try again.</span>";
        }
    } catch (error) {
        console.error("❌ Error checking answer:", error);
    }
}

// ✅ Ensure Users Stay Logged In & Redirect to Their Level
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ User is already logged in:", user.email);

        const playerRef = doc(db, "players", user.uid);
        const playerSnap = await getDoc(playerRef);

        if (playerSnap.exists()) {
            const lastLevel = playerSnap.data().level || 2;
            const urlParams = new URLSearchParams(window.location.search);
            const currentLevel = parseInt(urlParams.get("level")) || 2;

            if (lastLevel !== currentLevel) {
                console.log(`🔄 Redirecting user to their correct level: ${lastLevel}`);
                window.location.href = `level.html?level=${lastLevel}`;
            } else {
                console.log(`✅ User is already on the correct level: ${currentLevel}`);
                const riddle = await getRiddle(currentLevel);
                if (!riddle) {
                    console.warn(`⚠ No riddle found for Level ${currentLevel}. Redirecting to waiting page...`);
                    window.location.href = `waiting.html?level=${currentLevel}`;
                }
            }
        }
    }
});

// ✅ Attach Submit Button Event
document.addEventListener("DOMContentLoaded", async () => {
    const submitButton = document.getElementById("submitAnswer");
    if (submitButton) {
        submitButton.addEventListener("click", submitAnswer);
    } else {
        console.warn("⚠ Submit button not found in HTML.");
    }

    // ✅ Load Announcements
    const announcementElement = document.getElementById("announcements");
    if (announcementElement) {
        const announcementText = await getAnnouncement();
        announcementElement.innerText = announcementText;
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
