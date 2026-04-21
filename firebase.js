const firebaseConfig = {
  apiKey: "AIzaSyA2xTzOJ_fvAIMEjBBWQSxDIZIw8Inp-ww",
  authDomain: "simulacroesfms2026.firebaseapp.com",
  projectId: "simulacroesfms2026",
  storageBucket: "simulacroesfms2026.firebasestorage.app",
  messagingSenderId: "1076674602133",
  appId: "1:1076674602133:web:d0b010c9dfbee969d7e79c",
  measurementId: "G-N1FYQ17Z90",
};

const FIREBASE_URLS = {
  app: "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js",
  firestore: "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js",
  auth: "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js",
};

let firebaseServices = null;

export async function getFirebaseServices() {
  if (firebaseServices) return firebaseServices;

  try {
    const [{ initializeApp }, { getFirestore }, { getAuth, signInAnonymously }] =
      await Promise.all([
        import(FIREBASE_URLS.app),
        import(FIREBASE_URLS.firestore),
        import(FIREBASE_URLS.auth),
      ]);

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    firebaseServices = { app, db, auth, signInAnonymously };
    return firebaseServices;
  } catch (error) {
    console.warn("Modo offline: Firebase no disponible.", error);
    firebaseServices = null;
    return null;
  }
}

export const authReady = getFirebaseServices()
  .then(async (services) => {
    if (!services) return false;

    try {
      await services.signInAnonymously(services.auth);
      console.log("✅ Auth anónimo listo");
      return true;
    } catch (error) {
      console.warn("Continuando sin auth de Firebase.", error);
      return false;
    }
  })
  .catch((error) => {
    console.warn("Continuando sin Firebase.", error);
    return false;
  });
