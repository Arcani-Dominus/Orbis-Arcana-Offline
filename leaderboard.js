import { db } from "./firebase-config.js";
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// ✅ Get DOM elements safely
const leaderboardElement = document.getElementById("leaderboard");
const leaderboardButton = document.getElementById("loadLeaderboardBtn");

if (!leaderboardElement || !leaderboardButton) {
    console.error("❌ Leaderboard or button not found in DOM.");
    alert("Leaderboard element missing in HTML!");
}

let leaderboardVisible = false; // ✅ Track visibility

// ✅ Load Top 10 Teams from Firestore
async function loadLeaderboard() {
    console.log("📌 Fetching top 10 teams...");

    if (!leaderboardElement) {
        console.error("❌ Leaderboard element not found in the DOM.");
        return;
    }

    try {
        // ✅ Query the "teams" collection
        const leaderboardRef = collection(db, "teams");
        const q = query(
            leaderboardRef,
            orderBy("currentLevel", "desc"),         // Sort by highest level
            orderBy("lastAnswerTimestamp", "asc"),   // Tie-breaker by timestamp
            limit(10)                                // Top 10 teams
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.warn("⚠ No teams found in Firestore.");
            leaderboardElement.innerHTML = "<p>No teams yet.</p>";
            return;
        }

        let leaderboardHTML = "<h3>🏆 Top 10 Teams</h3><ol>";
        let count = 0;

        snapshot.forEach((doc) => {
            const team = doc.data();
            console.log(`📌 Team ${count + 1}:`, team);

            // ✅ Ensure valid team data
            const teamName = team.teamName || "Unknown Team";
            const level = team.currentLevel || 0;

            leaderboardHTML += `<li>#${count + 1} ${teamName} (Level ${level})</li>`;
            count++;
        });

        leaderboardHTML += "</ol>";

        if (count === 0) {
            leaderboardElement.innerHTML = "<p>No valid teams found.</p>";
        } else {
            leaderboardElement.innerHTML = leaderboardHTML;
        }

        console.log("✅ Leaderboard updated successfully!");
    } catch (error) {
        console.error("❌ Firestore error while loading leaderboard:", error);
        leaderboardElement.innerHTML = `<p>Error loading leaderboard: ${error.message}</p>`;
    }
}

// 🔹 Toggle leaderboard visibility
leaderboardButton.addEventListener("click", async () => {
    if (!leaderboardVisible) {
        await loadLeaderboard();     // ✅ Fetch only when opening
        leaderboardElement.style.display = "block";
    } else {
        leaderboardElement.style.display = "none";
    }
    leaderboardVisible = !leaderboardVisible;    // ✅ Toggle visibility state
});
