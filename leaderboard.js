import { db } from "./firebase-config.js";
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

const leaderboardElement = document.getElementById("leaderboard");
const leaderboardButton = document.getElementById("loadLeaderboardBtn");
let leaderboardVisible = false; // ✅ Track visibility

async function loadLeaderboard() {
    console.log("📌 Fetching top 10 players...");

    if (!leaderboardElement) {
        console.error("❌ Leaderboard element not found in the DOM.");
        return;
    }

    try {
        const leaderboardRef = collection(db, "players");
        const q = query(leaderboardRef, orderBy("level", "desc"), orderBy("timestamp", "asc"), limit(10)); // ✅ Strict limit to top 10
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.warn("⚠ No players found in Firestore.");
            leaderboardElement.innerHTML = "<p>No players yet.</p>";
            return;
        }

        let leaderboardHTML = "<h3>🏆 Top 10 Players</h3><ol>";
        let count = 0;

        snapshot.forEach((doc) => {
            if (count >= 10) return; // ✅ Ensure only 10 players are shown

            const player = doc.data();

            // ✅ Check if name and level are valid
            if (!player.name?.trim() || !player.level || isNaN(player.level)) {
                console.warn("⚠ Skipping invalid player:", player);
                return; // ❌ Skip empty or invalid players
            }

            leaderboardHTML += `<li>#${count + 1} ${player.name} (Level ${player.level})</li>`;
            count++;
        });

        leaderboardHTML += "</ol>";

        if (count === 0) {
            leaderboardElement.innerHTML = "<p>No valid players found.</p>";
        } else {
            leaderboardElement.innerHTML = leaderboardHTML;
        }

        console.log("✅ Leaderboard updated successfully!");
    } catch (error) {
        console.error("❌ Error loading leaderboard:", error);
        leaderboardElement.innerHTML = "<p>Error loading leaderboard.</p>";
    }
}

// 🔹 Toggle leaderboard visibility
leaderboardButton.addEventListener("click", async () => {
    if (!leaderboardVisible) {
        await loadLeaderboard(); // ✅ Fetch only when opening
        leaderboardElement.style.display = "block";
    } else {
        leaderboardElement.style.display = "none";
    }
    leaderboardVisible = !leaderboardVisible; // ✅ Toggle visibility state
});
