const AUTH_URL = "/.netlify/functions/auth";
const SESSION_KEY = "learnova_user";

const loggedInBox = document.getElementById("logged-in-box");
const activeUserInfo = document.getElementById("active-user-info");
const logoutBtn = document.getElementById("logout-btn");

const authBox = document.getElementById("auth-box");
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

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function renderSessionState() {
  const user = getCurrentUser();
  if (user && user.email) {
    authBox.classList.add("hidden");
    loggedInBox.classList.remove("hidden");
    activeUserInfo.innerHTML = `Ya iniciaste sesión como <strong>${user.name || user.email}</strong> (${user.email}).<br>Cierra sesión si deseas ingresar con otra cuenta.`;
  } else {
    loggedInBox.classList.add("hidden");
    authBox.classList.remove("hidden");
  }
}

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

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    authForm.reset();
    isRegisterMode = false;
    updateModeUI();
    renderSessionState();
  });
}

if (toggleModeBtn) {
  toggleModeBtn.addEventListener("click", () => {
    isRegisterMode = !isRegisterMode;
    updateModeUI();
  });
}

if (authForm) {
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Doble protección: impedir iniciar sesión si ya hay una activa
    if (getCurrentUser()) {
      renderSessionState();
      return;
    }

    authMessage.textContent = "Procesando...";
    authMessage.style.color = "";
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

      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      window.location.href = "catalog.html";
    } catch (error) {
      authMessage.textContent = error.message;
      authMessage.style.color = "#DC2626";
    } finally {
      submitBtn.disabled = false;
    }
  });
}

renderSessionState();