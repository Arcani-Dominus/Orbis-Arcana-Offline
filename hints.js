// ✅ Updated hints.js
import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

export async function getHint(level) {
    const hintElement = document.getElementById("hintText");

    // ✅ Get the riddle from localStorage first
    const storedRiddle = localStorage.getItem("currentRiddle");

    if (storedRiddle) {
        const currentRiddle = JSON.parse(storedRiddle);

        if (currentRiddle.hints) {
            console.log("💡 Hint loaded from localStorage:", currentRiddle.hints);
            hintElement.innerText = `💡 Hint: ${currentRiddle.hints}`;
            return;
        }
    }

    // 🔥 Fallback: If localStorage fails, fetch from Firestore
    try {
        console.log("⚠️ Hint not in localStorage, checking Firestore...");

        // We use the level number -> need team progress to map properly
        const teamId = localStorage.getItem("teamId");
        if (!teamId) {
            hintElement.innerText = "❌ Team not found.";
            return;
        }

        // Load current riddle from Firestore (doc name from localStorage id)
        const currentRiddleId = storedRiddle ? JSON.parse(storedRiddle).id : null;

        if (currentRiddleId) {
            const riddleRef = doc(db, "riddles", currentRiddleId);
            const riddleSnap = await getDoc(riddleRef);

            if (riddleSnap.exists() && riddleSnap.data().hints) {
                const hint = riddleSnap.data().hints;
                hintElement.innerText = `💡 Hint: ${hint}`;
                console.log("💡 Hint loaded from Firestore:", hint);
                return;
            }
        }

        hintElement.innerText = "⚠️ No hint available.";
    } catch (error) {
        console.error("❌ Error fetching hint:", error);
        hintElement.innerText = "❌ Error loading hint.";
    }
}
