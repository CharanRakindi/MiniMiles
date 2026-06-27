function handleImageError(img) {
    img.src = '/minimiles/images/default-avatar.png';
}

function ensureAbsolutePath(url) {
    if (!url.startsWith('/')) {
        return '/minimiles/' + url;
    }
    return url.startsWith('/minimiles/') ? url : '/minimiles' + url;
}

document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    if (!header) {
        console.error("Header element not found.");
        return;
    }

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');

    let navLinks = `
        <a href="/minimiles/resorts.html" class="nav-link ${currentPage === 'resorts.html' ? 'active' : ''}">Resorts</a>
        <a href="/minimiles/temples.html" class="nav-link ${currentPage === 'temples.html' ? 'active' : ''}">Temples</a>
        <a href="/minimiles/attractions.html" class="nav-link ${currentPage === 'attractions.html' ? 'active' : ''}">Attractions</a>
        <a href="/minimiles/camping.html" class="nav-link ${currentPage === 'camping.html' ? 'active' : ''}">Camping</a>
    `;

    let authLinks = '';
    if (user && user.id) {
        const profilePicSrc = user.profilePic ? ensureAbsolutePath(user.profilePic) : '/minimiles/images/default-avatar.png';
        authLinks = `
            <div class="user-header-container">
                <a href="/minimiles/profile.php" class="profile-photo-link" title="My Profile">
                    <img src="${profilePicSrc}" alt="${user.name || 'User'}" class="header-profile-photo" onerror="handleImageError(this)">
                </a>
                <button id="logout-btn-desktop" class="btn btn-logout" aria-label="Logout">Logout</button>
            </div>
        `;
    } else {
        authLinks = `
            <a href="/minimiles/login.html" class="btn btn-outline login-btn">Login</a>
            <a href="/minimiles/register.html" class="btn btn-primary register-btn">Register</a>
        `;
    }

    const hamburgerIconHtml = `
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
    `;
    
    const closeIconHtml = `
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
    `;

    header.innerHTML = `
        <div class="header-logo-container">
            <a href="/minimiles/" class="logo-link">
                <span class="logo-text">MINI MILES</span>
            </a>
        </div>
        
        <div class="header-right-group">
            <div class="header-nav-container">
                <nav class="main-nav">
                    ${navLinks}
                </nav>
            </div>
            
            <div class="header-auth-container">
                <div class="auth-nav">
                    ${authLinks}
                </div>
            </div>
        </div>
        
        <button class="mobile-menu-toggle" aria-label="Toggle menu" aria-expanded="false">
            ${hamburgerIconHtml}
        </button>
        
        <div class="mobile-nav-menu">
            <div class="mobile-menu-header-logo-container">
                 <a href="/minimiles/" class="logo-link">
                     <span class="logo-text">MINI MILES</span>
                 </a>
            </div>
            ${user && user.id ? `
                <div class="mobile-profile-link">
                    <a href="/minimiles/profile.php" class="nav-link profile-link ${currentPage === 'profile.php' ? 'active' : ''}">
                        <img src="${user.profilePic ? ensureAbsolutePath(user.profilePic) : '/minimiles/images/default-avatar.png'}" alt="${user.name || 'User'}" class="header-profile-photo" onerror="handleImageError(this)">
                        <span>My Profile</span>
                    </a>
                </div>
            ` : ''}
            ${navLinks}
            <div class="mobile-auth-links">
                ${user && user.id ? `
                    <button id="logout-btn-mobile" class="btn btn-logout">Logout</button>
                ` : `
                    <a href="/minimiles/login.html" class="btn btn-outline login-btn">Login</a>
                    <a href="/minimiles/register.html" class="btn btn-primary register-btn">Register</a>
                `}
            </div>
        </div>
    `;

    function handleLogout(event) {
        event.preventDefault();
        console.log("Logout initiated by button:", event.target.id);
        sessionStorage.removeItem('user');
        window.location.href = '/minimiles/';
    }

    const logoutBtnDesktop = document.getElementById('logout-btn-desktop');
    if (logoutBtnDesktop) {
        logoutBtnDesktop.addEventListener('click', handleLogout);
    }
    const logoutBtnMobile = document.getElementById('logout-btn-mobile');
    if (logoutBtnMobile) {
        logoutBtnMobile.addEventListener('click', handleLogout);
    }

    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav-menu');

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const isActive = mobileNav.classList.toggle('active');
            menuToggle.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', isActive);
            document.body.classList.toggle('menu-open', isActive);
            
            if (isActive) {
                mobileNav.style.display = 'flex';
                const profileImages = mobileNav.querySelectorAll('.user-photo-header');
                profileImages.forEach(img => {
                    if (img.complete && img.naturalHeight === 0 && !img.src.includes('placeholder.jpg')) {
                        img.src = '/minimiles/images/default-avatar.png';
                    }
                });
            } else {
                setTimeout(() => {
                    if (!mobileNav.classList.contains('active')) {
                        mobileNav.style.display = 'none';
                    }
                }, 300);
            }
        });
        
        document.addEventListener('click', function(e) {
            if (mobileNav.classList.contains('active') && 
                !mobileNav.contains(e.target) && 
                e.target !== menuToggle) {
                mobileNav.classList.remove('active');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('menu-open');
                setTimeout(() => {
                    if (!mobileNav.classList.contains('active')) {
                        mobileNav.style.display = 'none';
                    }
                }, 300);
            }
        });
        
        mobileNav.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 1024 && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('menu-open');
                mobileNav.style.display = 'none';
            }
        });
    }

    const logoLinks = document.querySelectorAll('.logo-link');
    logoLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            console.log('Logo clicked, redirecting to /minimiles/');
            window.location.href = '/minimiles/';
        });
    });

    const profileImages = header.querySelectorAll('.profile-avatar-sm, .user-photo-header');
    profileImages.forEach(img => {
        if (!img.onerror) {
            img.onerror = function() { handleImageError(this); };
        }
        if (img.complete && img.naturalHeight === 0 && img.src !== 'images/placeholder.jpg' && !img.src.startsWith('data:')) {
            handleImageError(img);
        }
    });

    // Expose updateHeader globally so other scripts (like profile.js) can call it
    window.updateHeader = function() {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        let updatedAuthLinks = '';
        if (user && user.id) {
            const profilePicSrc = user.profilePic ? ensureAbsolutePath(user.profilePic) : '/minimiles/images/default-avatar.png';
            updatedAuthLinks = `
                <div class="user-header-container">
                    <a href="/minimiles/profile.php" class="profile-photo-link" title="My Profile">
                        <img src="${profilePicSrc}" alt="${user.name || 'User'}" class="header-profile-photo" onerror="handleImageError(this)">
                    </a>
                    <button id="logout-btn-desktop" class="btn btn-logout" aria-label="Logout">Logout</button>
                </div>
            `;
        } else {
            updatedAuthLinks = `
                <a href="/minimiles/login.html" class="btn btn-outline login-btn">Login</a>
                <a href="/minimiles/register.html" class="btn btn-primary register-btn">Register</a>
            `;
        }

        const authNav = document.querySelector('.auth-nav');
        if (authNav) {
            authNav.innerHTML = updatedAuthLinks;
            const newLogoutBtnDesktop = document.getElementById('logout-btn-desktop');
            if (newLogoutBtnDesktop) {
                newLogoutBtnDesktop.addEventListener('click', handleLogout);
            }
        }

        const mobileProfileLink = document.querySelector('.mobile-profile-link');
        const mobileAuthLinks = document.querySelector('.mobile-auth-links');
        if (mobileProfileLink && mobileAuthLinks) {
            if (user && user.id) {
                mobileProfileLink.innerHTML = `
                    <a href="/minimiles/profile.php" class="nav-link profile-link ${currentPage === 'profile.php' ? 'active' : ''}">
                        <img src="${user.profilePic ? ensureAbsolutePath(user.profilePic) : '/minimiles/images/default-avatar.png'}" alt="${user.name || 'User'}" class="header-profile-photo" onerror="handleImageError(this)">
                        <span>My Profile</span>
                    </a>
                `;
                mobileAuthLinks.innerHTML = `
                    <button id="logout-btn-mobile" class="btn btn-logout">Logout</button>
                `;
                const newLogoutBtnMobile = document.getElementById('logout-btn-mobile');
                if (newLogoutBtnMobile) {
                    newLogoutBtnMobile.addEventListener('click', handleLogout);
                }
            } else {
                mobileProfileLink.innerHTML = '';
                mobileAuthLinks.innerHTML = `
                    <a href="/minimiles/login.html" class="btn btn-outline login-btn">Login</a>
                    <a href="/minimiles/register.html" class="btn btn-primary register-btn">Register</a>
                `;
            }
        }
    };
});