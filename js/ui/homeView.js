import { navigate } from "../modules/router.js";

export function homeView(app) {
  app.classList.remove("teacher-view");

  app.innerHTML = `
  <div class="home-bg-wrapper">  <!-- 🔥 NUEVO CONTENEDOR -->
  <div class="home-background">
    <div class="card home-card">
    
      <h1>⚡ IPAY</h1>
      <h5 style="margin-top:15px; font-size:25px;">
       Imanarninchikwan Pachakallpachakamaymanta Yachanachik 
      </h5>

     

      <button class="btn" id="btn-student">ESTUDIANTE - INGRESE AQUI</button>
      <br/><br/>
      <button class="btn btn-secondary" id="btn-teacher">MAESTRO</button>

      <p style="margin-top:20px; font-size:18px;">
        Elaborado por: Maribel Copajira Arispe - Miler Copajira Arispe🚀
      </p>
      <p style="margin-top:20px; font-size:12px;">
        Se prohibe la copia y distribucion de este material educativo.
      </p>

    </div>
  </div>
  </div>
`;

  document
    .getElementById("btn-student")
    .addEventListener("click", () => navigate("student"));

  document.getElementById("btn-teacher").addEventListener("click", () => {
    const code = prompt("Ingrese código maestro:");

    if (code === "admin123") {
      navigate("teacher");
    } else {
      alert("Código incorrecto ❌");
    }
  });
}


export function resetAppStyles(app) {
  app.classList.remove("home-bg");
  app.classList.remove("teacher-view");
}