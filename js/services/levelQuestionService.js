import { getRandomQuestions } from "../modules/utils.js";
import { obtenerPreguntas } from "./firestoreService.js";
import { hydrateOfflineQuestions } from "./offlineBootstrap.js";
import { getLocalQuestions } from "./storageService.js";

// 🔥 CACHE de preguntas para evitar queries repetidas
let cachedQuestions = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

async function loadAllQuestions() {
  const now = Date.now();
  
  // 🔥 Reutilizar cache si es reciente
  if (cachedQuestions && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedQuestions;
  }

  let preguntas = [];

  try {
    preguntas = await obtenerPreguntas();
  } catch (error) {
    preguntas = getLocalQuestions();
  }

  // 🔥 Guardar en cache
  cachedQuestions = preguntas;
  cacheTimestamp = now;

  return preguntas;
}

export async function getQuestionsForLevel(levelNumber, contenido = "MRUV") {
  let preguntas = await loadAllQuestions();

  const contenidoActivo = String(contenido || "MRUV").trim() || "MRUV";

  let preguntasNivel = preguntas.filter(
    (pregunta) =>
      Number(pregunta.nivel) === Number(levelNumber) &&
      String(pregunta.contenido || "MRUV").trim() === contenidoActivo,
  );

  if (preguntasNivel.length === 0) {
    const preguntasCompletadas = await hydrateOfflineQuestions(preguntas);
    preguntasNivel = preguntasCompletadas.filter(
      (pregunta) =>
        Number(pregunta.nivel) === Number(levelNumber) &&
        String(pregunta.contenido || "MRUV").trim() === contenidoActivo,
    );
  }

  return preguntasNivel;
}

export async function hasQuestionsForLevel(levelNumber, contenido = "MRUV") {
  const preguntasNivel = await getQuestionsForLevel(levelNumber, contenido);
  return preguntasNivel.length > 0;
}

export async function getGameQuestionsForLevel(levelNumber, cantidad = 10, contenido = "MRUV") {
  const preguntasNivel = await getQuestionsForLevel(levelNumber, contenido);
  return getRandomQuestions(preguntasNivel, cantidad);
}

export async function getAvailableContents() {
  const preguntas = await loadAllQuestions();

  const contenidos = [
    ...new Set(
      preguntas.map((pregunta) =>
        String(pregunta.contenido || "MRUV").trim() || "MRUV",
      ),
    ),
  ];

  return contenidos.sort((a, b) => {
    if (a === "MRUV") return -1;
    if (b === "MRUV") return 1;
    return a.localeCompare(b);
  });
}

export async function getAvailableLevelsForContent(contenido = "MRUV") {
  const preguntas = await loadAllQuestions();
  const contenidoActivo = String(contenido || "MRUV").trim() || "MRUV";

  const niveles = [
    ...new Set(
      preguntas
        .filter(
          (pregunta) =>
            String(pregunta.contenido || "MRUV").trim() === contenidoActivo,
        )
        .map((pregunta) => Number(pregunta.nivel) || 1),
    ),
  ];

  return niveles
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}
