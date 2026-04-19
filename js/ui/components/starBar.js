export function StarBar({ correctas = 0, total = 10 }) {
  return `
    <div class="star-bar">
      ${Array.from({ length: total }).map((_, i) => {
        const activa = i < correctas;

        // 🔥 calcular color progresivo
        const porcentaje = i / (total - 1); // 0 → 1

        const color = activa
          ? getColorGradiente(porcentaje)
          : "#ccc";

        return `
          <span 
            class="star ${activa ? "active" : ""}" 
            style="color:${color}"
          >
            ⭐
          </span>
        `;
      }).join("")}
    </div>
  `;
}

function getColorGradiente(p) {
  // p = 0 (rojo) → 1 (verde)

  const r = Math.round(255 * (1 - p)); // rojo baja
  const g = Math.round(255 * p);       // verde sube
  const b = 0;

  return `rgb(${r}, ${g}, ${b})`;
}