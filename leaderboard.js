import { db } from "./firebase-config.js";
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

const leaderboardElement = document.getElementById("leaderboard");
const leaderboardButton = document.getElementById("loadLeaderboardBtn");
let leaderboardVisible = false;  // ✅ Track visibility

// ✅ Test Firestore Connection
async function testFirestore() {
    try {
        const snapshot = await getDocs(collection(db, "teams"));
        snapshot.forEach(doc => doc.data());
    } catch (error) {
        console.error("❌ Firestore connection failed:", error);
    }
}

testFirestore();

// ✅ Load Top 10 Teams from Firestore
async function loadLeaderboard() {
    if (!leaderboardElement) {
        return;
    }

    try {
        const leaderboardRef = collection(db, "teams");

        const q = query(
            leaderboardRef,
            orderBy("currentLevel", "desc"),         // Sort by highest level
            orderBy("lastAnswerTimestamp", "asc"),  // Tie-breaker by timestamp
            limit(10)                               // Top 10 teams
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            leaderboardElement.innerHTML = "<p>No teams yet.</p>";
            return;
        }

        let leaderboardHTML = "<h3>🏆 Top 10 Teams</h3><ol>";
        let count = 0;

        snapshot.forEach((doc) => {
            if (count >= 10) return;

            const team = doc.data();
            const teamName = team.teamName || "Unknown Team";
            const level = team.currentLevel || 0;

            leaderboardHTML += `<li>#${count + 1} ${teamName} (Level ${level})</li>`;
            count++;
        });

        leaderboardHTML += "</ol>";
        leaderboardElement.innerHTML = leaderboardHTML;

    } catch (error) {
        console.error("❌ Error loading leaderboard:", error);
        leaderboardElement.innerHTML = "<p>Error loading leaderboard.</p>";
    }
}

// 🔹 Toggle leaderboard visibility
leaderboardButton.addEventListener("click", async () => {
    if (!leaderboardVisible) {
        await loadLeaderboard();
        leaderboardElement.style.display = "block";
    } else {
        leaderboardElement.style.display = "none";
    }

    leaderboardVisible = !leaderboardVisible;
});

export { startLeaderboardListener, stopLeaderboardListener };
