// ✅ Import dependencies once at the top
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { 
    getDocs, collection, doc, updateDoc, serverTimestamp, getDoc 
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// ✅ Fetch a random riddle from the Firestore "riddles" collection
export async function getRandomRiddle() {
    try {
        const riddlesRef = collection(db, "riddles");
        const snapshot = await getDocs(riddlesRef);

        if (snapshot.empty) {
            console.warn("⚠️ No riddles found in Firestore.");
            return null;
        }

        const riddles = [];
        snapshot.forEach((doc) => {
            riddles.push({
                id: doc.id,
                riddle: doc.data().riddle,
                answer: doc.data().answer.toLowerCase()
            });
        });

        // ✅ Pick a random riddle
        const randomIndex = Math.floor(Math.random() * riddles.length);
        return riddles[randomIndex];

    } catch (error) {
        console.error("❌ Firestore error while fetching random riddle:", error);
        return null;
    }
}

// ✅ Function to submit the answer and validate it
export async function submitAnswer() {
    const feedback = document.getElementById("feedback");
    const teamId = localStorage.getItem("teamId");  

    if (!teamId) {
        feedback.innerHTML = `<span style='color: red;'>Error: Team not found.</span>`;
        return;
    }

    const answerInput = document.getElementById("answerInput").value.trim().toLowerCase();

    try {
        const riddle = await getRandomRiddle();
        if (!riddle) {
            feedback.innerHTML = `<span style='color: red;'>No riddle available. Try again later.</span>`;
            return;
        }

        if (answerInput === riddle.answer) {
            feedback.innerHTML = `<span class='success-text'>✅ Correct! Proceeding to next level...</span>`;

            const teamRef = doc(db, "teams", teamId);

            // ✅ Update Firestore with new level progression
            await updateDoc(teamRef, {
                lastAnswerTimestamp: serverTimestamp() 
            });

            setTimeout(() => {
                window.location.href = `level.html`;
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

        const riddle = await getRandomRiddle();
        const riddleElement = document.getElementById("riddleText");

        if (riddle && riddleElement) {
            console.log(`🧩 Riddle: ${riddle.riddle}`);
            riddleElement.innerText = riddle.riddle;  // ✅ Display the riddle
        } else {
            console.warn("⚠️ Riddle or element not found.");
        }
    }
});

// ✅ Real-time announcements fetch
export async function getAnnouncement() {
    try {
        const announcementRef = doc(db, "announcements", "latest");
        const announcementSnap = await getDoc(announcementRef);

        if (announcementSnap.exists()) {
            return announcementSnap.data().message || "No announcement available.";
        } else {
            console.warn("⚠️ No announcement found.");
            return "No announcements available.";
        }
    } catch (error) {
        console.error("❌ Firestore error while fetching announcement:", error);
        return "Error loading announcements.";
    }
}

// ✅ Attach Submit Button Event
document.addEventListener("DOMContentLoaded", () => {
    const submitButton = document.getElementById("submitAnswer");
    
    if (submitButton) {
        submitButton.addEventListener("click", submitAnswer);
    } else {
        console.warn("⚠ Submit button not found in HTML.");
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
