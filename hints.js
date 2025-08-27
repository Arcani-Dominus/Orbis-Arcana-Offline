// hints.js
import { auth, db } from "./firebase-config.js";
import { getDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// ✅ Function to fetch and show hint for the current level
async function getHint() {
    const user = auth.currentUser;
    const hintDisplay = document.getElementById("hintDisplay");

    if (!user) {
        hintDisplay.innerText = "❌ You must be logged in to get a hint.";
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const level = parseInt(urlParams.get("level")) || 1;
    const levelKey = level.toString();
    const playerRef = doc(db, "teams", user.uid);

    console.log("👉 Current level:", level);
    console.log("👉 Looking for doc:", `randomRiddle${level}`);

    try {
        const playerSnap = await getDoc(playerRef);
        let usedHints = 0;
        let unlockedHints = {};

        if (playerSnap.exists()) {
            usedHints = playerSnap.data().hintsUsed || 0;
            unlockedHints = playerSnap.data().hintsUnlocked || {};
        }

        if (usedHints >= 3) {
            hintDisplay.innerText = "⚠️ You’ve used all 3 hints!";
            document.getElementById("getHintBtn").disabled = true;
            return;
        }

        // ✅ Fetch riddle doc (force fresh from server, not cache)
        const riddleRef = doc(db, "riddles", `randomRiddle${level}`);
        const riddleSnap = await getDoc(riddleRef, { source: "server" });

        if (!riddleSnap.exists()) {
            hintDisplay.innerText = "⚠️ No hint found for this level.";
            console.log("❌ No riddle doc found.");
            return;
        }

        // ✅ Log full document data
        const data = riddleSnap.data();
        console.log("👉 Raw Firestore doc data:", data);

        const hints = data.hints || "";
        console.log("👉 Processed hint:", hints);

        const hint = Array.isArray(hints) ? hints[0] : hints;

        if (!hint) {
            hintDisplay.innerText = "⚠️ No hints set for this riddle.";
            return;
        }

        // If already unlocked → just show it
        if (unlockedHints[levelKey]) {
            hintDisplay.innerText = `💡 Hint: ${hint}`;
            return;
        }

        // Unlock and save
        await updateDoc(playerRef, {
            hintsUsed: usedHints + 1,
            [`hintsUnlocked.${levelKey}`]: true
        });

        hintDisplay.innerText = `💡 Hint: ${hint}`;

        if (usedHints + 1 >= 3) {
            document.getElementById("getHintBtn").disabled = true;
            hintDisplay.innerText += " (⚠️ All hints used!)";
        }

    } catch (error) {
        console.error("❌ Error fetching hint:", error);
        hintDisplay.innerText = "Error loading hint.";
    }
}

// ✅ Export function so level.html can import it
export { getHint };
