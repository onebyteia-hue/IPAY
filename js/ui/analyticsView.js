import { navigate } from "../modules/router.js";
import { obtenerPreguntas, obtenerUsuarios } from "../services/firestoreService.js";

let chartInstances = [];
let currentView = "general";
let currentStudentId = null;

function clearCharts() {
  chartInstances.forEach(chart => chart.destroy());
  chartInstances = [];
}

export async function analyticsView(app) {
  app.classList.add("analytics-view");

  let preguntas = await obtenerPreguntas();
  let usuarios = await obtenerUsuarios();

  app.innerHTML = `
    <div class="analytics-container">
      <div class="analytics-header">
        <h2>📊 Panel de Analíticas Avanzado</h2>
        <button class="btn btn-outline" id="back-btn">← Volver al panel maestro</button>
      </div>

      <!-- TABS DE NAVEGACIÓN -->
      <div class="analytics-tabs">
        <button class="tab-btn active" data-tab="general">📈 Por Curso</button>
        <button class="tab-btn" data-tab="student">👤 Por Estudiante</button>
      </div>

      <!-- VISTA GENERAL (POR CURSO) -->
      <div class="tab-content active" id="tab-general">
        <div class="analytics-summary">
          <div class="summary-card">
            <h4>👥 Total Estudiantes</h4>
            <p class="summary-value">${usuarios.length}</p>
          </div>
          <div class="summary-card">
            <h4>❓ Total Preguntas</h4>
            <p class="summary-value">${preguntas.length}</p>
          </div>
          <div class="summary-card">
            <h4>📚 Contenidos</h4>
            <p class="summary-value">${new Set(preguntas.map(p => p.contenido || "MRUV")).size}</p>
          </div>
          <div class="summary-card">
            <h4>🎯 Niveles</h4>
            <p class="summary-value">${new Set(preguntas.map(p => p.nivel)).size}</p>
          </div>
        </div>

        <div class="charts-grid">
          <div class="chart-card">
            <h3>📊 Distribución de Estudiantes por Nivel</h3>
            <canvas id="progressChart"></canvas>
          </div>

          <div class="chart-card">
            <h3>✅ Respuestas Correctas vs Incorrectas</h3>
            <canvas id="correctAnswersChart"></canvas>
          </div>

          <div class="chart-card">
            <h3>📚 Distribución de Contenido</h3>
            <canvas id="contentChart"></canvas>
          </div>

          <div class="chart-card">
            <h3>📈 Tasa de Éxito por Nivel</h3>
            <canvas id="successRateChart"></canvas>
          </div>

          <div class="chart-card">
            <h3>❓ Preguntas por Nivel</h3>
            <canvas id="questionsPerLevelChart"></canvas>
          </div>

          <div class="chart-card">
            <h3>❤️ Vidas Promedio por Nivel</h3>
            <canvas id="livesChart"></canvas>
          </div>

          <div class="chart-card">
            <h3>🪙 Monedas Promedio por Nivel</h3>
            <canvas id="coinsChart"></canvas>
          </div>

          <div class="chart-card">
            <h3>📊 Rendimiento por Contenido</h3>
            <canvas id="contentPerformanceChart"></canvas>
          </div>

          <div class="chart-card">
            <h3>⏱️ Tiempo Promedio por Nivel</h3>
            <canvas id="timeChart"></canvas>
          </div>

          <div class="chart-card">
            <h3>🏆 Top Estudiantes</h3>
            <canvas id="topStudentsChart"></canvas>
          </div>
        </div>

        <div class="table-card">
          <h3>📋 Detalles Detallados de Estudiantes</h3>
          <div id="students-table-general"></div>
        </div>
      </div>

      <!-- VISTA POR ESTUDIANTE -->
      <div class="tab-content" id="tab-student">
        <div class="student-selector">
          <label for="student-select">Selecciona un estudiante:</label>
          <select id="student-select">
            <option value="">-- Elige un estudiante --</option>
            ${usuarios.map(u => `<option value="${u.id || u.nombre}">${u.nombre || "Sin nombre"}</option>`).join('')}
          </select>
        </div>

        <div id="student-analytics" style="display: none;">
          <div class="student-header-info">
            <div class="student-info-card">
              <h3>Información del Estudiante</h3>
              <div id="student-info"></div>
            </div>
          </div>

          <div class="analytics-summary">
            <div class="summary-card">
              <h4>📊 Nivel Actual</h4>
              <p class="summary-value" id="student-level">-</p>
            </div>
            <div class="summary-card">
              <h4>❤️ Vidas</h4>
              <p class="summary-value" id="student-lives">-</p>
            </div>
            <div class="summary-card">
              <h4>🪙 Monedas</h4>
              <p class="summary-value" id="student-coins">-</p>
            </div>
            <div class="summary-card">
              <h4>✅ Tasa de Éxito</h4>
              <p class="summary-value" id="student-success-rate">-</p>
            </div>
          </div>

          <div class="charts-grid">
            <div class="chart-card">
              <h3>📈 Progreso por Nivel</h3>
              <canvas id="studentProgressChart"></canvas>
            </div>

            <div class="chart-card">
              <h3>✅ Respuestas por Contenido</h3>
              <canvas id="studentContentChart"></canvas>
            </div>

            <div class="chart-card">
              <h3>📊 Rendimiento General</h3>
              <canvas id="studentPerformanceChart"></canvas>
            </div>

            <div class="chart-card">
              <h3>🎯 Tasa de Aciertos por Nivel</h3>
              <canvas id="studentSuccessPerLevelChart"></canvas>
            </div>

            <div class="chart-card">
              <h3>📚 Rendimiento por Contenido (%)</h3>
              <canvas id="studentContentPercentChart"></canvas>
            </div>

            <div class="chart-card">
              <h3>🔄 Intentos Promedio por Pregunta</h3>
              <canvas id="studentAttemptsChart"></canvas>
            </div>
          </div>

          <div class="table-card">
            <h3>📋 Historial Detallado de Respuestas</h3>
            <div id="student-responses-table"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("back-btn").onclick = () => navigate("teacher");

  // Event listeners para tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab, usuarios, preguntas));
  });

  // Event listener para selector de estudiante
  document.getElementById("student-select").addEventListener("change", (e) => {
    const studentId = e.target.value;
    if (studentId) {
      const student = usuarios.find(u => (u.id || u.nombre) === studentId);
      currentStudentId = studentId;
      showStudentAnalytics(student, usuarios, preguntas);
    } else {
      document.getElementById("student-analytics").style.display = "none";
    }
  });

  // Cargar Chart.js dinámicamente
  const chartScript = document.createElement("script");
  chartScript.src = "https://cdn.jsdelivr.net/npm/chart.js";
  chartScript.onload = () => {
    // Procesar datos para gráficas generales
    const chartData = processChartData(usuarios, preguntas);
    buildGeneralCharts(chartData, usuarios, preguntas);
  };
  document.head.appendChild(chartScript);
}

function switchTab(tab, usuarios, preguntas) {
  currentView = tab;
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  
  document.getElementById(`tab-${tab}`).classList.add("active");
  event.target.classList.add("active");

  clearCharts();
  
  if (tab === "general") {
    const chartData = processChartData(usuarios, preguntas);
    buildGeneralCharts(chartData, usuarios, preguntas);
  }
}

function processChartData(usuarios, preguntas) {
  // Agrupar preguntas por nivel y contenido
  const preguntasPorNivel = {};
  const preguntasPorContenido = {};
  const rendimientoPorContenido = {};

  preguntas.forEach(p => {
    const nivel = p.nivel || 1;
    const contenido = p.contenido || "MRUV";

    if (!preguntasPorNivel[nivel]) preguntasPorNivel[nivel] = [];
    preguntasPorNivel[nivel].push(p);

    if (!preguntasPorContenido[contenido]) preguntasPorContenido[contenido] = 0;
    preguntasPorContenido[contenido]++;
  });

  // Calcular progreso de estudiantes
  const progresoEstudiantes = {};
  usuarios.forEach(u => {
    const nivel = u.nivel || 1;
    if (!progresoEstudiantes[nivel]) progresoEstudiantes[nivel] = 0;
    progresoEstudiantes[nivel]++;
  });

  // Calcular respuestas correctas e incorrectas
  let respuestasCorrectas = 0;
  let respuestasIncorrectas = 0;
  let vidaPromedio = 0;
  let monedasPromedio = 0;

  usuarios.forEach(u => {
    if (u.progreso) {
      Object.values(u.progreso).forEach(preg => {
        if (preg.correcta) respuestasCorrectas++;
        else respuestasIncorrectas++;
      });
    }
    vidaPromedio += u.vidas || 0;
    monedasPromedio += u.monedas || 0;
  });

  vidaPromedio = (vidaPromedio / usuarios.length).toFixed(1);
  monedasPromedio = (monedasPromedio / usuarios.length).toFixed(1);

  // Calcular rendimiento por contenido
  preguntas.forEach(p => {
    const contenido = p.contenido || "MRUV";
    if (!rendimientoPorContenido[contenido]) {
      rendimientoPorContenido[contenido] = { correctas: 0, totales: 0 };
    }
  });

  usuarios.forEach(u => {
    if (u.progreso) {
      Object.entries(u.progreso).forEach(([key, preg]) => {
        const pregunta = preguntas.find(p => p.id === key);
        if (pregunta) {
          const contenido = pregunta.contenido || "MRUV";
          if (rendimientoPorContenido[contenido]) {
            rendimientoPorContenido[contenido].totales++;
            if (preg.correcta) rendimientoPorContenido[contenido].correctas++;
          }
        }
      });
    }
  });

  return {
    preguntasPorNivel,
    preguntasPorContenido,
    progresoEstudiantes,
    respuestasCorrectas,
    respuestasIncorrectas,
    vidaPromedio,
    monedasPromedio,
    rendimientoPorContenido,
  };
}

function buildGeneralCharts(chartData, usuarios, preguntas) {
  const nivelesOrdenados = Object.keys(chartData.progresoEstudiantes)
    .map(Number)
    .sort((a, b) => a - b);

  // 1. Progreso de estudiantes por nivel
  if (document.getElementById("progressChart")) {
    const ctx1 = document.getElementById("progressChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx1, {
        type: "bar",
        data: {
          labels: nivelesOrdenados.map(n => `Nivel ${n}`),
          datasets: [
            {
              label: "Estudiantes",
              data: nivelesOrdenados.map(n => chartData.progresoEstudiantes[n] || 0),
              backgroundColor: "#58cc02",
              borderColor: "#46a302",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      })
    );
  }

  // 2. Respuestas correctas vs incorrectas
  if (document.getElementById("correctAnswersChart")) {
    const ctx2 = document.getElementById("correctAnswersChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: ["✅ Correctas", "❌ Incorrectas"],
          datasets: [
            {
              data: [chartData.respuestasCorrectas, chartData.respuestasIncorrectas],
              backgroundColor: ["#58cc02", "#ff4458"],
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom" } },
        },
      })
    );
  }

  // 3. Distribución de contenido
  if (document.getElementById("contentChart")) {
    const contenidos = Object.keys(chartData.preguntasPorContenido);
    const coloresContenido = [
      "#58cc02", "#1cb0f6", "#ffa500", "#ff4458", "#a349a4", "#5c8c61",
      "#9b59b6", "#e74c3c", "#3498db", "#f39c12",
    ];
    const ctx3 = document.getElementById("contentChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx3, {
        type: "pie",
        data: {
          labels: contenidos,
          datasets: [
            {
              data: contenidos.map(c => chartData.preguntasPorContenido[c]),
              backgroundColor: coloresContenido.slice(0, contenidos.length),
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom" } },
        },
      })
    );
  }

  // 4. Tasa de éxito por nivel
  if (document.getElementById("successRateChart")) {
    const tasaExitoPorNivel = nivelesOrdenados.map(nivel => {
      const usuariosNivel = usuarios.filter(u => (u.nivel || 1) === nivel);
      if (usuariosNivel.length === 0) return 0;
      let totalCorrectas = 0, totalRespuestas = 0;
      usuariosNivel.forEach(u => {
        if (u.progreso) {
          Object.values(u.progreso).forEach(preg => {
            totalRespuestas++;
            if (preg.correcta) totalCorrectas++;
          });
        }
      });
      return totalRespuestas === 0 ? 0 : ((totalCorrectas / totalRespuestas) * 100).toFixed(1);
    });

    const ctx4 = document.getElementById("successRateChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx4, {
        type: "line",
        data: {
          labels: nivelesOrdenados.map(n => `Nivel ${n}`),
          datasets: [
            {
              label: "Tasa de Éxito (%)",
              data: tasaExitoPorNivel,
              borderColor: "#58cc02",
              backgroundColor: "rgba(88, 204, 2, 0.1)",
              borderWidth: 3,
              fill: true,
              pointRadius: 6,
              pointBackgroundColor: "#58cc02",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { callback: (v) => v + "%" },
            },
          },
        },
      })
    );
  }

  // 5. Preguntas por nivel
  if (document.getElementById("questionsPerLevelChart")) {
    const preguntasPorNivelOrdenado = nivelesOrdenados.map(n => {
      return chartData.preguntasPorNivel[n]?.length || 0;
    });

    const ctx5 = document.getElementById("questionsPerLevelChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx5, {
        type: "bar",
        data: {
          labels: nivelesOrdenados.map(n => `Nivel ${n}`),
          datasets: [
            {
              label: "Cantidad de Preguntas",
              data: preguntasPorNivelOrdenado,
              backgroundColor: "#1cb0f6",
              borderColor: "#0880b8",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      })
    );
  }

  // 6. Vidas promedio por nivel
  if (document.getElementById("livesChart")) {
    const vidasPromedio = nivelesOrdenados.map(nivel => {
      const usuariosNivel = usuarios.filter(u => (u.nivel || 1) === nivel);
      if (usuariosNivel.length === 0) return 0;
      const sumaVidas = usuariosNivel.reduce((sum, u) => sum + (u.vidas || 0), 0);
      return (sumaVidas / usuariosNivel.length).toFixed(1);
    });

    const ctx6 = document.getElementById("livesChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx6, {
        type: "radar",
        data: {
          labels: nivelesOrdenados.map(n => `Nivel ${n}`),
          datasets: [
            {
              label: "Vidas Promedio",
              data: vidasPromedio,
              borderColor: "#ffa500",
              backgroundColor: "rgba(255, 165, 0, 0.2)",
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: "#ffa500",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: { r: { beginAtZero: true } },
        },
      })
    );
  }

  // 7. Monedas promedio por nivel
  if (document.getElementById("coinsChart")) {
    const monedasPromedio = nivelesOrdenados.map(nivel => {
      const usuariosNivel = usuarios.filter(u => (u.nivel || 1) === nivel);
      if (usuariosNivel.length === 0) return 0;
      const sumaMonedas = usuariosNivel.reduce((sum, u) => sum + (u.monedas || 0), 0);
      return (sumaMonedas / usuariosNivel.length).toFixed(1);
    });

    const ctx7 = document.getElementById("coinsChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx7, {
        type: "bar",
        data: {
          labels: nivelesOrdenados.map(n => `Nivel ${n}`),
          datasets: [
            {
              label: "Monedas Promedio",
              data: monedasPromedio,
              backgroundColor: "#ffd700",
              borderColor: "#daa520",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: { y: { beginAtZero: true } },
        },
      })
    );
  }

  // 8. Rendimiento por contenido
  if (document.getElementById("contentPerformanceChart")) {
    const contenidos = Object.keys(chartData.rendimientoPorContenido);
    const porcentajesContenido = contenidos.map(c => {
      const data = chartData.rendimientoPorContenido[c];
      return data.totales === 0 ? 0 : ((data.correctas / data.totales) * 100).toFixed(1);
    });

    const ctx8 = document.getElementById("contentPerformanceChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx8, {
        type: "bar",
        data: {
          labels: contenidos,
          datasets: [
            {
              label: "Porcentaje de Aciertos",
              data: porcentajesContenido,
              backgroundColor: "#9b59b6",
              borderColor: "#8e44ad",
              borderWidth: 2,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              ticks: { callback: (v) => v + "%" },
            },
          },
        },
      })
    );
  }

  // 9. Top 5 Estudiantes
  if (document.getElementById("topStudentsChart")) {
    const estudiantesRendimiento = usuarios
      .map(u => {
        let correctas = 0, totales = 0;
        if (u.progreso) {
          Object.values(u.progreso).forEach(preg => {
            totales++;
            if (preg.correcta) correctas++;
          });
        }
        return {
          nombre: u.nombre || "Sin nombre",
          tasa: totales === 0 ? 0 : ((correctas / totales) * 100).toFixed(1),
        };
      })
      .sort((a, b) => b.tasa - a.tasa)
      .slice(0, 5);

    const ctx9 = document.getElementById("topStudentsChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx9, {
        type: "bar",
        data: {
          labels: estudiantesRendimiento.map(e => e.nombre),
          datasets: [
            {
              label: "Tasa de Éxito (%)",
              data: estudiantesRendimiento.map(e => e.tasa),
              backgroundColor: "#e74c3c",
              borderColor: "#c0392b",
              borderWidth: 2,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              ticks: { callback: (v) => v + "%" },
            },
          },
        },
      })
    );
  }

  // Llenar tabla de estudiantes general
  llenarTablaEstudiantesGeneral(usuarios);
}

function llenarTablaEstudiantesGeneral(usuarios) {
  const tableContainer = document.getElementById("students-table-general");

  if (usuarios.length === 0) {
    tableContainer.innerHTML = "<p>No hay estudiantes registrados.</p>";
    return;
  }

  let html = `
    <div class="table-responsive" style="overflow-x: auto; width: 100%;">
    <table class="students-table">
      <thead>
        <tr>
          <th>Estudiante</th>
          <th>Nivel</th>
          <th>❤️ Vidas</th>
          <th>🪙 Monedas</th>
          <th>Respuestas</th>
          <th>Tasa de Éxito</th>
          <th>Tiempo Jugado</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
  `;

  usuarios.forEach(u => {
    let totalRespuestas = 0;
    let respuestasCorrectas = 0;

    if (u.progreso) {
      Object.values(u.progreso).forEach(preg => {
        totalRespuestas++;
        if (preg.correcta) respuestasCorrectas++;
      });
    }

    const tasaExito = totalRespuestas === 0 ? "0%" : ((respuestasCorrectas / totalRespuestas) * 100).toFixed(1) + "%";
    const tiempoJugado = u.tiempoJugado ? Math.floor(u.tiempoJugado / 60) + " min" : "No disponible";
    const estado = u.vidas > 0 ? "✅ Activo" : "⚠️ Sin vidas";

    html += `
      <tr>
        <td><strong>${u.nombre || "Sin nombre"}</strong></td>
        <td>🎯 ${u.nivel || 1}</td>
        <td>${u.vidas || 0}</td>
        <td>${u.monedas || 0}</td>
        <td>${respuestasCorrectas}/${totalRespuestas}</td>
        <td><strong>${tasaExito}</strong></td>
        <td>${tiempoJugado}</td>
        <td>${estado}</td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  tableContainer.innerHTML = html;
}

function showStudentAnalytics(student, usuarios, preguntas) {
  if (!student) return;

  document.getElementById("student-analytics").style.display = "block";

  // 🔥 Lista de iconos aleatorios para el avatar (temática física/ciencia)
  const icons = ['⚛️', '🚀', '🔬', '🔭', '🪐', '🧠', '⚡', '🔋', '🤖', '📐', '🍎', '💡', '☄️', '📡', '🧪', '🌍'];
  const randomIcon = icons[Math.floor(Math.random() * icons.length)];

  // Información del estudiante
  const infoHtml = `
    <div class="student-profile-header" style="display: flex; align-items: center; gap: 20px; padding: 10px;">
      <div class="student-avatar" style="
        width: 80px; 
        height: 80px; 
        border-radius: 50%; 
        background: #ffffff; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 40px; 
        border: 4px solid #1cb0f6;
        box-shadow: 0 10px 25px rgba(28, 176, 246, 0.25), 0 4px 8px rgba(0,0,0,0.1);
        flex-shrink: 0;
        transform: translateY(-3px);
      ">
        ${randomIcon}
      </div>
      <div class="student-profile-text">
        <p style="margin: 0 0 5px 0; font-size: 1.3rem; color: #1a1a1a; font-weight: 800;">${student.nombre || "Sin nombre"}</p>
        <p style="margin: 0 0 5px 0; color: #666;"><strong>ID:</strong> ${student.id || "No disponible"}</p>
        <p style="margin: 0 0 5px 0; color: #666;"><strong>Email:</strong> ${student.email || "No disponible"}</p>
        <p style="margin: 0; font-variant: all-small-caps; color: #1cb0f6; font-weight: bold;"><strong>Rol:</strong> ${student.rol || "estudiante"}</p>
      </div>
    </div>
  `;
  document.getElementById("student-info").innerHTML = infoHtml;

  // 🔥 USAR RESPUESTAS INDIVIDUALES SI EXISTEN, SINO USAR PROGRESO ANTIGUO
  const respuestas = student.respuestas || [];
  let totalRespuestas = 0;
  let respuestasCorrectas = 0;
  const respuestasPorContenido = {};
  const respuestasPorNivel = {};

  if (respuestas.length > 0) {
    // 🔥 NUEVA ESTRUCTURA: respuestas individuales
    respuestas.forEach(r => {
      totalRespuestas++;
      if (r.correcta) respuestasCorrectas++;

      const nivel = r.nivel || 1;
      const contenido = r.contenido || "MRUV";

      if (!respuestasPorNivel[nivel]) respuestasPorNivel[nivel] = { correctas: 0, totales: 0 };
      if (!respuestasPorContenido[contenido]) respuestasPorContenido[contenido] = { correctas: 0, totales: 0 };

      respuestasPorNivel[nivel].totales++;
      respuestasPorContenido[contenido].totales++;

      if (r.correcta) {
        respuestasPorNivel[nivel].correctas++;
        respuestasPorContenido[contenido].correctas++;
      }
    });
  } else if (student.progreso) {
    // 🔥 ESTRUCTURA ANTIGUA: progreso por nivel
    Object.entries(student.progreso).forEach(([nivel, data]) => {
      if (typeof data === 'object' && data.estrellas !== undefined) {
        // Es la estructura antigua: { estrellas, intentos, completado }
        const intentos = data.intentos || 1;
        const correctas = Math.round((data.estrellas / 10) * intentos * 10);
        totalRespuestas += intentos * 10;
        respuestasCorrectas += correctas;

        if (!respuestasPorNivel[nivel]) respuestasPorNivel[nivel] = { correctas: 0, totales: 0 };
        respuestasPorNivel[nivel].correctas = data.estrellas;
        respuestasPorNivel[nivel].totales = intentos * 10 || 10;
      }
    });
  }

  const tasaExito = totalRespuestas === 0 ? "0%" : ((respuestasCorrectas / totalRespuestas) * 100).toFixed(1) + "%";

  document.getElementById("student-level").textContent = `${student.nivel || 1}`;
  document.getElementById("student-lives").textContent = `${student.vidas || 0}`;
  document.getElementById("student-coins").textContent = `${student.monedas || 0}`;
  document.getElementById("student-success-rate").textContent = tasaExito;

  clearCharts();

  // Construir gráficas del estudiante
  const nivelesOrdenados = Object.keys(respuestasPorNivel)
    .map(Number)
    .sort((a, b) => a - b);

  if (nivelesOrdenados.length === 0) {
    // Si no hay datos, mostrar mensaje
    document.getElementById("student-analytics").innerHTML += `<p style="text-align: center; color: #999; margin-top: 20px;">Este estudiante aún no ha respondido preguntas.</p>`;
    return;
  }

  // 1. Progreso por nivel
  if (document.getElementById("studentProgressChart")) {
    const correctasPorNivel = nivelesOrdenados.map(n => respuestasPorNivel[n].correctas || 0);
    const totalPorNivel = nivelesOrdenados.map(n => respuestasPorNivel[n].totales || 0);

    const ctx = document.getElementById("studentProgressChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: nivelesOrdenados.map(n => `Nivel ${n}`),
          datasets: [
            {
              label: "✅ Correctas",
              data: correctasPorNivel,
              backgroundColor: "#58cc02",
              borderColor: "#46a302",
              borderWidth: 2,
            },
            {
              label: "❌ Incorrectas",
              data: totalPorNivel.map((t, i) => t - correctasPorNivel[i]),
              backgroundColor: "#ff4458",
              borderColor: "#e63946",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: { y: { beginAtZero: true, stacked: false } },
        },
      })
    );
  }

  // 2. Respuestas por contenido
  if (document.getElementById("studentContentChart")) {
    const contenidos = Object.keys(respuestasPorContenido);
    const correctasPorContenido = contenidos.map(c => respuestasPorContenido[c].correctas);
    const totalPorContenido = contenidos.map(c => respuestasPorContenido[c].totales);

    const ctx = document.getElementById("studentContentChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: contenidos,
          datasets: [
            {
              data: totalPorContenido,
              backgroundColor: ["#58cc02", "#1cb0f6", "#ffa500", "#ff4458", "#a349a4", "#5c8c61"],
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom" } },
        },
      })
    );
  }

  // 3. Rendimiento general
  if (document.getElementById("studentPerformanceChart")) {
    const ctx = document.getElementById("studentPerformanceChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["✅ Correctas", "❌ Incorrectas"],
          datasets: [
            {
              data: [respuestasCorrectas, totalRespuestas - respuestasCorrectas],
              backgroundColor: ["#58cc02", "#ff4458"],
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom" } },
        },
      })
    );
  }

  // 4. Tasa de aciertos por nivel
  if (document.getElementById("studentSuccessPerLevelChart")) {
    const tasasPorNivel = nivelesOrdenados.map(n => {
      const data = respuestasPorNivel[n];
      return data.totales === 0 ? 0 : ((data.correctas / data.totales) * 100).toFixed(1);
    });

    const ctx = document.getElementById("studentSuccessPerLevelChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx, {
        type: "line",
        data: {
          labels: nivelesOrdenados.map(n => `Nivel ${n}`),
          datasets: [
            {
              label: "Tasa de Éxito (%)",
              data: tasasPorNivel,
              borderColor: "#58cc02",
              backgroundColor: "rgba(88, 204, 2, 0.1)",
              borderWidth: 3,
              fill: true,
              pointRadius: 6,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { callback: (v) => v + "%" },
            },
          },
        },
      })
    );
  }

  // 5. Rendimiento por contenido (%)
  if (document.getElementById("studentContentPercentChart")) {
    const contenidos = Object.keys(respuestasPorContenido);
    const porcentajesPorContenido = contenidos.map(c => {
      const data = respuestasPorContenido[c];
      return data.totales === 0 ? 0 : ((data.correctas / data.totales) * 100).toFixed(1);
    });

    const ctx = document.getElementById("studentContentPercentChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: contenidos,
          datasets: [
            {
              label: "Porcentaje de Aciertos",
              data: porcentajesPorContenido,
              backgroundColor: "#1cb0f6",
              borderColor: "#0880b8",
              borderWidth: 2,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              ticks: { callback: (v) => v + "%" },
            },
          },
        },
      })
    );
  }

  // 6. Intentos promedio (simulado)
  if (document.getElementById("studentAttemptsChart")) {
    const nivelesOrdenadosFull = Object.keys(respuestasPorNivel)
      .map(Number)
      .sort((a, b) => a - b);
    const intentosPorNivel = nivelesOrdenadosFull.map(n => {
      const data = respuestasPorNivel[n];
      return data.totales === 0 ? 0 : (data.totales / Math.max(1, data.correctas)).toFixed(2);
    });

    const ctx = document.getElementById("studentAttemptsChart").getContext("2d");
    chartInstances.push(
      new Chart(ctx, {
        type: "radar",
        data: {
          labels: nivelesOrdenadosFull.map(n => `Nivel ${n}`),
          datasets: [
            {
              label: "Intentos Promedio",
              data: intentosPorNivel,
              borderColor: "#ffa500",
              backgroundColor: "rgba(255, 165, 0, 0.2)",
              borderWidth: 2,
              pointRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: { r: { beginAtZero: true } },
        },
      })
    );
  }

  // Llenar tabla de respuestas del estudiante
  llenarTablaRespuestasEstudiante(student, preguntas);
}

function llenarTablaRespuestasEstudiante(student, preguntas) {
  const tableContainer = document.getElementById("student-responses-table");

  // 🔥 SOPORTAR AMBAS ESTRUCTURAS
  const respuestas = student.respuestas || [];

  if (respuestas.length === 0) {
    tableContainer.innerHTML = "<p>Este estudiante no tiene respuestas registradas.</p>";
    return;
  }

  let html = `
    <div class="table-responsive" style="overflow-x: auto; width: 100%;">
    <table class="students-table">
      <thead>
        <tr>
          <th>Pregunta</th>
          <th>Contenido</th>
          <th>Nivel</th>
          <th>Tu Respuesta</th>
          <th>Respuesta Correcta</th>
          <th>Resultado</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
  `;

  respuestas.forEach(r => {
    const resultado = r.correcta ? "✅ Correcta" : "❌ Incorrecta";
    const fecha = r.fecha ? new Date(r.fecha).toLocaleDateString("es-ES") : "No disponible";

    html += `
      <tr>
        <td><strong>${r.pregunta?.substring(0, 50) || "Pregunta desconocida"}...</strong></td>
        <td>${r.contenido || "MRUV"}</td>
        <td>${r.nivel || 1}</td>
        <td>${r.respuestaSeleccionada || "No disponible"}</td>
        <td><strong>${r.respuestaCorrecta || "No disponible"}</strong></td>
        <td>${resultado}</td>
        <td>${fecha}</td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  tableContainer.innerHTML = html;
}
