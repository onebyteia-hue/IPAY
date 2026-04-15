export function ProgressBar({ actual, total }) {

  const porcentaje = Math.round((actual / total) * 100);

  return `
    <div class="progress-container">
      <div 
        class="progress-bar" 
        style="width:${porcentaje}%"
      ></div>
    </div>
  `;
}