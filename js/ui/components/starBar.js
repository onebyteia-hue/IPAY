export function StarBar({ correctas = 0, total = 10 }) {
  return `
    <div class="star-bar">
      ${Array.from({ length: total }).map((_, i) => {
        const activa = i < correctas;
        return `
          <span class="star ${activa ? "active" : ""}" data-index="${i}">
            ⭐
          </span>
        `;
      }).join("")}
    </div>
  `;
}