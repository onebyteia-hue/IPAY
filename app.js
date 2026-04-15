


import { registerRoute, navigate } from "./js/modules/router.js";
import { authReady } from "./firebase.js";

import { homeView } from "./js/ui/homeView.js";
import { studentView } from "./js/ui/studentView.js";
import { studentProfileView } from "./js/ui/studentProfileView.js";
import { teacherView } from "./js/ui/teacherView.js";
import { gameView } from "./js/ui/gameView.js";
import { mapView } from "./js/ui/mapView.js";

// Rutas
registerRoute("home", homeView);
registerRoute("student", studentView);
registerRoute("student-profile", studentProfileView);
registerRoute("teacher", teacherView);
registerRoute("game", gameView);
registerRoute("map", mapView);

// 🔥 ESPERAR AUTH
authReady.then(() => {
  navigate("home");
});
