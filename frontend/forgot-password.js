document.getElementById('forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    const message = document.getElementById('forgot-message');
    message.textContent = '';
    try {
        const response = await fetch('http://localhost:5000/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!response.ok) {
            message.style.color = 'red';
            message.textContent = data.msg;
        } else {
            message.style.color = 'green';
            message.textContent = data.msg;
        }
    } catch (err) {
        message.style.color = 'red';
        message.textContent = 'Error sending request';
    }
});
