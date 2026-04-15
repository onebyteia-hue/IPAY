import { navigate } from "../../modules/router.js";

export function backButton(route = "home") {
  return `
    <button class="btn btn-secondary" id="back-btn">
      ⬅ Atrás
    </button>
  `;
}

export function activarBack(route = "home") {
  const btn = document.getElementById("back-btn");
  if (btn) {
    btn.onclick = () => navigate(route);
  }
}