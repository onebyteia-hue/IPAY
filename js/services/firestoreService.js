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
  await updateDoc(doc(db, "user_fisica", id), data);
}

export async function eliminarUsuario(id) {
  await deleteDoc(doc(db, "user_fisica", id));
}

export async function sincronizarUsuario(user) {
  try {
    if (user.id) {
      await actualizarUsuario(user.id, user);
      return user;
    }

    const usuarios = await obtenerUsuarios();
    const existente = usuarios.find((item) =>
      item.nombre === user.nombre && item.curso === user.curso
    );

    if (existente) {
      await actualizarUsuario(existente.id, user);
      return { ...user, id: existente.id };
    }

    return await guardarUsuario(user);
  } catch (error) {
    console.error("Error al sincronizar usuario:", error);
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
