// ✅ Import Firestore
import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// ✅ Get hint function
export async function getHint(level) {
    const teamId = localStorage.getItem("teamId");
    if (!teamId) {
        console.error("❌ No team ID found in localStorage.");
        return;
    }

    const teamRef = doc(db, "teams", teamId);
    const teamSnap = await getDoc(teamRef);

    const hintElement = document.getElementById("hintText");
    const hintBtn = document.getElementById("getHintBtn");

    if (!hintElement) {
        console.error("❌ No element found with id='hintText'");
        return;
    }

    if (teamSnap.exists()) {
        let teamData = teamSnap.data();
        let totalHintsUsed = teamData.hintsUsed || 0;
        let usedLevels = teamData.hintUsedLevels || [];

        // 🔄 Normalize level as string to avoid mismatches ("1" vs 1)
        const normalizedLevel = String(level);

        // 🚫 Already used all hints
        if (totalHintsUsed >= 3) {
            hintElement.innerText = "⚠️ You’ve already used all 3 hints for the game!";
            hintBtn.disabled = true;
            hintBtn.style.opacity = "0.5";
            return;
        }

        // 🔄 If this level’s hint was already used → show it again but don’t count
        if (usedLevels.includes(normalizedLevel)) {
            const storedRiddle = localStorage.getItem("currentRiddle");
            if (storedRiddle) {
                const currentRiddle = JSON.parse(storedRiddle);
                if (currentRiddle.hints) {
                    hintElement.innerText = `💡 Hint: ${currentRiddle.hints}`;
                    return;
                }
            }
        }

        // ✅ Otherwise → count a new hint usage
        const storedRiddle = localStorage.getItem("currentRiddle");
        if (storedRiddle) {
            const currentRiddle = JSON.parse(storedRiddle);

            if (currentRiddle.hints) {
                hintElement.innerText = `💡 Hint: ${currentRiddle.hints}`;

                // 🔄 Update Firestore with new hint usage
                await updateDoc(teamRef, {
                    hintsUsed: totalHintsUsed + 1,
                    hintUsedLevels: [...new Set([...usedLevels, normalizedLevel])]
                });
            } else {
                hintElement.innerText = "⚠️ No hint available for this riddle.";
            }
        }
    } else {
        console.error("❌ Team document not found.");
    }
}
