// Mongames service worker, scope "/": the whole hub and every game under it (/Redentore/, ...).
// It makes the hub installable and caches nothing, so a game update is live on the next launch.
// Page loads go to the network as usual; only when that fails (offline) it answers with a short page.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

const OFFLINE = `<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#000000">
<title>Mongames</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#000;color:#f5f5f7;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px">
<div><p style="font-size:1.3rem;font-weight:700;margin:0 0 8px">You're offline · Sei offline</p>
<p style="color:#98989d;margin:0 0 20px">Connect to the internet to play. · Collegati a internet per giocare.</p>
<button onclick="location.reload()" style="font:inherit;font-weight:600;border:0;border-radius:999px;padding:10px 22px;background:#0071e3;color:#fff">Retry · Riprova</button></div>`;

self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return; // scripts, images, saves: untouched, straight to the network
  e.respondWith(fetch(e.request).catch(() =>
    new Response(OFFLINE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
