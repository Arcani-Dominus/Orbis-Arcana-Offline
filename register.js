import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { setDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

document.getElementById("registerBtn").addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const studentID = document.getElementById("studentID").value.trim(); // ✅ Get student ID
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const result = document.getElementById("result");

    if (!name || !studentID || !email || !password) {
        result.innerHTML = "<span style='color: red;'>Please enter all details.</span>";
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ Save player data to Firestore with student ID & timestamp
        await setDoc(doc(db, "players", user.uid), {
            name: name,
            studentID: studentID, // ✅ Store student ID
            email: email,
            level: 2,
            timestamp: serverTimestamp() // ✅ Store registration timestamp
        });

        localStorage.setItem("userId", user.uid); // ✅ Save session
        localStorage.setItem("studentID", studentID); // ✅ Store student ID locally

        result.innerHTML = "<span class='success-text'>Registration successful! Redirecting...</span>";

        setTimeout(() => {
            window.location.href = "level.html?level=2";
        }, 2000);
    } catch (error) {
        console.error("❌ Registration failed:", error);
        result.innerHTML = `<span style='color: red;'>Error: ${error.message}</span>`;
    }
});
