if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavigation);
} else {
    updateNavigation();
}

function updateNavigation() {
    const navLinks = document.getElementById('navLinks');
    if (!navLinks) return; // If nav is not on page

    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');

    // Remove any existing auth options first
    const existingAuths = navLinks.querySelectorAll('.auth-nav-item');
    existingAuths.forEach(el => el.remove());

    if (userStr && token) {
        const user = JSON.parse(userStr);

        // Add Profile/Orders Link
        const profileLi = document.createElement('li');
        profileLi.className = 'auth-nav-item';
        profileLi.innerHTML = `<a href="profile.html">Hi, ${user.name.split(' ')[0]}</a>`;
        navLinks.appendChild(profileLi);

        // Add Logout Link
        const logoutLi = document.createElement('li');
        logoutLi.className = 'auth-nav-item';
        logoutLi.innerHTML = `<a href="#" onclick="logoutUser()">Logout</a>`;
        navLinks.appendChild(logoutLi);

        // Optional: If Admin, add Admin Panel Link to public facing pages
        if (user.role === 'admin' && !window.location.pathname.includes('admin.html')) {
            const adminLi = document.createElement('li');
            adminLi.className = 'auth-nav-item';
            adminLi.innerHTML = `<a href="admin.html" style="color:#FFD700;">Admin Panel</a>`;
            navLinks.appendChild(adminLi);
        }

    } else {
        // Not logged in -> Show Login button
        const loginLi = document.createElement('li');
        loginLi.className = 'auth-nav-item';
        loginLi.innerHTML = `<a href="login.html" class="btn" style="padding: 5px 15px;">Login</a>`;
        navLinks.appendChild(loginLi);
    }
}

function logoutUser() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Utility to get auth headers for fetch requests
function getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    if (token) {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    return {
        'Content-Type': 'application/json'
    };
}
