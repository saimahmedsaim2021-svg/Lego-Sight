import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ⚠️ আপনার ফায়ারবেস কনফিগ এখানে বসাবেন
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

// ----------------------------------------------------
// ১. লগইন / সাইন-আপ সিস্টেম
// ----------------------------------------------------
const loginModal = document.getElementById("loginModal");
const headerLoginBtn = document.getElementById("headerLoginBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const userProfile = document.getElementById("userProfile");
const userNameDisplay = document.getElementById("userNameDisplay");
const logoutBtn = document.getElementById("logoutBtn");

if(headerLoginBtn) headerLoginBtn.addEventListener("click", () => loginModal.classList.add("active"));
if(closeModalBtn) closeModalBtn.addEventListener("click", () => loginModal.classList.remove("active"));

const authForm = document.getElementById("authForm");
let isSignUpMode = false;

if(document.getElementById("toggleAuthMode")) {
    document.getElementById("toggleAuthMode").addEventListener("click", (e) => {
        e.preventDefault();
        isSignUpMode = !isSignUpMode;
        const nameInput = document.getElementById("nameInput");
        if (isSignUpMode) {
            document.getElementById("modalTitle").innerHTML = `Join <span class="highlight">Lego Sight</span>`;
            nameInput.classList.remove("hidden"); 
            nameInput.required = true;
            document.getElementById("authSubmitBtn").innerText = "Sign Up";
            e.target.innerText = "Sign In";
            document.getElementById("toggleText").innerText = "Already have an account? ";
        } else {
            document.getElementById("modalTitle").innerHTML = `Sign In to <span class="highlight">Lego Sight</span>`;
            nameInput.classList.add("hidden"); 
            nameInput.required = false;
            document.getElementById("authSubmitBtn").innerText = "Sign In";
            e.target.innerText = "Sign Up";
            document.getElementById("toggleText").innerText = "Don't have an account? ";
        }
    });
}

if(authForm) {
    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("emailInput").value;
        const password = document.getElementById("passwordInput").value;
        const name = document.getElementById("nameInput").value;

        try {
            if (isSignUpMode) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name });
                await setDoc(doc(db, "users", userCredential.user.uid), { uid: userCredential.user.uid, name: name, email: email });
                alert("Account created successfully!");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            loginModal.classList.remove("active");
            authForm.reset();
        } catch (error) {
            alert("Error: " + error.message);
        }
    });
}

if(document.getElementById("googleLoginBtn")) {
    document.getElementById("googleLoginBtn").addEventListener("click", async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            await setDoc(doc(db, "users", result.user.uid), { uid: result.user.uid, name: result.user.displayName, email: result.user.email }, { merge: true });
            loginModal.classList.remove("active");
        } catch (error) {
            alert("Waiting for Firebase config...");
        }
    });
}

onAuthStateChanged(auth, (user) => {
    if (user && headerLoginBtn) {
        headerLoginBtn.classList.add("hidden");
        userProfile.classList.remove("hidden");
        userNameDisplay.innerText = user.displayName || user.email.split("@")[0];
    } else if(headerLoginBtn) {
        headerLoginBtn.classList.remove("hidden");
        userProfile.classList.add("hidden");
    }
});

if(logoutBtn) {
    logoutBtn.addEventListener("click", () => signOut(auth));
}

// ----------------------------------------------------
// ২. ফায়ারস্টোর ডাটা ফেচিং (Banner, Footer, Videos)
// ----------------------------------------------------
// ----------------------------------------------------
// ২. ফায়ারস্টোর থেকে ডাইনামিক ব্যানার ও লাইভ লিংক আনা
// ----------------------------------------------------
async function loadBannerData() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "banner"));
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // ১. টাইটেল ও সাবটাইটেল বসানো
            document.getElementById("bannerTitle").innerText = data.title || "Live Match"; 
            document.getElementById("bannerSubtitle").innerText = data.subtitle || "";
            document.getElementById("bannerBackground").style.backgroundImage = `url('${data.imageUrl}')`;
            
            // ২. বাটনের নাম যদি এডমিন বদলাতে চায় (যেমন: Play Now বা Watch Live)
            if (data.btnText) {
                document.getElementById("bannerBtnText").innerText = data.btnText;
            }

            // ৩. 🌟 অ্যাডমিনের দেওয়া ভিডিও লিংক দিয়ে watch.html এ পাঠানো 🌟
            const watchBtn = document.getElementById("bannerWatchBtn");
            if (data.videoLink) {
                watchBtn.href = `watch.html?src=${encodeURIComponent(data.videoLink)}&title=${encodeURIComponent(data.title)}&cat=${encodeURIComponent(data.category || 'Live')}`;
            } else {
                watchBtn.href = "#";
            }
        }
    } catch (e) {
        console.log("Waiting for Admin Banner Data...");
    }
}

async function loadFooterData() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "contact"));
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById("footerPhone").innerText = data.phone || "";
            document.getElementById("footerWhatsapp").innerText = data.whatsapp ? `WhatsApp: ${data.whatsapp}` : "";
            document.getElementById("footerEmail").innerText = data.email || "";
        }
    } catch (e) {
        console.log("Waiting for Admin Contact Data...");
    }
}

// ----------------------------------------------------
// ৩. হোমপেজে ভিডিও লোড করা (সরাসরি watch.html এ লিংক করা)
// ----------------------------------------------------
async function loadVideos(categoryFilter = "All") {
    const videoGrid = document.getElementById("videoGrid");
    if(!videoGrid) return;
    
    videoGrid.innerHTML = `<p style="color: #aaa; text-align: center; width: 100%;">Loading videos...</p>`;
    
    try {
        const querySnapshot = await getDocs(collection(db, "videos"));
        videoGrid.innerHTML = ""; 
        let videoCount = 0;

        querySnapshot.forEach((docSnap) => {
            const video = docSnap.data();
            let showVideo = false;

            if (categoryFilter === "All") showVideo = true;
            else if (categoryFilter === "Live" && video.isLive === true) showVideo = true;
            else if (categoryFilter === "Sports" && (video.category === "Football" || video.category === "Cricket")) showVideo = true;
            else if (video.category === categoryFilter) showVideo = true;

            if (showVideo) {
                videoCount++;
                // 🌟 এই যে দেখুন: এখন ক্লিক করলে সরাসরি watch.html পেজে ওই ভিডিওটির ফায়ারস্টোর আইডি (ID) সহ চলে যাবে 🌟
                videoGrid.innerHTML += `
                    <a href="watch.html?id=${docSnap.id}" class="video-card">
                        <div class="thumbnail">
                            <img src="${video.thumbnailUrl}" alt="Thumbnail">
                            ${video.isLive ? '<span class="live-badge">LIVE</span>' : ''}
                        </div>
                        <div class="video-info">
                            <h3>${video.title}</h3>
                            <p>${video.category}</p>
                        </div>
                    </a>
                `;
            }
        });

        if (videoCount === 0) videoGrid.innerHTML = `<p style="color: #ff0000; text-align: center; width: 100%;">No videos available for ${categoryFilter}.</p>`;
    } catch (error) {
        videoGrid.innerHTML = `<p style="color: #ff0000; text-align: center; width: 100%;">Waiting for Firebase to connect...</p>`;
    }
}
// ----------------------------------------------------
// ৩. পেজ লোড ও রাউটিং
// ----------------------------------------------------
window.onload = () => {
    const pageType = document.body.getAttribute("data-page");

    if (pageType === "home") {
        loadBannerData();
        loadFooterData();
        loadVideos("All");
    } else if (pageType === "live") {
        loadVideos("Live");
    } else if (pageType === "sports") {
        loadVideos("Sports");
    }

    // Home Page Category Buttons Filter
    const categoryButtons = document.querySelectorAll(".cat-btn");
    if(categoryButtons.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener("click", (e) => {
                categoryButtons.forEach(btn => btn.classList.remove("active"));
                e.currentTarget.classList.add("active");
                const selectedCategory = e.currentTarget.getAttribute("data-category");
                loadVideos(selectedCategory);
            });
        });
    }
};