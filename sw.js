/* Service worker do Banco de Conteúdo.

   Estratégia: NETWORK-FIRST pro index.html e pro dados.json.
   O cache existe só como rede de segurança pra quando estiver offline.

   Motivo: com cache-first, uma atualização publicada não aparecia no aparelho
   até limpar o cache na mão. Conteúdo novo tem que aparecer na hora.

   Ao mudar arquivos do shell, subir o número da versão abaixo. */
const CACHE = 'roteiros-ads-v4';
const SHELL = ['./', './index.html', './sync.js', './manifest.webmanifest', './icon.svg', './icon-maskable.svg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function redePrimeiro(req, chaveCache){
  return fetch(req)
    .then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(chaveCache || req, copia));
      return r;
    })
    .catch(() => caches.match(chaveCache || req).then(hit => hit || caches.match('./index.html')));
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  // navegação (abrir o app) e o HTML: sempre tenta a rede primeiro
  if (e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html') || url.pathname.endsWith('sync.js')){
    e.respondWith(redePrimeiro(e.request, './index.html'));
    return;
  }

  // conteúdo: sempre tenta a rede primeiro
  if (url.pathname.endsWith('dados.json')){
    e.respondWith(redePrimeiro(e.request, './dados.json'));
    return;
  }

  // ícones e manifest: cache primeiro, quase nunca mudam
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia));
      return r;
    }))
  );
});
