import { getFirebaseServices } from "../../firebase.js";
import {
  deleteLocalQuestion,
  deleteLocalUser,
  getLocalQuestions,
  getLocalUsers,
  saveLocalQuestions,
  saveLocalUsers,
  upsertLocalQuestion,
  upsertLocalUser,
} from "./storageService.js";

const FIRESTORE_URL =
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let firestoreApiPromise = null;

async function getFirestoreApi() {
  if (!firestoreApiPromise) {
    firestoreApiPromise = import(FIRESTORE_URL).catch((error) => {
      console.warn("Modo offline: SDK de Firestore no disponible.", error);
      firestoreApiPromise = null;
      return null;
    });
  }

  return firestoreApiPromise;
}

async function getFirestoreContext() {
  const [services, api] = await Promise.all([
    getFirebaseServices(),
    getFirestoreApi(),
  ]);

  if (!services?.db || !api) {
    return null;
  }

  return { db: services.db, api };
}

function createLocalId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isLocalId(id) {
  return typeof id === "string" && id.startsWith("local_");
}

export async function guardarUsuario(user) {
  const localUser = { ...user, id: user.id || createLocalId("local_user") };
  upsertLocalUser(localUser);

  try {
    const context = await getFirestoreContext();
    if (!context) return localUser;

    const { addDoc, collection } = context.api;
    const docRef = await addDoc(collection(context.db, "user_fisica"), user);
    const savedUser = { id: docRef.id, ...user };
    upsertLocalUser(savedUser);
    deleteLocalUser(localUser);
    return savedUser;
  } catch (error) {
    console.error("Error guardando usuario, se conserva localmente.", error);
    return localUser;
  }
}

export async function obtenerUsuarios() {
  try {
    const context = await getFirestoreContext();

    if (!context) {
      return getLocalUsers();
    }

    const { collection, getDocs } = context.api;
    const snapshot = await getDocs(collection(context.db, "user_fisica"));
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    saveLocalUsers(users);
    return users;
  } catch (error) {
    console.warn("Usando usuarios locales por error de red.", error);
    return getLocalUsers();
  }
}

export async function actualizarUsuario(id, data) {
  const localUser = { ...data, id };
  upsertLocalUser(localUser);

  try {
    const context = await getFirestoreContext();
    if (!context) return localUser;

    const dataLimpia = {
      nivel: Number(data.nivel) || 1,
      monedas: Number(data.monedas) || 0,
      vidas: Number(data.vidas) || 0,
      progreso: data.progreso || {},
    };

    const { addDoc, collection, doc, updateDoc } = context.api;

    if (isLocalId(id)) {
      const docRef = await addDoc(collection(context.db, "user_fisica"), dataLimpia);
      const createdUser = { ...localUser, ...dataLimpia, id: docRef.id };
      upsertLocalUser(createdUser);
      deleteLocalUser(localUser);
      return createdUser;
    }

    await updateDoc(doc(context.db, "user_fisica", id), dataLimpia);
    const updatedUser = { ...localUser, ...dataLimpia };
    upsertLocalUser(updatedUser);
    return updatedUser;
  } catch (error) {
    console.error("Error actualizando usuario remoto.", error);
    return localUser;
  }
}

export async function eliminarUsuario(id) {
  const localUser = getLocalUsers().find((user) => user.id === id);

  if (localUser) {
    deleteLocalUser(localUser);
  }

  try {
    const context = await getFirestoreContext();
    if (!context) return;

    const { deleteDoc, doc } = context.api;
    await deleteDoc(doc(context.db, "user_fisica", id));
  } catch (error) {
    console.error("Error eliminando usuario remoto.", error);
  }
}

export async function sincronizarUsuario(user) {
  const userData = {
    nombre: user.nombre,
    curso: user.curso,
    nivel: Number(user.nivel) || 1,
    monedas: Number(user.monedas) || 0,
    vidas: Number(user.vidas) || 10,
    progreso: user.progreso || {},
  };

  const localUser = {
    ...user,
    ...userData,
    id: user.id || createLocalId("local_user"),
  };

  upsertLocalUser(localUser);

  try {
    const context = await getFirestoreContext();
    if (!context) {
      return localUser;
    }

    const { addDoc, collection, doc, updateDoc } = context.api;

    if (user.id && !isLocalId(user.id)) {
      await updateDoc(doc(context.db, "user_fisica", user.id), userData);
      const updatedUser = { ...user, ...userData };
      upsertLocalUser(updatedUser);
      return updatedUser;
    }

    const nuevo = await addDoc(collection(context.db, "user_fisica"), userData);
    const createdUser = { ...userData, id: nuevo.id };
    upsertLocalUser(createdUser);
    deleteLocalUser(localUser);
    return createdUser;
  } catch (error) {
    console.error("❌ Error sincronizando:", error);
    return localUser;
  }
}

export async function obtenerPreguntas() {
  try {
    const context = await getFirestoreContext();

    if (!context) {
      return getLocalQuestions();
    }

    const { collection, getDocs } = context.api;
    const snapshot = await getDocs(collection(context.db, "preguntas_fisica"));
    const questions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    saveLocalQuestions(questions);
    return questions;
  } catch (error) {
    console.warn("Usando preguntas locales por error de red.", error);
    return getLocalQuestions();
  }
}

export async function guardarPregunta(data) {
  const localQuestion = {
    ...data,
    id: data.id || createLocalId("local_question"),
  };

  upsertLocalQuestion(localQuestion);

  try {
    const context = await getFirestoreContext();
    if (!context) {
      return localQuestion;
    }

    const { addDoc, collection } = context.api;
    const docRef = await addDoc(collection(context.db, "preguntas_fisica"), data);
    const savedQuestion = { ...data, id: docRef.id };
    upsertLocalQuestion(savedQuestion);
    deleteLocalQuestion(localQuestion);
    return savedQuestion;
  } catch (error) {
    console.error("Error guardando pregunta, se conserva localmente.", error);
    return localQuestion;
  }
}

export async function actualizarPregunta(id, data) {
  const localQuestion = { ...data, id };
  upsertLocalQuestion(localQuestion);

  try {
    const context = await getFirestoreContext();
    if (!context) return localQuestion;

    const { addDoc, collection, doc, updateDoc } = context.api;

    if (isLocalId(id)) {
      const docRef = await addDoc(collection(context.db, "preguntas_fisica"), data);
      const createdQuestion = { ...data, id: docRef.id };
      upsertLocalQuestion(createdQuestion);
      deleteLocalQuestion(localQuestion);
      return createdQuestion;
    }

    await updateDoc(doc(context.db, "preguntas_fisica", id), data);
    return localQuestion;
  } catch (error) {
    console.error("Error actualizando pregunta remota.", error);
    return localQuestion;
  }
}

export async function eliminarPregunta(id) {
  const localQuestion = getLocalQuestions().find((question) => question.id === id);

  if (localQuestion) {
    deleteLocalQuestion(localQuestion);
  }

  try {
    const context = await getFirestoreContext();
    if (!context) return;

    if (isLocalId(id)) return;

    const { deleteDoc, doc } = context.api;
    await deleteDoc(doc(context.db, "preguntas_fisica", id));
  } catch (error) {
    console.error("Error eliminando pregunta remota.", error);
  }
}

export function escucharUsuariosRealtime(callback) {
  setTimeout(() => {
    callback(getLocalUsers());
  }, 0);

  let active = true;
  let unsubscribeRemote = null;

  getFirestoreContext()
    .then((context) => {
      if (!active || !context) return;

      const { collection, onSnapshot } = context.api;
      const colRef = collection(context.db, "user_fisica");

      unsubscribeRemote = onSnapshot(
        colRef,
        (snapshot) => {
          const usuarios = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          saveLocalUsers(usuarios);
          callback(usuarios);
        },
        (error) => {
          console.warn("Realtime no disponible, usando cache local.", error);
          callback(getLocalUsers());
        },
      );
    })
    .catch((error) => {
      console.warn("No se pudo iniciar realtime, usando local.", error);
      callback(getLocalUsers());
    });

  return () => {
    active = false;

    if (typeof unsubscribeRemote === "function") {
      unsubscribeRemote();
    }
  };
}
