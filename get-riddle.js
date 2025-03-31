import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { db } from "./firebase-config.js";  // ✅ Import Firestore configuration

// ✅ Fetch all riddles and randomly select one
export async function getRandomRiddle() {
    try {
        const riddlesRef = collection(db, "levels");   // ✅ Fetch all riddles
        const querySnapshot = await getDocs(riddlesRef);

        const riddles = [];

        querySnapshot.forEach((doc) => {
            riddles.push({
                id: doc.id,
                riddle: doc.data().riddle
            });
        });

        if (riddles.length === 0) {
            console.warn("⚠️ No riddles found!");
            return "No riddles available!";
        }

        // ✅ Select a random riddle
        const randomIndex = Math.floor(Math.random() * riddles.length);
        const randomRiddle = riddles[randomIndex];

        console.log(`🧩 Random Riddle:`, randomRiddle);
        return randomRiddle.riddle;

    } catch (error) {
        console.error("❌ Firestore error while fetching random riddle:", error);
        return "Error loading riddle!";
    }
}
