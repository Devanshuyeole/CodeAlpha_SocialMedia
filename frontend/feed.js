document.addEventListener('DOMContentLoaded', () => {
    const createPostBtn = document.getElementById('create-post-btn');
    const postModalOverlay = document.getElementById('post-modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const postMediaFileInput = document.getElementById('post-media-file');
    const fileNameDisplay = document.getElementById('file-name-display');
    const createPostForm = document.getElementById('create-post-form');
    const logoutButton = document.getElementById('logout-button');
    const postsContainer = document.getElementById('posts-container');
    const navProfileLink = document.getElementById('nav-profile-link');
    const logo = document.querySelector('.logo');

    const token = localStorage.getItem('token');
    const loggedInUsername = localStorage.getItem('username');

    if (!token || !loggedInUsername) {
        window.location.href = 'login.html';
        return;
    }
    
    if (loggedInUsername) {
        navProfileLink.href = `profile.html?username=${loggedInUsername}`;
    }
    if(logo) logo.addEventListener('click', () => { window.location.href = 'feed.html'; });

    function openModal() {
        postModalOverlay.style.display = 'flex';
    }

    function closeModal() {
        postModalOverlay.style.display = 'none';
        createPostForm.reset();
        fileNameDisplay.textContent = 'No file chosen';
    }

    createPostBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    postModalOverlay.addEventListener('click', (event) => {
        if (event.target === postModalOverlay) closeModal();
    });

    postMediaFileInput.addEventListener('change', () => {
        fileNameDisplay.textContent = postMediaFileInput.files.length > 0 ? postMediaFileInput.files[0].name : 'No file chosen';
    });
    
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    });
    
    async function fetchAndDisplayPosts() {
        try {
            const response = await fetch('http://localhost:5000/api/posts', {
                method: 'GET',
                headers: { 'x-auth-token': token }
            });
            if (!response.ok) throw new Error('Could not fetch posts');
            const posts = await response.json();
            postsContainer.innerHTML = '';
            
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            const currentUserId = decodedToken.user.id;

            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post-card';
                postElement.dataset.postId = post._id;

                const isLiked = post.likes.some(like => like.user.toString() === currentUserId);
                const isOwner = post.user.toString() === currentUserId;

                const ownerControls = isOwner ? `
                    <div class="owner-controls">
                        <button class="edit-post-btn">Edit</button>
                        <button class="delete-post-btn">Delete</button>
                    </div>` : '';

                const mediaElement = post.imageUrl ? `<img src="http://localhost:5000/${post.imageUrl.replace(/\\/g, '/')}" alt="Post media" class="post-image">` : '';

                let commentsHtml = post.comments.map(comment => `
                    <div class="comment" data-comment-id="${comment._id}">
                        <span>
                            <strong class="post-username" data-username="${comment.username}">${comment.username}</strong>
                            ${comment.text}
                        </span>
                        ${comment.user.toString() === currentUserId ? '<button class="delete-comment-btn">&times;</button>' : ''}
                    </div>
                `).join('');

                postElement.innerHTML = `
                    <div class="post-header">
                        <div>
                            <strong class="post-username" data-username="${post.username}">${post.username}</strong>
                            <span class="post-date">${new Date(post.date).toLocaleString()}</span>
                        </div>
                        ${ownerControls}
                    </div>
                    <div class="post-body">
                        ${mediaElement}
                        <p>${post.text}</p>
                    </div>
                    <div class="post-actions">
                        <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${post._id}">Like (${post.likes.length})</button>
                        <button class="comment-btn" data-id="${post._id}">Comment (${post.comments.length})</button>
                    </div>
                    <div class="comment-section">
                        ${commentsHtml}
                        <form class="comment-form">
                            <input type="text" class="comment-input" placeholder="Add a comment..." required>
                            <button type="submit" class="comment-submit-btn">Post</button>
                        </form>
                    </div>
                `;
                postsContainer.appendChild(postElement);
            });
        } catch (error) {
            console.error('Error fetching posts:', error);
            postsContainer.innerHTML = '<p>Could not load feed. Please try again later.</p>';
        }
    }

    createPostForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const formData = new FormData();
        formData.append('text', document.getElementById('post-caption').value);
        if (postMediaFileInput.files[0]) {
            formData.append('postMedia', postMediaFileInput.files[0]);
        }

        try {
            const response = await fetch('http://localhost:5000/api/posts', {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: formData
            });
            if (!response.ok) throw new Error('Failed to create post');
            closeModal();
            fetchAndDisplayPosts();
        } catch (error) {
            console.error('Error creating post:', error);
        }
    });

    postsContainer.addEventListener('click', async (event) => {
        const target = event.target;
        const postCard = target.closest('.post-card');
        if (!postCard) return;
        const postId = postCard.dataset.postId;

        if (target.classList.contains('like-btn')) {
            try {
                const response = await fetch(`http://localhost:5000/api/posts/like/${postId}`, {
                    method: 'PUT',
                    headers: { 'x-auth-token': token }
                });
                if (!response.ok) throw new Error('Failed to update like status');
                const updatedLikes = await response.json();
                target.textContent = `Like (${updatedLikes.length})`;
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                const isNowLiked = updatedLikes.some(like => like.user.toString() === decodedToken.user.id);
                target.classList.toggle('liked', isNowLiked);
            } catch (error) { console.error('Error liking post:', error); }
        } else if (target.classList.contains('post-username')) {
            window.location.href = `profile.html?username=${target.dataset.username}`;
        } else if (target.classList.contains('delete-post-btn')) {
            if (confirm('Are you sure you want to delete this post?')) {
                try {
                    const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
                        method: 'DELETE',
                        headers: { 'x-auth-token': token }
                    });
                    if (!response.ok) throw new Error('Failed to delete post');
                    postCard.remove();
                } catch (error) { console.error('Error deleting post:', error); }
            }
        } else if (target.classList.contains('delete-comment-btn')) {
            const commentElement = target.closest('.comment');
            const commentId = commentElement.dataset.commentId;
            if (confirm('Are you sure you want to delete this comment?')) {
                 try {
                    const response = await fetch(`http://localhost:5000/api/posts/comment/${postId}/${commentId}`, {
                        method: 'DELETE',
                        headers: { 'x-auth-token': token }
                    });
                    if (!response.ok) throw new Error('Failed to delete comment');
                    commentElement.remove();
                } catch (error) { console.error('Error deleting comment:', error); }
            }
        } else if (target.classList.contains('edit-post-btn')) {
            const postBody = postCard.querySelector('.post-body');
            const p = postBody.querySelector('p');
            const currentText = p.textContent;
            
            postBody.innerHTML = `
                <textarea class="edit-textarea">${currentText}</textarea>
                <div class="edit-controls">
                    <button class="save-edit-btn">Save</button>
                    <button class="cancel-edit-btn">Cancel</button>
                </div>
            `;
        } else if (target.classList.contains('cancel-edit-btn')) {
            fetchAndDisplayPosts();
        } else if (target.classList.contains('save-edit-btn')) {
            const postBody = postCard.querySelector('.post-body');
            const newText = postBody.querySelector('textarea').value;
            try {
                const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ text: newText })
                });
                if (!response.ok) throw new Error('Failed to save post');
                fetchAndDisplayPosts();
            } catch (error) { console.error('Error saving post:', error); }
        }
    });
    
    postsContainer.addEventListener('submit', async (event) => {
        if (event.target.classList.contains('comment-form')) {
            event.preventDefault();
            const input = event.target.querySelector('.comment-input');
            const text = input.value;
            const postId = event.target.closest('.post-card').dataset.postId;
            if (!text.trim()) return;
            try {
                const response = await fetch(`http://localhost:5000/api/posts/comment/${postId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ text })
                });
                if (!response.ok) throw new Error('Failed to post comment');
                fetchAndDisplayPosts();
            } catch (error) { console.error('Error posting comment:', error); }
        }
    });
    
    fetchAndDisplayPosts();
});