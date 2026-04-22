import { getRandomQuestions } from "../modules/utils.js";
import { obtenerPreguntas } from "./firestoreService.js";
import { hydrateOfflineQuestions } from "./offlineBootstrap.js";
import { getLocalQuestions } from "./storageService.js";

export async function getQuestionsForLevel(levelNumber) {
  let preguntas = [];

  try {
    preguntas = await obtenerPreguntas();
  } catch (error) {
    preguntas = getLocalQuestions();
  }

  let preguntasNivel = preguntas.filter(
    (pregunta) => Number(pregunta.nivel) === Number(levelNumber),
  );

  if (preguntasNivel.length === 0) {
    const preguntasCompletadas = await hydrateOfflineQuestions(preguntas);
    preguntasNivel = preguntasCompletadas.filter(
      (pregunta) => Number(pregunta.nivel) === Number(levelNumber),
    );
  }

  return preguntasNivel;
}

export async function hasQuestionsForLevel(levelNumber) {
  const preguntasNivel = await getQuestionsForLevel(levelNumber);
  return preguntasNivel.length > 0;
}

export async function getGameQuestionsForLevel(levelNumber, cantidad = 10) {
  const preguntasNivel = await getQuestionsForLevel(levelNumber);
  return getRandomQuestions(preguntasNivel, cantidad);
}
