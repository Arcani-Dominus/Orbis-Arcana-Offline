import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { getDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// ✅ Function to get a random riddle
export async function getRiddle() {
    try {
        const riddlesRef = doc(db, "riddles", "all");
        const riddlesSnap = await getDoc(riddlesRef);

        if (!riddlesSnap.exists()) {
            console.warn("⚠️ No riddles found in Firestore.");
            return null;
        }

        const riddles = riddlesSnap.data().riddles || [];
        if (riddles.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * riddles.length);
        return riddles[randomIndex];
    } catch (error) {
        console.error("❌ Firestore error while fetching riddle:", error);
        return null;
    }
}

// ✅ Function to fetch the correct answer for the current level
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

// ✅ Function to load announcements
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

// ✅ Function to submit the answer and store the timestamp
async function submitAnswer() {
    const feedback = document.getElementById("feedback");

    const teamId = localStorage.getItem("teamId");  // ✅ Retrieve the team ID from localStorage
    if (!teamId) {
        feedback.innerHTML = `<span style='color: red;'>Error: Team not found.</span>`;
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const currentLevel = parseInt(urlParams.get("level")) || 1;
    const answerInput = document.getElementById("answerInput").value.trim().toLowerCase();

    try {
        const correctAnswer = await getAnswer(currentLevel);

        if (correctAnswer && answerInput === correctAnswer) {
            feedback.innerHTML = `<span class='success-text'>✅ Correct! Proceeding to next level...</span>`;
            
            const teamRef = doc(db, "teams", teamId);

            // ✅ Update Firestore: level progression and timestamp
            await updateDoc(teamRef, {
                level: currentLevel + 1,
                lastAnswerTimestamp: serverTimestamp()  // ✅ Store submission timestamp
            });

            setTimeout(() => {
                window.location.href = `level.html?level=${currentLevel + 1}`;
            }, 2000);

        } else {
            feedback.innerHTML = `<span style='color: red;'>❌ Wrong answer! Try again.</span>`;
        }
    } catch (error) {
        console.error("❌ Error submitting answer:", error);
        feedback.innerHTML = `<span style="color: red;">❌ Error submitting answer. Try again.</span>`;
    }
}

// ✅ Ensure Users Stay Logged In & Redirect to Their Current Level
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log(`✅ User logged in: ${user.email}`);

        const teamId = localStorage.getItem("teamId");
        if (!teamId) {
            console.error("❌ Team ID not found in localStorage.");
            return;
        }

        const teamRef = doc(db, "teams", teamId);
        const teamSnap = await getDoc(teamRef);

        if (teamSnap.exists()) {
            const lastLevel = teamSnap.data().level || 1;
            const urlParams = new URLSearchParams(window.location.search);
            const currentLevel = parseInt(urlParams.get("level")) || 1;

            if (lastLevel !== currentLevel) {
                console.log(`🔄 Redirecting to correct level: ${lastLevel}`);
                window.location.href = `level.html?level=${lastLevel}`;
            } else {
                console.log(`✅ Already on the correct level: ${currentLevel}`);
                const riddle = await getRiddle();
                if (!riddle) {
                    console.warn("⚠ No riddle found. Redirecting to waiting page...");
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

// ✅ Force reload to get the latest data on mobile
window.onload = function () {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.unregister();
            });
        });
    }
};
