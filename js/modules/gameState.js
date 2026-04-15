import { upsertLocalUser } from "../services/storageService.js";
import { MAX_VIDAS, recoverLives } from "../services/lifeService.js";
import { sincronizarUsuario } from "../services/firestoreService.js";

export const TOTAL_LEVELS = 10;

const state = {
  currentUser: null,
  vidas: MAX_VIDAS,
  monedas: 0,
  nivel: 1,
  progreso: {}
};

function crearProgresoNormalizado(progreso = {}) {
  const resultado = {};

  for (let nivel = 1; nivel <= TOTAL_LEVELS; nivel++) {
    const actual = progreso[nivel] || progreso[String(nivel)] || {};

    resultado[nivel] = {
      estrellas: Number(actual.estrellas) || 0,
      completado: Boolean(actual.completado),
      intentos: Number(actual.intentos) || 0
    };
  }

  return resultado;
}

export function getState() {
  return state;
}

export function setUser(user) {
  const userConVidasRecuperadas = recoverLives(user);
  const progreso = crearProgresoNormalizado(userConVidasRecuperadas?.progreso);

  state.currentUser = {
    ...userConVidasRecuperadas,
    vidas: Number(userConVidasRecuperadas?.vidas) || MAX_VIDAS,
    monedas: Number(userConVidasRecuperadas?.monedas) || 0,
    nivel: Number(userConVidasRecuperadas?.nivel) || 1,
    progreso
  };

  state.vidas = state.currentUser.vidas;
  state.monedas = state.currentUser.monedas;
  state.nivel = state.currentUser.nivel;
  state.progreso = progreso;

  upsertLocalUser(state.currentUser);
  sincronizarUsuario(state.currentUser).then((userSincronizado) => {
    if (!userSincronizado?.id || !state.currentUser) return;

    state.currentUser.id = userSincronizado.id;
    upsertLocalUser(state.currentUser);
  });
}

export function updateLives(lives) {
  state.vidas = lives;

  if (state.currentUser) {
    state.currentUser.vidas = lives;
  }
}

export function updateCoins(coins) {
  state.monedas = coins;

  if (state.currentUser) {
    state.currentUser.monedas = coins;
  }
}

export function updateProgress(nivel, estrellas, intentosSumar = 1) {
  const progresoActual = state.progreso[nivel] || {
    estrellas: 0,
    completado: false,
    intentos: 0
  };

  const estrellasFinales = Math.max(progresoActual.estrellas || 0, estrellas);
  const intentosFinales = (progresoActual.intentos || 0) + intentosSumar;

  state.progreso[nivel] = {
    estrellas: estrellasFinales,
    completado: estrellasFinales > 0,
    intentos: intentosFinales
  };

  if (state.currentUser) {
    state.currentUser.progreso = state.progreso;

    if (estrellasFinales > 0) {
      state.currentUser.nivel = Math.max(state.currentUser.nivel || 1, nivel + 1);
      state.nivel = state.currentUser.nivel;
    }
  }
}

export function persistCurrentUser() {
  if (!state.currentUser) return;

  const userActualizado = {
    ...state.currentUser,
    vidas: state.vidas,
    monedas: state.monedas,
    nivel: state.currentUser.nivel || state.nivel,
    ultimoTiempoVida: state.currentUser.ultimoTiempoVida,
    progreso: state.progreso
  };

  upsertLocalUser(userActualizado);
  sincronizarUsuario(userActualizado).then((userSincronizado) => {
    if (!userSincronizado?.id || !state.currentUser) return;

    state.currentUser.id = userSincronizado.id;
    upsertLocalUser(state.currentUser);
  });
}
