document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    const navProfileLink = document.getElementById('nav-profile-link');
    const logo = document.querySelector('.logo');
    const createPostBtn = document.getElementById('create-post-btn');

    const loggedInUsername = localStorage.getItem('username');

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = 'login.html';
        });
    }

    if (navProfileLink && loggedInUsername) {
        navProfileLink.href = `profile.html?username=${loggedInUsername}`;
    }

    if (logo) {
        logo.addEventListener('click', () => {
            window.location.href = 'feed.html';
        });
    }

    if (createPostBtn && window.location.pathname.includes('feed.html')) {
    } else if (createPostBtn) {
        createPostBtn.addEventListener('click', () => {
            window.location.href = 'feed.html';
        });
    }
});