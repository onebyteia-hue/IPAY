import { getQuestions, saveQuestions } from "../services/storageService.js";
import { isOnline } from "../modules/network.js";

export async function cargarPreguntas() {
  if (isOnline()) {
    try {
      const preguntas = await obtenerPreguntasFirebase();
      saveQuestions(preguntas);
      return preguntas;
    } catch (e) {
      return getQuestions();
    }
  } else {
    return getQuestions();
  }
}