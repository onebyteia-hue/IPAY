import {
  guardarPregunta,
  obtenerPreguntas,
  actualizarPregunta,
  eliminarPregunta,
} from "../services/firestoreService.js";
import { saveLocalQuestions } from "../services/storageService.js";

import { obtenerUsuarios } from "../services/firestoreService.js";
import { saveLocalUsers } from "../services/storageService.js";

import { navigate } from "../modules/router.js";

export async function teacherView(app) {
  app.classList.add("teacher-view");

  let preguntas = await obtenerPreguntas();

  const contenidos = Array.from(
    new Set(
      preguntas.map((p) => String(p.contenido || "MRUV").trim() || "MRUV"),
    ),
  );

  if (!contenidos.includes("MRUV")) {
    contenidos.unshift("MRUV");
  }

  contenidos.sort((a, b) => {
    if (a === "MRUV") return -1;
    if (b === "MRUV") return 1;
    return a.localeCompare(b);
  });

  let imagenSeleccionada = "";
  let preguntaEnEdicionId = null;
  

  app.innerHTML = `
    <div class="card" style="max-width:900px; width:100%;">

      <h2>👨‍🏫 Panel Maestro</h2>
      

      <div class="form-box teacher-form">

        <div class="form-header">
          <div>
            <p class="section-label">Crear / Editar pregunta</p>
            <h3 class="section-title">Datos del contenido</h3>
            <p class="section-note">Selecciona el contenido activo o crea uno nuevo. Luego agrega la pregunta y marca la respuesta correcta.</p>
          </div>
        </div>

        <textarea id="enunciado" rows="5" placeholder="📝 Enunciado de la pregunta"></textarea>

        <div class="grid-2">
          <div class="option-row">
            <input id="op1" placeholder="Opción 1" />
            <label class="option-check">
              <input type="checkbox" class="correct-checkbox" data-index="0" />
              Correcta
            </label>
          </div>
          <div class="option-row">
            <input id="op2" placeholder="Opción 2" />
            <label class="option-check">
              <input type="checkbox" class="correct-checkbox" data-index="1" />
              Correcta
            </label>
          </div>
          <div class="option-row">
            <input id="op3" placeholder="Opción 3" />
            <label class="option-check">
              <input type="checkbox" class="correct-checkbox" data-index="2" />
              Correcta
            </label>
          </div>
          <div class="option-row">
            <input id="op4" placeholder="Opción 4" />
            <label class="option-check">
              <input type="checkbox" class="correct-checkbox" data-index="3" />
              Correcta
            </label>
          </div>
        </div>

        <div class="grid-2 teacher-meta-row">
          <div class="meta-left-block">
            <div class="small-field-block">
              <label class="field-label" for="nivel">Nivel</label>
              <input id="nivel" class="small-input" type="number" placeholder="Nivel" />
            </div>
            <div class="image-upload-block">
              <button class="btn btn-secondary" id="btn-img">Seleccionar imagen</button>
              <p id="img-name"></p>
            </div>
          </div>
          <div class="content-actions">
            <label class="field-label" for="selected-content">Contenido</label>
            <div class="content-control">
              <select id="selected-content"></select>
              <div class="content-button-row">
                <button class="btn btn-secondary" type="button" id="add-content">Nuevo contenido</button>
                <button class="btn btn-danger" type="button" id="delete-content">Eliminar contenido</button>
              </div>
            </div>
          </div>
        </div>

        <div class="teacher-actions">
          <button class="btn btn-primary" id="save">Guardar pregunta</button>
          <button class="btn btn-secondary" id="save-local">Guardar preguntas offline</button>
          <button class="btn btn-secondary" id="analytics-btn">📊 Ver Análiticas</button>
          <button class="btn btn-outline" id="back">Volver</button>
        </div>
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
  const correctCheckboxes = Array.from(
    document.querySelectorAll(".correct-checkbox"),
  );
  const nivelInput = document.getElementById("nivel");
  const selectedContent = document.getElementById("selected-content");
  const addContentButton = document.getElementById("add-content");
  const deleteContentButton = document.getElementById("delete-content");
  const imgName = document.getElementById("img-name");
  const saveButton = document.getElementById("save");
  const saveLocalButton = document.getElementById("save-local");
  const teacherActions = document.querySelector(".teacher-actions");

  function limpiarFormulario() {
    preguntaEnEdicionId = null;
    imagenSeleccionada = "";
    enunciadoInput.value = "";
    op1Input.value = "";
    op2Input.value = "";
    op3Input.value = "";
    op4Input.value = "";
    correctCheckboxes.forEach((checkbox) => (checkbox.checked = false));
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
    correctCheckboxes.forEach((checkbox) => {
      checkbox.checked = Number(checkbox.dataset.index) === Number(pregunta.correcta);
    });
    nivelInput.value = Number.isInteger(pregunta.nivel) ? pregunta.nivel : "";
    selectedContent.value = pregunta.contenido || "MRUV";
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

    const correcta = correctCheckboxes.findIndex((checkbox) => checkbox.checked);
    const nivel = parseInt(nivelInput.value, 10);
    const contenidoValor = selectedContent.value || "MRUV";

    if (!enunciadoInput.value.trim()) {
      alert("Completa el enunciado.");
      return;
    }

    if (opciones.some((op) => !op)) {
      alert("Completa las 4 respuestas.");
      return;
    }

    if (correcta < 0 || correcta > 3) {
      alert("Marca una opción como correcta.");
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
      contenido: contenidoValor,
    };

    if (preguntaEnEdicionId) {
      await actualizarPregunta(preguntaEnEdicionId, pregunta);
      alert("✅ Pregunta actualizada");
    } else {
      await guardarPregunta(pregunta);
      alert("✅ Guardado");
    }

    limpiarFormulario();
    if (!contenidos.includes(contenidoValor)) {
      contenidos.push(contenidoValor);
      contenidos.sort((a, b) => {
        if (a === "MRUV") return -1;
        if (b === "MRUV") return 1;
        return a.localeCompare(b);
      });
    }
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

    const filtroContenido = selectedContent.value || "MRUV";
    let preguntasFiltradas = preguntas.filter(
      (p) => String(p.contenido || "MRUV").trim() === filtroContenido,
    );

    if (nivelSeleccionado !== "todos") {
      preguntasFiltradas = preguntasFiltradas.filter(
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
      <p><strong>Contenido:</strong> ${p.contenido || "MRUV"}</p>
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

  function renderContenidoSelect() {
    selectedContent.innerHTML = contenidos
      .map(
        (contenido) =>
          `<option value="${contenido}">${contenido}</option>`,
      )
      .join("");
  }

  function bindCorrectCheckboxes() {
    correctCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          correctCheckboxes.forEach((other) => {
            if (other !== checkbox) other.checked = false;
          });
        }
      });
    });
  }

  function addNewContent() {
    const nombre = prompt("Nombre del nuevo contenido:");
    if (!nombre) return;

    const contenidoLimpio = nombre.trim();
    if (!contenidoLimpio) {
      alert("Ingresa un nombre válido para el contenido.");
      return;
    }

    if (!contenidos.includes(contenidoLimpio)) {
      contenidos.push(contenidoLimpio);
      contenidos.sort((a, b) => {
        if (a === "MRUV") return -1;
        if (b === "MRUV") return 1;
        return a.localeCompare(b);
      });
    }

    renderContenidoSelect();
    selectedContent.value = contenidoLimpio;
    renderListaPreguntas();
  }

  async function deleteSelectedContent() {
    const contenidoActivo = selectedContent.value || "MRUV";

    if (contenidoActivo === "MRUV") {
      alert("No se puede eliminar el contenido MRUV.");
      return;
    }

    const ok = confirm(`Eliminar todo el contenido '${contenidoActivo}' y sus preguntas?`);
    if (!ok) return;

    const preguntasAEliminar = preguntas.filter(
      (p) => String(p.contenido || "MRUV").trim() === contenidoActivo,
    );

    for (const pregunta of preguntasAEliminar) {
      if (pregunta.id) {
        await eliminarPregunta(pregunta.id);
      }
    }

    preguntas = preguntas.filter(
      (p) => String(p.contenido || "MRUV").trim() !== contenidoActivo,
    );

    const index = contenidos.indexOf(contenidoActivo);
    if (index >= 0) contenidos.splice(index, 1);

    renderContenidoSelect();
    selectedContent.value = contenidos[0] || "MRUV";
    renderListaPreguntas();
    alert(`Contenido '${contenidoActivo}' eliminado.`);
  }

  selectedContent.addEventListener("change", () => {
    renderListaPreguntas();
  });

  addContentButton.addEventListener("click", addNewContent);
  deleteContentButton.addEventListener("click", deleteSelectedContent);

  // 🔥 inicializar
  llenarFiltroNiveles(preguntas);
  renderContenidoSelect();
  bindCorrectCheckboxes();
  renderListaPreguntas();

  document.getElementById("back").onclick = () => location.reload();

  // Analytics button
  document.getElementById("analytics-btn").onclick = () => navigate("analytics");

}
