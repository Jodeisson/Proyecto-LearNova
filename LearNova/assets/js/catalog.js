const API_URL = "/.netlify/functions/courses";

const defaultCourses = [
  {
    id: "default-1",
    title: "Desarrollo Web Frontend Moderno",
    author: "Carlos Mendoza",
    category: "Tecnología",
    description: "Aprende HTML, CSS y JavaScript creando proyectos reales a tu propio ritmo y sin fechas límite."
  },
  {
    id: "default-2",
    title: "Diseño UI/UX para Principiantes",
    author: "Sofía Ramírez",
    category: "Diseño",
    description: "Domina los principios de interfaz, paletas de color y prototipado desde cero."
  },
  {
    id: "default-3",
    title: "Finanzas para Emprendedores Digitales",
    author: "Andrés Torres",
    category: "Negocios",
    description: "Organiza los ingresos, costos y proyecciones de tu proyecto sin complicaciones."
  },
  {
    id: "default-4",
    title: "Inglés Conversacional Práctico",
    author: "Elena Rostova",
    category: "Idiomas",
    description: "Mejora tu fluidez con ejercicios cotidianos adaptados a tu horario disponible."
  }
];

const coursesGrid = document.getElementById("courses-grid");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");

const courseModal = document.getElementById("course-modal");
const openModalBtn = document.getElementById("btn-open-modal");
const closeModalBtn = document.getElementById("btn-close-modal");
const newCourseForm = document.getElementById("new-course-form");

let allCourses = [];

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

if (openModalBtn && courseModal) {
  openModalBtn.addEventListener("click", () => courseModal.classList.remove("hidden"));
}

if (closeModalBtn && courseModal) {
  closeModalBtn.addEventListener("click", () => courseModal.classList.add("hidden"));
}

async function fetchCourses() {
  if (!coursesGrid) return;
  coursesGrid.innerHTML = `<p style="text-align:center; color:#64748B; grid-column: 1 / -1;">Cargando cursos...</p>`;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("No se pudo obtener la lista de cursos");
    const dbCourses = await response.json();
    allCourses = dbCourses.length > 0 ? dbCourses : defaultCourses;
    localStorage.setItem("learnova_courses", JSON.stringify(allCourses));
    renderCourses();
  } catch (error) {
    console.warn("Usando respaldo local:", error);
    allCourses = JSON.parse(localStorage.getItem("learnova_courses")) || defaultCourses;
    renderCourses();
  }
}

function renderCourses() {
  if (!coursesGrid) return;

  const query = (searchInput?.value || "").toLowerCase().trim();
  const selectedCategory = categoryFilter?.value || "all";

  const filtered = allCourses.filter((course) => {
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    const matchesSearch =
      !query ||
      (course.title || "").toLowerCase().includes(query) ||
      (course.author || "").toLowerCase().includes(query) ||
      (course.description || "").toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  coursesGrid.innerHTML = "";

  if (filtered.length === 0) {
    coursesGrid.innerHTML = `<p style="text-align:center; color:#64748B; grid-column: 1 / -1;">No se encontraron cursos con esos criterios.</p>`;
    return;
  }

  filtered.forEach((course) => {
    const safeTitle = escapeHtml(course.title);
    const safeAuthor = escapeHtml(course.author);
    const safeCategory = escapeHtml(course.category);
    const safeDescription = escapeHtml(course.description || "");
    const safeJsTitle = JSON.stringify(course.title || "");

    const card = document.createElement("div");
    card.className = "course-card";
    card.innerHTML = `
      <div>
        <span class="badge">${safeCategory}</span>
        <h3>${safeTitle}</h3>
        <p>${safeDescription}</p>
      </div>
      <div class="course-footer">
        <span>Por: <strong>${safeAuthor}</strong></span>
        <button class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border: none; cursor: pointer;" onclick='alert("Abriendo lecciones de: " + ${safeJsTitle})'>Entrar</button>
      </div>
    `;
    coursesGrid.appendChild(card);
  });
}

if (searchInput) searchInput.addEventListener("input", renderCourses);
if (categoryFilter) categoryFilter.addEventListener("change", renderCourses);

if (newCourseForm) {
  newCourseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("course-title")?.value.trim();
    const author = document.getElementById("course-author")?.value.trim();
    const category = document.getElementById("course-category")?.value.trim();
    const description = document.getElementById("course-desc")?.value.trim() || "";

    if (!title || !author || !category) return;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, category, description })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Error al guardar el curso");
      }

      newCourseForm.reset();
      if (courseModal) courseModal.classList.add("hidden");
      await fetchCourses();
      alert("¡Curso publicado correctamente en la plataforma!");
    } catch (error) {
      alert(`No se pudo publicar el curso: ${error.message}`);
    }
  });
}

async function fetchCourses() {
  if (!coursesGrid) return;
  coursesGrid.innerHTML = `<p style="text-align:center; color:#64748B; grid-column: 1 / -1;">Cargando cursos...</p>`;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("No se pudo obtener la lista de cursos");
    allCourses = await response.json();
    localStorage.setItem("learnova_courses", JSON.stringify(allCourses));
    renderCourses();
  } catch (error) {
    console.warn("Usando respaldo local:", error);
    allCourses = JSON.parse(localStorage.getItem("learnova_courses")) || defaultCourses;
    renderCourses();
  }
}