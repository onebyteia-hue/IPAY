import {
  getState,
  updateLives,
  updateCoins,
  updateProgress,
  persistCurrentUser,
} from "../modules/gameState.js";
import { navigate } from "../modules/router.js";
import { obtenerPreguntas } from "../services/firestoreService.js";
import { getRandomQuestions } from "../modules/utils.js";

import { getLocalQuestions } from "../services/storageService.js";

import { ProgressBar } from "./components/progressBar.js";

import {
  getTiempoRestante,
  getLivesReal,
  loseLife,
} from "../modules/gameState.js";

export async function gameView(app) {
  const state = getState();
  const userId = state.currentUser?.id || state.currentUser?.nombre; // ✅ AQUÍ

  let intervalVidas; // 🔥 declarar arriba

  intervalVidas = setInterval(() => {
    const el = document.getElementById("timer");
    if (!el) {
      clearInterval(intervalVidas);
      return;
    }

    const restante = getTiempoRestante(userId);

    const min = Math.floor(restante / 60000);
    const sec = Math.floor((restante % 60000) / 1000);

    el.textContent =
      restante > 0 ? `${min}:${sec.toString().padStart(2, "0")}` : "Listo ❤️";
  }, 1000);

  // 🔥 BLOQUEO REAL
  if (getLivesReal(userId) <= 0) {
    mostrarSinVidasBloqueo(app);
    return;
  }
  const nivelActual = Number(state.nivel || state.currentUser?.nivel || 1);

  function volverAlPerfil() {
    if (state.currentUser) {
      navigate("student-profile", { user: state.currentUser });
      return;
    }
    clearInterval(intervalVidas);
    navigate("student");
  }

  let preguntas = [];

  try {
    preguntas = await obtenerPreguntas();
  } catch (error) {
    preguntas = getLocalQuestions();

    if (!preguntas.length) {
      alert(
        "No se pudieron cargar preguntas desde internet ni desde almacenamiento local.",
      );
      return volverAlPerfil();
    }

    alert("Sin conexion: se usaran las preguntas guardadas localmente.");
  }

  let preguntasNivel = preguntas.filter(
    (pregunta) => Number(pregunta.nivel) === nivelActual,
  );

  if (preguntasNivel.length === 0) {
    alert(`No hay preguntas registradas para el nivel ${nivelActual}.`);
    return volverAlPerfil();
  }

  let preguntasJuego = getRandomQuestions(preguntasNivel, 10);

  let index = 0;
  let correctas = 0;
  let intentoRegistrado = false;
  let intentoCerrado = false;

  renderPregunta();

  function renderPregunta() {
    const total = preguntasJuego.length;
    const actual = index + 1;

    if (index >= preguntasJuego.length) {
      return finalizarJuego();
    }

    const p = preguntasJuego[index];

    app.innerHTML = `
  <div class="card">

    ${ProgressBar({ actual, total })}

    <h3>Pregunta ${actual}/${total}</h3>

    <p>${p.enunciado}</p>

    ${p.imagen ? `<img class="game-img" src="./assets/images/${p.imagen}" />` : ""}

    <div id="options">
      ${p.opciones
        .map(
          (op, i) => `
        <button class="btn option" data-i="${i}">
          ${op}
        </button>
      `,
        )
        .join("")}
    </div>

    <p>
  ❤️ Te quedan <span id="vidas">${getLivesReal(userId)}</span> corazones
</p>
<p>
  ⏳ Recuperación en: <span id="timer">--:--</span>
</p>
    <button class="btn btn-secondary" id="finish-attempt">Terminar intento</button>
  </div>
`;

    document.querySelectorAll(".option").forEach((btn) => {
      btn.onclick = () => verificarRespuesta(btn, p.correcta);
    });

    document.getElementById("finish-attempt").onclick = () => terminarIntento();
  }

  function verificarRespuesta(btn, correcta) {
    if (intentoCerrado) return;

    const seleccion = parseInt(btn.dataset.i);
    const esCorrecta = seleccion === correcta;

    if (esCorrecta) {
      correctas++;
      btn.style.background = "green";
    } else {
      btn.style.background = "red";
      const sinVidas = perderVida();

      if (sinVidas) {
        return;
      }
    }

    document.querySelectorAll(".option").forEach((optionButton) => {
      optionButton.disabled = true;
    });

    mostrarFeedbackRespuesta(esCorrecta);
  }

  function perderVida() {
    const vidas = loseLife(userId); // 🔥 ÚNICO SISTEMA

    if (vidas <= 0) {
      updateLives(0);
      registrarIntento(0);
      intentoCerrado = true;

      document.querySelectorAll(".option").forEach((btn) => {
        btn.disabled = true;
      });

      mostrarSinVidasModal();
      return true;
    }

    updateLives(vidas);
    persistCurrentUser();

    return false;
  }

  function terminarIntento() {
    const ok = confirm("¿Seguro que deseas terminar este intento?");

    if (!ok) return;

    finalizarJuego(true);
  }

  function mostrarFeedbackRespuesta(esCorrecta) {
    const modal = document.createElement("div");
    modal.innerHTML = `
      <div class="student-modal-overlay">
        <div class="card answer-feedback-card">
          <h3>${esCorrecta ? "✅ Respuesta correcta" : "❌ Respuesta incorrecta"}</h3>
          <p>${esCorrecta ? "Muy bien, puedes continuar a la siguiente pregunta." : "Se descontó un corazon. Revisa con calma y sigue intentando."}</p>
          <button class="btn" id="continue-answer">Continuar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#continue-answer").onclick = () => {
      modal.remove();
      index++;
      renderPregunta();
    };
  }

  function mostrarSinVidasModal() {
    const modal = document.createElement("div");
    modal.innerHTML = `
      <div class="student-modal-overlay">
        <div class="card answer-feedback-card">
          <h3>💀 Sin corazones</h3>
          <p>Se terminaron tus corazones. Este intento se cerrara y volveras a tu perfil.</p>
          <button class="btn" id="accept-no-lives">Aceptar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#accept-no-lives").onclick = () => {
      modal.remove();
      volverAlPerfil();
    };
  }

  function finalizarJuego(finalizadoPorUsuario = false) {
    let monedas = 0;
    let estrellas = 0;

    if (correctas === 10) monedas = 3;
    else if (correctas >= 8) monedas = 2;
    else if (correctas >= 6) monedas = 1;

    if (correctas === 10) estrellas = 3;
    else if (correctas >= 8) estrellas = 2;
    else if (correctas >= 6) estrellas = 1;

    updateCoins(state.monedas + monedas);
    registrarIntento(estrellas);
    clearInterval(intervalVidas);

    app.innerHTML = `
      <div class="card">
        <h2>🏁 Resultado</h2>

        <p>${finalizadoPorUsuario ? "Intento terminado por el estudiante." : "Intento completado."}</p>
        <p>Nivel jugado: ${nivelActual}</p>
        <p>Correctas: ${correctas}/10</p>
        <p>⭐ Estrellas obtenidas: ${estrellas}</p>
        <p>💰 Monedas ganadas: ${monedas}</p>
        <p>❤️ Corazones actuales: ${getLivesReal(userId)}/10</p>

        <button class="btn" id="retry">Reintentar</button>
        
        <button class="btn btn-secondary" id="exit">Salir</button>
      </div>
    `;

    document.getElementById("retry").onclick = () => navigate("game");
    document.getElementById("exit").onclick = () => volverAlPerfil();
  }

  function registrarIntento(estrellas) {
    if (intentoRegistrado) return;

    const nivelAntes = getState().nivel;

    // 🔥 IMPORTANTE: usar "correctas", NO estrellas
    updateProgress(nivelActual, correctas, 1);

    const nivelDespues = getState().nivel;

    // 🎉 detectar subida de nivel
    if (nivelDespues > nivelAntes) {
      mostrarSubidaNivel(nivelDespues);
    }

    
    intentoRegistrado = true;
  }

  

  function mostrarSinVidasBloqueo(app) {
    app.innerHTML = `
    <div class="card">
      <h2>💀 Sin corazones</h2>
      <p>No tienes corazones disponibles.</p>
      <p>Intenta nuevamente en 
        <span id="timer">--:--</span> segundos ⏳
      </p>

      <button class="btn" id="volver">Volver</button>
    </div>
  `;

    const interval = setInterval(() => {
      const el = document.getElementById("timer");
      if (!el) {
        clearInterval(interval);
        return;
      }

      const restante = getTiempoRestante(userId);

      const min = Math.floor(restante / 60000);
      const sec = Math.floor((restante % 60000) / 1000);

      el.textContent =
        restante > 0 ? `${min}:${sec.toString().padStart(2, "0")}` : "Listo ❤️";
    }, 1000);

    document.getElementById("volver").onclick = () => {
      clearInterval(intervalVidas);
      navigate("student");
    };
  }
}

function mostrarSubidaNivel(nivel) {
  const modal = document.createElement("div");

  modal.innerHTML = `
    <div class="student-modal-overlay">
      <div class="card">
        <h2>🎉 Nivel ${nivel}</h2>
        <p>¡Has desbloqueado el siguiente nivel!</p>
        <button class="btn" id="ok">Continuar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#ok").onclick = () => modal.remove();
}
