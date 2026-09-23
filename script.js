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
