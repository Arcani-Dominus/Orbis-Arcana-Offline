// ✅ Updated hints.js (global 3-hint system)
import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

export async function getHint(level) {
    const hintElement = document.getElementById("hintDisplay");
    const hintBtn = document.getElementById("getHintBtn");

    if (!hintElement) {
        console.error("❌ Hint element not found in HTML.");
        return;
    }

    // ✅ Global hint usage counter
    let totalHintsUsed = parseInt(localStorage.getItem("totalHintsUsed")) || 0;

    // ✅ Track if hint already used for this level
    const usedLevelsKey = "hintUsedLevels";
    let usedLevels = JSON.parse(localStorage.getItem(usedLevelsKey)) || [];

    if (usedLevels.includes(level)) {
        // Already used for this level → just show again without counting
        const storedRiddle = localStorage.getItem("currentRiddle");
        if (storedRiddle) {
            const currentRiddle = JSON.parse(storedRiddle);
            if (currentRiddle.hints) {
                hintElement.innerText = `💡 Hint: ${currentRiddle.hints}`;
                return;
            }
        }
    }

    if (totalHintsUsed >= 3) {
        hintElement.innerText = "⚠️ You’ve already used all 3 hints for the game!";
        hintBtn.disabled = true;
        hintBtn.style.opacity = "0.5";
        return;
    }

    // ✅ Show hint and count this level as "used"
    try {
        const storedRiddle = localStorage.getItem("currentRiddle");

        if (storedRiddle) {
            const currentRiddle = JSON.parse(storedRiddle);

            if (currentRiddle.hints) {
                totalHintsUsed++;
                localStorage.setItem("totalHintsUsed", totalHintsUsed);

                usedLevels.push(level);
                localStorage.setItem(usedLevelsKey, JSON.stringify(usedLevels));

                hintElement.innerText = `💡 Hint: ${currentRiddle.hints}`;
                console.log(`💡 Total hints used: ${totalHintsUsed}/3`);

                if (totalHintsUsed >= 3) {
                    hintBtn.disabled = true;
                    hintBtn.style.opacity = "0.5";
                }
                return;
            }
        }

        // 🔥 Fallback: Fetch from Firestore
        const currentRiddleId = storedRiddle ? JSON.parse(storedRiddle).id : null;

        if (currentRiddleId) {
            const riddleRef = doc(db, "riddles", currentRiddleId);
            const riddleSnap = await getDoc(riddleRef);

            if (riddleSnap.exists() && riddleSnap.data().hints) {
                totalHintsUsed++;
                localStorage.setItem("totalHintsUsed", totalHintsUsed);

                usedLevels.push(level);
                localStorage.setItem(usedLevelsKey, JSON.stringify(usedLevels));

                hintElement.innerText = `💡 Hint: ${riddleSnap.data().hints}`;
                console.log(`💡 Total hints used: ${totalHintsUsed}/3`);

                if (totalHintsUsed >= 3) {
                    hintBtn.disabled = true;
                    hintBtn.style.opacity = "0.5";
                }
                return;
            }
        }

        hintElement.innerText = "⚠️ No hint available.";
    } catch (error) {
        console.error("❌ Error fetching hint:", error);
        hintElement.innerText = "❌ Error loading hint.";
    }
}
