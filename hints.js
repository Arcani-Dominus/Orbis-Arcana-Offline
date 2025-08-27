// ✅ Updated hints.js (fixed hint element id)
import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

export async function getHint(level) {
    const hintElement = document.getElementById("hintDisplay"); // ✅ FIXED

    if (!hintElement) {
        console.error("❌ Hint element not found in HTML.");
        return;
    }

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
