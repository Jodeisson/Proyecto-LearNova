const defaultCourses = [
    {
        id: 1,
        title: "Desarrollo Web Frontend Moderno",
        author: "Carlos Mendoza",
        category: "Tecnología",
        description: "Aprende HTML, CSS y JavaScript creando proyectos reales a tu propio ritmo y sin fechas límite."
    },
    {
        id: 2,
        title: "Diseño UI/UX para Principiantes",
        author: "Sofía Ramírez",
        category: "Diseño",
        description: "Domina los principios de interfaz, paletas de color y prototipado desde cero."
    },
    {
        id: 3,
        title: "Finanzas para Emprendedores Digitales",
        author: "Andrés Torres",
        category: "Negocios",
        description: "Organiza los ingresos, costos y proyecciones de tu proyecto sin complicaciones."
    },
    {
        id: 4,
        title: "Inglés Conversacional Práctico",
        author: "Elena Rostova",
        category: "Idiomas",
        description: "Mejora tu fluidez con ejercicios cotidianos adaptados a tu horario disponible."
    }
];

// Cargar cursos desde localStorage o usar los predeterminados
let courses = JSON.parse(localStorage.getItem('learnova_courses')) || defaultCourses;

const coursesGrid = document.getElementById('courses-grid');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');

// Renderizar tarjetas en pantalla
function renderCourses(list) {
    coursesGrid.innerHTML = '';

    if (list.length === 0) {
        coursesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748B;">No se encontraron cursos con esos criterios.</p>';
        return;
    }

    list.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div>
                <span class="badge">${course.category}</span>
                <h3>${course.title}</h3>
                <p>${course.description}</p>
            </div>
            <div class="course-footer">
                <span>Por: <strong>${course.author}</strong></span>
                <button class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border: none; cursor: pointer;" onclick="alert('Abriendo lecciones de: ${course.title}')">Entrar</button>
            </div>
        `;
        coursesGrid.appendChild(card);
    });
}

// Filtrar por texto y categoría
function filterCourses() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filtered = courses.filter(course => {
        const matchesText = course.title.toLowerCase().includes(searchTerm) || 
                            course.description.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
        return matchesText && matchesCategory;
    });

    renderCourses(filtered);
}

searchInput.addEventListener('input', filterCourses);
categoryFilter.addEventListener('change', filterCourses);

// Lógica del Modal para subir cursos
const modal = document.getElementById('course-modal');
const openModalBtn = document.getElementById('btn-open-modal');
const closeModalBtn = document.getElementById('btn-close-modal');
const newCourseForm = document.getElementById('new-course-form');

openModalBtn.addEventListener('click', () => modal.classList.remove('hidden'));
closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));

newCourseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newCourse = {
        id: Date.now(),
        title: document.getElementById('course-title').value,
        author: document.getElementById('course-author').value,
        category: document.getElementById('course-category').value,
        description: document.getElementById('course-desc').value
    };

    courses.unshift(newCourse);
    localStorage.setItem('learnova_courses', JSON.stringify(courses));
    
    newCourseForm.reset();
    modal.classList.add('hidden');
    filterCourses();
});

// Inicializar vista
renderCourses(courses);

/*Actualizar catálogo------------------------------------------------------------------------------------------------------------*/

const API_URL = "/.netlify/functions/courses";

const coursesContainer = document.getElementById("courses-container");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const addCourseForm = document.getElementById("add-course-form");
const courseModal = document.getElementById("course-modal");

let allCourses = [];

function escapeHtml(text = "") {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function fetchCourses() {
  if (!coursesContainer) return;
  coursesContainer.innerHTML = `<p style="text-align:center; color:#64748B;">Cargando cursos...</p>`;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("No se pudo obtener la lista de cursos");
    allCourses = await response.json();
    localStorage.setItem("learnova_courses", JSON.stringify(allCourses));
    renderCourses();
  } catch (error) {
    console.warn("Usando respaldo local:", error);
    allCourses = JSON.parse(localStorage.getItem("learnova_courses")) || [];
    renderCourses();
  }
}

function renderCourses() {
  if (!coursesContainer) return;

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

  coursesContainer.innerHTML = "";

  if (filtered.length === 0) {
    coursesContainer.innerHTML = `<p style="text-align:center; color:#64748B; grid-column: 1 / -1;">No se encontraron cursos con esos criterios.</p>`;
    return;
  }

  filtered.forEach((course) => {
    const card = document.createElement("div");
    card.className = "course-card";
    card.innerHTML = `
      <span class="badge">${escapeHtml(course.category)}</span>
      <h3>${escapeHtml(course.title)}</h3>
      ${course.description ? `<p>${escapeHtml(course.description)}</p>` : ""}
      <small>Por: <strong>${escapeHtml(course.author)}</strong></small>
    `;
    coursesContainer.appendChild(card);
  });
}

if (searchInput) searchInput.addEventListener("input", renderCourses);
if (categoryFilter) categoryFilter.addEventListener("change", renderCourses);

if (addCourseForm) {
  addCourseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("course-title")?.value.trim();
    const author = document.getElementById("course-author")?.value.trim();
    const category = document.getElementById("course-category")?.value.trim();
    const description = document.getElementById("course-description")?.value.trim() || "";

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

      addCourseForm.reset();
      if (courseModal) courseModal.classList.add("hidden");
      await fetchCourses();
      alert("¡Curso publicado correctamente en la plataforma!");
    } catch (error) {
      alert(`No se pudo publicar el curso: ${error.message}`);
    }
  });
}

fetchCourses();