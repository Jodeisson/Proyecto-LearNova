(function () {
  const SESSION_KEY = "learnova_user";
  const navLink = document.getElementById("nav-auth-link");
  if (!navLink) return;

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    user = null;
  }

  if (user && user.email) {
    const firstName = (user.name || user.email).split(" ")[0];
    navLink.textContent = `Cerrar sesión (${firstName})`;
    navLink.href = "#";
    navLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm(`¿Cerrar la sesión de ${user.name || user.email}?`)) {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "login.html";
      }
    });
  } else {
    navLink.textContent = "Ingresar";
    navLink.href = "login.html";
  }
})();