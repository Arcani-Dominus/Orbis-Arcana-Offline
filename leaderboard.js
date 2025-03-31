import { db } from "./firebase-config.js";
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

const leaderboardElement = document.getElementById("leaderboard");
const leaderboardButton = document.getElementById("loadLeaderboardBtn");
let leaderboardVisible = false;  // ✅ Track visibility

// ✅ Load Top 10 Teams from Firestore with Logs
async function loadLeaderboard() {
    console.log("📌 Attempting to fetch top 10 teams...");

    if (!leaderboardElement) {
        console.error("❌ Leaderboard element not found in the DOM.");
        return;
    }

    try {
        console.log("🔎 Connecting to Firestore...");
        
        // ✅ Query the "teams" collection with sorting and limit
        const leaderboardRef = collection(db, "teams");
        console.log("✅ Reference to 'teams' collection created:", leaderboardRef);

        const q = query(
            leaderboardRef,
            orderBy("currentLevel", "desc"),         // Sort by highest level
            orderBy("lastAnswerTimestamp", "asc"),  // Tie-breaker by timestamp
            limit(10)                               // Top 10 teams
        );

        console.log("📌 Query created:", q);

        const snapshot = await getDocs(q);
        console.log("📌 Firestore snapshot received:", snapshot);

        if (snapshot.empty) {
            console.warn("⚠ No teams found in Firestore.");
            leaderboardElement.innerHTML = "<p>No teams yet.</p>";
            return;
        }

        console.log(`✅ Found ${snapshot.size} teams.`);

        let leaderboardHTML = "<h3>🏆 Top 10 Teams</h3><ol>";
        let count = 0;

        snapshot.forEach((doc) => {
            console.log(`📌 Document ID: ${doc.id}`);
            console.log("🔍 Team Data:", doc.data());

            if (count >= 10) return;

            const team = doc.data();

            // ✅ Display team name and level
            const teamName = team.teamName || "Unknown Team";
            const level = team.currentLevel || 0;

            console.log(`✅ Adding to leaderboard: ${teamName} (Level ${level})`);

            leaderboardHTML += `<li>#${count + 1} ${teamName} (Level ${level})</li>`;
            count++;
        });

        leaderboardHTML += "</ol>";
        leaderboardElement.innerHTML = leaderboardHTML;

        console.log("✅ Leaderboard updated successfully!");

    } catch (error) {
        console.error("❌ Error loading leaderboard:", error);
        leaderboardElement.innerHTML = "<p>Error loading leaderboard.</p>";
    }
}

// 🔹 Toggle leaderboard visibility
leaderboardButton.addEventListener("click", async () => {
    console.log(`📌 Leaderboard button clicked. Visible: ${leaderboardVisible}`);

    if (!leaderboardVisible) {
        await loadLeaderboard();
        leaderboardElement.style.display = "block";
    } else {
        leaderboardElement.style.display = "none";
    }

    leaderboardVisible = !leaderboardVisible;
    console.log(`✅ Leaderboard visibility toggled. Now: ${leaderboardVisible}`);
});
