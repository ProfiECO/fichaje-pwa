// Local server: serves the PWA and proxies /api and /hrms to Frappe so everything is same-origin (no CORS).
// Usage: FRAPPE_URL=https://tu-frappe.com node dev-server.js
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const TARGET = process.env.FRAPPE_URL?.replace(/\/$/, "");
const PORT = process.env.PORT || 8080;
if (!TARGET) throw new Error("Define FRAPPE_URL, p. ej. FRAPPE_URL=https://tu-frappe.com");

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const root = new URL(".", import.meta.url).pathname;

async function proxy(req, res) {
  const body = ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(await Array.fromAsync(req));
  const headers = Object.fromEntries(
    ["cookie", "content-type", "accept", "x-frappe-csrf-token"].filter((h) => req.headers[h]).map((h) => [h, req.headers[h]])
  );
  const upstream = await fetch(TARGET + req.url, { method: req.method, headers, body, redirect: "manual" });
  const out = { "content-type": upstream.headers.get("content-type") ?? "application/octet-stream" };
  // Cookies must belong to localhost (plain http) instead of the Frappe domain.
  const cookies = upstream.headers.getSetCookie().map((c) => c.replace(/;\s*(domain=[^;]*|secure)/gi, ""));
  if (cookies.length) out["set-cookie"] = cookies;
  res.writeHead(upstream.status, out).end(Buffer.from(await upstream.arrayBuffer()));
}

http
  .createServer(async (req, res) => {
    try {
      if (req.url.startsWith("/api/") || req.url.startsWith("/hrms")) return await proxy(req, res);
      const path = normalize(join(root, decodeURIComponent(new URL(req.url, "http://x").pathname)));
      if (!path.startsWith(root)) return res.writeHead(403).end();
      const file = path.endsWith("/") ? join(path, "index.html") : path;
      const data = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(data);
    } catch (err) {
      res.writeHead(err.code === "ENOENT" ? 404 : 502).end(String(err.message));
    }
  })
  .listen(PORT, () => console.log(`Fichaje en http://localhost:${PORT} → ${TARGET}`));
