import { navigate } from "../modules/router.js";
import { getState, TOTAL_LEVELS } from "../modules/gameState.js";
import { backButton, activarBack } from "./components/backButton.js";

export function mapView(app) {

  const state = getState();

  const niveles = Array.from({ length: TOTAL_LEVELS }, (_, index) => index + 1);


  app.innerHTML = `
  
    <div class="card">
      <h2>🗺️ Mapa de niveles</h2>

      <div id="map"></div>

      <br/>
      <button class="btn btn-secondary" id="back">Volver</button>
    </div>
  `;

  const map = document.getElementById("map");

  niveles.forEach(n => {

    const data = state.progreso[n] || { estrellas: 0 };

    const desbloqueado = n === 1 || (state.progreso[n-1]?.completado);

    const btn = document.createElement("button");

    btn.className = "btn";
    btn.style.margin = "10px";

    if (!desbloqueado) {
      btn.style.background = "gray";
      btn.disabled = true;
    }

    btn.innerHTML = `
      Nivel ${n} <br/>
      ⭐ ${data.estrellas}
    `;

    btn.onclick = () => {
      state.nivel = n;
      navigate("game");
    };

    map.appendChild(btn);
  });

  document.getElementById("back").onclick = () => navigate("student");
}
