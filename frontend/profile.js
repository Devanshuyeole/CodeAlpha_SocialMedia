document.addEventListener('DOMContentLoaded', () => {
    const profileUsernameEl = document.getElementById('profile-username');
    const postCountEl = document.getElementById('post-count');
    const followerCountEl = document.getElementById('follower-count');
    const followingCountEl = document.getElementById('following-count');
    const profileBioEl = document.getElementById('profile-bio');
    const profileActionBtn = document.getElementById('profile-action-btn');
    const messageUserBtn = document.getElementById('message-user-btn');
    const postsGrid = document.getElementById('profile-posts-grid');
    const logo = document.querySelector('.logo');
    const navProfileLink = document.getElementById('nav-profile-link');
    const logoutButton = document.getElementById('logout-button');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
    const editProfileForm = document.getElementById('edit-profile-form');
    const editBioTextarea = document.getElementById('edit-bio');

    const token = localStorage.getItem('token');
    const loggedInUsername = localStorage.getItem('username');

    if (!token || !loggedInUsername) {
        window.location.href = 'login.html';
        return;
    }

    if(logo) logo.addEventListener('click', () => { window.location.href = 'feed.html'; });
    if(logoutButton) logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    });
    if(navProfileLink) navProfileLink.href = `profile.html?username=${loggedInUsername}`;

    const urlParams = new URLSearchParams(window.location.search);
    const profileUsername = urlParams.get('username');

    let viewedUserId = null;
    let isFollowing = false;

    async function fetchProfileData() {
        if (!profileUsername) {
            profileUsernameEl.textContent = 'User not found.';
            return;
        }
        try {
            const response = await fetch(`http://localhost:5000/api/users/${profileUsername}`, {
                headers: { 'x-auth-token': token }
            });
            if (!response.ok) throw new Error('User not found');

            const { user, posts } = await response.json();
            viewedUserId = user._id;

            profileUsernameEl.textContent = user.username;
            postCountEl.textContent = posts.length;
            followerCountEl.textContent = user.followers.length;
            followingCountEl.textContent = user.following.length;
            profileBioEl.textContent = user.bio || 'No bio yet.';
            editBioTextarea.value = user.bio || '';

            postsGrid.innerHTML = '';
            posts.forEach(post => {
                const postItem = document.createElement('div');
                postItem.className = 'profile-post-item';
                if (post.imageUrl) {
                    const img = document.createElement('img');
                    img.src = `http://localhost:5000/${post.imageUrl.replace(/\\/g, '/')}`;
                    postItem.appendChild(img);
                } else {
                    postItem.textContent = post.text;
                }
                postsGrid.appendChild(postItem);
            });

            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            isFollowing = user.followers.includes(decodedToken.user.id);
            
            updateActionButtons(user.username);

        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }

    function updateActionButtons(username) {
        if (username === loggedInUsername) {
            profileActionBtn.textContent = 'Edit Profile';
            profileActionBtn.className = 'edit';
            if (messageUserBtn) messageUserBtn.style.display = 'none';
        } else {
            profileActionBtn.textContent = isFollowing ? 'Following' : 'Follow';
            profileActionBtn.className = isFollowing ? 'following' : 'follow';
            if (messageUserBtn) messageUserBtn.style.display = 'inline-block';
        }
    }

    closeEditModalBtn.addEventListener('click', () => editProfileModal.style.display = 'none');
    editProfileModal.addEventListener('click', (e) => {
        if (e.target === editProfileModal) editProfileModal.style.display = 'none';
    });

    profileActionBtn.addEventListener('click', async () => {
        if (profileActionBtn.classList.contains('edit')) {
            editProfileModal.style.display = 'flex';
            return;
        }
        if (!viewedUserId) return;
        try {
            const response = await fetch(`http://localhost:5000/api/users/follow/${viewedUserId}`, {
                method: 'PUT',
                headers: { 'x-auth-token': token }
            });
            if (!response.ok) throw new Error('Follow action failed');
            isFollowing = !isFollowing;
            let currentFollowers = parseInt(followerCountEl.textContent);
            followerCountEl.textContent = isFollowing ? currentFollowers + 1 : currentFollowers - 1;
            updateActionButtons(profileUsername);
        } catch (error) {
            console.error('Error following user:', error);
        }
    });

    editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newBio = editBioTextarea.value;
        try {
            const response = await fetch('http://localhost:5000/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ bio: newBio })
            });
            if (!response.ok) throw new Error('Failed to update profile');
            
            profileBioEl.textContent = newBio || 'No bio yet.';
            editProfileModal.style.display = 'none';
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    });

    fetchProfileData();
});