import { navigate } from "../modules/router.js";
import { getState, setUser, TOTAL_LEVELS } from "../modules/gameState.js";
import { getLivesReal, getTiempoRestante } from "../modules/gameState.js";
import {
  getAvailableContents,
  hasQuestionsForLevel,
  getQuestionsForLevel,
} from "../services/levelQuestionService.js";

const MIN_QUESTIONS = 10;

function construirResumenProgreso(user) {
  const niveles = Array.from({ length: TOTAL_LEVELS }, (_, index) => index + 1);

  return niveles
    .map((nivel) => {
      const progresoNivel = user.progreso?.[nivel] || {};
      const estrellas = progresoNivel.estrellas || 0;
      const completado = progresoNivel.completado || nivel < user.nivel;
      const estado = completado ? "Completado" : "Pendiente";
      const intentos = progresoNivel.intentos;
      const intentosTexto = Number.isFinite(intentos)
        ? intentos
        : "No registrado";

      return `
        <div class="student-progress-item">
          <div class="student-progress-main">
            <span class="student-progress-level">Nivel ${nivel}</span>
            <span class="student-progress-status">${estado}</span>
          </div>
          <div class="student-progress-info">
            <span class="student-progress-stars">⭐ ${estrellas}</span>
            <span class="student-progress-attempts">Intentos: ${intentosTexto}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

export async function studentProfileView(app, data = {}) {
  app.classList.remove("teacher-view");

  const state = getState();
  const user = data.user || state.currentUser;

  if (!user) {
    navigate("student");
    return;
  }

  setUser(user);
  localStorage.setItem("vidas", user.vidas);

  const nivelActual = Number(user.nivel ?? 1);
  const contenidosDisponibles = await getAvailableContents();
  let contenidoActivo =
    contenidosDisponibles.find((c) => c !== "MRUV") || "MRUV";
  const preguntasPrimerNivel = await getQuestionsForLevel(nivelActual, contenidoActivo);
  let preguntasDisponibles = preguntasPrimerNivel.length >= MIN_QUESTIONS;
  let totalPreguntasDisponibles = preguntasPrimerNivel.length;
  const progresoHtml = construirResumenProgreso(user);
  const userId = user.id || user.nombre;
  const vidasActuales = getLivesReal(userId);
  const restante = getTiempoRestante(userId);

  const min = Math.floor(restante / 60000);
  const sec = Math.floor((restante % 60000) / 1000);

  const siguienteVidaTexto =
    vidasActuales >= 10
      ? "Corazones completos ❤️"
      : `Siguiente corazón en ${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

  app.innerHTML = `
    <div class="student-profile-page" style=" /* Este div ahora es solo un wrapper de fondo */
      width: 100%; 
      background-color: #f7f9fc; 
      padding: 20px 10px 60px 10px; /* Padding general para la página */
      box-sizing: border-box;
    ">
      <div class="card student-modal-card" style=" /* La tarjeta principal */
        overflow: hidden; /* Mantiene el contenido dentro de los bordes redondeados */
        box-shadow: 0 20px 60px rgba(0,0,0,0.08); 
        max-width: 900px; /* Aumentado para un look más profesional en pantallas grandes */
        width: 100%; 
        height: auto;
        min-height: min-content;
        margin: 0 auto; 
        border-radius: 24px; 
        border: none;
        background: white;
      ">
        
        <!-- Cabecera Hero Profesional -->
        <div class="student-profile-header" style="
          text-align: center; 
          margin: -20px -20px 35px -20px; 
          padding: 50px 20px; 
          background: linear-gradient(135deg, #1cb0f6 0%, #1689c4 100%); 
          border-radius: 24px 24px 0 0; /* Bordes redondeados solo arriba para integrarse con la tarjeta */
        ">
          <p class="student-profile-label" style="
            margin: 0; 
            color: rgba(255, 255, 255, 0.85); 
            font-weight: 800; 
            font-variant: all-small-caps; 
            letter-spacing: 3px; 
            font-size: 0.85rem;
          ">Panel de Control</p>
          
          <h1 class="student-profile-name" style="
            margin: 10px 0; 
            font-size: clamp(1.6rem, 7vw, 3rem); /* Tamaño adaptable para móviles y escritorio */
            color: #ffffff; 
            font-weight: 900; 
            text-shadow: 0 4px 15px rgba(0,0,0,0.2); 
            letter-spacing: -1px; 
            line-height: 1;
          ">
            ${user.nombre || "Estudiante sin nombre"}
          </h1>
          
          <p class="student-profile-subtitle" style="
            margin: 0; 
            color: #ffffff; 
            font-size: 1.1rem; 
            font-weight: 500;
            opacity: 0.9;
          ">Panel de control de avance y estadísticas personales</p>
        </div>

        <div class="student-detail-grid" style=" /* Padding interno para la cuadrícula de detalles */
          padding: 25px;
        ">
          <p><strong>Curso:</strong> ${user.curso || "No registrado"}</p>
          <p><strong>Nivel actual:</strong> ${user.nivel ?? 1}</p>
          <p><strong>Monedas:</strong> ${user.monedas ?? 0}</p>
          <p>
            <strong>Corazones:</strong> 
            <span id="vidas">${vidasActuales}</span>/10
          </p>
          <p style="grid-column: 1 / -1; color: #1cb0f6; font-weight: bold; font-size: 0.9rem;">
            ⏳ <span id="timer">${siguienteVidaTexto}</span>
          </p>
        </div>
        ${contenidosDisponibles.length > 1 ? `
        <div class="student-content-section" style="padding: 0 25px 25px 25px;">
          <label class="content-section-label" for="selected-content">Selecciona un contenido para jugar:</label>
          <select id="selected-content" class="content-section-select">
            ${contenidosDisponibles
              .map(
                (contenido) =>
                  `<option value="${contenido}" ${
                    contenido === contenidoActivo ? "selected" : ""
                  }>${contenido}</option>`,
              )
              .join("")}
          </select>
          <p id="questions-count" class="questions-info"></p>
        </div> 
        ` : `<p class="questions-info" style="padding: 0 25px 25px 25px;">Solo hay un contenido disponible: ${contenidoActivo}</p>`}

        <div class="student-profile-actions" style="padding: 0 25px 25px 25px;">
          <button class="btn btn-secondary" id="back-top">Volver</button>
          <button class="btn btn-play" id="play" ${preguntasDisponibles ? "" : "disabled"}>
            <span class="play-icon">▶️</span>
            <span class="play-text">Jugar: ${contenidoActivo}</span>
          </button>
        </div>

        <p id="play-help" class="student-help-text" style="padding: 0 25px 25px 25px;">
          ${preguntasDisponibles
            ? `Nivel listo para jugar con ${contenidoActivo}.`
            : `Se necesitan al menos ${MIN_QUESTIONS} preguntas. Hay ${totalPreguntasDisponibles}.`}
        </p>

        <div class="student-progress-box" style="padding: 0 25px 25px 25px;">
          <h4>📊 Avance en niveles</h4>
          <div class="student-progress-list">
            ${progresoHtml}
          </div>
        </div>
      </div> <!-- Fin de student-modal-card -->
    </div> <!-- Fin de student-profile-page -->

      <div id="student-modal-overlay" class="modal-overlay hidden">
        <div class="modal-card">
          <h3>Aviso</h3>
          <p id="modal-message"></p>
          <button class="btn btn-secondary" id="modal-close">Entendido</button>
        </div>
      </div>
    </div>
  `;

  const intervalPerfil = setInterval(() => {
    const vidas = getLivesReal(userId);
    const restante = getTiempoRestante(userId);

    const min = Math.floor(restante / 60000);
    const sec = Math.floor((restante % 60000) / 1000);

    const vidasEl = document.getElementById("vidas");
    const timerEl = document.getElementById("timer");

    if (vidasEl) vidasEl.textContent = vidas;

    if (timerEl) {
      timerEl.textContent =
        vidas >= 10
          ? "Corazones completos ❤️"
          : `${min}:${sec.toString().padStart(2, "0")}`;
    }
  }, 1000);

  const selectedContentElement = document.getElementById("selected-content");
  const playButton = document.getElementById("play");
  const playHelp = document.getElementById("play-help");
  const questionsCountEl = document.getElementById("questions-count");
  const modalOverlay = document.getElementById("student-modal-overlay");
  const modalMessage = document.getElementById("modal-message");
  const modalClose = document.getElementById("modal-close");

  function abrirModalInsuficiente(contenido, total) {
    if (modalMessage) {
      modalMessage.textContent = `No hay suficientes preguntas para ${contenido} en el nivel ${nivelActual}. Solo hay ${total} pregunta${
        total === 1 ? "" : "s"
      }, y se requieren al menos ${MIN_QUESTIONS}.`;
    }
    modalOverlay?.classList.remove("hidden");
  }

  function cerrarModal() {
    modalOverlay?.classList.add("hidden");
  }

  async function actualizarEstadoContenido(contenido) {
    contenidoActivo = contenido;
    const preguntasNivel = await getQuestionsForLevel(nivelActual, contenidoActivo);
    totalPreguntasDisponibles = preguntasNivel.length;
    const tienePreguntas = totalPreguntasDisponibles >= MIN_QUESTIONS;

    if (playButton) {
      playButton.textContent = `Jugar: ${contenidoActivo}`;
      playButton.disabled = !tienePreguntas;
    }

    if (playHelp) {
      playHelp.textContent = tienePreguntas
        ? `Nivel listo para jugar con ${contenidoActivo}.`
        : `Se necesitan al menos ${MIN_QUESTIONS} preguntas. Hay ${totalPreguntasDisponibles}.`;
    }

    if (questionsCountEl) {
      questionsCountEl.textContent = `Preguntas disponibles: ${totalPreguntasDisponibles}`;
    }

    preguntasDisponibles = tienePreguntas;
  }

  if (selectedContentElement) {
    selectedContentElement.onchange = (event) => {
      actualizarEstadoContenido(event.target.value);
    };
  }

  if (modalClose) {
    modalClose.onclick = cerrarModal;
  }

  modalOverlay?.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
      cerrarModal();
    }
  });

  document.getElementById("play").onclick = () => {
    clearInterval(intervalPerfil);

    if (!preguntasDisponibles) {
      abrirModalInsuficiente(contenidoActivo, totalPreguntasDisponibles);
      return;
    }

    if (getLivesReal(userId) <= 0) {
      alert("💀 Sin corazones. Espera a que se recarguen ⏳");
      return;
    }

    if (user) {
      user.contenido = contenidoActivo;
      setUser(user);
    }

    navigate("game");
  };

  document.getElementById("back-top").onclick = () => {
    clearInterval(intervalPerfil);
    navigate("student");
  };
}