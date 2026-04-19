import { db } from "../../firebase.js";
import {
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import {
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================
// 👤 USUARIOS
// ============================

export async function guardarUsuario(user) {
  try {
    const docRef = await addDoc(collection(db, "user_fisica"), user);
    console.log("Usuario guardado:", docRef.id);
    return { id: docRef.id, ...user };
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

export async function obtenerUsuarios() {
  const snapshot = await getDocs(collection(db, "user_fisica"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function actualizarUsuario(id, data) {
  const dataLimpia = {
    nivel: Number(data.nivel) || 1,
    monedas: Number(data.monedas) || 0,
    vidas: Number(data.vidas) || 0,
    progreso: data.progreso || {},
  };

  await updateDoc(doc(db, "user_fisica", id), dataLimpia);
}

export async function eliminarUsuario(id) {
  await deleteDoc(doc(db, "user_fisica", id));
}

export async function sincronizarUsuario(user) {
  try {
    const userData = {
      nombre: user.nombre,
      curso: user.curso,
      nivel: Number(user.nivel) || 1,
      monedas: Number(user.monedas) || 0,
      vidas: Number(user.vidas) || 10,
      progreso: user.progreso || {},
    };

    // 🔥 SI TIENE ID → SOLO ACTUALIZA
    if (user.id) {
      await updateDoc(doc(db, "user_fisica", user.id), userData);
      return { ...user, ...userData };
    }

    // 🔥 SI NO TIENE ID → CREAR SOLO UNA VEZ
    const nuevo = await addDoc(collection(db, "user_fisica"), userData);

    return { ...userData, id: nuevo.id };

  } catch (error) {
    console.error("❌ Error sincronizando:", error);
    return user;
  }
}

// ============================
// 📚 PREGUNTAS
// ============================

export async function obtenerPreguntas() {
  const snapshot = await getDocs(collection(db, "preguntas_fisica"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// ✏️ EDITAR
export async function actualizarPregunta(id, data) {
  await updateDoc(doc(db, "preguntas_fisica", id), data);
}

// 🗑️ ELIMINAR
export async function eliminarPregunta(id) {
  await deleteDoc(doc(db, "preguntas_fisica", id));
}
export function escucharUsuariosRealtime(callback) {
  const colRef = collection(db, "user_fisica");

  return onSnapshot(colRef, (snapshot) => {
    const usuarios = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(usuarios);
  }, (error) => {
    console.error("Error en tiempo real:", error);
  });
}