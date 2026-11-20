(function () {
  const SESSION_KEY = "learnova_user";
  const navLink = document.getElementById("nav-auth-link");

  const widget = document.getElementById("user-profile-widget");
  const avatarEl = document.getElementById("user-avatar-letter");
  const nameEl = document.getElementById("user-display-name");
  const emailEl = document.getElementById("user-display-email");

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    user = null;
  }

  const isLoggedIn = Boolean(user && user.email);

  if (widget && avatarEl && nameEl && emailEl) {
    if (isLoggedIn) {
      const displayName = (user.name || user.email.split("@")[0]).trim();
      const initial = displayName.charAt(0).toUpperCase() || "U";

      avatarEl.textContent = initial;
      nameEl.textContent = displayName;
      emailEl.textContent = user.email;

      widget.classList.add("is-visible");
      widget.setAttribute("aria-hidden", "false");
    } else {
      widget.classList.remove("is-visible");
      widget.setAttribute("aria-hidden", "true");
      avatarEl.textContent = "";
      nameEl.textContent = "";
      emailEl.textContent = "";
    }
  }

  if (!navLink) return;

  if (isLoggedIn) {
    const firstName = (user.name || user.email).split(" ")[0];
    navLink.textContent = `Cerrar sesión (${firstName})`;
    navLink.href = "#";
    navLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm(`¿Cerrar la sesión de ${user.name || user.email}?`)) {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "sesion.html";
      }
    });
  } else {
    navLink.textContent = "Ingresar";
    navLink.href = "sesion.html";
  }
})();