// import { upsertLocalUser } from "../services/storageService.js";
// import { MAX_VIDAS, recoverLives } from "../services/lifeService.js";
// import { sincronizarUsuario } from "../services/firestoreService.js";

// export const TOTAL_LEVELS = 10;

// const state = {
//   currentUser: null,
//   vidas: MAX_VIDAS,
//   monedas: 0,
//   nivel: 1,
//   progreso: {}
// };

// function crearProgresoNormalizado(progreso = {}) {
//   const resultado = {};

//   for (let nivel = 1; nivel <= TOTAL_LEVELS; nivel++) {
//     const actual = progreso[nivel] || progreso[String(nivel)] || {};

//     resultado[nivel] = {
//       estrellas: Number(actual.estrellas) || 0,
//       completado: Boolean(actual.completado),
//       intentos: Number(actual.intentos) || 0
//     };
//   }

//   return resultado;
// }

// export function getState() {
//   return state;
// }

// export function setUser(user) {
//   const userConVidasRecuperadas = recoverLives(user);
//   const progreso = crearProgresoNormalizado(userConVidasRecuperadas?.progreso);

//   state.currentUser = {
//     ...userConVidasRecuperadas,
//     vidas: Number(userConVidasRecuperadas?.vidas) || MAX_VIDAS,
//     monedas: Number(userConVidasRecuperadas?.monedas) || 0,
//     nivel: Number(userConVidasRecuperadas?.nivel) || 1,
//     progreso
//   };

//   state.vidas = state.currentUser.vidas;
//   state.monedas = state.currentUser.monedas;
//   state.nivel = state.currentUser.nivel;
//   state.progreso = progreso;

//   upsertLocalUser(state.currentUser);
//   sincronizarUsuario(state.currentUser).then((userSincronizado) => {
//     if (!userSincronizado?.id || !state.currentUser) return;

//     state.currentUser.id = userSincronizado.id;
//     upsertLocalUser(state.currentUser);
//   });
// }

// export function updateLives(vidas) {
//   const state = getState();

//   state.vidas = vidas;

//   if (state.currentUser) {
//     state.currentUser.vidas = vidas;
//   }

//   // 🔥 guardar en localStorage
//   localStorage.setItem("vidas", vidas);

//   persistCurrentUser();
// }

// export function updateCoins(coins) {
//   state.monedas = coins;

//   if (state.currentUser) {
//     state.currentUser.monedas = coins;
//   }
// }

// export function updateProgress(nivel, estrellas, intentosSumar = 1) {
//   const progresoActual = state.progreso[nivel] || {
//     estrellas: 0,
//     completado: false,
//     intentos: 0
//   };

//   const estrellasFinales = Math.max(progresoActual.estrellas || 0, estrellas);
//   const intentosFinales = (progresoActual.intentos || 0) + intentosSumar;

//   state.progreso[nivel] = {
//     estrellas: estrellasFinales,
//     completado: estrellasFinales > 0,
//     intentos: intentosFinales
//   };

//   if (state.currentUser) {
//     state.currentUser.progreso = state.progreso;

//     if (estrellasFinales > 0) {
//       state.currentUser.nivel = Math.max(state.currentUser.nivel || 1, nivel + 1);
//       state.nivel = state.currentUser.nivel;
//     }
//   }
// }

// export function persistCurrentUser() {
//   if (!state.currentUser) return;

//   const userActualizado = {
//     ...state.currentUser,
//     vidas: state.vidas,
//     monedas: state.monedas,
//     nivel: state.currentUser.nivel || state.nivel,
//     ultimoTiempoVida: state.currentUser.ultimoTiempoVida,
//     progreso: state.progreso
//   };

//   upsertLocalUser(userActualizado);
//   sincronizarUsuario(userActualizado).then((userSincronizado) => {
//     if (!userSincronizado?.id || !state.currentUser) return;

//     state.currentUser.id = userSincronizado.id;
//     upsertLocalUser(state.currentUser);
//   });
// }

// import { sincronizarUsuario } from "../services/firestoreService.js";

// const MAX_VIDAS = 10;
// export const TOTAL_LEVELS = 10;
// const state = {
//   currentUser: null,
//   vidas: 0,
//   monedas: 0,
//   nivel: 1,
//   progreso: {},
// };



// // ===============================
// // ❤️ SISTEMA PRO DE VIDAS
// // ===============================

// const MAX_CORAZONES = 10;
// const TIEMPO_RECUPERACION = 2 * 60 * 1000; // 10 min

// export function getState() {
//   return state;
// }

// export function setUser(user) {
//   if (!user) return;

//   initCorazones();
//   const userId = user.id || user.nombre;
// const vidasLocal = getLivesReal(userId);

//   state.currentUser = {
//     ...user,
//     vidas: !isNaN(vidasLocal) ? vidasLocal : (user.vidas ?? MAX_VIDAS),
//   };

//   state.vidas = state.currentUser.vidas;
//   state.monedas = user.monedas ?? 0;
//   state.nivel = user.nivel ?? 1;
//   state.progreso = user.progreso ?? {};
// }

// // 🔥 ACTUALIZAR VIDAS (CLAVE)
// export function updateLives(vidas) {
//   state.vidas = vidas;

//   if (state.currentUser) {
//     state.currentUser.vidas = vidas;
//   }

//   localStorage.setItem("corazones", vidas); // 🔥 clave

//   persistCurrentUser();
// }

// export function updateCoins(monedas) {
//   state.monedas = monedas;

//   if (state.currentUser) {
//     state.currentUser.monedas = monedas;
//   }

//   persistCurrentUser();
// }

// export function updateProgress(nivel, estrellas, intento = 1) {
//   if (!state.progreso[nivel]) {
//     state.progreso[nivel] = {
//       estrellas: 0,
//       intentos: 0,
//       completado: false,
//     };
//   }

//   state.progreso[nivel].estrellas = Math.max(
//     state.progreso[nivel].estrellas,
//     estrellas,
//   );

//   state.progreso[nivel].intentos += intento;

//   if (estrellas > 0) {
//     state.progreso[nivel].completado = true;
//   }

//   if (state.currentUser) {
//     state.currentUser.progreso = state.progreso;
//   }

//   persistCurrentUser();
// }

// // 🔥 SINCRONIZACIÓN REAL
// export async function persistCurrentUser() {
//   if (!state.currentUser) return;

//   const actualizado = await sincronizarUsuario(state.currentUser);
//   state.currentUser = actualizado;
// }



// function initCorazones() {
//   if (!localStorage.getItem("corazones")) {
//     localStorage.setItem("corazones", MAX_CORAZONES);
//   }
// }




// // 🔹 obtener vidas
// function getKey(userId, tipo) {
//   return `${tipo}_${userId}`;
// }

// export function getLivesReal(userId) {
//   if (!userId) return MAX_CORAZONES;

//   let vidas = parseInt(localStorage.getItem(getKey(userId, "corazones"))) ?? MAX_CORAZONES;
//   let ultimoTiempo = parseInt(localStorage.getItem(getKey(userId, "tiempo")));

//   if (!ultimoTiempo) return vidas;

//   const ahora = Date.now();
//   const diff = ahora - ultimoTiempo;

//   const recuperados = Math.floor(diff / TIEMPO_RECUPERACION);

//   if (recuperados > 0) {
//     vidas = Math.min(MAX_CORAZONES, vidas + recuperados);

//     if (vidas === MAX_CORAZONES) {
//       localStorage.removeItem(getKey(userId, "tiempo"));
//     } else {
//       const nuevoTiempo = ultimoTiempo + recuperados * TIEMPO_RECUPERACION;
//       localStorage.setItem(getKey(userId, "tiempo"), nuevoTiempo);
//     }

//     localStorage.setItem(getKey(userId, "corazones"), vidas);
//   }

//   return vidas;
// }

// export function loseLife(userId) {
//   let vidas = getLivesReal(userId);

//   if (vidas <= 0) return 0;

//   vidas--;

//   localStorage.setItem(getKey(userId, "corazones"), vidas);

//   if (!localStorage.getItem(getKey(userId, "tiempo"))) {
//     localStorage.setItem(getKey(userId, "tiempo"), Date.now());
//   }

//   return vidas;
// }

// export function getTiempoRestante(userId) {
//   const ultimoTiempo = parseInt(localStorage.getItem(getKey(userId, "tiempo")));
//   if (!ultimoTiempo) return 0;

//   const ahora = Date.now();
//   return Math.max(0, TIEMPO_RECUPERACION - (ahora - ultimoTiempo));
// }


import { sincronizarUsuario } from "../services/firestoreService.js";

const MAX_VIDAS = 10;
export const TOTAL_LEVELS = 10;

const MAX_CORAZONES = 10;
const TIEMPO_RECUPERACION = 2 * 60 * 1000; // 2 min

const state = {
  currentUser: null,
  vidas: MAX_CORAZONES,
  monedas: 0,
  nivel: 1,
  progreso: {},
};

// ===============================
// 🧠 HELPERS SEGUROS
// ===============================

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getKey(userId, tipo) {
  return `${tipo}_${userId}`;
}

// ===============================
// ❤️ INIT
// ===============================

function initCorazones(userId) {
  const key = getKey(userId, "corazones");

  if (localStorage.getItem(key) === null) {
    localStorage.setItem(key, MAX_CORAZONES);
  }
}

// ===============================
// 📦 STATE
// ===============================

export function getState() {
  return state;
}

export function setUser(user) {
  if (!user) return;

  const userId = user.id || user.nombre;

  initCorazones(userId);

  const vidasLocal = getLivesReal(userId);

  state.currentUser = {
    ...user,
    vidas: toNumber(vidasLocal, MAX_CORAZONES),
  };

  state.vidas = clamp(toNumber(vidasLocal, MAX_CORAZONES), 0, MAX_CORAZONES);
  state.monedas = toNumber(user.monedas, 0);

  // 🔥 PROTECCIÓN DE NIVEL
  state.nivel = Math.max(toNumber(user.nivel, 1), state.nivel);

  state.progreso = user.progreso ?? {};
}

// ===============================
// ❤️ ACTUALIZAR VIDAS (FIX NaN)
// ===============================

export function updateLives(vidas) {
  if (!state.currentUser) return;

  const userId = state.currentUser.id || state.currentUser.nombre;

  const vidasNum = clamp(toNumber(vidas, MAX_CORAZONES), 0, MAX_CORAZONES);

  state.vidas = vidasNum;
  state.currentUser.vidas = vidasNum;

  // 🔥 CLAVE CORRECTA (ANTES ERA ERROR)
  localStorage.setItem(getKey(userId, "corazones"), vidasNum);

  persistCurrentUser();
}

// ===============================
// 💰 MONEDAS
// ===============================

export function updateCoins(monedas) {
  const monedasNum = toNumber(monedas, 0);

  state.monedas = monedasNum;

  if (state.currentUser) {
    state.currentUser.monedas = monedasNum;
  }

  persistCurrentUser();
}


function calcularSubidaNivel(aciertos, nivelActual) {
  if (aciertos >= 9) return nivelActual + 2; // 🔥 modo PRO
  if (aciertos >= 6) return nivelActual + 1;
  return nivelActual;
}
// ===============================
// 📊 PROGRESO
// ===============================

export function updateProgress(nivel, aciertos, intento = 1) {
  // ⭐ convertir aciertos → estrellas (puedes ajustar)
  let estrellas = 0;
  if (aciertos >= 9) estrellas = 3;
  else if (aciertos >= 6) estrellas = 2;
  else if (aciertos >= 3) estrellas = 1;

  if (!state.progreso[nivel]) {
    state.progreso[nivel] = {
      estrellas: 0,
      intentos: 0,
      completado: false,
    };
  }

  // 🔥 guardar mejor resultado
  state.progreso[nivel].estrellas = Math.max(
    state.progreso[nivel].estrellas,
    estrellas
  );

  state.progreso[nivel].intentos += intento;

  if (estrellas > 0) {
    state.progreso[nivel].completado = true;
  }

  // ===============================
  // 🚀 SUBIDA DE NIVEL AUTOMÁTICA
  // ===============================

  const nivelActual = state.nivel;

  let nuevoNivel = calcularSubidaNivel(aciertos, nivelActual);

  // 🔥 límite máximo
  nuevoNivel = Math.min(nuevoNivel, TOTAL_LEVELS);

  // 🔥 solo sube, nunca baja
  if (nuevoNivel > state.nivel) {
    state.nivel = nuevoNivel;

    if (state.currentUser) {
      state.currentUser.nivel = nuevoNivel;
    }

    console.log(`🎉 Subiste de nivel: ${nivelActual} → ${nuevoNivel}`);
  }

  // guardar progreso en usuario
  if (state.currentUser) {
    state.currentUser.progreso = state.progreso;
  }

  persistCurrentUser();
}
// ===============================
// 🔄 FIREBASE
// ===============================

export async function persistCurrentUser() {
  if (!state.currentUser) return;
  state.currentUser.nivel = state.nivel;

  // 🔥 FORZAR SINCRONIZACIÓN REAL
  const userActualizado = {
    ...state.currentUser,
    nivel: state.nivel, // 🔥 CLAVE
    monedas: state.monedas,
    vidas: state.vidas,
    progreso: state.progreso,
  };

  const actualizado = await sincronizarUsuario(userActualizado);

  state.currentUser = actualizado;
}

// ===============================
// ❤️ SISTEMA REAL DE VIDAS
// ===============================

export function getLivesReal(userId) {
  if (!userId) return MAX_CORAZONES;

  const keyCorazones = getKey(userId, "corazones");
  const keyTiempo = getKey(userId, "tiempo");

  let vidas = toNumber(localStorage.getItem(keyCorazones), MAX_CORAZONES);
  let ultimoTiempo = toNumber(localStorage.getItem(keyTiempo), null);

  if (!ultimoTiempo) return vidas;

  const ahora = Date.now();
  const diff = ahora - ultimoTiempo;

  const recuperados = Math.floor(diff / TIEMPO_RECUPERACION);

  if (recuperados > 0) {
    vidas = clamp(vidas + recuperados, 0, MAX_CORAZONES);

    if (vidas === MAX_CORAZONES) {
      localStorage.removeItem(keyTiempo);
    } else {
      const nuevoTiempo = ultimoTiempo + recuperados * TIEMPO_RECUPERACION;
      localStorage.setItem(keyTiempo, nuevoTiempo);
    }

    localStorage.setItem(keyCorazones, vidas);
  }

  return vidas;
}

export function loseLife(userId) {
  let vidas = getLivesReal(userId);

  if (vidas <= 0) return 0;

  vidas--;

  const keyCorazones = getKey(userId, "corazones");
  const keyTiempo = getKey(userId, "tiempo");

  localStorage.setItem(keyCorazones, vidas);

  if (!localStorage.getItem(keyTiempo)) {
    localStorage.setItem(keyTiempo, Date.now());
  }

  // 🔥 SINCRONIZA ESTADO GLOBAL
  state.vidas = vidas;
  if (state.currentUser) {
    state.currentUser.vidas = vidas;
  }

  return vidas;
}

export function getTiempoRestante(userId) {
  const keyTiempo = getKey(userId, "tiempo");

  const ultimoTiempo = toNumber(localStorage.getItem(keyTiempo), null);
  if (!ultimoTiempo) return 0;

  const ahora = Date.now();
  return Math.max(0, TIEMPO_RECUPERACION - (ahora - ultimoTiempo));
}

