/**
 * We are following Cache falling back to the network
 */
const UNVARYING_CACHE = "images-v1";
/**
 * We are following Cache then network strategy.
 */
const VOLATILE = "volatile-v1";

// Images we always want to be cached
const CACHED_ONLY_URLS = [
  "css/fonts/OpenSans-Regular.ttf",
  "books-images/1984first.jpg",
  "books-images/Dune-Frank_Herbert_(1965)_First_edition.jpg",
  "books-images/Hyperion_cover.jpg",
  "books-images/Neuromancer_(Book).jpg",
  "books-images/Snowcrash.jpg",
  "books-images/TheLeftHandOfDarkness1stEd.jpg",
];

/**
 * We are precaching the image urls, fonts as they don't update frequently
 */
self.addEventListener("install", (installEvent) => {
  //   self.skipWaiting();
  installEvent.waitUntil(
    caches
      .open(UNVARYING_CACHE)
      .then((cache) => cache.addAll(CACHED_ONLY_URLS))
      .then(() => {
        console.log(
          "Activate service worker! This will listen to future fetch calls"
        );
        self.skipWaiting();
      })
  );
});

/**
 * Activates the new service worker and clean old cache incase of version changes
 */
self.addEventListener("activate", (event) => {
  const currentCaches = [UNVARYING_CACHE, VOLATILE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter(
          (cacheName) => !currentCaches.includes(cacheName)
        );
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

async function updateCacheFromResponse(cache, request, fetchResponse) {
  if (fetchResponse.status >= 200 && fetchResponse.status < 300) {
    await cache.put(request, fetchResponse);
  }
  console.log("Cache updated");
}
/**
 * Lazily updates cache in background from network
 * @param {*} request
 */
async function updateCacheFromNetwork(request) {
  try {
    const cache = await caches.open(VOLATILE);
    const fetchResponse = await fetch(request);
    updateCacheFromResponse(cache, request, fetchResponse.clone());
  } catch (err) {
    console.log("Network call failed with error: ", err);
  }
}

/**
 * Network call made when we couldn't find request in the cache
 * @param {*} request
 */
async function getResponseFromNetwork(request) {
  const fetchResponse = await fetch(request);
  const cache = await caches.open(VOLATILE);
  updateCacheFromResponse(cache, request, fetchResponse.clone());
  return fetchResponse;
}

/**
 * The fetch handler serves responses for same-origin resources from a cache.
 *
 * If response is cached then return cached response and lazily update
 * the cache in background
 * else get response from network and cache the response for future
 *
 */
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests, like those for Google Analytics.
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(async (cachedResponse) => {
        /**
         * We want font and images to work in cache only mode.
         */
        let destination = event.request && event.request.destination;
        switch (destination) {
          case "image":
          case "font":
            if (cachedResponse) {
              return cachedResponse;
            }
        }

        if (cachedResponse) {
          updateCacheFromNetwork(event.request);
          return cachedResponse;
        } else {
          const fetchedResponse = await getResponseFromNetwork(event.request);
          return fetchedResponse;
        }
      })
    );
  }
});
