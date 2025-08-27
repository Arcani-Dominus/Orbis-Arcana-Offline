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
    const playerRef = doc(db, "teams", user.uid);

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

        // ✅ Always fetch the correct riddle doc for this level
        const riddleRef = doc(db, "riddles", `randomRiddle${level}`);
        const riddleSnap = await getDoc(riddleRef);

        if (!riddleSnap.exists()) {
            hintDisplay.innerText = "⚠️ No hint found for this level.";
            return;
        }

        // ✅ Get hint (string or array)
        const hints = riddleSnap.data().hints || "";
        const hint = Array.isArray(hints) ? hints[0] : hints;

        if (!hint) {
            hintDisplay.innerText = "⚠️ No hints set for this riddle.";
            return;
        }

        // ✅ If already unlocked → just show it
        if (unlockedHints[level]) {
            hintDisplay.innerText = `💡 Hint: ${hint}`;
            return;
        }

        // ✅ Unlock hint → consume one global hint and mark this level as unlocked
        await updateDoc(playerRef, {
            hintsUsed: usedHints + 1,
            [`hintsUnlocked.${level}`]: true
        });

        hintDisplay.innerText = `💡 Hint: ${hint}`;

        // Disable button if all hints used
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
