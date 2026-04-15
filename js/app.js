const state = {
  student: null,
  chapterData: null,
  currentLevel: null,
  selectedQuestions: [],
  currentQuestionIndex: 0,
  score: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  stars: 3,
  coinsWon: 0,
  selectedAnswer: null,
  completedLevels: [],
  currentAttempt: null,
};
const levelsContainer = document.getElementById("levels-container");

// ELEMENTOS
const loginScreen = document.getElementById("login-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const loginForm = document.getElementById("login-form");
const studentNameInput = document.getElementById("student-name");
const studentCodeInput = document.getElementById("student-code");

const dashboardName = document.getElementById("dashboard-name");
const dashboardChapter = document.getElementById("dashboard-chapter");
const dashboardLevel = document.getElementById("dashboard-level");
const dashboardCoins = document.getElementById("dashboard-coins");
const dashboardPoints = document.getElementById("dashboard-points");
const startLevelBtn = document.getElementById("start-level-btn");

const quizTitle = document.getElementById("quiz-title");
const questionCounter = document.getElementById("question-counter");
const questionType = document.getElementById("question-type");
const questionText = document.getElementById("question-text");
const questionMedia = document.getElementById("question-media");
const answersContainer = document.getElementById("answers-container");
const submitAnswerBtn = document.getElementById("submit-answer-btn");
const feedbackBox = document.getElementById("feedback-box");
const progressFill = document.getElementById("progress-fill");
const liveStars = document.getElementById("live-stars");
const liveCoins = document.getElementById("live-coins");

const resultCorrect = document.getElementById("result-correct");
const resultIncorrect = document.getElementById("result-incorrect");
const resultStars = document.getElementById("result-stars");
const resultCoins = document.getElementById("result-coins");
const resultMessage = document.getElementById("result-message");
const retryBtn = document.getElementById("retry-btn");
const nextBtn = document.getElementById("next-btn");

// INICIO
document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  try {
    const response = await fetch("data/capitulo1_niveles_1_10.json");

    if (!response.ok) {
      throw new Error(
        `No se pudo cargar el JSON. Estado HTTP: ${response.status}`,
      );
    }

    const text = await response.text();

    if (!text.trim()) {
      throw new Error("El archivo JSON está vacío.");
    }

    state.chapterData = JSON.parse(text);
    console.log("JSON cargado correctamente:", state.chapterData);
  } catch (error) {
    alert("Error al cargar el archivo JSON. Revisa consola.");
    console.error("Error al cargar JSON:", error);
  }
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = studentNameInput.value.trim();
  const code = studentCodeInput.value.trim();

  if (!name || !code) {
    alert("Completa nombre y código.");
    return;
  }

  const savedData = loadProgress(code);

  if (savedData) {
    state.student = savedData.student;
    state.completedLevels = savedData.completedLevels || [];
    state.currentAttempt = savedData.currentAttempt || null;
  } else {
    state.student = {
      name,
      code,
      chapter: 1,
      currentLevel: 1,
      unlockedLevel: 1,
      coins: 0,
      points: 0,
    };

    state.completedLevels = [];
    state.currentAttempt = null;
  }

  updateDashboard();
  showScreen("dashboard");
});
startLevelBtn.addEventListener("click", () => {
  startLevel(state.student.currentLevel);
});

document.getElementById("export-btn")
  .addEventListener("click", exportProgress);

submitAnswerBtn.addEventListener("click", handleSubmitAnswer);
retryBtn.addEventListener("click", () =>
  startLevel(state.student.currentLevel),
);
nextBtn.addEventListener("click", handleNextAction);

function showScreen(screenName) {
  const screens = [loginScreen, dashboardScreen, quizScreen, resultScreen];
  screens.forEach((screen) => screen.classList.add("hidden"));

  if (screenName === "login") loginScreen.classList.remove("hidden");
  if (screenName === "dashboard") dashboardScreen.classList.remove("hidden");
  if (screenName === "quiz") quizScreen.classList.remove("hidden");
  if (screenName === "result") resultScreen.classList.remove("hidden");
}

function updateDashboard() {
  dashboardName.textContent = state.student.name;
  dashboardChapter.textContent = state.student.chapter;
  dashboardLevel.textContent = state.student.currentLevel;
  dashboardCoins.textContent = state.student.coins;
  dashboardPoints.textContent = state.student.points;

  renderLevels();
  saveProgress();
}

function startLevel(levelNumber) {
  if (!state.chapterData || !state.chapterData.niveles) {
    alert("Aún no se cargaron los niveles. Intenta de nuevo.");
    return;
  }

  const level = state.chapterData.niveles.find((n) => n.nivel === levelNumber);
  
  if (state.currentAttempt && state.currentAttempt.level === levelNumber) {
    // 🔥 CONTINUAR INTENTO
    loadAttempt(state.currentAttempt);
    return;
  }

  if (!level) {
    alert("No se encontró el nivel.");
    return;
  }

  state.currentLevel = level;
  const totalQuestionsToUse = Math.min(
    level.minimoPreguntas || 10,
    level.preguntas.length,
  );
  state.selectedQuestions = getRandomQuestions(
    level.preguntas,
    totalQuestionsToUse,
  );
  state.currentAttempt = {
    level: levelNumber,
    questions: state.selectedQuestions,
    currentQuestionIndex: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    stars: 3,
    score: 0,
  };

  saveProgress();
  state.currentQuestionIndex = 0;
  state.score = 0;
  state.correctAnswers = 0;
  state.incorrectAnswers = 0;
  state.stars = 3;
  state.coinsWon = 0;
  state.selectedAnswer = null;

  liveStars.textContent = state.stars;
  liveCoins.textContent = state.student.coins;
  feedbackBox.className = "feedback hidden";

  renderQuestion();
  showScreen("quiz");
}

function getRandomQuestions(questions, amount = 10) {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, amount);
}

function renderQuestion() {
  const question = state.selectedQuestions[state.currentQuestionIndex];
  if (!question) return;

  quizTitle.textContent = `Capítulo ${state.chapterData.capitulo} - Nivel ${state.currentLevel.nivel}`;
  questionCounter.textContent = `Pregunta ${state.currentQuestionIndex + 1} de ${state.selectedQuestions.length}`;
  questionType.textContent = formatQuestionType(question.tipo);
  questionText.textContent = question.enunciado;

  questionMedia.innerHTML = "";
  answersContainer.innerHTML = "";
  feedbackBox.className = "feedback hidden";
  feedbackBox.textContent = "";
  state.selectedAnswer = null;

  const progressPercent =
    (state.currentQuestionIndex / state.selectedQuestions.length) * 100;
  progressFill.style.width = `${progressPercent}%`;

  if (question.tipo === "seleccion_multiple") {
    renderMultipleChoice(question);
  } else if (question.tipo === "verdadero_falso") {
    renderTrueFalse(question);
  } else if (question.tipo === "completar") {
    renderFillBlank(question);
  } else if (question.tipo === "grafica") {
    renderGraphQuestion(question);
  }
}

function renderMultipleChoice(question) {
  question.opciones.forEach((option) => {
    const button = document.createElement("button");
    button.className = "answer-option";
    button.type = "button";
    button.textContent = option;

    button.addEventListener("click", () => {
      clearSelections();
      button.classList.add("selected");
      state.selectedAnswer = option;
    });

    answersContainer.appendChild(button);
  });
}

function renderTrueFalse() {
  ["Verdadero", "Falso"].forEach((option) => {
    const button = document.createElement("button");
    button.className = "answer-option";
    button.type = "button";
    button.textContent = option;

    button.addEventListener("click", () => {
      clearSelections();
      button.classList.add("selected");
      state.selectedAnswer = option === "Verdadero";
    });

    answersContainer.appendChild(button);
  });
}

function renderFillBlank() {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "completar-input";
  input.placeholder = "Escribe tu respuesta aquí";

  input.addEventListener("input", (e) => {
    state.selectedAnswer = e.target.value.trim();
  });

  answersContainer.appendChild(input);
}

function renderGraphQuestion(question) {
  if (question.imagen) {
    const img = document.createElement("img");
    img.src = question.imagen;
    img.alt = "Gráfica de la pregunta";
    questionMedia.appendChild(img);
  }

  question.opciones.forEach((option) => {
    const button = document.createElement("button");
    button.className = "answer-option";
    button.type = "button";
    button.textContent = option;

    button.addEventListener("click", () => {
      clearSelections();
      button.classList.add("selected");
      state.selectedAnswer = option;
    });

    answersContainer.appendChild(button);
  });
}



function handleSubmitAnswer() {
  const question = state.selectedQuestions[state.currentQuestionIndex];

  if (
    state.selectedAnswer === null ||
    state.selectedAnswer === undefined ||
    state.selectedAnswer === ""
  ) {
    alert("Selecciona o escribe una respuesta.");
    return;
  }

  const isCorrect = validateAnswer(question, state.selectedAnswer);

  if (isCorrect) {
    state.correctAnswers++;
    state.score += 10;
    showFeedback(true, question.retroalimentacion || "¡Correcto!");
  } else {
    state.incorrectAnswers++;
    state.stars = Math.max(1, calculateStars(state.incorrectAnswers));
    liveStars.textContent = state.stars;
    showFeedback(false, question.retroalimentacion || "Respuesta incorrecta.");
  }

  submitAnswerBtn.disabled = true;

  setTimeout(() => {
    submitAnswerBtn.disabled = false;
    goToNextQuestion();
  }, 1200);

  updateAttempt();
  saveProgress();
}

function validateAnswer(question, answer) {
  if (question.tipo === "completar") {
    const normalizedAnswer = String(answer).trim().toLowerCase();
    const validAnswers = [
      String(question.respuestaCorrecta).trim().toLowerCase(),
      ...(question.alternativasValidas || []).map((item) =>
        String(item).trim().toLowerCase(),
      ),
    ];
    return validAnswers.includes(normalizedAnswer);
  }

  return answer === question.respuestaCorrecta;
}

function calculateStars(incorrectAnswers) {
  if (incorrectAnswers <= 1) return 3;
  if (incorrectAnswers <= 3) return 2;
  return 1;
}

function showFeedback(isCorrect, message) {
  feedbackBox.classList.remove("hidden", "correct", "incorrect");
  feedbackBox.classList.add(isCorrect ? "correct" : "incorrect");
  feedbackBox.textContent = isCorrect ? `✅ ${message}` : `❌ ${message}`;
}

function goToNextQuestion() {
  state.currentQuestionIndex++;

  if (state.currentQuestionIndex < state.selectedQuestions.length) {
    updateAttempt();
    saveProgress();
    renderQuestion();
  } else {
    finishLevel();
  }
}

function finishLevel() {

  
  progressFill.style.width = "100%";

  const passed = state.correctAnswers >= 7;
  state.coinsWon = passed ? 3 : 0;




  if (passed) {
    const wasCompletedBefore = state.completedLevels.includes(
      state.currentLevel.nivel,
    );

    state.student.points += state.score;

    if (!wasCompletedBefore) {
      state.student.coins += state.coinsWon;
      state.completedLevels.push(state.currentLevel.nivel);
    } else {
      state.coinsWon = 0;
    }
    const nextLevelExists = state.chapterData.niveles.some(
      (nivel) => nivel.nivel === state.currentLevel.nivel + 1,
    );

    if (
      nextLevelExists &&
      state.student.unlockedLevel < state.currentLevel.nivel + 1
    ) {
      state.student.unlockedLevel = state.currentLevel.nivel + 1;
    }
  }

  resultCorrect.textContent = state.correctAnswers;
  resultIncorrect.textContent = state.incorrectAnswers;
  resultStars.textContent = passed ? state.stars : 0;
  resultCoins.textContent = state.coinsWon;

  if (passed) {
    const nextLevelExists = state.chapterData.niveles.some(
      (nivel) => nivel.nivel === state.currentLevel.nivel + 1,
    );

    if (nextLevelExists) {
      resultMessage.textContent =
        "¡Nivel superado! Se desbloqueó el siguiente nivel.";
    } else {
      resultMessage.textContent =
        "¡Felicidades! Has completado todos los niveles de este capítulo.";
    }
  } else {
    resultMessage.textContent =
      "No alcanzaste el mínimo. Necesitas al menos 7 respuestas correctas.";
  }


  const reward = document.getElementById("reward");
  const starsBox = document.getElementById("victory-stars");
  const defeatBox = document.getElementById("defeat-icons");

  reward.classList.add("hidden");
  starsBox.classList.add("hidden");
  defeatBox.classList.add("hidden");

  reward.textContent = "";
  starsBox.innerHTML = "";
  defeatBox.innerHTML = "";

  if (passed) {
    mostrarEstrellas(state.score);
    mostrarRecompensa(state.score);
  } else {
    mostrarDerrota();
  }

  nextBtn.textContent = passed ? "Volver al panel" : "Reintentar después";
  showScreen("result");
  state.currentAttempt = null;

  saveProgress();
}

function handleNextAction() {
  const passed = state.correctAnswers >= 7;

  if (passed) {
    const nextLevel = state.currentLevel.nivel + 1;
    const nextLevelExists = state.chapterData.niveles.some(
      (nivel) => nivel.nivel === nextLevel,
    );

    if (nextLevelExists) {
      state.student.currentLevel = nextLevel;
    }
  }

  updateDashboard();
  showScreen("dashboard");
}

function formatQuestionType(type) {
  const map = {
    seleccion_multiple: "Selección múltiple",
    verdadero_falso: "Verdadero / Falso",
    completar: "Completar",
    grafica: "Gráfica",
  };

  return map[type] || "Pregunta";
}
function renderLevels() {
  levelsContainer.innerHTML = "";

  const niveles = state.chapterData.niveles;

  niveles.forEach((nivel) => {
    const card = document.createElement("div");
    const isCompleted = state.completedLevels.includes(nivel.nivel);
    const isUnlocked = nivel.nivel <= state.student.unlockedLevel;

    card.classList.add("level-card");

    if (isCompleted) {
      card.classList.add("completed");
    } else if (isUnlocked) {
      card.classList.add("unlocked");
    } else {
      card.classList.add("locked");
    }

    let statusText = "Bloqueado";
    if (isCompleted) statusText = "Completado";
    else if (isUnlocked) statusText = "Disponible";

    card.innerHTML = `
      <div class="level-number">Nivel ${nivel.nivel}</div>
      <div class="level-status">${statusText}</div>
    `;

    if (isUnlocked) {
      card.addEventListener("click", () => {
        state.student.currentLevel = nivel.nivel;
        updateDashboard();
        startLevel(nivel.nivel);
      });
    }

    levelsContainer.appendChild(card);
  });
}

function getStorageKey() {
  return `ipay_user_${state.student.code}`;
}

function saveProgress() {
  if (!state.student) return;

  const data = {
    student: state.student,
    completedLevels: state.completedLevels,
    currentAttempt: state.currentAttempt,
  };

  localStorage.setItem(getStorageKey(), JSON.stringify(data));
}

function loadProgress(code) {
  const data = localStorage.getItem(`ipay_user_${code}`);
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Error al leer localStorage", error);
    return null;
  }
}
function loadAttempt(attempt) {
  const level = state.chapterData.niveles.find((n) => n.nivel === attempt.level);

  if (!level) {
    alert("No se pudo restaurar el intento porque el nivel no existe.");
    state.currentAttempt = null;
    saveProgress();
    return;
  }

  state.currentLevel = level;
  state.selectedQuestions = attempt.questions;
  state.currentQuestionIndex = attempt.currentQuestionIndex;
  state.correctAnswers = attempt.correctAnswers;
  state.incorrectAnswers = attempt.incorrectAnswers;
  state.stars = attempt.stars;
  state.score = attempt.score;
  state.selectedAnswer = null;
  state.coinsWon = 0;

  liveStars.textContent = state.stars;
  liveCoins.textContent = state.student.coins;

  renderQuestion();
  showScreen("quiz");
}


function updateAttempt() {
  if (!state.currentAttempt) return;

  state.currentAttempt.currentQuestionIndex = state.currentQuestionIndex + 1;
  state.currentAttempt.correctAnswers = state.correctAnswers;
  state.currentAttempt.incorrectAnswers = state.incorrectAnswers;
  state.currentAttempt.stars = state.stars;
  state.currentAttempt.score = state.score;
}
function clearSelections() {
  document.querySelectorAll(".answer-option").forEach((el) => {
    el.classList.remove("selected");
  });
}
function mostrarEstrellas(puntaje) {
  const container = document.getElementById("victory-stars");
  container.innerHTML = "";
  container.classList.remove("hidden");

  let estrellas = Math.round((puntaje / 100) * 3);

  for (let i = 0; i < 3; i++) {
    const star = document.createElement("span");
    star.className = "star";
    star.textContent = i < estrellas ? "⭐" : "☆";
    container.appendChild(star);
  }
}

function mostrarDerrota() {
  const container = document.getElementById("defeat-icons");
  container.innerHTML = "💀 ❌ 💀";
  container.classList.remove("hidden");
}
function mostrarRecompensa(puntaje) {
  const reward = document.getElementById("reward");
  reward.classList.remove("hidden");

  if (puntaje >= 80) {
    reward.textContent = "🏆";
  } else if (puntaje >= 50) {
    reward.textContent = "🥇";
  } else {
    reward.textContent = "📘";
  }
}

function exportProgress() {
  if (!state.student) {
    alert("No hay datos para exportar.");
    return;
  }

  const exportData = {
    student: state.student,
    completedLevels: state.completedLevels,
    currentAttempt: state.currentAttempt,
    exportDate: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `progreso_${state.student.code}.json`;
  a.click();

  URL.revokeObjectURL(url);
}
function mostrarRecompensa(puntaje) {
  const reward = document.getElementById("reward");
  reward.classList.remove("hidden");

  if (puntaje >= 90) {
    reward.textContent = "🏆";
  } else if (puntaje >= 70) {
    reward.textContent = "🥇";
  } else {
    reward.textContent = "🎖️";
  }
}
function cancelGame() {
  if (!state.currentAttempt) {
    showScreen("dashboard");
    return;
  }

  const confirmExit = confirm(
    "¿Seguro que deseas salir? Tu progreso actual se guardará."
  );

  if (!confirmExit) return;

  // Guardar estado actual
  updateAttempt();
  saveProgress();

  // Limpiar intento activo
  state.currentAttempt = null;

  showScreen("dashboard");
}
function saveProgress() {
  if (!state.student) return;

  const data = {
    student: state.student,
    completedLevels: state.completedLevels,
    currentAttempt: state.currentAttempt,
    lastUpdate: Date.now(),
  };

  localStorage.setItem(getStorageKey(), JSON.stringify(data));
}