import { getLocalQuestions, saveLocalQuestions } from "./storageService.js";

const BUNDLED_QUESTION_SOURCES = ["./data/capitulo1_niveles_1_10.json"];

const COMPLETAR_DISTRACTORES = [
  "distancia",
  "rapidez",
  "aceleracion",
  "trayectoria",
  "masa",
  "fuerza",
];

function uniqueOptions(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim()))];
}

function buildCompletarOptions(answer, alternatives = []) {
  const correct = String(answer || "").trim();
  const distractors = COMPLETAR_DISTRACTORES.filter(
    (item) => item.toLowerCase() !== correct.toLowerCase(),
  ).slice(0, 3);

  return uniqueOptions([correct, ...alternatives, ...distractors]).slice(0, 4);
}

function normalizeQuestion(levelNumber, question) {
  if (!question?.enunciado) return null;

  if (Array.isArray(question.opciones) && Number.isInteger(question.correcta)) {
    return {
      ...question,
      nivel: Number(question.nivel ?? levelNumber ?? 1),
      imagen: question.imagen || "",
    };
  }

  const level = Number(levelNumber ?? question.nivel ?? 1);
  const type = question.tipo;

  if (type === "seleccion_multiple") {
    const options = Array.isArray(question.opciones) ? question.opciones : [];
    const correct = options.findIndex(
      (option) => String(option).trim() === String(question.respuestaCorrecta).trim(),
    );

    return {
      id: question.id,
      nivel: level,
      enunciado: question.enunciado,
      opciones: options,
      correcta: correct >= 0 ? correct : 0,
      imagen: question.imagen || "",
    };
  }

  if (type === "verdadero_falso") {
    return {
      id: question.id,
      nivel: level,
      enunciado: question.enunciado,
      opciones: ["Verdadero", "Falso"],
      correcta: question.respuestaCorrecta === true ? 0 : 1,
      imagen: question.imagen || "",
    };
  }

  if (type === "completar") {
    const options = buildCompletarOptions(
      question.respuestaCorrecta,
      question.alternativasValidas,
    );

    return {
      id: question.id,
      nivel: level,
      enunciado: question.enunciado,
      opciones: options,
      correcta: 0,
      imagen: question.imagen || "",
    };
  }

  return null;
}

function normalizeQuestions(payload) {
  if (Array.isArray(payload)) {
    return payload
      .map((question) => normalizeQuestion(question.nivel, question))
      .filter(Boolean);
  }

  if (!Array.isArray(payload?.niveles)) {
    return [];
  }

  return payload.niveles.flatMap((level) =>
    (level.preguntas || [])
      .map((question) => normalizeQuestion(level.nivel, question))
      .filter(Boolean),
  );
}

async function loadBundledQuestions() {
  for (const source of BUNDLED_QUESTION_SOURCES) {
    try {
      const response = await fetch(source);
      if (!response.ok) continue;

      const payload = await response.json();
      const questions = normalizeQuestions(payload);

      if (questions.length) {
        return questions;
      }
    } catch (error) {
      console.warn(`No se pudo cargar el banco local ${source}.`, error);
    }
  }

  return [];
}

export async function ensureOfflineData() {
  const localQuestions = getLocalQuestions();
  if (localQuestions.length) {
    return { seeded: false, questionCount: localQuestions.length };
  }

  const bundledQuestions = await loadBundledQuestions();
  if (bundledQuestions.length) {
    saveLocalQuestions(bundledQuestions);
    return { seeded: true, questionCount: bundledQuestions.length };
  }

  return { seeded: false, questionCount: 0 };
}
