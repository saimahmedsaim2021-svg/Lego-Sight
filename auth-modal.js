import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🌟 আপনার আসল ফায়ারবেস কনফিগ 🌟
const firebaseConfig = {
    apiKey: "AIzaSyDWugLg2G3Bvo5q6vPxIdGUUdKH1W0NenE",
    authDomain: "lego-sight.firebaseapp.com",
    projectId: "lego-sight",
    storageBucket: "lego-sight.firebasestorage.app",
    messagingSenderId: "417663931445",
    appId: "1:417663931445:web:270748ca31cb2912cb4d7c",
    measurementId: "G-KREWWFSZZ2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =========================================================
// 🚀 ১. সিনেমাটিক লোডার ও ওয়েলকাম টোস্ট স্টাইল ইনজেকশন 🚀
// =========================================================
const loaderStyles = `
<style id="legoLoaderStyle">
    .page-loader-overlay {
        position: fixed;
        inset: 0;
        background: #0c0c0c;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999999;
        transition: opacity 0.35s ease, visibility 0.35s ease;
    }
    .page-loader-overlay.fade-out {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
    }
    .loader-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
    }
    .loader-logo-pulse {
        width: 65px;
        height: 65px;
        border-radius: 50%;
        border: 2px solid #0099ff;
        box-shadow: 0 0 25px rgba(0, 153, 255, 0.7);
        animation: logoPulse 0.8s infinite alternate ease-in-out;
    }
    .loader-spinner-ring {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(255, 255, 255, 0.08);
        border-top-color: #00d2ff;
        border-right-color: #ff0000;
        border-radius: 50%;
        animation: spinRing 0.65s linear infinite;
    }
    @keyframes spinRing { to { transform: rotate(360deg); } }
    @keyframes logoPulse {
        from { transform: scale(0.94); box-shadow: 0 0 15px rgba(0, 153, 255, 0.4); }
        to { transform: scale(1.06); box-shadow: 0 0 30px rgba(0, 210, 255, 0.9); }
    }

    /* 🌟 ওয়েলকাম টোস্ট নোটিফিকেশন 🌟 */
    .welcome-toast {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(50px);
        background: rgba(22, 22, 22, 0.95);
        border: 1px solid #00d2ff;
        color: white;
        padding: 14px 25px;
        border-radius: 30px;
        box-shadow: 0 10px 30px rgba(0, 210, 255, 0.3);
        font-size: 14px;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 999999;
        opacity: 0;
        pointer-events: none;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .welcome-toast.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
        pointer-events: auto;
    }
</style>
`;

const loaderHTML = `
<div id="pageLoader" class="page-loader-overlay">
    <div class="loader-box">
        <img src="logo.png" alt="Lego Sight" class="loader-logo-pulse" onerror="this.style.display='none'">
        <div class="loader-spinner-ring"></div>
    </div>
</div>
<div id="welcomeToast" class="welcome-toast">
    <i class="fa-solid fa-circle-check" style="color: #00d2ff; font-size: 18px;"></i>
    <span id="toastMsg">Welcome!</span>
</div>
`;

document.head.insertAdjacentHTML("beforeend", loaderStyles);
document.body.insertAdjacentHTML("afterbegin", loaderHTML);

const loaderEl = document.getElementById("pageLoader");
const toastEl = document.getElementById("welcomeToast");
const toastMsg = document.getElementById("toastMsg");

// লোডার কন্ট্রোল ফাংশন
function showLoader() {
    if (loaderEl) loaderEl.classList.remove("fade-out");
}

function hideLoader(delay = 550) {
    if (loaderEl) {
        setTimeout(() => {
            loaderEl.classList.add("fade-out");
        }, delay);
    }
}

// ওয়েলকাম টোস্ট দেখানোর ফাংশন
function showWelcomeToast(name) {
    toastMsg.innerHTML = `Welcome back, <span style="color: #00d2ff;">${name}</span>! 🎉`;
    toastEl.classList.add("show");
    setTimeout(() => {
        toastEl.classList.remove("show");
    }, 4000);
}

// পেজ ওপেন হওয়ার প্রথম লোডিং
if (document.readyState === "complete") {
    hideLoader();
} else {
    window.addEventListener("load", () => hideLoader());
    setTimeout(() => hideLoader(), 1000);
}

// লিংকে ক্লিক করলে স্মুথ ট্রানজিশন
document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link && link.href) {
        const targetUrl = link.getAttribute("href");
        if (targetUrl && !targetUrl.startsWith("#") && !targetUrl.startsWith("javascript") && !link.target && targetUrl !== "") {
            showLoader();
        }
    }
});

// =========================================================
// 🌟 ২. লগইন ও সাইন-আপ পপআপ মডাল অটো-ইনজেকশন 🌟
// =========================================================
const modalHTML = `
<div id="loginModal" class="modal-overlay">
    <div class="modal-box">
        <button class="close-btn" id="closeModalBtn">&times;</button>
        <div class="modal-header">
            <h2 id="modalTitle">Sign In to <span class="highlight">Lego Sight</span></h2>
            <p id="modalSubtitle">Access live sports, chat & premium content.</p>
        </div>
        <div class="modal-body">
            <form id="authForm">
                <input type="text" id="nameInput" placeholder="Full Name" class="auth-input hidden">
                <input type="email" id="emailInput" placeholder="Email Address" class="auth-input" required>
                <input type="password" id="passwordInput" placeholder="Password" class="auth-input" required>
                <button type="submit" class="submit-btn" id="authSubmitBtn">Sign In</button>
            </form>
            <div class="toggle-auth" style="margin-top: 15px; font-size: 13px; color: #aaa;">
                <span id="toggleText">Don't have an account? </span>
                <a href="#" id="toggleAuthMode" style="color: #ff0000; text-decoration: none; font-weight: bold;">Sign Up</a>
            </div>
            <div class="divider">or</div>
            <button class="google-btn" id="googleLoginBtn" type="button">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google">
                Continue with Google
            </button>
        </div>
    </div>
</div>`;

if (!document.getElementById("loginModal")) {
    document.body.insertAdjacentHTML("beforeend", modalHTML);
}

// --------------------------------------------------------
// ৩. লগইন বাটনে ক্লিক ও সুইচিং লজিক
// --------------------------------------------------------
const loginModal = document.getElementById("loginModal");
const closeModalBtn = document.getElementById("closeModalBtn");

// 🌟 হেডারের Login বাটনে চাপ দিলে হালকা লোডিং হয়ে পপআপ আসবে 🌟
document.addEventListener("click", (e) => {
    if (e.target && (e.target.id === "headerLoginBtn" || e.target.classList.contains("login-btn"))) {
        e.preventDefault();
        showLoader();
        setTimeout(() => {
            hideLoader(150);
            loginModal.classList.add("active");
        }, 300);
    }
});

closeModalBtn.onclick = () => loginModal.classList.remove("active");

const toggleLink = document.getElementById("toggleAuthMode");
let isSignUpMode = false;

toggleLink.onclick = (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    const nameField = document.getElementById("nameInput");
    const submitBtn = document.getElementById("authSubmitBtn");
    const title = document.getElementById("modalTitle");
    const toggleTxt = document.getElementById("toggleText");

    if (isSignUpMode) {
        title.innerHTML = `Join <span class="highlight">Lego Sight</span>`;
        nameField.classList.remove("hidden");
        nameField.required = true;
        submitBtn.innerText = "Sign Up";
        toggleLink.innerText = "Sign In";
        toggleTxt.innerText = "Already have an account? ";
    } else {
        title.innerHTML = `Sign In to <span class="highlight">Lego Sight</span>`;
        nameField.classList.add("hidden");
        nameField.required = false;
        submitBtn.innerText = "Sign In";
        toggleLink.innerText = "Sign Up";
        toggleTxt.innerText = "Don't have an account? ";
    }
};

// --------------------------------------------------------
// 🌟 ৪. ইমেইল/পাসওয়ার্ড দিয়ে সাইন-আপ বা লগইন (লোডার সহ) 🌟
// --------------------------------------------------------
document.getElementById("authForm").onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value.trim();
    const name = document.getElementById("nameInput").value.trim();

    // সাইন-আপ বা লগইনে ক্লিক করার সাথে সাথে লোডার চালু
    showLoader();

    try {
        let displayName = name;
        if (isSignUpMode) {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                name: name,
                email: email,
                createdAt: new Date()
            }, { merge: true });
            displayName = name;
        } else {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            displayName = userCredential.user.displayName || userCredential.user.email.split("@")[0];
        }

        // সফল হওয়ার পর পপআপ বন্ধ এবং লোডার মিলিয়ে গিয়ে প্রোফাইল শো
        setTimeout(() => {
            loginModal.classList.remove("active");
            document.getElementById("authForm").reset();
            hideLoader(200);
            showWelcomeToast(displayName);
        }, 700);

    } catch (err) {
        hideLoader(100);
        alert("Authentication Error: " + err.message);
    }
};

// --------------------------------------------------------
// 🌟 ৫. গুগল দিয়ে সাইন-আপ বা লগইন (লোডার সহ) 🌟
// --------------------------------------------------------
document.getElementById("googleLoginBtn").onclick = async () => {
    showLoader();
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            createdAt: new Date()
        }, { merge: true });

        const displayName = user.displayName || user.email.split("@")[0];

        // সফল লগইন শেষে লোডার মিলিয়ে প্রোফাইল ফুটে উঠবে
        setTimeout(() => {
            loginModal.classList.remove("active");
            hideLoader(200);
            showWelcomeToast(displayName);
        }, 700);

    } catch (err) {
        hideLoader(100);
        alert("Google Login Error: " + err.message);
    }
};

// --------------------------------------------------------
// ৬. রিয়েল-টাইম প্রোফাইল সিঙ্ক
// --------------------------------------------------------
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById("headerLoginBtn");
    const userProfile = document.getElementById("userProfile");
    const userNameDisplay = document.getElementById("userNameDisplay");

    if (user) {
        if (loginBtn) loginBtn.classList.add("hidden");
        if (userProfile) {
            userProfile.classList.remove("hidden");
            if (userNameDisplay) userNameDisplay.innerText = user.displayName || user.email.split("@")[0];
        }
    } else {
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (userProfile) userProfile.classList.add("hidden");
    }
});

// লগআউট
document.addEventListener("click", (e) => {
    if (e.target && (e.target.id === "logoutBtn" || e.target.closest("#logoutBtn"))) {
        showLoader();
        signOut(auth).then(() => {
            setTimeout(() => {
                hideLoader(200);
            }, 500);
        });
    }
});

// =========================================================
// 🟢 ৭. রিয়েল-টাইম অনলাইন লাইভ ভিজিটর ট্র্যাকার 🟢
// =========================================================
const visitorId = sessionStorage.getItem("lego_visitor_session") || "vis_" + Math.random().toString(36).substring(2, 10);
sessionStorage.setItem("lego_visitor_session", visitorId);

const visitorRef = doc(db, "online_visitors", visitorId);

async function pingOnline() {
    try {
        await setDoc(visitorRef, {
            lastSeen: Date.now(),
            page: window.location.pathname
        }, { merge: true });
    } catch(e) {}
}

pingOnline();
setInterval(pingOnline, 30000);

window.addEventListener("beforeunload", () => {
    deleteDoc(visitorRef);
});