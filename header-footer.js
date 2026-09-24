document.addEventListener("DOMContentLoaded", function () {
    // কোন পেজে আছি তা body ট্যাগ থেকে স্বয়ংক্রিয়ভাবে চিনে নেওয়া
    const currentPage = document.body.getAttribute("data-page") || "home";

    // =========================================================
    // 🌟 ১. মাস্টার হেডার ও সার্চ বার (এক জায়গার কোড) 🌟
    // =========================================================
    const headerHTML = `
    <header class="navbar">
        <div class="logo">
            <a href="index.html">
                <img src="logo.png" alt="Lego Sight" class="site-logo-img" onerror="this.src='https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100';">
                <span class="logo-text">Lego <span>Sight</span></span>
            </a>
        </div>
        
        <!-- যে পেজে আছেন সেটি স্বয়ংক্রিয়ভাবে লাল রঙ হয়ে যাবে -->
        <nav class="nav-links" id="navLinks">
            <a href="index.html" style="${currentPage === 'home' ? 'color: #ff0000; font-weight: bold;' : ''}">Home</a>
            <a href="live.html" style="${currentPage === 'live' ? 'color: #ff0000; font-weight: bold;' : ''}">Live Now</a>
            <a href="sports.html" style="${currentPage === 'sports' ? 'color: #ff0000; font-weight: bold;' : ''}">Sports</a>
            <a href="about.html" style="${currentPage === 'about' ? 'color: #ff0000; font-weight: bold;' : ''}">About</a>
        </nav>
        
        <div class="header-right">
            <div id="authSection">
                <button class="login-btn" id="headerLoginBtn">Login</button>
                <div id="userProfile" class="profile-section hidden">
                    <i class="fa-solid fa-circle-user profile-icon"></i>
                    <span id="userNameDisplay">User</span>
                    <button id="logoutBtn" class="logout-btn" title="Logout"><i class="fa-solid fa-right-from-bracket"></i></button>
                </div>
            </div>
            
            <!-- ৩টি দাগের নিয়ন ব্লু বাটন -->
            <button class="menu-toggle" id="mobileMenuBtn" aria-label="Toggle Menu">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
            </button>
        </div>
    </header>

    <!-- 🔍 সব পেজের জন্য স্বয়ংক্রিয় সার্চ বার 🔍 -->
    <div style="max-width: 650px; margin: 15px auto 10px auto; padding: 0 20px;">
        <div style="position: relative; display: flex; align-items: center;">
            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 18px; color: #00d2ff; font-size: 15px;"></i>
            <input type="text" id="globalSearchInput" placeholder="Search matches, football, cricket, leagues..." 
                style="width: 100%; background: #1a1a1a; border: 1.5px solid #2e2e2e; padding: 11px 40px 11px 48px; border-radius: 30px; color: #fff; font-size: 14px; outline: none; transition: 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
            <button id="clearGlobalSearch" style="position: absolute; right: 15px; background: none; border: none; color: #888; font-size: 18px; cursor: pointer; display: none;">&times;</button>
        </div>
    </div>
    `;

    // =========================================================
    // 🌟 ২. মাস্টার ফুটার (এক জায়গার কোড) 🌟
    // =========================================================
    const footerHTML = `
    <footer class="footer">
        <div class="footer-content">
            <div class="footer-box">
                <h2><i class="fa-solid fa-play-circle" style="color: #ff0000;"></i> Lego Sight</h2>
                <p>The best platform to watch live sports, gaming, and events seamlessly across all devices.</p>
            </div>
            <div class="footer-box">
                <h2>Quick Links</h2>
                <ul>
                    <li><a href="index.html">Home</a></li>
                    <li><a href="live.html">Live Now</a></li>
                    <li><a href="sports.html">Sports</a></li>
                    <li><a href="privacy.html">Privacy Policy</a></li>
                </ul>
            </div>
            <div class="footer-box">
                <h2>Contact Us</h2>
                <p><i class="fa-solid fa-phone"></i> <span id="footerPhone">+880 1800-000000</span></p>
                <p><i class="fa-brands fa-whatsapp" style="color: #25D366;"></i> <span id="footerWhatsapp">WhatsApp: +880 1800-000000</span></p>
                <p><i class="fa-solid fa-envelope" style="color: #ea4335;"></i> <span id="footerEmail">support@legosight.com</span></p>
            </div>
        </div>
        <div class="footer-bottom">
            &copy; 2026 Lego Sight. All rights reserved.
        </div>
    </footer>
    `;

    // পেজে স্বয়ংক্রিয়ভাবে হেডার ও ফুটার বসিয়ে দেওয়া
    const headerPlaceholder = document.getElementById("siteHeader");
    const footerPlaceholder = document.getElementById("siteFooter");

    if (headerPlaceholder) headerPlaceholder.innerHTML = headerHTML;
    if (footerPlaceholder) footerPlaceholder.innerHTML = footerHTML;

    // ৩-দাগের মোবাইল মেনু টগল
    const menuBtn = document.getElementById("mobileMenuBtn");
    const navLinks = document.getElementById("navLinks");
    if (menuBtn && navLinks) {
        menuBtn.onclick = function (e) {
            e.stopPropagation();
            navLinks.classList.toggle("active");
            menuBtn.classList.toggle("open");
        };
    }

    // অল-ইন-ওয়ান ইনস্ট্যান্ট সার্চ ইঞ্জিন
    const searchInput = document.getElementById("globalSearchInput");
    const clearBtn = document.getElementById("clearGlobalSearch");

    if (searchInput) {
        searchInput.oninput = function () {
            const query = this.value.toLowerCase().trim();
            if (clearBtn) clearBtn.style.display = query ? "block" : "none";

            const cards = document.querySelectorAll(".video-card");
            cards.forEach(card => {
                const title = card.querySelector("h3") ? card.querySelector("h3").innerText.toLowerCase() : "";
                const category = card.querySelector("p") ? card.querySelector("p").innerText.toLowerCase() : "";
                if (title.includes(query) || category.includes(query)) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        };

        if (clearBtn) {
            clearBtn.onclick = function () {
                searchInput.value = "";
                searchInput.dispatchEvent(new Event("input"));
                this.style.display = "none";
            };
        }
    }
});
