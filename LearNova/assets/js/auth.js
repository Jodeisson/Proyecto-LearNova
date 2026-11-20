const AUTH_URL = "/.netlify/functions/auth";

const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const nameGroup = document.getElementById("name-group");
const nameInput = document.getElementById("auth-name");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const submitBtn = document.getElementById("auth-submit");
const toggleModeBtn = document.getElementById("toggle-mode-btn");
const toggleText = document.getElementById("toggle-text");
const authMessage = document.getElementById("auth-message");

let isRegisterMode = false;

function updateModeUI() {
  if (isRegisterMode) {
    authTitle.textContent = "Crear cuenta";
    authSubtitle.textContent = "Únete a LearNova y comparte tus conocimientos.";
    nameGroup.classList.remove("hidden");
    nameInput.required = true;
    submitBtn.textContent = "Registrarse";
    toggleText.textContent = "¿Ya tienes cuenta?";
    toggleModeBtn.textContent = "Iniciar sesión";
  } else {
    authTitle.textContent = "Iniciar sesión";
    authSubtitle.textContent = "Accede a tu cuenta para publicar y explorar cursos.";
    nameGroup.classList.add("hidden");
    nameInput.required = false;
    submitBtn.textContent = "Entrar";
    toggleText.textContent = "¿No tienes cuenta?";
    toggleModeBtn.textContent = "Crear cuenta";
  }
  authMessage.textContent = "";
}

toggleModeBtn.addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;
  updateModeUI();
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMessage.textContent = "Procesando...";
  submitBtn.disabled = true;

  const payload = {
    action: isRegisterMode ? "register" : "login",
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value
  };

  try {
    const response = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "No se pudo completar la operación.");
    }

    localStorage.setItem("learnova_user", JSON.stringify(data.user));
    window.location.href = "catalog.html";
  } catch (error) {
    authMessage.textContent = error.message;
    authMessage.style.color = "#DC2626";
  } finally {
    submitBtn.disabled = false;
  }
});