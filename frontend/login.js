document.addEventListener('DOMContentLoaded', () => {
    const authTitle = document.getElementById('auth-title');
    const authForm = document.getElementById('auth-form');
    const usernameGroup = document.getElementById('username-group');
    const emailGroup = document.getElementById('email-group');
    const confirmPasswordGroup = document.getElementById('confirm-password-group');
    const authButton = document.getElementById('auth-button');
    const toggleText = document.getElementById('toggle-text');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const usernameInput = document.getElementById('username');
    const messageDiv = document.getElementById('auth-message');

    let isLogin = true;

    function showSignUp() {
        authTitle.textContent = 'Create Account';
        usernameInput.placeholder = 'Username';
        emailGroup.style.display = 'block';
        confirmPasswordGroup.style.display = 'block';
        authForm.insertBefore(emailGroup, authForm.children[1]);
        authForm.insertBefore(confirmPasswordGroup, authForm.children[3]);
        authButton.textContent = 'SIGN UP';
        toggleText.innerHTML = 'Already have an account? <a href="#" id="toggle-link" class="signup-link">Sign In</a>';
        forgotPasswordLink.style.display = 'none';
        isLogin = false;
        addToggleListener();
    }

    function showSignIn() {
        authTitle.textContent = 'Welcome Back';
        usernameInput.placeholder = 'USERNAME OR EMAIL';
        emailGroup.style.display = 'none';
        confirmPasswordGroup.style.display = 'none';
        authButton.textContent = 'SIGN IN';
        toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="toggle-link" class="signup-link">Sign Up</a>';
        forgotPasswordLink.style.display = 'inline';
        isLogin = true;
        addToggleListener();
    }

    function toggleAuthMode(event) {
        event.preventDefault();
        if (isLogin) showSignUp();
        else showSignIn();
    }

    function addToggleListener() {
        const newToggleLink = document.getElementById('toggle-link');
        newToggleLink.addEventListener('click', toggleAuthMode);
    }

    addToggleListener();

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `auth-message ${type}`;
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'auth-message';
        }, 3000);
    }

    authForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        messageDiv.textContent = '';
        messageDiv.className = 'auth-message';

        const password = document.getElementById('password').value;
        const url = isLogin ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/register';
        let body;

        if (isLogin) {
            body = { identifier: usernameInput.value, password: password };
        } else {
            const username = usernameInput.value;
            const email = document.getElementById('email').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            if (password !== confirmPassword) {
                showMessage('Passwords do not match!', 'error');
                return;
            }
            body = { username, email, password };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) {
                showMessage(data.msg || 'Something went wrong', 'error');
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            showMessage('Success! You are now logged in.', 'success');
            setTimeout(() => {
                window.location.href = 'feed.html';
            }, 1000);
        } catch (error) {
            showMessage(error.message, 'error');
        }
    });
});
