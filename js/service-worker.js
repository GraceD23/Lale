/* =========================================================
   LALE SERVICE WORKER
   ---------------------------------------------------------
   Caches all app files on first load so the app works
   fully offline. When you add a new page or file, bump
   the VERSION number by 1 — that's the only change needed.

   HOW TO UPDATE:
   - Added a new HTML page?       → bump VERSION, add file to CACHE_FILES
   - Added a new JS/CSS file?     → bump VERSION, add file to CACHE_FILES
   - Changed existing files?      → bump VERSION (no other changes needed)
   ========================================================= */

const VERSION = "lale-v3";

const CACHE_FILES = [
  /* ---- Pages ---- */
  "./",
  "./index.html",
  "./add.html",
  "./conversation.html",
  "./health.html",
  "./history.html",
  "./learning.html",
  "./media.html",
  "./notes.html",
  "./spelling.html",
  "./streaks.html",
  "./turkish.html",
  "./work.html",

  /* ---- CSS ---- */
  "./css/style.css",
  "./css/theme.css",
  "./css/layout.css",
  "./css/components.css",
  "./css/components-additions.css",

  /* ---- JS ---- */
  "./js/add-system.js",
  "./js/app.js",
  "./js/auth.js",
  "./js/brain-confirm.js",
  "./js/brain-dump.js",
  "./js/brain-parser.js",
  "./js/config.js",
  "./js/conversation.js",
  "./js/dropdowns.js",
  "./js/etsy-system.js",
  "./js/health-system.js",
  "./js/history.js",
  "./js/labels.js",
  "./js/menu.js",
  "./js/notes.js",
  "./js/review-panel.js",
  "./js/spelling.js",
  "./js/storage.js",
  "./js/streaks-edit.js",
  "./js/streaks.js",
  "./js/tasks-system.js",
  "./js/tasks.js",
  "./js/turkish.js",

  /* ---- Fonts (cached from Google Fonts on first load) ---- */
  "https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600&display=swap"
];

/* =========================================================
   INSTALL — cache all files on first load
   ========================================================= */
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(VERSION).then(function(cache) {
      /* Cache files one by one so a single failure doesn't
         break the whole install */
      return Promise.allSettled(
        CACHE_FILES.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn("[SW] Failed to cache:", url, err.message);
          });
        })
      );
    }).then(function() {
      /* Activate immediately without waiting for old tabs to close */
      return self.skipWaiting();
    })
  );
});

/* =========================================================
   ACTIVATE — delete old caches when version changes
   ========================================================= */
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== VERSION; })
            .map(function(key) {
              console.log("[SW] Deleting old cache:", key);
              return caches.delete(key);
            })
      );
    }).then(function() {
      /* Take control of all open tabs immediately */
      return self.clients.claim();
    })
  );
});

/* =========================================================
   FETCH — serve from cache, fall back to network
   ========================================================= */
self.addEventListener("fetch", function(event) {
  const url = new URL(event.request.url);

  /* Always go to network for:
     - API calls (Cloudflare Worker, TMDB, MusicBrainz, etc.)
     - Non-GET requests */
  if (event.request.method !== "GET") return;
  if (url.hostname.includes("workers.dev")) return;
  if (url.hostname.includes("themoviedb.org")) return;
  if (url.hostname.includes("musicbrainz.org")) return;
  if (url.hostname.includes("coverartarchive.org")) return;
  if (url.hostname.includes("upcitemdb.com")) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        /* Serve from cache, but also update cache in background
           so next visit gets fresh files when online */
        fetch(event.request).then(function(fresh) {
          if (fresh && fresh.status === 200) {
            caches.open(VERSION).then(function(cache) {
              cache.put(event.request, fresh);
            });
          }
        }).catch(function() { /* offline, that's fine */ });
        return cached;
      }

      /* Not in cache — try network */
      return fetch(event.request).then(function(response) {
        /* Cache successful responses for future offline use */
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(VERSION).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        /* Fully offline and not cached — return offline page if available */
        if (event.request.destination === "document") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
