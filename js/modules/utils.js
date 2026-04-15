// Mezclar array (Fisher-Yates)
export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Obtener 10 preguntas aleatorias
export function getRandomQuestions(allQuestions, cantidad = 10) {
  return shuffle([...allQuestions]).slice(0, cantidad);
}

export function exportarProgreso(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "progreso_estudiante.json";
  a.click();
}