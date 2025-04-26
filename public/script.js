// Modal toggling (login/register)
const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const iconClose = document.querySelector('.icon-close');

registerLink?.addEventListener('click', () => wrapper.classList.add('active'));
loginLink?.addEventListener('click', () => wrapper.classList.remove('active'));
iconClose?.addEventListener('click', () => wrapper.classList.remove('active'));

// Firebase v10+ SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAWk0KJevizzACk-dscsTsBJ1kXuXDsTbI",
  authDomain: "lost-and-found-website-51b6d.firebaseapp.com",
  projectId: "lost-and-found-website-51b6d",
  storageBucket: "lost-and-found-website-51b6d.appspot.com",
  messagingSenderId: "586463765425",
  appId: "1:586463765425:web:14d5c78458206bb651d390"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Google Sign-In
function signInWithGoogle() {
  console.log("Google Sign-In initiated.");
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(async (result) => {
      const user = result.user;
      console.log("Google Sign-In successful:", user.email);

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: user.displayName || "Anonymous",
        createdAt: new Date()
      });

      alert("Google Sign-In successful!");
      setTimeout(() => window.location.href = "./home.html", 100);
    })
    .catch((error) => {
      console.error("Google Sign-In failed:", error);
      alert(`Google Sign-In failed: ${error.message}`);
    });
}

// Register Google login button
document.addEventListener('DOMContentLoaded', () => {
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  googleLoginBtn?.addEventListener('click', signInWithGoogle);
});

// Email/Password Registration
const registerForm = document.getElementById("registerForm");
registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;
  const username = e.target.username.value;

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName: username || "Anonymous",
      createdAt: new Date()
    });

    alert("Registration successful!");
    setTimeout(() => window.location.href = "./home.html", 100);
  } catch (error) {
    console.error("Registration failed:", error);
    alert(`Registration failed: ${error.message}`);
  }
});

// Email/Password Login
const loginForm = document.getElementById("loginForm");
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;

    alert(`Welcome back, ${user.email}`);
    setTimeout(() => window.location.href = "./home.html", 100);
  } catch (error) {
    console.error("Login failed:", error);
    alert(`Login failed: ${error.message}`);
  }
});

// Monitor Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log(`Auth state: Logged in as ${user.email}`);

    const logoutBtn = document.getElementById("logout-button");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "./index.html";
      });
    }
  } else {
    console.log("Auth state: Not logged in");
  }
});

// Report a Lost Item
const reportForm = document.getElementById("reportForm");
reportForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const itemName = e.target.itemName.value;
  const itemDescription = e.target.itemDescription.value;
  const itemImage = e.target.itemImage.files[0];

  try {
    if (!itemImage) throw new Error("No image file selected.");
    const storageRef = ref(storage, `lost_items/${itemImage.name}`);
    await uploadBytes(storageRef, itemImage);

    const imageURL = await getDownloadURL(storageRef);

    const currentUser = auth.currentUser?.email || "Anonymous";

    await addDoc(collection(db, "lost_items"), {
      title: itemName,
      description: itemDescription,
      imageURL,
      reporter: currentUser,
      claimedBy: null,
      createdAt: new Date()
    });

    alert("Lost item reported successfully!");
    e.target.reset();
    window.location.href = "./home.html";

  } catch (error) {
    console.error("Failed to report lost item:", error);
    alert(`Failed to report lost item: ${error.message}`);
  }
});

// Load Lost Items
async function loadLostItems() {
  const container = document.getElementById("lost-items-container");
  if (!container) return;

  try {
    const snapshot = await getDocs(collection(db, "lost_items"));
    container.innerHTML = ""; // Clear container before adding items

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <img src="${data.imageURL}" alt="Lost item image" />
        <h3>${data.title}</h3>
        <p>${data.description}</p>
        <small><strong>Reported by:</strong> ${data.reporter}</small>
      `;
      container.appendChild(card);
    });

  } catch (error) {
    console.error("Error loading lost items:", error);
    alert("Failed to load lost items.");
  }
}

window.addEventListener("DOMContentLoaded", loadLostItems);