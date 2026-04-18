// export const MAX_VIDAS = 10;
// export const TIEMPO_POR_VIDA_MS = 10 * 60 * 1000;

// export function recoverLives(user = {}) {
//   const vidasActuales = Number(user.vidas);
//   const vidas = Number.isFinite(vidasActuales) ? Math.max(0, Math.min(MAX_VIDAS, vidasActuales)) : MAX_VIDAS;
//   const ahora = Date.now();
//   const ultimoTiempoVida = Number(user.ultimoTiempoVida) || ahora;

//   if (vidas >= MAX_VIDAS) {
//     return {
//       ...user,
//       vidas: MAX_VIDAS,
//       ultimoTiempoVida: ahora
//     };
//   }

//   const tiempoPasado = Math.max(0, ahora - ultimoTiempoVida);
//   const vidasRecuperadas = Math.floor(tiempoPasado / TIEMPO_POR_VIDA_MS);

//   if (vidasRecuperadas <= 0) {
//     return {
//       ...user,
//       vidas,
//       ultimoTiempoVida
//     };
//   }

//   const nuevasVidas = Math.min(MAX_VIDAS, vidas + vidasRecuperadas);
//   const tiempoConsumido = vidasRecuperadas * TIEMPO_POR_VIDA_MS;

//   return {
//     ...user,
//     vidas: nuevasVidas,
//     ultimoTiempoVida: nuevasVidas >= MAX_VIDAS ? ahora : ultimoTiempoVida + tiempoConsumido
//   };
// }

// export function spendLife(user = {}, cantidad = 1) {
//   const vidasActuales = Number(user.vidas);
//   const vidas = Number.isFinite(vidasActuales) ? Math.max(0, Math.min(MAX_VIDAS, vidasActuales)) : MAX_VIDAS;
//   const descuento = Math.max(0, Number(cantidad) || 0);
//   const nuevasVidas = Math.max(0, vidas - descuento);

//   return {
//     ...user,
//     vidas: nuevasVidas,
//     ultimoTiempoVida: vidas >= MAX_VIDAS ? Date.now() : Number(user.ultimoTiempoVida) || Date.now()
//   };
// }


export const MAX_VIDAS = 10;
export const TIEMPO_POR_VIDA_MS = 5 * 60 * 1000; // 5 min

export function recoverLives(user) {
  if (!user) return user;

  const ahora = Date.now();
  const ultimo = Number(user.ultimoTiempoVida) || ahora;

  let vidas = user.vidas ?? MAX_VIDAS;

  if (vidas >= MAX_VIDAS) return user;

  const tiempoPasado = ahora - ultimo;
  const vidasRecuperadas = Math.floor(tiempoPasado / TIEMPO_POR_VIDA_MS);

  if (vidasRecuperadas > 0) {
    vidas = Math.min(MAX_VIDAS, vidas + vidasRecuperadas);

    user.vidas = vidas;
    user.ultimoTiempoVida = ahora;
  }

  return user;
}

// 🔥 PERDER VIDA
export function spendLife(user, cantidad = 1) {
  if (!user) return user;

  const vidasActuales = user.vidas ?? MAX_VIDAS;

  if (vidasActuales <= 0) return user;

  user.vidas = Math.max(0, vidasActuales - cantidad);

  if (user.vidas === 0) {
    user.ultimoTiempoVida = Date.now();
  }

  return user;
}