import { navigate } from "../modules/router.js";

export function homeView(app) {
  app.classList.remove("teacher-view");

  app.innerHTML = `
    <div class="card home-card ">
    
      <h1>⚡ IPAY</h1>
      <h5 style="margin-top:15px; font-size:25px;">
       Imanarninchikwan Pachakallpachakymanta Yachanachik 
       </h5>

      <div class="logo-container">
  <img
    class="home-logo"
    src="./assets/images/logo.png"
    alt="Logo IPAY"
  />
</div>

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
  `;

  document.getElementById("btn-student")
    .addEventListener("click", () => navigate("student"));

  document.getElementById("btn-teacher")
  .addEventListener("click", () => {

    const code = prompt("Ingrese código maestro:");

    if (code === "miler123") {
      navigate("teacher");
    } else {
      alert("Código incorrecto ❌");
    }
  });
}
