/* Agenda cultural — service worker network-first.
   Subir la versión al publicar cambios: obliga a limpiar cachés viejas. */
var VERSION = "agenda-v1";
var BASE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(VERSION).then(function(c){
      return c.addAll(BASE)["catch"](function(){ return null; });
    })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){
        return k === VERSION ? null : caches["delete"](k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* Network-first para todo lo propio: el HTML y los dos JSON tienen que llegar
   frescos. Si no hay red, se sirve lo último cacheado. */
self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req).then(function(res){
      var copia = res.clone();
      caches.open(VERSION).then(function(c){ c.put(req, copia); });
      return res;
    })["catch"](function(){
      return caches.match(req, {ignoreSearch:true}).then(function(r){
        return r || caches.match("./index.html");
      });
    })
  );
});
