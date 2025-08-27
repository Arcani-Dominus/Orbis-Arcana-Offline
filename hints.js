// hints.js — global 3-hint limit, per-level no double count, robust DOM + data handling

import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// Helper: get the visible hint text from localStorage's currentRiddle
function getHintFromLocalStorage() {
  const stored = localStorage.getItem("currentRiddle");
  if (!stored) return null;

  const r = JSON.parse(stored);
  const raw = r?.hints;

  // Support string or array
  if (Array.isArray(raw)) return raw[0] ?? null;
  if (typeof raw === "string") return raw.length ? raw : null;
  return null;
}

// Helper: show text in the UI safely
function setHintText(text) {
  const el = document.getElementById("hintDisplay"); // ✅ must exist in level.html
  if (!el) {
    console.error("❌ #hintDisplay not found in DOM.");
    return false;
  }
  el.innerText = text;
  return true;
}

// Helper: disable the button if needed
function updateHintButtonDisabled(disabled) {
  const btn = document.getElementById("getHintBtn");
  if (btn) {
    btn.disabled = !!disabled;
    btn.style.opacity = disabled ? "0.5" : "";
  }
}

// Main: get a hint with global limit and per-level no double count
export async function getHint(level) {
  // Normalize level as string to prevent "1" vs 1 mismatches across devices
  const normalizedLevel = String(level ?? "").trim();

  // DOM safety
  if (!document.getElementById("hintDisplay")) {
    console.error("❌ #hintDisplay missing. Ensure your HTML has <p id=\"hintDisplay\"></p>");
    return;
  }

  const teamId = localStorage.getItem("teamId");
  if (!teamId) {
    setHintText("❌ Team not found. Please sign in again.");
    return;
  }

  const teamRef = doc(db, "teams", teamId);

  try {
    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) {
      setHintText("❌ Team data not found.");
      return;
    }

    // Read counters from Firestore
    const data = teamSnap.data() || {};
    const hintsUsed = Number(data.hintsUsed || 0);          // global counter (0..3)
    const hintUsedLevels = Array.isArray(data.hintUsedLevels)
      ? data.hintUsedLevels.map(String)
      : [];

    // If this level already consumed a hint → just re-show without counting
    if (normalizedLevel && hintUsedLevels.includes(normalizedLevel)) {
      const cachedHint = getHintFromLocalStorage();
      if (cachedHint) {
        setHintText(`💡 Hint: ${cachedHint}`);
      } else {
        // Fallback if local cache missing
        setHintText("💡 Hint already used for this level.");
      }
      return;
    }

    // If global cap reached → block
    if (hintsUsed >= 3) {
      setHintText("⚠️ You’ve already used all 3 hints for the game!");
      updateHintButtonDisabled(true);
      return;
    }

    // Pull hint for the current riddle (prefer local cache)
    const hintText = getHintFromLocalStorage();
    if (!hintText) {
      setHintText("⚠️ No hint available for this riddle.");
      return;
    }

    // Show hint immediately for good UX
    setHintText(`💡 Hint: ${hintText}`);

    // Update Firestore: increment global counter and mark this level as used (no duplicates)
    const newCount = hintsUsed + 1;
    const newLevels = normalizedLevel
      ? Array.from(new Set([...hintUsedLevels, normalizedLevel]))
      : hintUsedLevels;

    await updateDoc(teamRef, {
      hintsUsed: newCount,
      hintUsedLevels: newLevels
    });

    // If this was the third hint, disable the button
    if (newCount >= 3) updateHintButtonDisabled(true);

  } catch (err) {
    console.error("❌ Error fetching/updating hint:", err);
    setHintText("❌ Error loading hint.");
  }
}
