"use strict";
// Mercurius fără calculator: totul rămâne pe telefon (nu sunt date din dosare), deci merge și fără internet.
const CACHE = "mercurius-offline-4b8c476e2395";
const PYODIDE = "https://cdn.jsdelivr.net/npm/pyodide@314.0.7/";
const AICI = ["./", "index.html", "manifest.webmanifest", "py.json", "texte.json", "icon-192.png", "icon-512.png"];
const PY = ["pyodide.js", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"].map(f => PYODIDE + f);
self.addEventListener("install", e => e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  await c.addAll(AICI);
  await c.addAll(PY).catch(() => {});            // se iau și la prima folosire
  await self.skipWaiting();
})()));
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("mercurius-offline-") && k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
async function dinCache(cerere) {
  const c = await caches.open(CACHE);
  const gasit = await c.match(cerere, {ignoreSearch: true});
  if (gasit) return gasit;
  const r = await fetch(cerere);
  if (r.ok) c.put(cerere, r.clone());
  return r;
}
async function intaiReteaua(cerere) {               // texte.json: textele noi ajung fără o versiune nouă a paginii
  const c = await caches.open(CACHE);
  try { const r = await fetch(cerere, {cache: "no-cache"}); if (r.ok) { c.put(cerere, r.clone()); return r; } } catch (e) {}
  return (await c.match(cerere, {ignoreSearch: true})) || Response.error();
}
self.addEventListener("fetch", e => {
  const url = e.request.url;
  if (e.request.method !== "GET") return;
  if (url.endsWith("/texte.json")) return e.respondWith(intaiReteaua(e.request));
  if (e.request.mode === "navigate") return e.respondWith(caches.match("./").then(r => r || fetch(e.request)));
  if (url.startsWith(PYODIDE) || url.startsWith(self.registration.scope)) e.respondWith(dinCache(e.request));
});
