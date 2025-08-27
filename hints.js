// hints.js
import { auth, db } from "./firebase-config.js";
import { getDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

async function getHint() {
    const user = auth.currentUser;
    const hintDisplay = document.getElementById("hintDisplay");

    if (!user) {
        hintDisplay.innerText = "❌ You must be logged in to get a hint.";
        return;
    }

    // ✅ Get the current riddle ID from localStorage
    const riddleId = localStorage.getItem("currentRiddleId");
    if (!riddleId) {
        hintDisplay.innerText = "⚠️ No riddle loaded.";
        return;
    }

    console.log("👉 Fetching hint for:", riddleId);

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

        // ✅ Fetch the riddle doc directly by ID
        const riddleRef = doc(db, "riddles", riddleId);
        const riddleSnap = await getDoc(riddleRef);

        if (!riddleSnap.exists()) {
            hintDisplay.innerText = "⚠️ No hint found for this riddle.";
            return;
        }

        const hints = riddleSnap.data().hints || "";
        console.log("👉 Firestore returned hints:", hints);

        const hint = Array.isArray(hints) ? hints[0] : hints;

        if (!hint) {
            hintDisplay.innerText = "⚠️ No hints set for this riddle.";
            return;
        }

        // If already unlocked → just show it
        if (unlockedHints[riddleId]) {
            hintDisplay.innerText = `💡 Hint: ${hint}`;
            return;
        }

        // Unlock and save
        await updateDoc(playerRef, {
            hintsUsed: usedHints + 1,
            [`hintsUnlocked.${riddleId}`]: true
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

export { getHint };
