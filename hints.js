// hints.js — fixed: global 3-hint cap, per-level no double count ✅

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
  const el = document.getElementById("hintDisplay");
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
  const normalizedLevel = String(level ?? "").trim();

  if (!document.getElementById("hintDisplay")) {
    console.error("❌ #hintDisplay missing in DOM.");
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

    const data = teamSnap.data() || {};
    let hintsUsed = Number(data.hintsUsed || 0);
    let hintUsedLevels = Array.isArray(data.hintUsedLevels)
      ? data.hintUsedLevels.map(String)
      : [];

    // If global cap already reached → block
    if (hintsUsed >= 3) {
      setHintText("⚠️ You’ve already used all 3 hints for the game!");
      updateHintButtonDisabled(true);
      return;
    }

    // If this level already consumed a hint → just re-show, do NOT increment
    if (normalizedLevel && hintUsedLevels.includes(normalizedLevel)) {
      const cachedHint = getHintFromLocalStorage();
      setHintText(cachedHint ? `💡 Hint: ${cachedHint}` : "💡 Hint already used for this level.");
      return;
    }

    // Pull hint for the current riddle (prefer local cache)
    const hintText = getHintFromLocalStorage();
    if (!hintText) {
      setHintText("⚠️ No hint available for this riddle.");
      return;
    }

    // Show immediately
    setHintText(`💡 Hint: ${hintText}`);

    // ✅ Increment only once per new level
    hintsUsed += 1;
    hintUsedLevels = [...new Set([...hintUsedLevels, normalizedLevel])];

    await updateDoc(teamRef, {
      hintsUsed,
      hintUsedLevels
    });

    if (hintsUsed >= 3) updateHintButtonDisabled(true);

  } catch (err) {
    console.error("❌ Error fetching/updating hint:", err);
    setHintText("❌ Error loading hint.");
  }
}
