import { db } from "../../firebase.js";
import {
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  obtenerPreguntas,
  actualizarPregunta,
  eliminarPregunta,
} from "../services/firestoreService.js";
import { saveLocalQuestions } from "../services/storageService.js";

import { obtenerUsuarios } from "../services/firestoreService.js";
import { saveLocalUsers } from "../services/storageService.js";

export async function teacherView(app) {
  app.classList.add("teacher-view");

  const preguntas = await obtenerPreguntas();

  let imagenSeleccionada = "";
  let preguntaEnEdicionId = null;
  

  app.innerHTML = `
    <div class="card" style="max-width:900px; width:100%;">

      <h2>👨‍🏫 Panel Maestro</h2>
      

      <div class="form-box">

        <input id="enunciado" placeholder="📝 Enunciado"/>

        <div class="grid-2">
          <input id="op1" placeholder="Opción 1"/>
          <input id="op2" placeholder="Opción 2"/>
          <input id="op3" placeholder="Opción 3"/>
          <input id="op4" placeholder="Opción 4"/>
        </div>

        <div class="grid-2">
          <input id="correcta" type="number" placeholder="Correcta (0-3)"/>
          <input id="nivel" type="number" placeholder="Nivel"/>
        </div>

        <button class="btn" id="btn-img">Seleccionar imagen</button>
        <p id="img-name"></p>

        <button class="btn" id="save">Guardar pregunta</button>
        <button class="btn" id="save-local">Guardar preguntas offline</button>
        <button class="btn btn-secondary" id="back">Volver</button>
      </div>

      <hr/>

      <h3>📚 Preguntas</h3>

<div style="margin-bottom:10px;">
  <select id="filtro-nivel">
    <option value="todos">Todos los niveles</option>
  </select>
</div>


      <div id="lista"></div>

      
    </div>
  `;

  const enunciadoInput = document.getElementById("enunciado");
  const op1Input = document.getElementById("op1");
  const op2Input = document.getElementById("op2");
  const op3Input = document.getElementById("op3");
  const op4Input = document.getElementById("op4");
  const correctaInput = document.getElementById("correcta");
  const nivelInput = document.getElementById("nivel");
  const imgName = document.getElementById("img-name");
  const saveButton = document.getElementById("save");
  const saveLocalButton = document.getElementById("save-local");

  function limpiarFormulario() {
    preguntaEnEdicionId = null;
    imagenSeleccionada = "";
    enunciadoInput.value = "";
    op1Input.value = "";
    op2Input.value = "";
    op3Input.value = "";
    op4Input.value = "";
    correctaInput.value = "";
    nivelInput.value = "";
    imgName.textContent = "";
    saveButton.textContent = "Guardar pregunta";
  }

  function cargarPreguntaEnFormulario(pregunta) {
    preguntaEnEdicionId = pregunta.id;
    imagenSeleccionada = pregunta.imagen || "";
    enunciadoInput.value = pregunta.enunciado || "";
    op1Input.value = pregunta.opciones?.[0] || "";
    op2Input.value = pregunta.opciones?.[1] || "";
    op3Input.value = pregunta.opciones?.[2] || "";
    op4Input.value = pregunta.opciones?.[3] || "";
    correctaInput.value = Number.isInteger(pregunta.correcta)
      ? pregunta.correcta
      : "";
    nivelInput.value = Number.isInteger(pregunta.nivel) ? pregunta.nivel : "";
    imgName.textContent = imagenSeleccionada || "Sin imagen seleccionada";
    saveButton.textContent = "Actualizar pregunta";
    enunciadoInput.focus();
  }

  // =========================
  // 🖼️ MODAL IMÁGENES
  // =========================

  document.getElementById("btn-img").onclick = () => {
    const imagenes = [
      "a1.jpg",
      "a2.png",
      "a3.png",
      "a4.png",
      "a5.png",
      "a6.png",
      "a7.png",
      "a8.jpg",
      "a9.jpg",
      "a10.jpg",
      "a11.jpeg",
      "a12.jpg",
      "a13.png",
      "a14.jpeg",
      "a15.jpeg",
      "a16.jpeg",
      "a17.jpeg",
      "a18.jpeg",
      "a19.jpeg",
      "a20.jpeg",
      "a21.jpeg",
      "a22.jpeg",
      "a23.jpeg",
      "a24.jpeg",
      "a25.jpeg",
      "a26.jpeg",
      "a27.jpeg",
      "a28.jpeg",
      "a29.jpeg",
      "a30.jpeg",
      "a31.jpeg",
      "a32.jpeg",
      "a33.jpeg",
      "a34.jpeg",
      "a35.jpeg",
      "a36.jpeg",
      "a37.jpeg",
      "a38.jpeg",
      "a39.jpeg",
      "a40.jpeg",
      "a41.jpeg",
      "a42.jpeg",
      "a43.jpeg",
      "a44.jpeg",
      "a45.jpeg",
      "a46.jpeg",
      "a47.jpg",
      "a48.jpg",
      "a49.jpg",
      "a50.jpg",
      "a51.jpg",
      "a52.jpg",
      "a53.jpg",
      "a54.jpg",
      "a55.jpg",
      "a56.jpg",
      "a57.jpg",
      "a58.jpg",
      "a59.jpg",
      "a60.jpg",
    ];

    const modal = document.createElement("div");

    modal.innerHTML = `
      <div style="
        position:fixed;
        top:0; left:0;
        width:100%; height:100%;
        background:rgba(0,0,0,0.5);
        display:flex;
        justify-content:center;
        align-items:center;
      ">
        <div class="card">
          <h3>Selecciona imagen</h3>
          <div class="galeria"></div>
          <button id="close">Cerrar</button>
        </div>
      </div>
    `;

    const galeria = modal.querySelector(".galeria");

    imagenes.forEach((img) => {
      const el = document.createElement("img");
      el.src = `./assets/images/${img}`;
      el.className = "img-option";

      el.onclick = () => {
        imagenSeleccionada = img;
        imgName.textContent = img;
        modal.remove();
      };

      galeria.appendChild(el);
    });

    modal.querySelector("#close").onclick = () => modal.remove();

    document.body.appendChild(modal);
  };

  // =========================
  // 💾 GUARDAR
  // =========================

  saveButton.onclick = async () => {
    const opciones = [
      op1Input.value.trim(),
      op2Input.value.trim(),
      op3Input.value.trim(),
      op4Input.value.trim(),
    ];

    const correcta = parseInt(correctaInput.value, 10);
    const nivel = parseInt(nivelInput.value, 10);

    if (!enunciadoInput.value.trim()) {
      alert("Completa el enunciado.");
      return;
    }

    if (opciones.some((op) => !op)) {
      alert("Completa las 4 respuestas.");
      return;
    }

    if (Number.isNaN(correcta) || correcta < 0 || correcta > 3) {
      alert("La respuesta correcta debe estar entre 0 y 3.");
      return;
    }

    if (Number.isNaN(nivel)) {
      alert("Ingresa un nivel válido.");
      return;
    }

    const pregunta = {
      enunciado: enunciadoInput.value.trim(),
      imagen: imagenSeleccionada,
      opciones,
      correcta,
      nivel,
    };

    if (preguntaEnEdicionId) {
      await actualizarPregunta(preguntaEnEdicionId, pregunta);
      alert("✅ Pregunta actualizada");
    } else {
      await addDoc(collection(db, "preguntas_fisica"), pregunta);
      alert("✅ Guardado");
    }

    limpiarFormulario();
    await teacherView(app);
  };

  saveLocalButton.onclick = async () => {
    try {
      // 🔥 1. TRAER PREGUNTAS
      const preguntasActualizadas = await obtenerPreguntas();

      // 🔥 2. TRAER USUARIOS
      const usuariosActualizados = await obtenerUsuarios();

      if (!preguntasActualizadas.length) {
        alert("No hay preguntas para guardar.");
        return;
      }

      if (!usuariosActualizados.length) {
        alert("No hay estudiantes para guardar.");
        return;
      }

      // 🔥 3. GUARDAR TODO LOCAL
      saveLocalQuestions(preguntasActualizadas);
      saveLocalUsers(usuariosActualizados);

      alert(`✅ Modo offline listo:
📚 ${preguntasActualizadas.length} preguntas
👤 ${usuariosActualizados.length} estudiantes`);
    } catch (error) {
      console.error("Error guardando offline:", error);
      alert("❌ Error al guardar datos offline");
    }
  };

  // =========================
  // 📚 LISTA + EDITAR + ELIMINAR
  // =========================

  const lista = document.getElementById("lista");
  const filtroNivel = document.getElementById("filtro-nivel");

  let nivelSeleccionado = "todos";

  // 🔥 llenar select niveles
  function llenarFiltroNiveles(preguntas) {
    const niveles = [
      ...new Set(preguntas.map((p) => p.nivel).filter((n) => n !== undefined)),
    ].sort((a, b) => a - b);

    filtroNivel.innerHTML = `
    <option value="todos">Todos los niveles</option>
    ${niveles.map((n) => `<option value="${n}">Nivel ${n}</option>`).join("")}
  `;
  }


  // 🔥 evento filtro (SOLO UNA VEZ)
  filtroNivel.addEventListener("change", (e) => {
    nivelSeleccionado = e.target.value;
    renderListaPreguntas();
  });

  // 🔥 render lista
  function renderListaPreguntas() {
    lista.innerHTML = "";

    let preguntasFiltradas = preguntas;

    if (nivelSeleccionado !== "todos") {
      preguntasFiltradas = preguntas.filter(
        (p) => String(p.nivel) === String(nivelSeleccionado),
      );
    }

    const preguntasOrdenadas = [...preguntasFiltradas].sort((a, b) => {
      return Number(a.nivel) - Number(b.nivel);
    });

    let contador = 1;
    let nivelActual = null;

    preguntasOrdenadas.forEach((p) => {
      if (p.nivel !== nivelActual) {
        nivelActual = p.nivel;

        const tituloNivel = document.createElement("h4");
        tituloNivel.textContent = `Nivel ${nivelActual}`;
        lista.appendChild(tituloNivel);
      }

      const div = document.createElement("div");
      div.className = "pregunta-card";

      const respuestaCorrecta = p.opciones?.[p.correcta] || "No definida";

      div.innerHTML = `
      <p><strong>${contador}.</strong> ${p.enunciado}</p>
      <p><strong>Nivel:</strong> ${p.nivel ?? "Sin nivel"}</p>
      ${p.imagen ? `<img src="./assets/images/${p.imagen}" width="80"/>` : ""}
      <p><strong>Respuesta correcta:</strong> ${respuestaCorrecta}</p>

      <br/>
      <button class="btn edit">Editar</button>
      <button class="btn btn-secondary delete">Eliminar</button>
    `;

      div.querySelector(".edit").onclick = () => {
        cargarPreguntaEnFormulario(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
      };

      div.querySelector(".delete").onclick = async () => {
        const ok = confirm("¿Eliminar pregunta?");
        if (ok) {
          await eliminarPregunta(p.id);
          div.remove();
        }
      };

      lista.appendChild(div);

      contador++;
    });
  }

  // 🔥 inicializar
  llenarFiltroNiveles(preguntas);
  renderListaPreguntas();

  document.getElementById("back").onclick = () => location.reload();


}
