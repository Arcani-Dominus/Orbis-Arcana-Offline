// ✅ Import dependencies once at the top
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { 
    getDocs, collection, doc, updateDoc, serverTimestamp, getDoc
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

const feedback = document.getElementById("feedback");
const answerInput = document.getElementById("answerInput");

// ✅ Show loading indicator
function showLoadingIndicator(message = "⏳ Checking answer...") {
    feedback.innerHTML = `<span style="color: blue;">${message}</span>`;
}

// ✅ Load the riddle: First check localStorage, then Firestore
export async function loadRiddle() {
    const riddleElement = document.getElementById("riddleText");

    // ✅ Check if a riddle is stored in localStorage
    const storedRiddle = localStorage.getItem("currentRiddle");

    if (storedRiddle) {
        console.log("📌 Using cached riddle from localStorage.");
        const cachedRiddle = JSON.parse(storedRiddle);

        // ✅ Display the cached riddle
        if (riddleElement) {
            riddleElement.innerText = cachedRiddle.riddle;
        }
        return;
    }

    // 🔥 If no riddle in localStorage, fetch a new one
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

        // ✅ Get team progress from Firestore
        const teamId = localStorage.getItem("teamId");
        const teamRef = doc(db, "teams", teamId);
        const teamSnap = await getDoc(teamRef);

        const solvedRiddles = teamSnap.exists() ? teamSnap.data().solvedRiddles || [] : [];

        // ✅ Filter out solved riddles
        const unsolvedRiddles = riddles.filter(riddle => !solvedRiddles.includes(riddle.id));

        if (unsolvedRiddles.length === 0) {
            console.log("✅ All riddles solved! Redirecting...");
            window.location.href = "congratulations.html";  // 🎯 Redirect to completion page
            return null;
        }

        // ✅ Select a random unsolved riddle
        const randomIndex = Math.floor(Math.random() * unsolvedRiddles.length);
        const selectedRiddle = unsolvedRiddles[randomIndex];

        // ✅ Store the riddle in localStorage
        localStorage.setItem("currentRiddle", JSON.stringify(selectedRiddle));

        // ✅ Display the riddle
        if (riddleElement) {
            riddleElement.innerText = selectedRiddle.riddle;
        }

    } catch (error) {
        console.error("❌ Firestore error while fetching random riddle:", error);
    }
}

// ✅ Submit the answer using the cached or loaded riddle
export async function submitAnswer() {
    const teamId = localStorage.getItem("teamId");  

    if (!teamId) {
        feedback.innerHTML = `<span style='color: red;'>❌ Error: Team not found.</span>`;
        return;
    }

    const answer = answerInput.value.trim().toLowerCase();

    if (!answer) {
        feedback.innerHTML = `<span style="color: red;">⚠️ Please enter an answer.</span>`;
        return;
    }

    showLoadingIndicator();

    // ✅ Get the riddle from localStorage
    const storedRiddle = localStorage.getItem("currentRiddle");

    if (!storedRiddle) {
        feedback.innerHTML = `<span style="color: red;">❌ No riddle loaded. Please refresh the page.</span>`;
        return;
    }

    const currentRiddle = JSON.parse(storedRiddle);

    try {
        if (answer === currentRiddle.answer) {
            feedback.innerHTML = `<span class='success-text'>✅ Correct! Proceeding to next level...</span>`;

            const teamRef = doc(db, "teams", teamId);

            // ✅ Get current solved riddles and level
            const teamSnap = await getDoc(teamRef);
            const solvedRiddles = teamSnap.exists() ? teamSnap.data().solvedRiddles || [] : [];
            const currentLevel = teamSnap.exists() ? teamSnap.data().currentLevel || 1 : 1;

            // ✅ Add the current riddle to the solved list
            solvedRiddles.push(currentRiddle.id);

            // ✅ Increment the level in Firestore
            await updateDoc(teamRef, {
                solvedRiddles: solvedRiddles,
                currentLevel: currentLevel + 1,   // ✅ Increment the level
                lastAnswerTimestamp: serverTimestamp()
            });

            // 🔥 Clear the solved riddle from localStorage
            localStorage.removeItem("currentRiddle");

            // ✅ Check if all riddles are solved after updating Firestore
            const riddlesRef = collection(db, "riddles");
            const totalRiddlesSnapshot = await getDocs(riddlesRef);

            if (solvedRiddles.length >= totalRiddlesSnapshot.size) {
                console.log("🎯 All riddles solved! Redirecting...");
                window.location.href = "congratulations.html";
            } else {
                console.log("✅ Proceeding to next level...");
                setTimeout(() => {
                    window.location.href = `level.html`;
                }, 2000);
            }

        } else {
            feedback.innerHTML = `<span style='color: red;'>❌ Wrong answer! Try again.</span>`;
        }

    } catch (error) {
        console.error("❌ Error submitting answer:", error);
        feedback.innerHTML = `<span style="color: red;">❌ Error submitting answer. Try again.</span>`;
    }
}

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

// ✅ Show the current level
export async function showCurrentLevel() {
    const teamId = localStorage.getItem("teamId");

    if (!teamId) {
        console.warn("⚠️ No team ID found.");
        return;
    }

    const teamRef = doc(db, "teams", teamId);
    const teamSnap = await getDoc(teamRef);

    if (teamSnap.exists()) {
        const currentLevel = teamSnap.data().currentLevel || 1;
        const levelElement = document.getElementById("levelTitle");
        if (levelElement) {
            levelElement.innerText = `Level ${currentLevel}`;
        }
    }
}

// ✅ Clear localStorage on new login
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log(`✅ User logged in: ${user.email}`);

        const teamId = localStorage.getItem("teamId");
        if (!teamId) {
            console.error("❌ Team ID not found in localStorage.");
            return;
        }

        await loadRiddle();  // ✅ Load the riddle once
        await showCurrentLevel();  // ✅ Display the current level
    }
});
