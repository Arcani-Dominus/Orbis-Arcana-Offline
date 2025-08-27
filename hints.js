// ✅ Import Firestore dependencies
import { db, auth } from "./firebase-config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

// ✅ Get hint function
export async function getHint(level) {
    const teamId = localStorage.getItem("teamId");
    if (!teamId) {
        console.error("❌ Team ID not found in localStorage.");
        return;
    }

    const hintDisplay = document.getElementById("hintDisplay");
    if (!hintDisplay) {
        console.error("❌ Hint display element not found in DOM.");
        return;
    }

    try {
        // ✅ Get team document
        const teamRef = doc(db, "teams", teamId);
        const teamSnap = await getDoc(teamRef);

        if (!teamSnap.exists()) {
            console.error("❌ Team document not found.");
            return;
        }

        let teamData = teamSnap.data();
        let usedHints = teamData.usedHints || 0;

        // ✅ If already reached limit, stop
        if (usedHints >= 3) {
            hintDisplay.innerText = "⚠️ You have already used all 3 hints for this game.";
            return;
        }

        // ✅ Check if current riddle is in localStorage
        const storedRiddle = localStorage.getItem("currentRiddle");
        if (!storedRiddle) {
            console.error("❌ No riddle in localStorage.");
            hintDisplay.innerText = "⚠️ No riddle loaded.";
            return;
        }

        const currentRiddle = JSON.parse(storedRiddle);

        // ✅ If hint already shown before for this riddle, just re-show it
        if (currentRiddle.shownHint) {
            console.log("📌 Hint already revealed for this riddle, reusing it.");
            hintDisplay.innerText = currentRiddle.shownHint;
            return;
        }

        // ✅ Otherwise, reveal the hint (use first hint for now)
        let hint = "⚠️ No hint available.";
        if (currentRiddle.hints && currentRiddle.hints.length > 0) {
            hint = currentRiddle.hints[0]; // 🎯 you can randomize or rotate if needed
        }

        // ✅ Update localStorage to remember that hint is already shown
        currentRiddle.shownHint = hint;
        localStorage.setItem("currentRiddle", JSON.stringify(currentRiddle));

        // ✅ Update Firestore: increment hint count ONCE
        await updateDoc(teamRef, {
            usedHints: usedHints + 1
        });

        // ✅ Show hint
        hintDisplay.innerText = hint;

    } catch (error) {
        console.error("❌ Error fetching hint:", error);
        const hintDisplay = document.getElementById("hintDisplay");
        if (hintDisplay) {
            hintDisplay.innerText = "❌ Error loading hint.";
        }
    }
}

// ✅ Reset hint usage on new login (optional safeguard)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ User logged in, hint system ready.");
    }
});
