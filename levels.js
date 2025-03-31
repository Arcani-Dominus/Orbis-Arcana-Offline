// ✅ Import dependencies once at the top
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { 
    getDocs, collection, doc, updateDoc, serverTimestamp, getDoc 
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// ✅ Fetch all riddles and check for unseen ones
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

        // ✅ Retrieve seen riddles from localStorage
        let seenRiddles = JSON.parse(localStorage.getItem("seenRiddles")) || [];

        // ✅ Check if the player has solved all riddles
        if (seenRiddles.length >= riddles.length) {
            console.log("✅ All riddles solved! Redirecting...");
            window.location.href = "congratulations.html";  // 🎯 Redirect to completion page
            return null;
        }

        // ✅ Filter unseen riddles
        const unseenRiddles = riddles.filter(riddle => !seenRiddles.includes(riddle.id));

        // ✅ Select a random unseen riddle
        const randomIndex = Math.floor(Math.random() * unseenRiddles.length);
        const selectedRiddle = unseenRiddles[randomIndex];

        // ✅ Add to seen list and store it in localStorage
        seenRiddles.push(selectedRiddle.id);
        localStorage.setItem("seenRiddles", JSON.stringify(seenRiddles));

        return selectedRiddle;

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

            // ✅ Update Firestore with solved riddle count
            const teamSnap = await getDoc(teamRef);
            const solvedCount = (teamSnap.exists() && teamSnap.data().solvedCount) || 0;

            await updateDoc(teamRef, {
                solvedCount: solvedCount + 1,
                lastAnswerTimestamp: serverTimestamp() 
            });

            // ✅ Redirect to congrats page if all riddles are solved
            const riddlesRef = collection(db, "riddles");
            const totalRiddlesSnapshot = await getDocs(riddlesRef);
            
            if (solvedCount + 1 >= totalRiddlesSnapshot.size) {
                window.location.href = "congratulations.html";  // 🎯 Redirect to congrats page
            } else {
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
