// hints.js
import { auth, db } from "./firebase-config.js";
import { getDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

async function getHint(currentLevel) {
    const user = auth.currentUser;
    const hintDisplay = document.getElementById("hintDisplay");

    if (!hintDisplay) return;
    if (!user) {
        hintDisplay.innerText = "❌ You must be logged in to get a hint.";
        return;
    }

    const teamRef = doc(db, "teams", user.uid);

    try {
        const teamSnap = await getDoc(teamRef);

        if (!teamSnap.exists()) {
            hintDisplay.innerText = "❌ Team data not found.";
            return;
        }

        let { hintsUsed = 0, lastHintLevel = null } = teamSnap.data();

        // ✅ Enforce max 3 hints globally
        if (hintsUsed >= 3 && lastHintLevel !== currentLevel) {
            hintDisplay.innerText = "⚠️ You’ve used all 3 hints for the game!";
            document.getElementById("getHintBtn").disabled = true;
            return;
        }

        // ✅ Fetch the riddle for this level
        const riddleRef = doc(db, "riddles", `randomRiddle${currentLevel}`);
        const riddleSnap = await getDoc(riddleRef);

        if (!riddleSnap.exists()) {
            hintDisplay.innerText = "⚠️ No hint found for this level.";
            return;
        }

        const hints = riddleSnap.data().hints || [];
        const hint = Array.isArray(hints) ? hints[0] : hints;

        if (!hint) {
            hintDisplay.innerText = "⚠️ No hints set for this riddle.";
            return;
        }

        // ✅ If already unlocked for this level → don't count again
        if (lastHintLevel === currentLevel) {
            hintDisplay.innerText = `💡 Hint: ${hint}`;
            return;
        }

        // ✅ First time using hint on this level → increment + update Firestore
        await updateDoc(teamRef, {
            hintsUsed: hintsUsed + 1,
            lastHintLevel: currentLevel
        });

        hintDisplay.innerText = `💡 Hint: ${hint}`;

        if (hintsUsed + 1 >= 3) {
            document.getElementById("getHintBtn").disabled = true;
            hintDisplay.innerText += " (⚠️ All hints used!)";
        }

    } catch (error) {
        console.error("❌ Error fetching hint:", error);
        hintDisplay.innerText = "Error loading hint.";
    }
}

export { getHint };
