// Verificar si el usuario ha iniciado sesión
if (localStorage.getItem('auth_token') !== 'true') {
    window.location.href = 'login.html';
}

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('auth_token');
    window.location.href = 'login.html';
});

const tbody = document.getElementById('admin-courses-tbody');

function loadAdminCourses() {
    let courses = JSON.parse(localStorage.getItem('learnova_courses')) || [];
    tbody.innerHTML = '';

    if (courses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #64748B;">No hay cursos registrados.</td></tr>`;
        return;
    }

    courses.forEach(course => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${course.title}</strong></td>
            <td>${course.author}</td>
            <td><span class="badge">${course.category}</span></td>
            <td>
                <button onclick="deleteCourse(${course.id})" style="background-color: #EF4444; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer;">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.deleteCourse = function(id) {
    if (confirm('¿Estás seguro de eliminar este curso?')) {
        let courses = JSON.parse(localStorage.getItem('learnova_courses')) || [];
        courses = courses.filter(c => c.id !== id);
        localStorage.setItem('learnova_courses', JSON.stringify(courses));
        loadAdminCourses();
    }
}

loadAdminCourses();