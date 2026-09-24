import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, collection, getDocs, 
    addDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, query, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ⚠️ আপনার ফায়ারবেস কনফিগ
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

// DOM Elements
const ytPlayer = document.getElementById("ytPlayer");
const videoPlayer = document.getElementById("videoPlayer");
const titleEl = document.getElementById("currentVideoTitle");
const catEl = document.getElementById("videoCategory");
const statusBadge = document.getElementById("statusBadge");

const likeBtn = document.getElementById("likeBtn");
const likeCount = document.getElementById("likeCount");
const subscribeBtn = document.getElementById("subscribeBtn");
const subBtnText = document.getElementById("subBtnText");

const commentInput = document.getElementById("commentInput");
const submitCommentBtn = document.getElementById("submitCommentBtn");
const commentsList = document.getElementById("commentsList");
const commentCount = document.getElementById("commentCount");
const loginModal = document.getElementById("loginModal");
const closeModalBtn = document.getElementById("closeModalBtn");

// URL থেকে প্যারামিটার রিড করা
const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('id');       // ফায়ারস্টোর ডক আইডি
const directSrc = urlParams.get('src');   // সরাসরি MP4 বা YouTube লিংক
const ytParam = urlParams.get('yt');       // সরাসরি YouTube আইডি

let currentUser = null;
let currentVideoData = null;

// ----------------------------------------------------
// ১. ইউজার অথেন্টিকেশন ও লগইন লজিক
// ----------------------------------------------------
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const headerLoginBtn = document.getElementById("headerLoginBtn");
    const userProfile = document.getElementById("userProfile");
    const userNameDisplay = document.getElementById("userNameDisplay");

    if (user) {
        if (headerLoginBtn) headerLoginBtn.classList.add("hidden");
        if (userProfile) userProfile.classList.remove("hidden");
        if (userNameDisplay) userNameDisplay.innerText = user.displayName || user.email.split("@")[0];
    } else {
        if (headerLoginBtn) headerLoginBtn.classList.remove("hidden");
        if (userProfile) userProfile.classList.add("hidden");
    }

    // ইউজার পরিবর্তনের সাথে সাথে লাইক বাটন স্টেট রিফ্রেশ
    updateLikeButtonUI();
});

// লগইন নিশ্চিত করার হেল্পার ফাংশন
function requireLogin(callback) {
    if (!currentUser) {
        loginModal.classList.add("active");
    } else {
        callback(currentUser);
    }
}

if (closeModalBtn) {
    closeModalBtn.onclick = () => loginModal.classList.remove("active");
}

// লগআউট
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.onclick = () => signOut(auth);
}

// ----------------------------------------------------
// ২. স্মার্ট ভিডিও প্লেয়ার লোডার (YouTube বা MP4)
// ----------------------------------------------------
function getYouTubeId(url) {
    if (!url) return null;
    if (url.length === 11 && !url.includes('/') && !url.includes('.')) return url;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
}

// =========================================================
// 🎬 স্মার্ট ভিডিও প্লেয়ার ফাংশন (Kick, YouTube ও MP4)
// =========================================================
function playVideo(videoSourceUrl, isLiveMatch = false, videoTitle = "Match Video", category = "Sports") {
    titleEl.innerText = videoTitle;
    catEl.innerText = category;

    // লাইভ হলে LIVE ব্যাজ, না হলে Video ব্যাজ
    if (isLiveMatch) {
        statusBadge.className = "live-tag";
        statusBadge.innerText = "🔴 LIVE";
    } else {
        statusBadge.className = "vod-tag";
        statusBadge.innerText = "🎬 Match Video";
    }

    const ytId = getYouTubeId(videoSourceUrl);

    // =======================================================
    // 👉 ১. ঠিক এইখানে Kick.com এর কোডটি বসবে 👈
    // =======================================================
    if (videoSourceUrl && videoSourceUrl.includes("kick.com")) {
        ytPlayer.src = videoSourceUrl;
        ytPlayer.classList.remove("hidden");
        videoPlayer.classList.add("hidden");
    } 
    // 👉 ২. যদি ইউটিউব লিংক হয়
    else if (ytId) {
        ytPlayer.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
        ytPlayer.classList.remove("hidden");
        videoPlayer.classList.add("hidden");
    } 
    // 👉 ৩. যদি সাধারণ MP4 ভিডিও হয়
    else if (videoSourceUrl) {
        videoPlayer.src = videoSourceUrl;
        videoPlayer.load();
        videoPlayer.play().catch(() => console.log("Click play to start"));
        videoPlayer.classList.remove("hidden");
        ytPlayer.classList.add("hidden");
    }
}
// ----------------------------------------------------
// ৩. ফায়ারস্টোর থেকে ভিডিও রিয়েল-টাইমে লোড করা
// ----------------------------------------------------
if (videoId) {
    // ফায়ারস্টোর থেকে রিয়েল-টাইম তথ্য শুনবে (onSnapshot)
    onSnapshot(doc(db, "videos", videoId), (docSnap) => {
        if (docSnap.exists()) {
            currentVideoData = docSnap.data();
            playVideo(
                currentVideoData.videoLink, 
                currentVideoData.isLive || false, 
                currentVideoData.title, 
                currentVideoData.category
            );
            
            // রিয়েলটাইম লাইক কাউন্ট
            const likesArr = currentVideoData.likedBy || [];
            likeCount.innerText = likesArr.length;
            updateLikeButtonUI();

            // রিলেটেড ভিডিও লোড করা
            loadRelatedVideos(currentVideoData.category, videoId);
        }
    });

    // কমেন্ট রিয়েলটাইমে লোড করা
    listenToComments(videoId);
} else {
    // সরাসরি প্যারামিটার আসলে (টেস্টিংয়ের জন্য)
    const activeUrl = ytParam ? `https://www.youtube.com/watch?v=${ytParam}` : directSrc;
    playVideo(activeUrl, false, urlParams.get('title') || "Sports Match", urlParams.get('cat') || "Football");
}

// ----------------------------------------------------
// ৪. রিয়েলটাইম লাইক সিস্টেম (লগইন আবশ্যক)
// ----------------------------------------------------
function updateLikeButtonUI() {
    if (currentVideoData && currentUser) {
        const likedBy = currentVideoData.likedBy || [];
        if (likedBy.includes(currentUser.uid)) {
            likeBtn.classList.add("active");
        } else {
            likeBtn.classList.remove("active");
        }
    } else {
        likeBtn.classList.remove("active");
    }
}

likeBtn.onclick = () => {
    requireLogin(async (user) => {
        if (!videoId || !currentVideoData) return;

        const videoRef = doc(db, "videos", videoId);
        const likedBy = currentVideoData.likedBy || [];

        if (likedBy.includes(user.uid)) {
            // লাইক তোলা (Unlike)
            await updateDoc(videoRef, { likedBy: arrayRemove(user.uid) });
        } else {
            // নতুন লাইক দেওয়া (Like)
            await updateDoc(videoRef, { likedBy: arrayUnion(user.uid) });
        }
    });
};

// ----------------------------------------------------
// ৫. রিয়েলটাইম সাবস্ক্রাইব বাটন (লগইন আবশ্যক)
// ----------------------------------------------------
let isSubscribed = false;
subscribeBtn.onclick = () => {
    requireLogin((user) => {
        isSubscribed = !isSubscribed;
        if (isSubscribed) {
            subscribeBtn.classList.add("subscribed");
            subBtnText.innerText = "Subscribed";
        } else {
            subscribeBtn.classList.remove("subscribed");
            subBtnText.innerText = "Subscribe";
        }
    });
};

// ----------------------------------------------------
// ৬. রিয়েলটাইম কমেন্ট সিস্টেম (লগইন আবশ্যক)
// ----------------------------------------------------
function listenToComments(vId) {
    const q = query(collection(db, "videos", vId, "comments"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        commentCount.innerText = snapshot.size;
        commentsList.innerHTML = "";

        if (snapshot.empty) {
            commentsList.innerHTML = `<p style="color: #666; font-size: 13px;">No comments yet. Be the first to comment!</p>`;
            return;
        }

        snapshot.forEach((docItem) => {
            const data = docItem.data();
            const commentDiv = document.createElement("div");
            commentDiv.className = "single-comment";
            commentDiv.innerHTML = `
                <i class="fa-solid fa-circle-user" style="color: #ff0000; font-size: 22px;"></i>
                <div>
                    <h5>${data.userName}</h5>
                    <p>${data.text}</p>
                </div>
            `;
            commentsList.appendChild(commentDiv);
        });
    });
}

submitCommentBtn.onclick = () => {
    requireLogin(async (user) => {
        const text = commentInput.value.trim();
        if (!text || !videoId) return;

        await addDoc(collection(db, "videos", videoId, "comments"), {
            userId: user.uid,
            userName: user.displayName || user.email.split("@")[0],
            text: text,
            createdAt: serverTimestamp()
        });

        commentInput.value = "";
    });
};

// ----------------------------------------------------
// ৭. রিয়েলটাইম সম্পর্কিত ভিডিও (ফায়ারস্টোর থেকে)
// ----------------------------------------------------
async function loadRelatedVideos(category, currentId) {
    const relatedContainer = document.getElementById("relatedVideosList");
    try {
        const querySnapshot = await getDocs(collection(db, "videos"));
        relatedContainer.innerHTML = "";
        let count = 0;

        querySnapshot.forEach((docItem) => {
            const video = docItem.data();
            if (docItem.id !== currentId && video.category === category) {
                count++;
                // 🌟 সম্পর্কিত ভিডিওতে লাইভ হলে তবেই লাইভ ব্যাজ দেখাবে 🌟
                const badgeHTML = video.isLive 
                    ? `<span class="live-tag" style="position: absolute; top: 6px; left: 6px;">🔴 LIVE</span>` 
                    : ``;

                const card = `
                    <a href="watch.html?id=${docItem.id}" class="related-card" style="position: relative;">
                        <img src="${video.thumbnailUrl}" alt="Thumbnail">
                        ${badgeHTML}
                        <div class="related-info">
                            <h4>${video.title}</h4>
                            <span>${video.category} • ${video.isLive ? 'Live Match' : 'Match Video'}</span>
                        </div>
                    </a>
                `;
                relatedContainer.innerHTML += card;
            }
        });

        if (count === 0) {
            relatedContainer.innerHTML = `<p style="color: #666; font-size: 13px;">No other matches found.</p>`;
        }
    } catch (e) {
        console.error(e);
    }
}

// শেয়ার বাটন
document.getElementById("shareBtn").onclick = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Match link copied to clipboard!");
};

// মডাল সাইন ইন এবং গুগল লগইন হ্যান্ডলার
document.getElementById("googleLoginBtn").onclick = async () => {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        loginModal.classList.remove("active");
    } catch (err) {
        alert("Login failed: " + err.message);
    }
};

document.getElementById("authForm").onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginModal.classList.remove("active");
    } catch (err) {
        alert(err.message);
    }
};
