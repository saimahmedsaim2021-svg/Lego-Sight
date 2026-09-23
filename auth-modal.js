import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut,
    sendPasswordResetEmail, deleteUser 
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
// ১. স্টাইল ইনজেকশন (লোডার + প্রোফাইল মডাল + টোস্ট)
// =========================================================
const masterStyles = `
<style id="legoMasterStyles">
    .page-loader-overlay {
        position: fixed; inset: 0; background: #0c0c0c;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        z-index: 9999999; transition: opacity 0.35s ease, visibility 0.35s ease;
    }
    .page-loader-overlay.fade-out { opacity: 0; visibility: hidden; pointer-events: none; }
    .loader-box { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .loader-logo-pulse {
        width: 65px; height: 65px; border-radius: 50%; border: 2px solid #0099ff;
        box-shadow: 0 0 25px rgba(0, 153, 255, 0.7); animation: logoPulse 0.8s infinite alternate ease-in-out;
    }
    .loader-spinner-ring {
        width: 32px; height: 32px; border: 3px solid rgba(255, 255, 255, 0.08);
        border-top-color: #00d2ff; border-right-color: #ff0000; border-radius: 50%;
        animation: spinRing 0.65s linear infinite;
    }
    @keyframes spinRing { to { transform: rotate(360deg); } }
    @keyframes logoPulse {
        from { transform: scale(0.94); box-shadow: 0 0 15px rgba(0, 153, 255, 0.4); }
        to { transform: scale(1.06); box-shadow: 0 0 30px rgba(0, 210, 255, 0.9); }
    }

    .welcome-toast {
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(50px);
        background: rgba(22, 22, 22, 0.95); border: 1px solid #00d2ff; color: white;
        padding: 14px 25px; border-radius: 30px; box-shadow: 0 10px 30px rgba(0, 210, 255, 0.3);
        font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 10px;
        z-index: 999999; opacity: 0; pointer-events: none; transition: all 0.4s ease;
    }
    .welcome-toast.show { transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: auto; }

    #userProfile { cursor: pointer; transition: 0.25s; }
    #userProfile:hover { border-color: #00d2ff; }

    .acc-modal-box {
        background: linear-gradient(145deg, #1c1c1c, #131313); border: 1px solid #333;
        padding: 30px 25px; border-radius: 14px; width: 380px; max-width: 90%;
        text-align: center; position: relative; box-shadow: 0 15px 40px rgba(0,0,0,0.8);
    }
    .acc-avatar {
        width: 60px; height: 60px; border-radius: 50%; background: #ff0000;
        color: white; font-size: 24px; font-weight: bold; display: flex;
        align-items: center; justify-content: center; margin: 0 auto 12px auto;
        border: 2px solid #00d2ff; box-shadow: 0 0 15px rgba(0, 210, 255, 0.4);
    }
    .sub-tier-badge {
        display: inline-flex; align-items: center; gap: 6px; background: #222;
        color: #00d2ff; border: 1px solid rgba(0, 210, 255, 0.4); padding: 5px 14px;
        border-radius: 20px; font-size: 12px; font-weight: bold; margin: 12px 0 20px 0;
    }
    .btn-acc-action {
        width: 100%; padding: 11px; border-radius: 8px; font-size: 14px; font-weight: bold;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        gap: 8px; margin-bottom: 10px; border: none; transition: 0.25s;
    }
    .btn-sub-upgrade { background: linear-gradient(135deg, #0077ff, #00d2ff); color: #fff; }
    .btn-pass-change { background: #262626; color: #ddd; border: 1px solid #444; }
    .btn-pass-change:hover { background: #333; color: #fff; border-color: #00d2ff; }
    .btn-acc-logout { background: #ff0000; color: #fff; }
    .btn-acc-logout:hover { background: #cc0000; }
    .btn-acc-delete { background: transparent; color: #ff5555; border: 1px solid #441111; margin-top: 15px; }
    .btn-acc-delete:hover { background: #330000; border-color: #ff0000; }
</style>
`;

// =========================================================
// ২. HTML ইনজেকশন
// =========================================================
const componentsHTML = `
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

<!-- ১. লগইন / সাইন-আপ পপআপ মডাল -->
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
</div>

<!-- ২. ইউজার প্রোফাইল ও সেটিংস মডাল -->
<div id="userAccountModal" class="modal-overlay">
    <div class="acc-modal-box">
        <button class="close-btn" id="closeAccModalBtn">&times;</button>
        <div class="acc-avatar" id="accAvatarLetter">U</div>
        <h3 id="accDisplayName" style="font-size: 18px; color: #fff;">User Name</h3>
        <p id="accDisplayEmail" style="font-size: 13px; color: #888;">user@gmail.com</p>

        <div class="sub-tier-badge">
            <i class="fa-solid fa-crown"></i> <span id="userSubTier">Free Member</span>
        </div>

        <button class="btn-acc-action btn-sub-upgrade" onclick="alert('VIP Subscription is coming soon! 💎')">
            <i class="fa-solid fa-gem"></i> Upgrade to VIP
        </button>

        <button class="btn-acc-action btn-pass-change" id="changePasswordBtn">
            <i class="fa-solid fa-key"></i> Reset / Change Password
        </button>

        <button class="btn-acc-action btn-acc-logout" id="accountLogoutBtn">
            <i class="fa-solid fa-right-from-bracket"></i> Log Out
        </button>

        <button class="btn-acc-action btn-acc-delete" id="deleteAccountPermanentBtn">
            <i class="fa-solid fa-trash-can"></i> Delete Account Permanently
        </button>
    </div>
</div>
`;

document.head.insertAdjacentHTML("beforeend", masterStyles);
document.body.insertAdjacentHTML("beforeend", componentsHTML);

const loaderEl = document.getElementById("pageLoader");
const toastEl = document.getElementById("welcomeToast");
const toastMsg = document.getElementById("toastMsg");

function showLoader() { if (loaderEl) loaderEl.classList.remove("fade-out"); }
function hideLoader(delay = 500) { if (loaderEl) setTimeout(() => loaderEl.classList.add("fade-out"), delay); }

function showToast(text) {
    toastMsg.innerHTML = text;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 3500);
}

// পেজ ওপেন লোডার
if (document.readyState === "complete") { hideLoader(); } 
else { window.addEventListener("load", () => hideLoader()); setTimeout(() => hideLoader(), 900); }

// লিংকে ক্লিকে লোডার
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
// ৩. ফায়ারস্টোরে ইউজার প্রোফাইল বাধ্যতামূলক সেভ করার ফাংশন
// =========================================================
async function saveUserToFirestore(user, customName = null) {
    try {
        const userName = customName || user.displayName || user.email.split("@")[0];
        
        // 🌟 ফায়ারস্টোরের 'users' কালেকশনে সরাসরি রাইট হবে 🌟
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: userName,
            email: user.email,
            subscription: "free",
            lastLogin: new Date()
        }, { merge: true });

        console.log("✅ User successfully saved in Firestore 'users' collection!");
    } catch (err) {
        console.error("❌ Firestore Save Error:", err);
        alert("Firestore Permission Error! Please update Firestore Rules: " + err.message);
    }
}

// =========================================================
// ৪. মডাল ওপেন / ক্লোজ ও সুইচিং
// =========================================================
const loginModal = document.getElementById("loginModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const userAccountModal = document.getElementById("userAccountModal");
const closeAccModalBtn = document.getElementById("closeAccModalBtn");

document.addEventListener("click", (e) => {
    if (e.target && (e.target.id === "headerLoginBtn" || e.target.classList.contains("login-btn"))) {
        e.preventDefault();
        showLoader();
        setTimeout(() => { hideLoader(100); loginModal.classList.add("active"); }, 200);
    }
});

closeModalBtn.onclick = () => loginModal.classList.remove("active");
closeAccModalBtn.onclick = () => userAccountModal.classList.remove("active");

document.addEventListener("click", (e) => {
    const profileSection = e.target.closest("#userProfile");
    if (profileSection && !e.target.closest("#logoutBtn")) {
        userAccountModal.classList.add("active");
    }
});

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

// =========================================================
// ৫. ইমেইল সাইন-আপ ও লগইন হ্যান্ডলার
// =========================================================
document.getElementById("authForm").onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value.trim();
    const name = document.getElementById("nameInput").value.trim();

    showLoader();
    try {
        let finalName = name;
        if (isSignUpMode) {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCred.user, { displayName: name });
            // ফায়ারস্টোরে নিশ্চিত সেভ
            await saveUserToFirestore(userCred.user, name);
            finalName = name;
        } else {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            finalName = userCred.user.displayName || userCred.user.email.split("@")[0];
            // ফায়ারস্টোরে নিশ্চিত সেভ
            await saveUserToFirestore(userCred.user);
        }

        setTimeout(() => {
            loginModal.classList.remove("active");
            document.getElementById("authForm").reset();
            hideLoader(150);
            showToast(`Welcome, <span style="color: #00d2ff;">${finalName}</span>! 🎉`);
        }, 500);

    } catch (err) {
        hideLoader(100);
        alert("Authentication Error: " + err.message);
    }
};

// =========================================================
// ৬. গুগল লগইন হ্যান্ডলার
// =========================================================
document.getElementById("googleLoginBtn").onclick = async () => {
    showLoader();
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // 🌟 গুগলের ইউজারকে ফায়ারস্টোরে নিশ্চিত সেভ করা 🌟
        await saveUserToFirestore(user);

        const displayName = user.displayName || user.email.split("@")[0];

        setTimeout(() => {
            loginModal.classList.remove("active");
            hideLoader(150);
            showToast(`Welcome, <span style="color: #00d2ff;">${displayName}</span>! 🎉`);
        }, 500);

    } catch (err) {
        hideLoader(100);
        if (err.code !== "auth/popup-closed-by-user") {
            alert("Google Sign-In Error: " + err.message);
        }
    }
};

// =========================================================
// ৭. রিয়েল-টাইম প্রোফাইল সিঙ্ক ও অটো ফায়ারস্টোর চেক
// =========================================================
onAuthStateChanged(auth, async (user) => {
    const loginBtn = document.getElementById("headerLoginBtn");
    const userProfile = document.getElementById("userProfile");
    const userNameDisplay = document.getElementById("userNameDisplay");

    if (user) {
        if (loginBtn) loginBtn.classList.add("hidden");
        if (userProfile) {
            userProfile.classList.remove("hidden");
            const name = user.displayName || user.email.split("@")[0];
            if (userNameDisplay) userNameDisplay.innerText = name;

            document.getElementById("accDisplayName").innerText = name;
            document.getElementById("accDisplayEmail").innerText = user.email;
            document.getElementById("accAvatarLetter").innerText = name.charAt(0).toUpperCase();
        }

        // ব্রাউজারে আগে থেকে লগইন থাকলে ফায়ারস্টোর ডক আরেকবার নিশ্চিত করা
        await saveUserToFirestore(user);

    } else {
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (userProfile) userProfile.classList.add("hidden");
    }
});

// =========================================================
// ৮. নিশ্চিত লগআউট
// =========================================================
async function executeLogout() {
    userAccountModal.classList.remove("active");
    showLoader();
    try {
        await signOut(auth);
        sessionStorage.clear();
        setTimeout(() => {
            window.location.reload();
        }, 400);
    } catch (err) {
        hideLoader(100);
        alert("Logout Error: " + err.message);
    }
}

document.getElementById("accountLogoutBtn").onclick = executeLogout;

document.addEventListener("click", (e) => {
    if (e.target && (e.target.id === "logoutBtn" || e.target.closest("#logoutBtn"))) {
        e.preventDefault();
        e.stopPropagation();
        executeLogout();
    }
});

// =========================================================
// ৯. পাসওয়ার্ড রিসেট
// =========================================================
document.getElementById("changePasswordBtn").onclick = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    try {
        await sendPasswordResetEmail(auth, user.email);
        alert(`A password reset link has been sent to:\n${user.email}`);
    } catch (err) {
        alert("Reset Error: " + err.message);
    }
};

// =========================================================
// ১০. একাউন্ট চিরতরে ডিলিট (ফায়ারস্টোর + Auth)
// =========================================================
document.getElementById("deleteAccountPermanentBtn").onclick = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (confirm("⚠️ Are you sure you want to delete your account permanently?\nYour data will be completely deleted from Firestore.")) {
        userAccountModal.classList.remove("active");
        showLoader();
        try {
            await deleteDoc(doc(db, "users", user.uid));
            await deleteUser(user);
            alert("Account deleted successfully!");
            window.location.reload();
        } catch (err) {
            hideLoader(100);
            if (err.code === "auth/requires-recent-login") {
                alert("Security Alert: Please log out and log in again once, then delete account.");
            } else {
                alert("Delete Error: " + err.message);
            }
        }
    }
};

