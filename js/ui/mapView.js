import { navigate } from "../modules/router.js";
import { getState } from "../modules/gameState.js";
import { getAvailableContents, getAvailableLevelsForContent } from "../services/levelQuestionService.js";

export async function mapView(app) {
  const state = getState();
  const currentUserContent = state.currentUser?.contenido || "";

  const contenidosDisponibles = await getAvailableContents();
  const contenidoActivo = contenidosDisponibles.includes(currentUserContent)
    ? currentUserContent
    : contenidosDisponibles[0] || "MRUV";

  app.innerHTML = `
    <div class="card">
      <div class="map-header">
        <div>
          <h2>🗺️ Mapa de contenidos</h2>
          <p class="map-subtitle">Selecciona un contenido y verás los niveles que tienen preguntas registradas.</p>
        </div>
        <button class="btn btn-secondary" id="back">Volver</button>
      </div>

      <div class="map-toolbar">
        <div class="map-toolbar-item">
          <label for="map-content-select">Contenido</label>
          <select id="map-content-select">
            ${contenidosDisponibles
              .map(
                (contenido) =>
                  `<option value="${contenido}" ${
                    contenido === contenidoActivo ? "selected" : ""
                  }>${contenido}</option>`,
              )
              .join("")}
          </select>
        </div>
        <div class="map-info" id="map-info"></div>
      </div>

      <div id="map" class="map-grid"></div>
    </div>
  `;

  const map = document.getElementById("map");
  const contentSelect = document.getElementById("map-content-select");
  const mapInfo = document.getElementById("map-info");

  function renderEmptyMessage(contenido) {
    if (!map) return;
    map.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "map-empty";
    empty.innerHTML = `
      <p>No hay niveles registrados para <strong>${contenido}</strong>.</p>
      <p>Agrega al menos una pregunta en ese contenido para que aquí aparezcan los niveles.</p>
    `;
    map.appendChild(empty);
  }

  async function renderContentLevels(contenido) {
    const nivelesDisponibles = await getAvailableLevelsForContent(contenido);

    if (mapInfo) {
      mapInfo.innerHTML = nivelesDisponibles.length
        ? `Mostrando ${nivelesDisponibles.length} nivel${nivelesDisponibles.length === 1 ? "" : "es"} para <strong>${contenido}</strong>.`
        : `No se encontraron niveles con preguntas para <strong>${contenido}</strong>.`;
    }

    if (!map) return;
    map.innerHTML = "";

    if (nivelesDisponibles.length === 0) {
      renderEmptyMessage(contenido);
      return;
    }

    nivelesDisponibles.forEach((nivel) => {
      const data = state.progreso[nivel] || { estrellas: 0 };
      const card = document.createElement("button");
      card.className = "btn level-card";
      card.innerHTML = `
        <div class="level-card-title">Nivel ${nivel}</div>
        <div class="level-card-meta">⭐ ${data.estrellas}</div>
      `;

      card.onclick = () => {
        if (state.currentUser) {
          state.currentUser.contenido = contenido;
        }
        state.nivel = nivel;
        navigate("game");
      };

      map.appendChild(card);
    });
  }

  if (contentSelect) {
    contentSelect.onchange = (event) => {
      renderContentLevels(event.target.value);
    };
  }

  await renderContentLevels(contenidoActivo);

  document.getElementById("back").onclick = () => navigate("student");
}
