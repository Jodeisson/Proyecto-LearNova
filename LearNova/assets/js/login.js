const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    // Credenciales de prueba para el proyecto
    if (user === 'admin' && pass === 'learnova2026') {
        localStorage.setItem('auth_token', 'true');
        window.location.href = 'panel.html';
    } else {
        loginError.classList.remove('hidden');
    }
});