import { navigate } from "../modules/router.js";
import { getState, setUser, TOTAL_LEVELS } from "../modules/gameState.js";
import { MAX_VIDAS, recoverLives, TIEMPO_POR_VIDA_MS } from "../services/lifeService.js";

function construirResumenProgreso(user) {
  const niveles = Array.from({ length: TOTAL_LEVELS }, (_, index) => index + 1);

  return niveles
    .map((nivel) => {
      const progresoNivel = user.progreso?.[nivel] || {};
      const estrellas = progresoNivel.estrellas || 0;
      const completado = progresoNivel.completado || nivel < user.nivel;
      const estado = completado ? "Completado" : "Pendiente";
      const intentos = progresoNivel.intentos;
      const intentosTexto = Number.isFinite(intentos) ? intentos : "No registrado";

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

export function studentProfileView(app, data = {}) {
  app.classList.remove("teacher-view");

  const state = getState();
  const user = recoverLives(data.user || state.currentUser);

  if (!user) {
    navigate("student");
    return;
  }

  const progresoHtml = construirResumenProgreso(user);
  const tiempoRestanteMs = user.vidas >= MAX_VIDAS
    ? 0
    : Math.max(0, TIEMPO_POR_VIDA_MS - (Date.now() - (Number(user.ultimoTiempoVida) || Date.now())));
  const minutos = Math.floor(tiempoRestanteMs / 60000);
  const segundos = Math.floor((tiempoRestanteMs % 60000) / 1000);
  const siguienteVidaTexto = user.vidas >= MAX_VIDAS
    ? "Corazones completos"
    : `Siguiente corazon en ${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

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
          <p><strong>Corazones:</strong> ${user.vidas ?? MAX_VIDAS}/${MAX_VIDAS}</p>
          <p><strong>Recuperacion:</strong> ${siguienteVidaTexto}</p>
        </div>
        <button class="btn" id="play">Comenzar a jugar</button>
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

  document.getElementById("play").onclick = () => {
    setUser(user);
    navigate("game");
  };

  document.getElementById("back-top").onclick = () => {
    navigate("student");
  };
}
