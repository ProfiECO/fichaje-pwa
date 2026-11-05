// Invites the user to install the app: native prompt where the browser offers one, instructions otherwise.
const dialog = document.getElementById("install");
const text = document.getElementById("install-text");
const installBtn = document.getElementById("install-ok");

const installed = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
const dismissed = () => {
  try { return localStorage.getItem("install-dismissed") === "1"; } catch { return false; }
};
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function show(message, canInstall) {
  if (installed || dismissed() || dialog.open) return;
  text.textContent = message;
  installBtn.hidden = !canInstall;
  dialog.showModal();
}

let deferred = null;
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e;
  show("Instala Fichaje en tu dispositivo para abrirlo como una app, desde la pantalla de inicio.", true);
});

installBtn.addEventListener("click", async () => {
  dialog.close();
  deferred?.prompt();
  if ((await deferred?.userChoice)?.outcome === "accepted") localStorage.setItem("install-dismissed", "1");
  deferred = null;
});

dialog.addEventListener("close", () => {
  if (dialog.returnValue === "never") localStorage.setItem("install-dismissed", "1");
});

if (isIOS) {
  show("Para instalarla en tu iPhone o iPad: pulsa el botón Compartir (el cuadrado con la flecha hacia arriba) y elige «Añadir a pantalla de inicio».", false);
} else if (matchMedia("(pointer: coarse)").matches) {
  // Mobile browsers without a native prompt (e.g. Firefox): explain it if no prompt arrived.
  setTimeout(() => deferred || show("Para instalarla: abre el menú del navegador (⋮) y elige «Instalar» o «Añadir a pantalla de inicio».", false), 3000);
}
