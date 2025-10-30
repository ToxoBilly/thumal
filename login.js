// Import Firebase core + analytics
    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
    import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
    import { 
      getAuth, 
      createUserWithEmailAndPassword, 
      signInWithEmailAndPassword, 
      updateProfile 
    } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyCoVG6uy4YWb5uJsrR3k1X_dilpH2Hz7i0",
      authDomain: "minor-project-bca-ium.firebaseapp.com",
      projectId: "minor-project-bca-ium",
      storageBucket: "minor-project-bca-ium.firebasestorage.app",
      messagingSenderId: "719831195445",
      appId: "1:719831195445:web:514f2323ebf76f4e6cf67c",
      measurementId: "G-XG0LE8YGC1"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    const auth = getAuth(app);

    // Signup
    document.getElementById("signup-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("signup-username").value;
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });
        alert("✅ Account created successfully!");

        username.value = "";
        email.value = "";
        password.value = "";

        document.getElementById("chk").checked = false; // Switch to login view
      } catch (error) {
        alert("❌ Signup failed: " + error.message);
      }
    });

    // Login
    document.getElementById("login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        alert("✅ Logged in as " + (user.displayName || user.email));
        window.location.href = "front.html"; // redirect page
      } catch (error) {
        alert("❌ Login failed: " + error.message);
      }
    });