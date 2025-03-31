// ✅ Import dependencies once at the top
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { 
    getDocs, collection, doc, updateDoc, serverTimestamp, getDoc 
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// ✅ Fetch a random riddle from Firestore, ensuring no duplicates
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
        return unsolvedRiddles[randomIndex];

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

            // ✅ Get current solved riddles and level
            const teamSnap = await getDoc(teamRef);
            const solvedRiddles = teamSnap.exists() ? teamSnap.data().solvedRiddles || [] : [];
            const currentLevel = teamSnap.exists() ? teamSnap.data().currentLevel || 1 : 1;

            // ✅ Add the current riddle to the solved list
            solvedRiddles.push(riddle.id);

            // ✅ Increment the level in Firestore
            await updateDoc(teamRef, {
                solvedRiddles: solvedRiddles,
                currentLevel: currentLevel + 1,   // ✅ Increment the level
                lastAnswerTimestamp: serverTimestamp()
            });

            // ✅ Check if all riddles are solved after updating Firestore
            const riddlesRef = collection(db, "riddles");
            const totalRiddlesSnapshot = await getDocs(riddlesRef);

            if (solvedRiddles.length >= totalRiddlesSnapshot.size) {
                console.log("🎯 All riddles solved! Redirecting...");
                window.location.href = "congratulations.html";  // ✅ Redirect to completion page
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

        const riddle = await getRandomRiddle();
        const riddleElement = document.getElementById("riddleText");

        if (riddle && riddleElement) {
            console.log(`🧩 Riddle: ${riddle.riddle}`);
            riddleElement.innerText = riddle.riddle;  // ✅ Display the riddle
        } else {
            console.warn("⚠️ Riddle or element not found.");
        }

        await showCurrentLevel();  // ✅ Display the current level
    }
});
