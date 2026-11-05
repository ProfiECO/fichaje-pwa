# Fichaje Frappe HR (PWA)

PWA para fichar en una instancia de [Frappe HR](https://github.com/frappe/hrms). Misma lógica y estilos que la extensión de Chrome `fichaje-extension`.

- Pide dominio y credenciales, inicia sesión y se sincroniza con tu empleado.
- Botón de **Entrada** / **Salida** según tu último fichaje y reloj con el tiempo que llevas dentro.
- Pestaña **Semana** con las horas trabajadas cada día de la semana actual.
- Instalable en escritorio y móvil: ofrece instalarla (o explica cómo en iOS y Firefox) y abre sin conexión (los fichajes necesitan red).

## Requisito: mismo dominio o CORS

La app usa la cookie de sesión de Frappe, así que tiene que servirse **desde el mismo dominio que Frappe** (por ejemplo `https://tu-frappe.com/fichaje/`). Desde otro dominio, como GitHub Pages, el navegador bloquea las llamadas a menos que el servidor:

- permita el origen en `site_config.json` (`"allow_cors": ["https://pelasua.github.io"]`), y
- envíe la cookie `sid` con `SameSite=None; Secure` (Frappe usa `Lax` por defecto).

## Probar en local

Un servidor sin dependencias sirve la app y reenvía `/api` y `/hrms` a Frappe, así que todo queda en el mismo origen:

```bash
FRAPPE_URL=https://tu-frappe.com npm run dev
```

Abre `http://localhost:8080` y conecta con el dominio que aparece por defecto (`http://localhost:8080`).

## Desplegar en el servidor de Frappe

Copia `index.html`, `app.css`, `app.js`, `api.js`, `time.js`, `sw.js`, `manifest.webmanifest` e `icons/` a una ruta pública del mismo dominio (p. ej. con nginx en `/fichaje/`).

## Notas

- Las credenciales se guardan en `localStorage` (sin cifrar) para volver a iniciar sesión cuando caduca. «Desconectar» las borra.
- Las horas se interpretan en la zona horaria del navegador, que debe coincidir con la del servidor.

## Tests

```bash
npm test
```
