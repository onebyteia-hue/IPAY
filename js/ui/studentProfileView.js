import { navigate } from "../modules/router.js";
import { getState, setUser, TOTAL_LEVELS } from "../modules/gameState.js";
import { getLivesReal, getTiempoRestante } from "../modules/gameState.js";
import { hasQuestionsForLevel } from "../services/levelQuestionService.js";

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
  const preguntasDisponibles = await hasQuestionsForLevel(nivelActual);
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
    <div class="student-profile-page">
      <div class="student-profile-topbar">
        <button class="btn btn-secondary" id="back-top">Volver</button>
      </div>

      <div class="card student-modal-card">
        <div class="student-profile-header">
          <p class="student-profile-label">Perfil del estudiante</p>
          <h2 class="student-profile-name">${user.nombre || "Estudiante sin nombre"}</h2>
          <p class="student-profile-subtitle">Revisa tus datos y tu avance antes de comenzar a jugar.</p>
        </div>
        

        <div class="student-detail-grid">
          <p><strong>Curso:</strong> ${user.curso || "No registrado"}</p>
          <p><strong>Nivel actual:</strong> ${user.nivel ?? 1}</p>
          <p><strong>Monedas:</strong> ${user.monedas ?? 0}</p>
          <p>
  <strong>Corazones:</strong> 
  <span id="vidas">${vidasActuales}</span>/10
</p>

<p>
  <strong>Recuperación:</strong> 
  <span id="timer">${siguienteVidaTexto}</span>
</p>
        </div>
        <button class="btn" id="play" ${preguntasDisponibles ? "" : "disabled"}>Comenzar a jugar</button>
        <p id="play-help">${preguntasDisponibles ? `Nivel listo para jugar.` : `No hay preguntas disponibles para el nivel ${nivelActual}.`}</p>
        <br/><br/>

        <div class="student-progress-box">
          <h4>Avance en niveles</h4>
          <div class="student-progress-list">
            ${progresoHtml}
          </div>
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

  document.getElementById("play").onclick = () => {
    clearInterval(intervalPerfil);

    if (!preguntasDisponibles) {
      return;
    }

    if (getLivesReal(userId) <= 0) {
      alert("💀 Sin corazones. Espera a que se recarguen ⏳");
      return;
    }

    navigate("game");
  };

  document.getElementById("back-top").onclick = () => {
    clearInterval(intervalPerfil);
    navigate("student");
  };
}
