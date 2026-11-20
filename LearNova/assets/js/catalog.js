const API_URL = "/.netlify/functions/courses";
const SESSION_KEY = "learnova_user";
const PRICE_PER_HOUR = 10000; // Puedes ajustar este valor según tu moneda

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

// Elementos de compra de tiempo y sala de curso
const buyTimeModal = document.getElementById("buy-time-modal");
const closeBuyModalBtn = document.getElementById("btn-close-buy-modal");
const buyTimeForm = document.getElementById("buy-time-form");
const hoursInput = document.getElementById("hours-input");
const priceBreakdown = document.getElementById("price-breakdown");

const coursePlayerModal = document.getElementById("course-player-modal");
const playerCategory = document.getElementById("player-category");
const playerTitle = document.getElementById("player-title");
const playerAuthor = document.getElementById("player-author");
const playerDescription = document.getElementById("player-description");
const btnLeaveCourse = document.getElementById("btn-leave-course");
const btnOpenBuyFromPlayer = document.getElementById("btn-open-buy-from-player");

const cornerTimer = document.getElementById("corner-timer");
const cornerTimerDisplay = document.getElementById("corner-timer-display");
const btnExitCourseCorner = document.getElementById("btn-exit-course-corner");

let allCourses = [];
let pendingCourseToEnter = null;
let activeCourse = null;
let countdownInterval = null;

function getLoggedUser() {
  try {
    const user = JSON.parse(localStorage.getItem(SESSION_KEY));
    return user && user.email ? user : null;
  } catch {
    return null;
  }
}

function getWalletKey() {
  const user = getLoggedUser();
  return user ? `learnova_seconds_${user.email.toLowerCase()}` : null;
}

function getRemainingSeconds() {
  const key = getWalletKey();
  if (!key) return 0;
  const val = Number(localStorage.getItem(key) || "0");
  return Number.isFinite(val) && val > 0 ? Math.floor(val) : 0;
}

function setRemainingSeconds(seconds) {
  const key = getWalletKey();
  if (!key) return;
  const safeSec = Math.max(0, Math.floor(seconds));
  localStorage.setItem(key, String(safeSec));
  updateTimerDisplay(safeSec);
}

function formatSeconds(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remSec = sec % 60;
  return [hrs, mins, remSec].map((n) => String(n).padStart(2, "0")).join(":");
}

function updateTimerDisplay(seconds = getRemainingSeconds()) {
  if (cornerTimerDisplay) {
    cornerTimerDisplay.textContent = formatSeconds(seconds);
  }
}

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Cálculo de precio con 25% de descuento si se compran MÁS de 5 horas
function calculatePurchase(hours) {
  const validHours = Math.max(0, Number(hours) || 0);
  const subtotal = validHours * PRICE_PER_HOUR;
  const hasDiscount = validHours > 5;
  const discountAmount = hasDiscount ? subtotal * 0.25 : 0;
  const total = subtotal - discountAmount;
  return { validHours, subtotal, hasDiscount, discountAmount, total };
}

function renderPriceBreakdown() {
  if (!hoursInput || !priceBreakdown) return;
  const { validHours, subtotal, hasDiscount, discountAmount, total } = calculatePurchase(hoursInput.value);

  if (validHours <= 0) {
    priceBreakdown.innerHTML = "Ingresa una cantidad válida de horas.";
    return;
  }

  if (hasDiscount) {
    priceBreakdown.innerHTML = `
      <div>Subtotal (${validHours} h): <del>$${subtotal.toLocaleString("es-CO")}</del></div>
      <div>Descuento (25% por superar 5 horas): <strong>-$${discountAmount.toLocaleString("es-CO")}</strong> <span class="discount-tag">25% OFF</span></div>
      <div style="margin-top: 0.3rem; font-size: 1.05rem;">Total a pagar: <strong>$${total.toLocaleString("es-CO")}</strong></div>
    `;
  } else {
    priceBreakdown.innerHTML = `
      <div>Tiempo a recibir: <strong>${validHours} hora(s)</strong> (${formatSeconds(validHours * 3600)})</div>
      <div style="margin-top: 0.3rem; font-size: 1.05rem;">Total a pagar: <strong>$${total.toLocaleString("es-CO")}</strong></div>
      <div style="font-size: 0.78rem; color: #64748b; margin-top: 0.25rem;">Compra más de 5 horas para obtener 25% de descuento.</div>
    `;
  }
}

function openBuyTimeModal(course = null) {
  const user = getLoggedUser();
  if (!user) {
    alert("Debes iniciar sesión para comprar tiempo y acceder a los cursos.");
    window.location.href = "login.html";
    return;
  }
  pendingCourseToEnter = course;
  renderPriceBreakdown();
  if (buyTimeModal) buyTimeModal.classList.remove("hidden");
}

function closeBuyTimeModal() {
  if (buyTimeModal) buyTimeModal.classList.add("hidden");
  pendingCourseToEnter = null;
}

function stopCourseTimer() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  if (cornerTimer) cornerTimer.classList.remove("active");
}

function exitActiveCourse(reasonMessage = "") {
  stopCourseTimer();
  activeCourse = null;
  if (coursePlayerModal) coursePlayerModal.classList.remove("active");
  if (reasonMessage) {
    alert(reasonMessage);
  }
}

function startCourseSession(course) {
  const remaining = getRemainingSeconds();
  if (remaining <= 0) {
    openBuyTimeModal(course);
    return;
  }

  stopCourseTimer();
  activeCourse = course;

  if (playerCategory) playerCategory.textContent = course.category || "Curso";
  if (playerTitle) playerTitle.textContent = course.title || "Curso";
  if (playerAuthor) playerAuthor.textContent = `Creador: ${course.author || "Comunidad"}`;
  if (playerDescription) playerDescription.textContent = course.description || "";

  if (coursePlayerModal) coursePlayerModal.classList.add("active");
  if (cornerTimer) cornerTimer.classList.add("active");
  updateTimerDisplay(remaining);

  countdownInterval = setInterval(() => {
    const currentSec = getRemainingSeconds();
    if (currentSec <= 1) {
      setRemainingSeconds(0);
      exitActiveCourse("Tu tiempo se ha agotado. Se ha cerrado la sesión del curso automáticamente.");
      return;
    }
    setRemainingSeconds(currentSec - 1);
  }, 1000);
}

if (closeBuyModalBtn) closeBuyModalBtn.addEventListener("click", closeBuyTimeModal);
if (hoursInput) hoursInput.addEventListener("input", renderPriceBreakdown);

if (buyTimeForm) {
  buyTimeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const { validHours, total, hasDiscount } = calculatePurchase(hoursInput.value);
    if (validHours <= 0) return;

    const addedSeconds = Math.round(validHours * 3600);
    const nextSeconds = getRemainingSeconds() + addedSeconds;
    setRemainingSeconds(nextSeconds);

    const courseToResume = pendingCourseToEnter || activeCourse;
    closeBuyTimeModal();

    alert(
      `¡Compra exitosa! Agregaste ${validHours} h (${formatSeconds(addedSeconds)}) por $${total.toLocaleString("es-CO")}${hasDiscount ? " con 25% de descuento" : ""}.`
    );

    if (courseToResume) {
      startCourseSession(courseToResume);
    }
  });
}

if (btnLeaveCourse) {
  btnLeaveCourse.addEventListener("click", () => {
    exitActiveCourse("Saliste del curso. Tu tiempo restante quedó pausado y guardado.");
  });
}

if (btnExitCourseCorner) {
  btnExitCourseCorner.addEventListener("click", () => {
    exitActiveCourse("Saliste del curso. Tu tiempo restante quedó pausado y guardado.");
  });
}

if (btnOpenBuyFromPlayer) {
  btnOpenBuyFromPlayer.addEventListener("click", () => {
    openBuyTimeModal(activeCourse);
  });
}

if (openModalBtn && courseModal) {
  openModalBtn.addEventListener("click", () => {
    const user = getLoggedUser();
    if (!user) {
      alert("Debes iniciar sesión o crear una cuenta para publicar un curso.");
      window.location.href = "login.html";
      return;
    }

    const authorInput = document.getElementById("course-author");
    if (authorInput && user.name && !authorInput.value) {
      authorInput.value = user.name;
    }

    courseModal.classList.remove("hidden");
  });
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
    allCourses = await response.json();
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

  filtered.forEach((course, index) => {
    const safeTitle = escapeHtml(course.title);
    const safeAuthor = escapeHtml(course.author);
    const safeCategory = escapeHtml(course.category);
    const safeDescription = escapeHtml(course.description || "");
    const courseId = course.id || `course-${index}`;

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
        <button type="button" class="btn-primary btn-enter-course" data-course-id="${escapeHtml(courseId)}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border: none; cursor: pointer;">Entrar</button>
      </div>
    `;

    const enterBtn = card.querySelector(".btn-enter-course");
    enterBtn.addEventListener("click", () => {
      const user = getLoggedUser();
      if (!user) {
        alert("Debes iniciar sesión para comprar tiempo y entrar a los cursos.");
        window.location.href = "login.html";
        return;
      }

      if (getRemainingSeconds() <= 0) {
        openBuyTimeModal(course);
      } else {
        startCourseSession(course);
      }
    });

    coursesGrid.appendChild(card);
  });
}

if (searchInput) searchInput.addEventListener("input", renderCourses);
if (categoryFilter) categoryFilter.addEventListener("change", renderCourses);

if (newCourseForm) {
  newCourseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = getLoggedUser();
    if (!user) {
      alert("Debes iniciar sesión para publicar un curso.");
      window.location.href = "login.html";
      return;
    }

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

updateTimerDisplay();
fetchCourses();