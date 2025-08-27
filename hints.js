// hints.js
import { auth, db } from "./firebase-config.js";
import { getDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

/** ---------- Level state (localStorage) ---------- */
function getCurrentLevel() {
  const n = parseInt(localStorage.getItem("currentLevel"), 10);
  if (Number.isFinite(n) && n > 0) return n;
  localStorage.setItem("currentLevel", "1");
  return 1;
}
function setCurrentLevel(n) {
  const v = parseInt(n, 10);
  localStorage.setItem("currentLevel", (Number.isFinite(v) && v > 0 ? v : 1).toString());
}
function incrementLevel() {
  const n = getCurrentLevel() + 1;
  setCurrentLevel(n);
  return n;
}
function decrementLevel() {
  const n = Math.max(1, getCurrentLevel() - 1);
  setCurrentLevel(n);
  return n;
}

/** ---------- Hints ---------- */
// ✅ Function to fetch and show hint for the current level
async function getHint() {
  const user = auth.currentUser;
  const hintDisplay = document.getElementById("hintDisplay");

  if (!user) {
    hintDisplay.innerText = "❌ You must be logged in to get a hint.";
    return;
  }

  // 🟢 READ LEVEL FROM LOCALSTORAGE (not URL)
  const level = getCurrentLevel();
  const levelKey = level.toString();
  const playerRef = doc(db, "teams", user.uid);

  console.log("👉 Current level:", level);
  console.log("👉 Looking for doc:", `randomRiddle${level}`);

  try {
    const playerSnap = await getDoc(playerRef);
    let usedHints = 0;
    let unlockedHints = {};

    if (playerSnap.exists()) {
      usedHints = playerSnap.data().hintsUsed || 0;
      unlockedHints = playerSnap.data().hintsUnlocked || {};
    }

    if (usedHints >= 3) {
      hintDisplay.innerText = "⚠️ You’ve used all 3 hints!";
      const btn = document.getElementById("getHintBtn");
      if (btn) btn.disabled = true;
      return;
    }

    // Fetch riddle doc for this level
    const riddleRef = doc(db, "riddles", `randomRiddle${level}`);
    const riddleSnap = await getDoc(riddleRef);

    if (!riddleSnap.exists()) {
      hintDisplay.innerText = "⚠️ No hint found for this level.";
      console.log("❌ No riddle doc found.");
      return;
    }

    // Support string or array in Firestore
    const hints = riddleSnap.data().hints || "";
    console.log("👉 Firestore returned hints:", hints);
    const hint = Array.isArray(hints) ? hints[0] : hints;

    if (!hint) {
      hintDisplay.innerText = "⚠️ No hints set for this riddle.";
      return;
    }

    // If already unlocked → just show it (do NOT consume a hint)
    if (unlockedHints[levelKey]) {
      hintDisplay.innerText = `💡 Hint: ${hint}`;
      return;
    }

    // Unlock hint → consume one global hint and mark this level as unlocked
    await updateDoc(playerRef, {
      hintsUsed: usedHints + 1,
      [`hintsUnlocked.${levelKey}`]: true,
    });

    hintDisplay.innerText = `💡 Hint: ${hint}`;

    // Disable button if all hints used
    if (usedHints + 1 >= 3) {
      const btn = document.getElementById("getHintBtn");
      if (btn) btn.disabled = true;
      hintDisplay.innerText += " (⚠️ All hints used!)";
    }
  } catch (error) {
    console.error("❌ Error fetching hint:", error);
    hintDisplay.innerText = "Error loading hint.";
  }
}

// Export what you might need elsewhere
export { getHint, getCurrentLevel, setCurrentLev
