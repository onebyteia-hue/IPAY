export function isOnline() {
  return navigator.onLine;
}

export function onNetworkChange(callback) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
}