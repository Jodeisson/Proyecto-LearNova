// Verificar si el usuario ha iniciado sesión
if (localStorage.getItem("auth_token") !== "true") {
  window.location.href = "login.html";
}

const API_URL = "/.netlify/functions/courses";
const tbody = document.getElementById("admin-courses-tbody");
const logoutBtn = document.getElementById("btn-logout");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("auth_token");
    window.location.href = "login.html";
  });
}

function escapeHtml(text = "") {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadAdminCourses() {
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #64748B;">Cargando cursos desde la base de datos...</td></tr>`;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("No se pudieron cargar los cursos");

    const courses = await response.json();
    tbody.innerHTML = "";

    if (courses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #64748B;">No hay cursos registrados en la base de datos.</td></tr>`;
      return;
    }

    courses.forEach((course) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${escapeHtml(course.title)}</strong></td>
        <td>${escapeHtml(course.author)}</td>
        <td><span class="badge">${escapeHtml(course.category)}</span></td>
        <td>
          <button onclick="deleteCourse('${course.id}')" style="background-color: #EF4444; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer;">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #DC2626;">Error al cargar cursos: ${escapeHtml(error.message)}</td></tr>`;
  }
}

window.deleteCourse = async function (id) {
  if (!confirm("¿Estás seguro de eliminar este curso de forma permanente?")) return;

  try {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "No se pudo eliminar el curso");
    }

    await loadAdminCourses();
  } catch (error) {
    alert(`Error al eliminar: ${error.message}`);
  }
};

loadAdminCourses();