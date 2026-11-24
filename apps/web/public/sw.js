// Service worker do easyService (app instalável).
// - Arquivos do app com hash no nome (/assets/...): guardados no aparelho, abrem na hora.
// - Páginas: busca na rede; sem internet, abre a última versão guardada do app.
// - API e fotos (/api, /uploads): sempre da rede, nunca guardados (são dados de clientes).
const VERSAO = 'easyservice-v2';
const ESSENCIAIS = ['/', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(ESSENCIAIS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads')) return;

  // Navegação: rede primeiro, versão guardada se estiver sem internet
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(VERSAO).then((cache) => cache.put('/', copia));
          return resposta;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // Arquivos com hash nunca mudam: guardado primeiro
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (guardado) =>
          guardado ||
          fetch(request).then((resposta) => {
            const copia = resposta.clone();
            caches.open(VERSAO).then((cache) => cache.put(request, copia));
            return resposta;
          }),
      ),
    );
  }
});
