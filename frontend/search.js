document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results-container');
    const logo = document.querySelector('.logo');
    const navProfileLink = document.getElementById('nav-profile-link');
    const logoutButton = document.getElementById('logout-button');

    const token = localStorage.getItem('token');
    const loggedInUsername = localStorage.getItem('username');

    if (!token || !loggedInUsername) {
        window.location.href = 'login.html';
        return;
    }
    
    if(logo) logo.addEventListener('click', () => { window.location.href = 'feed.html'; });
    if(navProfileLink) navProfileLink.href = `profile.html?username=${loggedInUsername}`;
    if(logoutButton) logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    });

    let searchTimeout;

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = searchInput.value.trim();
            if (query.length > 1) {
                performSearch(query);
            } else {
                resultsContainer.innerHTML = '';
            }
        }, 300);
    });

    async function performSearch(query) {
        try {
            const response = await fetch(`http://localhost:5000/api/users/search/${query}`, {
                headers: { 'x-auth-token': token }
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const users = await response.json();
            displayResults(users);
        } catch (error) {
            console.error('Error performing search:', error);
            resultsContainer.innerHTML = '<p>Error searching for users.</p>';
        }
    }

    function displayResults(users) {
        resultsContainer.innerHTML = '';
        if (users.length === 0) {
            resultsContainer.innerHTML = '<p>No users found.</p>';
            return;
        }

        users.forEach(user => {
            if (user.username !== loggedInUsername) {
                const userElement = document.createElement('div');
                userElement.className = 'search-result-item';
                userElement.innerHTML = `
                    <span class="result-username">${user.username}</span>
                    <a href="profile.html?username=${user.username}" class="view-profile-link">View Profile</a>
                `;
                resultsContainer.appendChild(userElement);
            }
        });
    }
});
