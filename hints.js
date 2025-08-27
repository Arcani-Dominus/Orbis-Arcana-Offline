import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

export async function getHint(level) {
    const hintElement = document.getElementById("hintDisplay");
    const hintBtn = document.getElementById("getHintBtn");

    if (!hintElement) {
        console.error("❌ Hint element not found in HTML.");
        return;
    }

    const teamId = localStorage.getItem("teamId");
    if (!teamId) {
        console.error("❌ No teamId found in localStorage.");
        return;
    }

    const teamRef = doc(db, "teams", teamId);
    const teamSnap = await getDoc(teamRef);

    if (!teamSnap.exists()) {
        console.error("❌ Team not found in Firestore.");
        return;
    }

    let teamData = teamSnap.data();
    let totalHintsUsed = teamData.hintsUsed || 0;
    let usedLevels = teamData.hintUsedLevels || [];

    // 🔒 Already maxed out?
    if (totalHintsUsed >= 3) {
        hintElement.innerText = "⚠️ You’ve already used all 3 hints for the game!";
        hintBtn.disabled = true;
        hintBtn.style.opacity = "0.5";
        return;
    }

    // 🔄 If this level’s hint was already used → show again but don’t count
    if (usedLevels.includes(level)) {
        const storedRiddle = localStorage.getItem("currentRiddle");
        if (storedRiddle) {
            const currentRiddle = JSON.parse(storedRiddle);
            if (currentRiddle.hints) {
                hintElement.innerText = `💡 Hint: ${currentRiddle.hints}`;
                return;
            }
        }
    }

    try {
        const storedRiddle = localStorage.getItem("currentRiddle");

        if (storedRiddle) {
            const currentRiddle = JSON.parse(storedRiddle);

            if (currentRiddle.hints) {
                // ✅ Update Firestore usage count
                totalHintsUsed++;
                usedLevels.push(level);

                await updateDoc(teamRef, {
                    hintsUsed: totalHintsUsed,
                    hintUsedLevels: usedLevels
                });

                hintElement.innerText = `💡 Hint: ${currentRiddle.hints}`;
                console.log(`💡 Total hints used: ${totalHintsUsed}/3`);

                if (totalHintsUsed >= 3) {
                    hintBtn.disabled = true;
                    hintBtn.style.opacity = "0.5";
                }
                return;
            }
        }

        // 🔥 Fallback: Fetch from Firestore if not in localStorage
        const currentRiddleId = storedRiddle ? JSON.parse(storedRiddle).id : null;
        if (currentRiddleId) {
            const riddleRef = doc(db, "riddles", currentRiddleId);
            const riddleSnap = await getDoc(riddleRef);

            if (riddleSnap.exists() && riddleSnap.data().hints) {
                totalHintsUsed++;
                usedLevels.push(level);

                await updateDoc(teamRef, {
                    hintsUsed: totalHintsUsed,
                    hintUsedLevels: usedLevels
                });

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
