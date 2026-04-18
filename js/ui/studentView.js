import {
  guardarUsuario,
  sincronizarUsuario,
  eliminarUsuario,
} from "../services/firestoreService.js";
import { saveLocalUsers, getLocalUsers } from "../services/storageService.js";
import { getLivesReal, getTiempoRestante } from "../modules/gameState.js";

import { navigate } from "../modules/router.js";
import { getState } from "../modules/gameState.js";
import { exportarProgreso } from "../modules/utils.js";
import { backButton, activarBack } from "./components/backButton.js";

import { obtenerUsuarios } from "../services/firestoreService.js";

import { escucharUsuariosRealtime } from "../services/firestoreService.js";

export async function studentView(app) {
  app.classList.remove("teacher-view");

  // let users = [];

  // // 🔥 NUEVO: cargar también desde Firestore
  // try {
  //   const firebaseUsers = await obtenerUsuarios();

  //   // 🔥 FIRESTORE ES LA FUENTE PRINCIPAL
  //   users = firebaseUsers;

  //   // 🔥 guardar como cache local
  //   saveLocalUsers(users);
  // } catch (error) {
  //   console.error("Error cargando desde Firebase:", error);

  //   // 🔥 fallback SOLO si falla internet
  //   users = getLocalUsers();
  // }

  let users = [];

  // 🔥 SUSCRIPCIÓN EN TIEMPO REAL
  const unsubscribe = escucharUsuariosRealtime((firebaseUsers) => {
    users = firebaseUsers;

    // cache local opcional
    saveLocalUsers(users);

    renderCursos();
    renderList();
  });

  let cursoActivo = "Todos";
  let filtroNombre = "";

  app.innerHTML = `
    <div class="card student-panel">
      <h2>👨‍🎓 Panel Estudiante</h2>
      <p class="student-panel-subtitle">Busca tu curso y luego tu nombre para entrar mas rapido.</p>

      <div class="student-toolbar">
        <button class="btn" id="btn-add" type="button">
          Registrar estudiantes
        </button>

        <button class="btn btn-secondary" id="btn-map" type="button">
          Ver niveles
        </button>
        <button class="btn" id="export" type="button">Exportar progreso</button>
      </div>

      <div class="student-filters">
        <input id="student-search" class="student-search" placeholder="Buscar por nombre..." />
        <div id="course-list" class="course-list"></div>
      </div>

      <div id="student-summary" class="student-summary"></div>
      <ul id="user-list" class="student-list"></ul>
      ${backButton("student")}
<br/><br/>
    </div>
  `;

  const list = document.getElementById("user-list");
  const summary = document.getElementById("student-summary");
  const courseList = document.getElementById("course-list");
  const searchInput = document.getElementById("student-search");
  const addButton = document.getElementById("btn-add");
  document
    .getElementById("btn-map")
    .addEventListener("click", () => navigate("map"));

  function obtenerCursos() {
    const cursos = [
      ...new Set(
        users.map((user) => (user.curso || "Sin curso").trim() || "Sin curso"),
      ),
    ];
    return cursos.sort((a, b) => a.localeCompare(b));
  }

  function obtenerUsuariosFiltrados() {
    return users
      .filter((user) => {
        const nombre = (user.nombre || "").toString();
        const curso = (user.curso || "Sin curso").trim() || "Sin curso";
        const coincideCurso = cursoActivo === "Todos" || curso === cursoActivo;
        const coincideNombre = nombre
          .toLowerCase()
          .includes(filtroNombre.toLowerCase().trim());

        return coincideCurso && coincideNombre;
      })
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }

  function renderCursos() {
    const cursos = ["Todos", ...obtenerCursos()];

    courseList.innerHTML = cursos
      .map((curso) => {
        const total =
          curso === "Todos"
            ? users.length
            : users.filter(
                (user) =>
                  ((user.curso || "Sin curso").trim() || "Sin curso") === curso,
              ).length;

        return `
          <button class="course-chip ${curso === cursoActivo ? "active" : ""}" data-curso="${curso}">
            ${curso} <span>${total}</span>
          </button>
        `;
      })
      .join("");

    courseList.querySelectorAll(".course-chip").forEach((button) => {
      button.addEventListener("click", () => {
        cursoActivo = button.dataset.curso;
        renderCursos();
        renderList();
      });
    });
  }

  function guardarUsuariosLocales() {
    saveLocalUsers(users);
  }

  function eliminarUsuarioLocal(user) {
    users = users.filter((item) => {
      if (user.id && item.id) {
        return item.id !== user.id;
      }

      return !(item.nombre === user.nombre && item.curso === user.curso);
    });

    guardarUsuariosLocales();
  }

  function crearTarjetaAdmin(user) {
    const item = document.createElement("li");
    item.className = "admin-student-item";

    const userId = user.id || user.nombre;

    item.innerHTML = `
    <div class="admin-student-info">
      <strong>${user.nombre}</strong>
      <span>
        ${user.curso || "Sin curso"} | 
        Nivel ${user.nivel ?? 1} | 
        ❤️ ${getLivesReal(userId)}
      </span>
    </div>
    <button class="btn btn-danger" type="button">Eliminar</button>
  `;

    item.querySelector(".btn-danger").addEventListener("click", async () => {
      const ok = confirm(`¿Eliminar a ${user.nombre}?`);
      if (!ok) return;

      if (user.id) {
        await eliminarUsuario(user.id);
      }

      eliminarUsuarioLocal(user);
      renderCursos();
      renderList();
      item.remove();
    });

    return item;
  }

  function abrirAdminModal() {
    const modal = document.createElement("div");
    modal.innerHTML = `
      <div class="student-modal-overlay">
        <div class="card admin-modal-card">
          <div class="admin-modal-header">
            <h3>Administrar estudiantes</h3>
            <p>Registra nuevos estudiantes o busca uno existente para eliminarlo.</p>
          </div>

          <form id="admin-student-form" class="admin-student-form">
            <input id="admin-name" placeholder="Nombre completo" required />
            <input id="admin-course" placeholder="Curso" required />

            <div class="admin-modal-actions">
              <button class="btn" type="submit">Guardar</button>
              <button class="btn btn-secondary" type="button" id="admin-cancel">Cancelar</button>
            </div>
          </form>

          <div class="admin-student-manager">
            <h4>Buscar estudiantes</h4>
            <input id="admin-student-search" placeholder="Buscar por nombre o curso..." />
            <ul id="admin-student-results" class="admin-student-list"></ul>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const form = modal.querySelector("#admin-student-form");
    const nameInput = modal.querySelector("#admin-name");
    const courseInput = modal.querySelector("#admin-course");
    const cancelButton = modal.querySelector("#admin-cancel");
    const adminSearch = modal.querySelector("#admin-student-search");
    const adminResults = modal.querySelector("#admin-student-results");

    function cerrarModal() {
      modal.remove();
    }

    function renderAdminList() {
      const query = adminSearch.value.toLowerCase().trim();
      const filtrados = users
        .filter((user) => {
          const nombre = (user.nombre || "").toString().toLowerCase();
          const curso = (user.curso || "").toLowerCase();
          return !query || nombre.includes(query) || curso.includes(query);
        })
        .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

      adminResults.innerHTML = "";

      if (filtrados.length === 0) {
        adminResults.innerHTML = `
          <li class="student-empty-state">No hay estudiantes para mostrar.</li>
        `;
        return;
      }

      filtrados.forEach((user) => {
        adminResults.appendChild(crearTarjetaAdmin(user));
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const nombre = nameInput.value.trim();
      const curso = courseInput.value.trim();

      if (!nombre || !curso) {
        alert("Completa nombre y curso.");
        return;
      }

      const user = {
        nombre,
        curso,
        nivel: 1,
        monedas: 0,
        vidas: 10,
        progreso: {},
        ultimoTiempoVida: Date.now(),
      };

      const userGuardado = await guardarUsuario(user);
      const userFinal = userGuardado || user;

      users.push(userFinal);
      guardarUsuariosLocales();
      renderCursos();
      renderList();
      renderAdminList();
      form.reset();
      nameInput.focus();
    });

    cancelButton.addEventListener("click", cerrarModal);
    adminSearch.addEventListener("input", renderAdminList);
    renderAdminList();
    nameInput.focus();
  }

  function abrirAccesoAdmin() {
    const modal = document.createElement("div");
    modal.innerHTML = `
      <div class="student-modal-overlay">
        <div class="card admin-access-card">
          <h3>Acceso administrador</h3>
          <p>Ingresa la contraseña para administrar estudiantes.</p>

          <form id="admin-access-form" class="admin-access-form">
            <input id="admin-password" type="password" placeholder="Contraseña" required />

            <div class="admin-modal-actions">
              <button class="btn" type="submit">Ingresar</button>
              <button class="btn btn-secondary" type="button" id="admin-access-cancel">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const form = modal.querySelector("#admin-access-form");
    const passwordInput = modal.querySelector("#admin-password");
    const cancelButton = modal.querySelector("#admin-access-cancel");

    function cerrarModal() {
      modal.remove();
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (passwordInput.value !== "admin123") {
        alert("Contraseña incorrecta");
        passwordInput.focus();
        passwordInput.select();
        return;
      }

      cerrarModal();
      abrirAdminModal();
    });

    cancelButton.addEventListener("click", cerrarModal);
    passwordInput.focus();
  }

  let usuariosCache = [];

  function renderList() {
    const usuariosFiltrados = obtenerUsuariosFiltrados();
    usuariosCache = usuariosFiltrados;

    list.innerHTML = "";
    summary.innerHTML = `
    <div class="student-summary-card">
      <strong>${cursoActivo}</strong>
      <span>${usuariosFiltrados.length} estudiante(s) visibles</span>
    </div>
  `;

    if (usuariosFiltrados.length === 0) {
      list.innerHTML = `
      <li class="student-empty-state">
        No se encontraron estudiantes con ese filtro.
      </li>
    `;
      return;
    }

    usuariosFiltrados.forEach((u) => {
      const userId = u.id || u.nombre;

      const li = document.createElement("li");
      li.className = "student-list-item";

      li.innerHTML = `
      <button class="btn btn-secondary student-btn">
        <span class="student-name">${u.nombre}</span>
        <span class="student-course-badge">${u.curso || "Sin curso"}</span>
        
        <span class="student-meta">
          ⭐ Nivel: ${u.nivel} | 💰 ${u.monedas} | 
          ❤️ <span class="vidas" data-id="${userId}"></span> |
          ⏳ <span class="timer" data-id="${userId}"></span>
        </span>
      </button>
    `;

      li.addEventListener("click", () => {
        clearInterval(intervalLista);
        navigate("student-profile", { user: u });
      });

      list.appendChild(li);
    });

    // 🔥 actualización inicial
    actualizarVidasLista(usuariosCache);
  }

  const intervalLista = setInterval(() => {
    actualizarVidasLista(usuariosCache);
  }, 1000);

  searchInput.addEventListener("input", (event) => {
    filtroNombre = event.target.value;
    renderList();
  });

  renderCursos();
  renderList();

  // BOTÓN REGISTRO
  addButton.addEventListener("click", abrirAccesoAdmin);

  document.getElementById("export").onclick = () => {
    exportarProgreso(getState());
  };
  activarBack("home");
  document.addEventListener("click", (e) => {
    if (e.target.closest(".back-button")) {
      clearInterval(intervalLista);
    }
  });

  function actualizarVidasLista(usuarios) {
    usuarios.forEach((u) => {
      const userId = u.id || u.nombre;

      const key = `corazones_${userId}`;

      // 🔥 inicializar si no existe
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, u.vidas ?? 10);
      }

      const vidas = getLivesReal(userId);
      const restante = getTiempoRestante(userId);

      const min = Math.floor(restante / 60000);
      const sec = Math.floor((restante % 60000) / 1000);

      document.querySelectorAll(`.vidas[data-id="${userId}"]`).forEach((el) => {
        el.textContent = vidas;
      });

      document.querySelectorAll(`.timer[data-id="${userId}"]`).forEach((el) => {
        el.textContent =
          vidas >= 10 ? "❤️" : `${min}:${sec.toString().padStart(2, "0")}`;
      });
    });
  }
}



document.addEventListener("click", (e) => {
  if (e.target.closest(".back-button")) {
    unsubscribe(); // 🔥 DETENER ESCUCHA
    clearInterval(intervalLista);
  }
});