const API_URL = "/.netlify/functions/courses";

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

let courses = JSON.parse(localStorage.getItem("learnova_courses")) || [...defaultCourses];

const coursesGrid = document.getElementById("courses-grid") || document.getElementById("courses-container");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");

const modal = document.getElementById("course-modal");
const openModalBtn = document.getElementById("btn-open-modal");
const closeModalBtn = document.getElementById("btn-close-modal");
const newCourseForm = document.getElementById("new-course-form") || document.getElementById("add-course-form");

function escapeHtml(text = "") {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Cargar cursos desde MongoDB Atlas vía Netlify Function
async function fetchCourses() {
    if (!coursesGrid) return;
    coursesGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748B;">Cargando cursos...</p>`;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("No se pudieron cargar los cursos desde el servidor");

        const data = await response.json();
        courses = Array.isArray(data) ? data : [];
        localStorage.setItem("learnova_courses", JSON.stringify(courses));
        filterCourses();
    } catch (error) {
        console.warn("Cargando cursos locales:", error);
        courses = JSON.parse(localStorage.getItem("learnova_courses")) || [...defaultCourses];
        filterCourses();
    }
}

// Renderizar tarjetas en pantalla
function renderCourses(list) {
    if (!coursesGrid) return;
    coursesGrid.innerHTML = "";

    if (list.length === 0) {
        coursesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748B;">No se encontraron cursos con esos criterios.</p>';
        return;
    }

    list.forEach((course) => {
        const safeTitle = escapeHtml(course.title || "");
        const safeAuthor = escapeHtml(course.author || "");
        const safeCategory = escapeHtml(course.category || "");
        const safeDesc = escapeHtml(course.description || "");

        const card = document.createElement("div");
        card.className = "course-card";
        card.innerHTML = `
            <div>
                <span class="badge">${safeCategory}</span>
                <h3>${safeTitle}</h3>
                <p>${safeDesc}</p>
            </div>
            <div class="course-footer">
                <span>Por: <strong>${safeAuthor}</strong></span>
                <button class="btn-primary btn-enter-course" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border: none; cursor: pointer;">Entrar</button>
            </div>
        `;

        card.querySelector(".btn-enter-course").addEventListener("click", () => {
            alert(`Abriendo lecciones de: ${course.title}`);
        });

        coursesGrid.appendChild(card);
    });
}

// Filtrar por texto y categoría
function filterCourses() {
    const searchTerm = (searchInput?.value || "").toLowerCase().trim();
    const selectedCategory = categoryFilter?.value || "all";

    const filtered = courses.filter((course) => {
        const title = (course.title || "").toLowerCase();
        const description = (course.description || "").toLowerCase();
        const author = (course.author || "").toLowerCase();

        const matchesText =
            !searchTerm ||
            title.includes(searchTerm) ||
            description.includes(searchTerm) ||
            author.includes(searchTerm);

        const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
        return matchesText && matchesCategory;
    });

    renderCourses(filtered);
}

if (searchInput) searchInput.addEventListener("input", filterCourses);
if (categoryFilter) categoryFilter.addEventListener("change", filterCourses);

// Lógica del Modal para subir cursos
if (openModalBtn && modal) {
    openModalBtn.addEventListener("click", () => modal.classList.remove("hidden"));
}

if (closeModalBtn && modal) {
    closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));
}

if (newCourseForm) {
    newCourseForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("course-title")?.value.trim() || "";
        const author = document.getElementById("course-author")?.value.trim() || "";
        const category = document.getElementById("course-category")?.value.trim() || "";
        const description = (
            document.getElementById("course-desc")?.value ||
            document.getElementById("course-description")?.value ||
            ""
        ).trim();

        if (!title || !author || !category) return;

        const payload = { title, author, category, description };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "No se pudo guardar el curso en la base de datos");
            }

            newCourseForm.reset();
            if (modal) modal.classList.add("hidden");
            await fetchCourses();
            alert("¡Curso publicado correctamente!");
        } catch (error) {
            // Respaldo local si se prueba sin backend activo
            const fallbackCourse = { id: Date.now(), ...payload };
            courses.unshift(fallbackCourse);
            localStorage.setItem("learnova_courses", JSON.stringify(courses));

            newCourseForm.reset();
            if (modal) modal.classList.add("hidden");
            filterCourses();
            alert(`Guardado localmente (${error.message})`);
        }
    });
}

// Inicializar vista
fetchCourses();