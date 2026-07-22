document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const resetForm = document.getElementById('reset-form');
  const passwordInput = document.getElementById('password');
  const messageDiv = document.getElementById('message');

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = passwordInput.value;

    try {
      const res = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();

      messageDiv.textContent = data.msg;
      messageDiv.style.color = res.ok ? 'green' : 'red';
    } catch (err) {
      messageDiv.textContent = 'Something went wrong';
      messageDiv.style.color = 'red';
    }
  });
});
