import {
  getLocalQuestions,
  getLocalUsers,
  saveLocalQuestions,
  saveLocalUsers,
} from "../services/storageService.js";
import {
  hydrateOfflineQuestions,
  normalizeQuestions,
} from "../services/offlineBootstrap.js";

const MANAGED_KEYS = ["users_fisica", "preguntas_fisica_local"];
const MANAGED_PREFIXES = ["corazones_", "tiempo_"];

function isManagedStorageKey(key) {
  return (
    MANAGED_KEYS.includes(key) ||
    MANAGED_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
}

function getManagedStorageEntries() {
  const entries = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !isManagedStorageKey(key)) continue;
    entries[key] = localStorage.getItem(key);
  }

  return entries;
}

function clearManagedStorage() {
  const keysToDelete = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && isManagedStorageKey(key)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => localStorage.removeItem(key));
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("No se pudo leer el archivo."));
    reader.readAsText(file, "utf-8");
  });
}

async function applyBackupPayload(payload) {
  clearManagedStorage();

  if (Array.isArray(payload.users)) {
    saveLocalUsers(payload.users);
  }

  let importedQuestions = [];

  if (Array.isArray(payload.questions)) {
    importedQuestions = normalizeQuestions(payload.questions);
  } else if (payload.questions && typeof payload.questions === "object") {
    importedQuestions = normalizeQuestions(payload.questions);
  }

  if (importedQuestions.length) {
    saveLocalQuestions(importedQuestions);
  }

  Object.entries(payload.storage || {}).forEach(([key, value]) => {
    if (!isManagedStorageKey(key) || value === null || value === undefined) return;
    localStorage.setItem(key, String(value));
  });

  await hydrateOfflineQuestions(importedQuestions);
}

export function exportarRespaldoPortable() {
  const payload = {
    app: "IPAY",
    version: 1,
    exportedAt: new Date().toISOString(),
    users: getLocalUsers(),
    questions: getLocalQuestions(),
    storage: getManagedStorageEntries(),
  };

  downloadJson("ipay_respaldo_usb.json", payload);
  return payload;
}

export async function importarRespaldoPortable(file) {
  const rawText = await readFileAsText(file);
  const payload = JSON.parse(rawText);

  if (!payload || typeof payload !== "object") {
    throw new Error("El archivo no contiene un respaldo válido.");
  }

  await applyBackupPayload(payload);

  return {
    users: Array.isArray(payload.users) ? payload.users.length : getLocalUsers().length,
    questions: Array.isArray(payload.questions)
      ? payload.questions.length
      : getLocalQuestions().length,
  };
}
