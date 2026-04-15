const routes = {};

export function registerRoute(name, renderFn) {
  routes[name] = renderFn;
}

export function navigate(routeName, data = {}) {
  const app = document.getElementById("app");

  if (!routes[routeName]) {
    app.innerHTML = "<h2>Ruta no encontrada</h2>";
    return;
  }

  app.innerHTML = "";
  routes[routeName](app, data);
}

