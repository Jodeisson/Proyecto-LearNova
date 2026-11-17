const form = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);

    fetch('/', {
        method: 'POST',
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString()
    })
    .then(() => {
        formStatus.textContent = "¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.";
        formStatus.className = "form-status success";
        formStatus.classList.remove('hidden');
        form.reset();
    })
    .catch((error) => {
        formStatus.textContent = "Lo sentimos, ocurrió un error al enviar. Por favor intenta de nuevo.";
        formStatus.className = "form-status error";
        formStatus.classList.remove('hidden');
    });
});